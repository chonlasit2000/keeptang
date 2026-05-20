import { useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import MonthPicker from '../components/MonthPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import TransactionRow from '../components/TransactionRow.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Select from '../components/Select.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { deleteTransaction, useTransactions } from '../hooks/useTransactions.js';
import { baht, dateLabel, groupByDate, monthBounds, summarize } from '../lib/format.js';

export default function Transactions() {
  const [month, setMonth] = useState(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const bounds = useMemo(() => monthBounds(month), [month]);
  const { categories } = useCategories();
  const { transactions, loading, error, reload } = useTransactions({ ...bounds, categoryId: categoryId || undefined });
  const filteredCategories = useMemo(
    () => (typeFilter === 'all' ? categories : categories.filter((category) => category.type === typeFilter)),
    [categories, typeFilter]
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'ทุกหมวดหมู่' },
      ...filteredCategories.map((category) => ({
        value: category.id,
        label: category.name,
        description: category.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        icon: category.icon,
        color: category.color
      }))
    ],
    [filteredCategories]
  );
  const visibleTransactions = useMemo(
    () => (typeFilter === 'all' ? transactions : transactions.filter((transaction) => transaction.type === typeFilter)),
    [transactions, typeFilter]
  );
  const grouped = useMemo(() => groupByDate(visibleTransactions), [visibleTransactions]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setActionError('');
    setDeleting(true);
    try {
      await deleteTransaction(pendingDelete.id);
      await reload();
      setPendingDelete(null);
    } catch (deleteError) {
      setActionError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Header eyebrow="ประวัติ" title="รายการทั้งหมด" />
      <MonthPicker value={month} onChange={setMonth} />

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold">ชนิดรายการ</p>
        <div className="mt-3 grid grid-cols-3 rounded-2xl bg-cream p-1">
          {[
            ['all', 'ทั้งหมด'],
            ['income', 'รายรับ'],
            ['expense', 'รายจ่าย']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-[0.9rem] py-2.5 text-sm font-bold ${typeFilter === value ? 'bg-coral text-white' : 'text-muted'}`}
              onClick={() => {
                setTypeFilter(value);
                setCategoryId('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold">กรองตามหมวดหมู่</p>
        <Select className="mt-2" value={categoryId} onChange={setCategoryId} options={categoryOptions} />
      </section>

      <section className="mt-5">
        {error ? <p className="rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}
        {actionError ? <p className="mb-3 rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{actionError}</p> : null}
        {loading ? <p className="text-sm font-semibold text-muted">กำลังโหลดรายการ...</p> : null}
        {!loading && visibleTransactions.length === 0 ? <EmptyState title="ไม่พบรายการ" description="ลองเปลี่ยนเดือน ชนิดรายการ หรือหมวดหมู่" /> : null}

        <div className="space-y-5">
          {Object.entries(grouped).map(([date, rows]) => {
            const daily = summarize(rows);
            return (
              <div key={date}>
                <div className="mb-2 flex items-end justify-between gap-3">
                  <p className="text-sm font-bold text-muted">{dateLabel(date)}</p>
                  <p className="text-xs font-semibold text-muted">
                    +{baht(daily.income)} / -{baht(daily.expense)}
                  </p>
                </div>
                <div className="space-y-2">
                  {rows.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onDelete={(selected) => {
                        setActionError('');
                        setPendingDelete(selected);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="ลบรายการนี้?"
        description="รายการที่ลบแล้วจะไม่สามารถกู้คืนได้"
        error={actionError}
        confirmLabel="ลบ"
        loadingLabel="กำลังลบ..."
        loading={deleting}
        onCancel={() => {
          setPendingDelete(null);
          setActionError('');
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
