import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import CategoryBadge from '../components/CategoryBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ThaiDatePicker from '../components/ThaiDatePicker.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { getTransaction, saveTransaction } from '../hooks/useTransactions.js';
import { localDate } from '../lib/format.js';

export default function AddTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [txnDate, setTxnDate] = useState(localDate());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const loadedTransactionRef = useRef('');

  const filteredCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);
  const selectedCategory = filteredCategories.find((category) => category.id === categoryId);

  useEffect(() => {
    if (!id || categories.length === 0 || loadedTransactionRef.current === id) return;
    loadedTransactionRef.current = id;
    setLoadError('');
    setError('');
    getTransaction(id)
      .then((transaction) => {
        setType(transaction.type);
        setAmount(String(Number(transaction.amount)));
        setCategoryId(transaction.category_id || '');
        setTxnDate(transaction.txn_date);
        setNote(transaction.note || '');
        setLoadError('');
      })
      .catch((transactionError) => {
        setLoadError(transactionError.message);
        setError('ไม่พบรายการที่ต้องการแก้ไข หรือคุณไม่มีสิทธิ์เข้าถึง');
      });
  }, [categories.length, id]);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [categoryId, filteredCategories]);

  const submit = async () => {
    if (loadError) return;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('กรุณาใส่จำนวนเงินมากกว่า 0');
      return;
    }
    if (!categoryId) {
      setError('กรุณาเลือกหมวดหมู่');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveTransaction(
        user.id,
        {
          amount: numericAmount,
          type,
          category_id: categoryId,
          txn_date: txnDate,
          note: note.trim() || null
        },
        id
      );
      navigate('/', { replace: true });
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full md:max-w-lg">
      <Header eyebrow={id ? 'แก้ไขรายการ' : 'เพิ่มรายการ'} title={type === 'expense' ? 'บันทึกรายจ่าย' : 'บันทึกรายรับ'} />

      <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-soft">
        {[
          ['expense', 'รายจ่าย'],
          ['income', 'รายรับ']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-[0.9rem] py-3 text-sm font-bold ${type === key ? 'bg-coral text-white' : 'text-muted'}`}
            onClick={() => {
              setType(key);
              setCategoryId('');
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-2xl bg-white p-5 text-center shadow-soft">
        <label className="block">
          <span className="text-sm font-semibold text-muted">จำนวนเงิน</span>
          <span className="mt-3 flex min-w-0 items-center rounded-2xl bg-cream px-4 py-3 ring-1 ring-[#EAD8CA] focus-within:ring-coral">
            <span className="shrink-0 text-3xl font-bold text-muted">฿</span>
            <input
              className="ml-2 min-w-0 flex-1 bg-transparent text-right text-4xl font-bold text-ink outline-none placeholder:text-[#BDA99D]"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={amount}
              onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))}
              placeholder="0"
              aria-label="จำนวนเงิน"
            />
          </span>
          {amount ? <span className="mt-2 block text-right text-sm font-semibold text-muted">{formatAmountInput(amount)}</span> : null}
        </label>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-base font-bold">หมวดหมู่</h2>
        {categoriesLoading ? <p className="text-sm font-semibold text-muted">กำลังโหลดหมวดหมู่...</p> : null}
        {!categoriesLoading && filteredCategories.length === 0 ? <EmptyState title="ยังไม่มีหมวดหมู่" description="เพิ่มหมวดหมู่ได้ที่หน้าตั้งค่า" /> : null}
        <div className="grid grid-cols-4 gap-3">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`rounded-[1rem] bg-white p-3 text-center shadow-soft ring-2 ${
                categoryId === category.id ? 'ring-coral' : 'ring-transparent'
              }`}
              onClick={() => setCategoryId(category.id)}
            >
              <CategoryBadge category={category} size="lg" className="mx-auto" />
              <span className="mt-2 block truncate text-xs font-bold">{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid min-w-0 gap-3 rounded-2xl bg-white p-4 shadow-soft">
        <ThaiDatePicker value={txnDate} onChange={setTxnDate} />
        <label className="block min-w-0">
          <span className="text-sm font-semibold">โน้ต</span>
          <textarea className="mt-2 block w-full max-w-full min-w-0 resize-none rounded-2xl border border-[#EAD8CA] px-4 py-3 outline-none focus:border-coral" rows="2" value={note} onChange={(event) => setNote(event.target.value)} placeholder={selectedCategory?.name || 'รายละเอียดเพิ่มเติม'} />
        </label>
      </section>

      {error ? <p className="mt-4 rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}

      <button type="button" disabled={saving || Boolean(loadError)} className="mt-5 w-full rounded-2xl bg-coral px-5 py-4 text-base font-bold text-white shadow-soft disabled:opacity-60" onClick={submit}>
        {saving ? 'กำลังบันทึก...' : 'บันทึก'}
      </button>
    </div>
  );
}

function sanitizeAmountInput(value) {
  const normalized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDot = normalized.indexOf('.');
  const withoutExtraDots =
    firstDot === -1
      ? normalized
      : `${normalized.slice(0, firstDot + 1)}${normalized.slice(firstDot + 1).replace(/\./g, '')}`;
  const [integerPart, decimalPart = ''] = withoutExtraDots.split('.');
  const integer = integerPart.slice(0, 10);
  const decimal = decimalPart.slice(0, 2);

  if (firstDot !== -1) return `${integer || '0'}.${decimal}`;
  return integer;
}

function formatAmountInput(value) {
  if (!value) return '฿0';
  const [integer, decimal] = value.split('.');
  const formattedInteger = Number(integer || 0).toLocaleString('th-TH');
  if (value.endsWith('.')) return `฿${formattedInteger}.`;
  if (decimal !== undefined) return `฿${formattedInteger}.${decimal}`;
  return `฿${formattedInteger}`;
}
