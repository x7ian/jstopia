import AdminNav from './AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl p-6 bg-white text-slate-900 rounded-xl shadow-lg shadow-slate-200/60 border border-slate-200">
      <h1 className="text-2xl font-bold">Admin</h1>
      <AdminNav />
      <div className="mt-6 w-full">{children}</div>
    </div>
  )
}
