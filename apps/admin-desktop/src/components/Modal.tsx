import React from 'react';
import clsx from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={clsx('modal-shell', 'modal-md')}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="text-button" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="ui-button" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
