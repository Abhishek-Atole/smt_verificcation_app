import clsx from 'clsx';

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  return (
    <button type="button" className="toggle-row" onClick={() => onChange(!checked)}>
      <span>
        <span className="toggle-label">{label}</span>
        {description ? <span className="toggle-description">{description}</span> : null}
      </span>
      <span className={clsx('toggle', checked && 'is-on')}><span className="toggle-thumb" /></span>
    </button>
  );
}
