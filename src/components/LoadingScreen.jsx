export default function LoadingScreen({ label = 'กำลังโหลด...' }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
      <div>
        <img src="/icons/icon-192.png" alt="" className="mx-auto h-16 w-16 animate-pulse rounded-2xl" />
        <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
      </div>
    </div>
  );
}
