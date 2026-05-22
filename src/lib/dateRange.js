import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getYear,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears
} from 'date-fns';
import { th } from 'date-fns/locale';

const weekOptions = { weekStartsOn: 1 };

function toDate(input) {
  return typeof input === 'string' ? parseISO(input) : input;
}

function localDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

function bounds(start, end) {
  return {
    startDate: localDateString(start),
    endDate: localDateString(end)
  };
}

export function getRangeBounds(mode, anchor) {
  if (mode === 'day') return bounds(startOfDay(anchor), endOfDay(anchor));
  if (mode === 'week') return bounds(startOfWeek(anchor, weekOptions), endOfWeek(anchor, weekOptions));
  if (mode === 'year') return bounds(startOfYear(anchor), endOfYear(anchor));
  return bounds(startOfMonth(anchor), endOfMonth(anchor));
}

export function getQueryBounds(mode, anchor) {
  if (mode === 'day') return bounds(startOfDay(subDays(anchor, 6)), endOfDay(anchor));
  if (mode === 'week') return bounds(startOfWeek(subWeeks(anchor, 5), weekOptions), endOfWeek(anchor, weekOptions));
  if (mode === 'year') return bounds(startOfYear(subYears(anchor, 4)), endOfYear(anchor));
  return bounds(startOfMonth(subMonths(anchor, 5)), endOfMonth(anchor));
}

export function shiftAnchor(mode, anchor, direction) {
  if (mode === 'day') return addDays(anchor, direction);
  if (mode === 'week') return addWeeks(anchor, direction);
  if (mode === 'year') return addYears(anchor, direction);
  return addMonths(anchor, direction);
}

export function formatThaiDate(input, pattern) {
  const date = toDate(input);
  const buddhistYear = String(getYear(date) + 543);
  const safePattern = pattern.replace(/yyyy/g, "'__BE_YEAR__'");
  return format(date, safePattern, { locale: th }).replace(/__BE_YEAR__/g, buddhistYear);
}

export function formatRangeLabel(mode, anchor) {
  if (mode === 'day') return formatThaiDate(anchor, 'EEEE d MMMM yyyy');
  if (mode === 'month') return formatThaiDate(anchor, 'MMMM yyyy');
  if (mode === 'year') return formatThaiDate(anchor, 'yyyy');

  const start = startOfWeek(anchor, weekOptions);
  const end = endOfWeek(anchor, weekOptions);
  const sameYear = getYear(start) === getYear(end);
  const sameMonth = sameYear && format(start, 'MM') === format(end, 'MM');

  if (sameMonth) return `${format(start, 'd', { locale: th })} – ${formatThaiDate(end, 'd MMM yyyy')}`;
  if (sameYear) return `${formatThaiDate(start, 'd MMM')} – ${formatThaiDate(end, 'd MMM yyyy')}`;
  return `${formatThaiDate(start, 'd MMM yyyy')} – ${formatThaiDate(end, 'd MMM yyyy')}`;
}

export function isNextRangeInFuture(mode, anchor) {
  const next = shiftAnchor(mode, anchor, 1);
  return getRangeBounds(mode, next).startDate > localDateString(new Date());
}

export function clampAnchorToToday(mode, anchor) {
  const today = new Date();
  return getRangeBounds(mode, anchor).startDate > localDateString(today) ? today : anchor;
}

export function pickAnchorForMode(fromMode, toMode, currentAnchor) {
  if (fromMode === toMode) return currentAnchor;

  let candidate = currentAnchor;
  if (toMode === 'day') {
    if (fromMode === 'month') candidate = endOfMonth(currentAnchor);
    else if (fromMode === 'year') candidate = endOfYear(currentAnchor);
    else if (fromMode === 'week') candidate = endOfWeek(currentAnchor, weekOptions);
  } else if (toMode === 'month' && fromMode === 'year') {
    candidate = endOfYear(currentAnchor);
  }

  return clampAnchorToToday(toMode, candidate);
}
