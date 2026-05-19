export default function LoadingScreen({ label = 'กำลังโหลด...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
      <div>
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-coral" />
        <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
      </div>
    </div>
  );
}
