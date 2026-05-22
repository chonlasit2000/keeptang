const options = [
  { value: 'day', label: 'วัน' },
  { value: 'week', label: 'สัปดาห์' },
  { value: 'month', label: 'เดือน' },
  { value: 'year', label: 'ปี' }
];

export default function RangeToggle({ value, onChange }) {
  return (
    <div className="mt-4 grid grid-cols-4 rounded-[1rem] bg-white p-1 shadow-soft" role="tablist" aria-label="เลือกช่วงเวลา">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`min-h-[44px] touch-manipulation select-none rounded-[0.85rem] px-2 text-sm font-bold transition ${
              active
                ? 'bg-coral text-white shadow-[0_10px_22px_rgba(216,90,48,0.22)]'
                : 'text-muted active:bg-cream [@media(hover:hover)]:hover:bg-cream'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
