import { useTheme } from '../../contexts/ThemeContext';

export default function Topbar() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-search">&nbsp;</div>
      <div className="topbar-links">
        <div className="topbar-user">
          <strong>Administrator</strong>
          <span>{resolvedTheme}</span>
        </div>
        <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">Theme</button>
      </div>
    </header>
  );
}
import { Bell, CircleHelp, LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Input placeholder="Search system entities..." type="search" prefix={<Search size={16} />} />
      </div>
      <div className="topbar-links">
        <button type="button" className="icon-button"><Bell size={18} /></button>
        <button type="button" className="icon-button"><CircleHelp size={18} /></button>
        {user ? <Avatar initials={user.initials} name={user.name} tone="primary" online /> : null}
        <div className="topbar-user">
          <strong>{user?.name ?? 'Operator'}</strong>
          <span>{user?.role ?? 'guest'}</span>
        </div>
        <Button variant="ghost" size="sm" leftIcon={<LogOut size={16} />} onClick={() => { logout(); navigate('/login'); }}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
