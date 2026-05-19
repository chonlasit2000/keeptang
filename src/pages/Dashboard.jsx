import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Header from '../components/Header.jsx';
import MonthPicker from '../components/MonthPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TransactionRow from '../components/TransactionRow.jsx';
import { baht, dateLabel, groupByDate, monthBounds, summarize } from '../lib/format.js';
import { useTransactions } from '../hooks/useTransactions.js';

export default function Dashboard() {
  const [month, setMonth] = useState(new Date());
  const bounds = useMemo(() => monthBounds(month), [month]);
  const { transactions, loading, error } = useTransactions(bounds);
  const summary = useMemo(() => summarize(transactions), [transactions]);
  const grouped = useMemo(() => Object.fromEntries(Object.entries(groupByDate(transactions)).slice(0, 4)), [transactions]);

  return (
    <div>
      <Header eyebrow="สรุปเดือนนี้" title="ภาพรวมเงินของคุณ" />
      <MonthPicker value={month} onChange={setMonth} />

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-soft md:order-3">
          <p className="text-sm font-semibold text-muted">เงินคงเหลือ</p>
          <p className={`mt-2 text-4xl font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>{baht(summary.balance)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:contents">
          <SummaryCard label="รายรับรวม" value={summary.income} className="bg-incomeSoft text-income md:order-1" />
          <SummaryCard label="รายจ่ายรวม" value={summary.expense} className="bg-expenseSoft text-expense md:order-2" />
        </div>
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">วันนี้และล่าสุด</h2>
          <Link to="/transactions" className="text-sm font-bold text-coral">
            ดูทั้งหมด
          </Link>
        </div>

        {error ? <p className="rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}
        {loading ? <p className="text-sm font-semibold text-muted">กำลังโหลดรายการ...</p> : null}
        {!loading && transactions.length === 0 ? <EmptyState /> : null}

        <div className="space-y-5">
          {Object.entries(grouped).map(([date, rows]) => (
            <div key={date}>
              <p className="mb-2 text-sm font-bold text-muted">{dateLabel(date)}</p>
              <div className="space-y-2">
                {rows.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/add"
        aria-label="เพิ่มรายการ"
        className="fixed bottom-24 right-[max(1.25rem,calc((100vw-28rem)/2+1.25rem))] z-30 grid h-14 w-14 place-items-center rounded-full bg-coral text-white shadow-soft md:hidden"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  );
}

function SummaryCard({ label, value, className }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{baht(value)}</p>
    </div>
  );
}
