import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { BOMS } from '../../data/mock';

export function NewSessionModal({ open, onClose, defaultBomId }: { open: boolean; onClose: () => void; defaultBomId?: string }) {
  const navigate = useNavigate();
  const [bomId, setBomId] = useState(defaultBomId ?? BOMS[0]?.id ?? '');
  const [line, setLine] = useState('Line 3');
  const [station, setStation] = useState('Station A');
  const [notes, setNotes] = useState('');

  const selected = useMemo(() => BOMS.find((bom) => bom.id === bomId) ?? BOMS[0], [bomId]);

  return (
    <Modal open={open} title="Start New Session" size="lg" onClose={onClose} footer={<div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button leftIcon={<span className="material-symbols-outlined">play_arrow</span>} onClick={() => { navigate(`/sessions/${selected?.id.replace('BOM-', '') ?? '1042'}`); onClose(); }}>Start Session</Button></div>}>
      <div className="modal-grid">
        <Input label="Select BOM" value={bomId} onChange={(event) => setBomId(event.target.value)} />
        <Input label="Production Line" value={line} onChange={(event) => setLine(event.target.value)} />
        <Input label="Station" value={station} onChange={(event) => setStation(event.target.value)} />
        <label className="field field-full">
          <span className="field-label">Notes</span>
          <textarea className="ui-textarea" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
