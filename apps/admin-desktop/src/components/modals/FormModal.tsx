import React from 'react';

interface FormModalProps {
  open: boolean;
  title?: string;
  onSubmit: (data: Record<string, any>) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function FormModal({ open, title = 'Form', onSubmit, onClose, children }: FormModalProps) {
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For placeholder, return empty data
    onSubmit({});
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <form className="modal-shell modal-md" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="text-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="ui-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-button ui-button-primary">Submit</button>
        </div>
      </form>
    </div>
  );
}
