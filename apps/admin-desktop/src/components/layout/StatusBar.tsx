export default function StatusBar() {
  return (
    <footer className="status-bar">
      <div className="status-left">Ready</div>
      <div className="status-right">All systems nominal</div>
    </footer>
  );
}

export function StatusBarPlaceholder() {
  return <StatusBar />;
}
