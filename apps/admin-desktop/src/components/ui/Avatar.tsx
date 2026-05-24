import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';
type Tone = 'primary' | 'secondary' | 'tertiary';

export function Avatar({ initials, name, size = 'md', tone = 'primary', online = false }: { initials: string; name?: string; size?: Size; tone?: Tone; online?: boolean }) {
  return (
    <span className={clsx('avatar', `avatar-${size}`, `avatar-${tone}`)} title={name}>
      {initials}
      {online ? <span className="avatar-online pulse-dot" /> : null}
    </span>
  );
}
