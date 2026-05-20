import { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { th } from 'react-day-picker/locale';
import { CalendarDays } from 'lucide-react';
import { localDate } from '../lib/format.js';

export default function ThaiDatePicker({ value, onChange, label = 'วันที่' }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom');
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const selectedDate = useMemo(() => parseLocalDate(value), [value]);
  const displayValue = selectedDate ? formatThaiBuddhistDate(selectedDate) : 'เลือกวันที่';

  useEffect(() => {
    if (!open) return undefined;

    const updatePlacement = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPlacement(spaceBelow < 380 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    };
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    updatePlacement();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative block min-w-0">
      <span className="text-sm font-semibold">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        className="mt-2 flex w-full max-w-full items-center justify-between gap-3 rounded-2xl border border-[#EAD8CA] bg-white px-4 py-3 text-left font-semibold text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{displayValue}</span>
        <CalendarDays className="h-5 w-5 shrink-0 text-coral" aria-hidden="true" />
      </button>

      {open ? (
        <div
          className={`absolute left-1/2 z-30 w-[min(21.5rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.25rem] border border-[#EAD8CA] bg-white p-3 shadow-soft sm:left-0 sm:translate-x-0 ${
            placement === 'top' ? 'bottom-full mb-3' : 'mt-3'
          }`}
          role="dialog"
          aria-label="เลือกวันที่"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate || new Date()}
            onSelect={(date) => {
              if (!date) return;
              onChange(localDate(date));
              setOpen(false);
            }}
            locale={th}
            weekStartsOn={0}
            navLayout="around"
            showOutsideDays
            fixedWeeks
            formatters={{
              formatCaption: formatThaiBuddhistMonth
            }}
            className="keeptang-day-picker"
          />
        </div>
      ) : null}
    </div>
  );
}

function parseLocalDate(value) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatThaiBuddhistDate(date) {
  return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function formatThaiBuddhistMonth(date) {
  return `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
}

const thaiMonths = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม'
];
