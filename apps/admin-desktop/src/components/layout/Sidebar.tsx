export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">SMT</div>
      <nav className="sidebar-nav">
        <a className="sidebar-item">Dashboard</a>
      </nav>
    </aside>
  );
}

export function SidebarPlaceholder() {
  return <Sidebar />;
}
