import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryBadge from './CategoryBadge.jsx';
import { baht } from '../lib/format.js';

export default function TransactionRow({ transaction, onDelete }) {
  const navigate = useNavigate();
  const category = transaction.category;
  const title = transaction.note?.trim() || category?.name || 'ไม่ระบุหมวด';
  const isIncome = transaction.type === 'income';
  const rowHeight = onDelete ? 'h-24' : 'h-20';

  return (
    <div className={`grid ${rowHeight} min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white p-3 shadow-soft`}>
      <button type="button" className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-left" onClick={() => navigate(`/edit/${transaction.id}`)}>
        <CategoryBadge category={category} />
        <span className="min-w-0 overflow-hidden">
          <span className="block truncate text-sm font-bold text-ink">{title}</span>
          <span className="block truncate text-xs text-muted">{category?.name || 'ไม่มีหมวดหมู่'}</span>
        </span>
      </button>
      <div className="grid min-w-[6.5rem] justify-items-end gap-1 text-right sm:min-w-[8rem]">
        <p className={`max-w-[7.5rem] truncate text-sm font-bold sm:max-w-[9rem] ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'}{baht(transaction.amount)}
        </p>
        {onDelete ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-expenseSoft px-3 py-2 text-xs font-bold text-expense"
            onClick={() => onDelete(transaction)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>ลบ</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
