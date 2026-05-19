import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  description,
  error,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  loadingLabel = 'กำลังดำเนินการ...',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel
}) {
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancelRef.current?.();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, open]);

  if (!open) return null;

  const confirmClass = tone === 'danger' ? 'bg-expense text-white' : 'bg-coral text-white';
  const handleCancel = () => {
    if (!loading) onCancelRef.current?.();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/30 px-5 backdrop-blur-sm" onMouseDown={handleCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-ink shadow-soft"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-xl font-bold">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-expenseSoft p-3 text-sm font-semibold text-expense">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="rounded-2xl bg-cream px-4 py-3 text-sm font-bold text-muted"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-60 ${confirmClass}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
