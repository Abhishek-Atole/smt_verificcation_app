import React from 'react';

interface IconProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Icon({ children, className }: IconProps) {
  return <span className={className} aria-hidden>{children}</span>;
}
