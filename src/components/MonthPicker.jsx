import { addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel } from '../lib/format.js';

export default function MonthPicker({ value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-[1rem] bg-white px-3 py-2 shadow-soft">
      <button
        type="button"
        aria-label="เดือนก่อนหน้า"
        className="grid h-10 w-10 place-items-center rounded-2xl bg-cream text-coral"
        onClick={() => onChange(addMonths(value, -1))}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="text-base font-bold">{monthLabel(value)}</p>
      <button
        type="button"
        aria-label="เดือนถัดไป"
        className="grid h-10 w-10 place-items-center rounded-2xl bg-cream text-coral"
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
