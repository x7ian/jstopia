'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { EditorView } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { oneDark } from '@codemirror/theme-one-dark'
import { cn } from '@/lib/utils'
import { PlaygroundConsole } from '@/components/playground/PlaygroundConsole'
import { PlaygroundTabs } from '@/components/playground/PlaygroundTabs'
import { buildSrcDoc, type PlaygroundConsoleMessage, type PlaygroundFile, type PlaygroundRunResult } from '@/components/playground/iframeBridge'

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false })

type PlaygroundProps = {
  title?: string
  files: PlaygroundFile[]
  mode?: 'web'
  height?: number
  previewHeight?: number
  readOnly?: boolean
  showConsole?: boolean
  showPreview?: boolean
  onRunComplete?: (result: PlaygroundRunResult) => void
  onFilesChange?: (files: PlaygroundFile[]) => void
}

export type PlaygroundHandle = {
  run: () => Promise<PlaygroundRunResult>
  reset: () => void
  stop: () => void
}

const DEFAULT_HEIGHT = 420
const DEFAULT_PREVIEW_HEIGHT = 260

export const Playground = forwardRef<PlaygroundHandle, PlaygroundProps>(function Playground(
  {
    title,
    files,
    mode = 'web',
    height = DEFAULT_HEIGHT,
    previewHeight = DEFAULT_PREVIEW_HEIGHT,
    readOnly = false,
    showConsole = true,
    showPreview,
    onRunComplete,
    onFilesChange,
  },
  ref
) {
  const initialFiles = useMemo(
    () =>
      files.map((file) => ({
        ...file,
        content: normalizeFileContent(file.content),
      })),
    [files]
  )
  const initialFilesRef = useRef<PlaygroundFile[] | null>(null)
  const runIdRef = useRef(0)
  const pendingRunRef = useRef<((result: PlaygroundRunResult) => void) | null>(null)
  const logsRef = useRef<PlaygroundConsoleMessage[]>([])
  const errorsRef = useRef<string[]>([])
  const resultTextRef = useRef('')
  const runTimeoutRef = useRef<number | null>(null)

  const [currentFiles, setCurrentFiles] = useState<PlaygroundFile[]>(initialFiles)
  const [activeFile, setActiveFile] = useState(initialFiles[0]?.name ?? '')
  const [logs, setLogs] = useState<PlaygroundConsoleMessage[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [resultText, setResultText] = useState('')
  const [iframeKey, setIframeKey] = useState(0)
  const [srcDoc, setSrcDoc] = useState('')
  const defaultShowPreview = useMemo(
    () => showPreview ?? currentFiles.some((file) => file.language === 'html' || file.language === 'css'),
    [showPreview, currentFiles]
  )
  const [previewOpen, setPreviewOpen] = useState(defaultShowPreview)

  useEffect(() => {
    if (!initialFilesRef.current) {
      initialFilesRef.current = initialFiles
    }
  }, [initialFiles])

  useEffect(() => {
    setCurrentFiles(initialFiles)
    setActiveFile(initialFiles[0]?.name ?? '')
    const shouldShow = showPreview ?? initialFiles.some((file) => file.language === 'html' || file.language === 'css')
    setPreviewOpen(shouldShow)
  }, [initialFiles, showPreview])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.source !== 'jstopia-playground') return
      if (data.runId !== runIdRef.current) return

      if (data.type === 'console') {
        const nextLogs = [...logsRef.current, { type: data.level, message: String(data.message) }]
        logsRef.current = nextLogs
        setLogs(nextLogs)
      }

      if (data.type === 'error') {
        const nextErrors = [...errorsRef.current, String(data.message)]
        errorsRef.current = nextErrors
        setErrors(nextErrors)
      }

      if (data.type === 'result') {
        const nextText = String(data.resultText ?? '')
        resultTextRef.current = nextText
        setResultText(nextText)
      }

      if (data.type === 'result') {
        const finalResult = {
          logs: logsRef.current,
          errors: errorsRef.current,
          resultText: resultTextRef.current,
        }
        if (pendingRunRef.current) {
          pendingRunRef.current(finalResult)
          pendingRunRef.current = null
        }
        onRunComplete?.(finalResult)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onRunComplete])

  const activeFileContent = currentFiles.find((file) => file.name === activeFile)?.content ?? ''

  function normalizeFileContent(content: string) {
    if (!content.includes('\\n') && !content.includes('\\t')) return content
    const hasRealNewlines = content.includes('\n')
    if (hasRealNewlines) return content
    return content.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
  }

  function updateFile(name: string, value: string) {
    setCurrentFiles((prev) => {
      const next = prev.map((file) => (file.name === name ? { ...file, content: value } : file))
      onFilesChange?.(next)
      return next
    })
  }

  function reset() {
    if (!initialFilesRef.current) return
    const next = initialFilesRef.current.map((file) => ({ ...file }))
    setCurrentFiles(next)
    onFilesChange?.(next)
    logsRef.current = []
    errorsRef.current = []
    resultTextRef.current = ''
    setLogs([])
    setErrors([])
    setResultText('')
  }

  function stop() {
    setIframeKey((prev) => prev + 1)
    setSrcDoc('')
    logsRef.current = []
    errorsRef.current = []
    resultTextRef.current = ''
    setLogs([])
    setErrors([])
    setResultText('')
  }

  function run(): Promise<PlaygroundRunResult> {
    if (mode !== 'web') {
      return Promise.resolve({ logs: [], errors: ['Unsupported mode'], resultText: '' })
    }

    runIdRef.current += 1
    const nextRunId = runIdRef.current
    logsRef.current = []
    errorsRef.current = []
    resultTextRef.current = ''
    setLogs([])
    setErrors([])
    setResultText('')
    const nextDoc = buildSrcDoc(currentFiles, nextRunId)
    setSrcDoc(nextDoc)
    setIframeKey(nextRunId)

    return new Promise((resolve) => {
      pendingRunRef.current = (result) => {
        resolve({
          logs: result.logs ?? [],
          errors: result.errors ?? [],
          resultText: String(result.resultText ?? ''),
        })
      }
      if (runTimeoutRef.current) {
        window.clearTimeout(runTimeoutRef.current)
      }
      runTimeoutRef.current = window.setTimeout(() => {
        if (!pendingRunRef.current) return
        pendingRunRef.current({
          logs: logsRef.current,
          errors: errorsRef.current,
          resultText: resultTextRef.current,
        })
        pendingRunRef.current = null
      }, 500)
    })
  }

  useImperativeHandle(ref, () => ({ run, reset, stop }))

  const languageExtension = useMemo(() => {
    const file = currentFiles.find((item) => item.name === activeFile)
    if (!file) return javascript()
    if (file.language === 'html') return html()
    if (file.language === 'css') return css()
    return javascript()
  }, [activeFile, currentFiles])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? <h3 className="text-sm font-semibold text-slate-100">{title}</h3> : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => run()}
            className="rounded-full border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100"
          >
            Run
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <PlaygroundTabs files={currentFiles} activeFile={activeFile} onSelect={setActiveFile} />
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
          {readOnly ? 'Read only' : 'Editable'}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
          <CodeMirror
            value={activeFileContent}
            height={`${height}px`}
            theme={oneDark}
            extensions={[languageExtension, EditorView.lineWrapping]}
            onChange={(value) => updateFile(activeFile, value)}
            readOnly={readOnly}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
            <span>Output</span>
            <button
              type="button"
              onClick={() => setPreviewOpen((prev) => !prev)}
              className="rounded-full border border-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.3em] text-slate-300 hover:border-white/30"
            >
              {previewOpen ? 'Collapse' : 'Show Output Window'}
            </button>
          </div>
          <div
            className={cn(
              'rounded-2xl border border-white/10 bg-black/30 transition-all',
              previewOpen ? 'opacity-100' : 'h-0 overflow-hidden border-transparent opacity-0'
            )}
          >
            <iframe
              key={iframeKey}
              sandbox="allow-scripts"
              title="Playground Preview"
              className={cn('w-full rounded-2xl', previewOpen ? 'h-full' : 'h-[1px]')}
              style={{ height: previewOpen ? previewHeight : 1 }}
              srcDoc={srcDoc}
            />
          </div>
          {showConsole ? <PlaygroundConsole logs={logs} errors={errors} onClear={() => setLogs([])} /> : null}
        </div>
      </div>
    </div>
  )
})
