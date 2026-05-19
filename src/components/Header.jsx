export default function Header({ eyebrow, title, action }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-sm font-semibold text-coral">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-bold leading-tight tracking-normal text-ink">{title}</h1>
      </div>
      {action}
    </header>
  );
}
