export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

