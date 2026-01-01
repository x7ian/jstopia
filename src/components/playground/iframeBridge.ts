export type PlaygroundFile = {
  name: string
  language: 'html' | 'css' | 'js'
  content: string
}

export type PlaygroundConsoleMessage = {
  type: 'log' | 'warn' | 'error' | 'info'
  message: string
}

export type PlaygroundRunResult = {
  logs: PlaygroundConsoleMessage[]
  errors: string[]
  resultText: string
}

export function buildSrcDoc(files: PlaygroundFile[], runId: number) {
  const htmlFile = files.find((file) => file.name === 'index.html' || file.language === 'html')
  const cssFile = files.find((file) => file.language === 'css')
  const jsFile = files.find((file) => file.language === 'js')

  const baseHtml =
    htmlFile?.content ??
    '<!doctype html><html><head><meta charset="utf-8" /></head><body><div id="root"></div><pre id="result"></pre></body></html>'

  const css = cssFile?.content ?? ''
  const js = jsFile?.content ?? ''

  const bridgeScript = `
    (function() {
      const RUN_ID = ${runId};
      const SOURCE = "jstopia-playground";
      const send = (payload) => {
        window.parent.postMessage({ source: SOURCE, runId: RUN_ID, ...payload }, "*");
      };

      const formatArgs = (args) => args.map((arg) => {
        if (typeof arg === "string") return arg;
        try { return JSON.stringify(arg); } catch (_) { return String(arg); }
      }).join(" ");

      ["log","warn","error","info"].forEach((level) => {
        const original = console[level];
        console[level] = function(...args) {
          send({ type: "console", level, message: formatArgs(args) });
          if (original) original.apply(console, args);
        };
      });

      window.onerror = function(message, source, lineno, colno, error) {
        send({ type: "error", message: String(message), stack: error && error.stack ? String(error.stack) : "" });
      };

      window.onunhandledrejection = function(event) {
        const reason = event && event.reason ? event.reason : "Unhandled promise rejection";
        send({ type: "error", message: String(reason) });
      };

      send({ type: "ready" });
    })();
  `

  const resultScript = `
    (function() {
      const el = document.querySelector("#result");
      const text = el ? el.textContent || "" : "";
      window.parent.postMessage({ source: "jstopia-playground", runId: ${runId}, type: "result", resultText: text }, "*");
    })();
  `

  if (!baseHtml.includes('</head>') || !baseHtml.includes('</body>')) {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style id="__playground_css__">${css}</style>
        </head>
        <body>
          ${baseHtml}
          <script>${bridgeScript}</script>
          <script id="__playground_js__">${js}</script>
          <script>${resultScript}</script>
        </body>
      </html>
    `
  }

  return baseHtml
    .replace('</head>', `<style id="__playground_css__">${css}</style></head>`)
    .replace('</body>', `<script>${bridgeScript}</script><script id="__playground_js__">${js}</script><script>${resultScript}</script></body>`)
}
