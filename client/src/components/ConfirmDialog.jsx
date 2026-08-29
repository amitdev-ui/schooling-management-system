import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm action', message = 'Are you sure?', loading = false, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
    </Modal>
  );
}
