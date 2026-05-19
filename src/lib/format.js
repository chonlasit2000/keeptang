import { endOfMonth, format, isToday, parseISO, startOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

export function baht(value) {
  const amount = Number(value || 0);
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

export function localDate(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

export function monthBounds(monthDate) {
  return {
    startDate: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd')
  };
}

export function monthLabel(monthDate) {
  return format(monthDate, 'MMMM yyyy', { locale: th });
}

export function dateLabel(value) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (isToday(date)) return 'วันนี้';
  return format(date, 'd MMMM yyyy', { locale: th });
}

export function groupByDate(transactions) {
  return transactions.reduce((groups, transaction) => {
    const key = transaction.txn_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(transaction);
    return groups;
  }, {});
}

export function summarize(transactions) {
  return transactions.reduce(
    (sum, transaction) => {
      const amount = Number(transaction.amount || 0);
      if (transaction.type === 'income') sum.income += amount;
      if (transaction.type === 'expense') sum.expense += amount;
      sum.balance = sum.income - sum.expense;
      return sum;
    },
    { income: 0, expense: 0, balance: 0 }
  );
}
