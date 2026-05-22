import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRangeLabel, isNextRangeInFuture } from '../lib/dateRange.js';

export default function RangeNav({ mode, anchor, onPrev, onNext }) {
  const nextDisabled = isNextRangeInFuture(mode, anchor);

  return (
    <div className="mt-3 flex items-center justify-between rounded-[1rem] bg-white px-3 py-2 shadow-soft">
      <button
        type="button"
        aria-label="ช่วงก่อนหน้า"
        className="grid h-11 w-11 touch-manipulation select-none place-items-center rounded-2xl text-coral [-webkit-tap-highlight-color:transparent]"
        onClick={onPrev}
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cream">
          <ChevronLeft className="h-5 w-5" />
        </span>
      </button>
      <p className="min-w-0 px-3 text-center text-base font-bold leading-snug">{formatRangeLabel(mode, anchor)}</p>
      <button
        type="button"
        aria-label="ช่วงถัดไป"
        className="grid h-11 w-11 touch-manipulation select-none place-items-center rounded-2xl text-coral [-webkit-tap-highlight-color:transparent] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={nextDisabled}
      >
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cream">
          <ChevronRight className="h-5 w-5" />
        </span>
      </button>
    </div>
  );
}
