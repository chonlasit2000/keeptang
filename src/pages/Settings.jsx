import { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import Header from '../components/Header.jsx';
import CategoryBadge from '../components/CategoryBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCategories } from '../hooks/useCategories.js';
import { Icon } from '../lib/icons.jsx';

const iconOptions = [
  ['Utensils', 'อาหาร'],
  ['Soup', 'มื้ออาหาร'],
  ['Coffee', 'กาแฟ'],
  ['Salad', 'อาหารสุขภาพ'],
  ['Bus', 'รถเมล์'],
  ['TrainFront', 'รถไฟ'],
  ['Car', 'รถยนต์'],
  ['Fuel', 'น้ำมัน'],
  ['Plane', 'เดินทาง'],
  ['ShoppingBag', 'ช้อปปิ้ง'],
  ['Shirt', 'เสื้อผ้า'],
  ['ReceiptText', 'บิล'],
  ['CreditCard', 'บัตร'],
  ['Smartphone', 'มือถือ'],
  ['Wifi', 'อินเทอร์เน็ต'],
  ['Gamepad2', 'บันเทิง'],
  ['HeartPulse', 'สุขภาพ'],
  ['Dumbbell', 'ฟิตเนส'],
  ['PiggyBank', 'ออมเงิน'],
  ['Landmark', 'ธนาคาร'],
  ['WalletCards', 'เงินเดือน'],
  ['BriefcaseBusiness', 'งาน'],
  ['Laptop', 'ฟรีแลนซ์'],
  ['GraduationCap', 'เรียน'],
  ['Gift', 'ของขวัญ'],
  ['Sparkles', 'โบนัส'],
  ['House', 'บ้าน'],
  ['Wrench', 'ซ่อมแซม'],
  ['CircleDollarSign', 'เงิน'],
  ['Circle', 'อื่นๆ']
];
const colorOptions = [
  ['amber', 'อำพัน', '#FFE6A8'],
  ['sky', 'ฟ้า', '#DDEEFF'],
  ['pink', 'ชมพู', '#FBDDE8'],
  ['mint', 'มิ้นต์', '#DDF2DD'],
  ['coral', 'coral', '#F8D6C8'],
  ['peach', 'พีช', '#FFE0CC'],
  ['lavender', 'ลาเวนเดอร์', '#EDE3FF'],
  ['butter', 'เนย', '#FFF2BF'],
  ['teal', 'ทีล', '#DDF6F3'],
  ['leaf', 'ใบไม้', '#E6F4D7']
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();
  const [tab, setTab] = useState('expense');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ name: '', icon: 'Circle', color: 'coral', grp: 'need' });
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const visibleCategories = useMemo(() => categories.filter((category) => category.type === tab), [categories, tab]);

  useEffect(() => {
    setEditingId('');
    setForm({ name: '', icon: 'Circle', color: 'coral', grp: 'need' });
  }, [tab]);

  const edit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      icon: category.icon,
      color: category.color,
      grp: category.grp
    });
  };

  const reset = () => {
    setEditingId('');
    setForm({ name: '', icon: 'Circle', color: 'coral', grp: 'need' });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (submitting) return;
    const payload = { ...form, name: form.name.trim(), type: tab };
    setActionError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await addCategory(payload);
      }
      reset();
    } catch (submitError) {
      setActionError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setActionError('');
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      if (editingId === pendingDelete.id) reset();
      setPendingDelete(null);
    } catch (deleteError) {
      setActionError(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Header
        eyebrow="บัญชีและหมวดหมู่"
        title="ตั้งค่า"
        action={
          <button type="button" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-coral shadow-soft" onClick={signOut} aria-label="ออกจากระบบ">
            <LogOut className="h-5 w-5" />
          </button>
        }
      />

      <section className="rounded-2xl bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-muted">เข้าสู่ระบบด้วย</p>
        <p className="mt-1 break-all text-base font-bold">{user?.email}</p>
      </section>

      <section className="mt-5">
        <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-soft">
          {[
            ['expense', 'รายจ่าย'],
            ['income', 'รายรับ']
          ].map(([key, label]) => (
            <button key={key} type="button" className={`rounded-[0.9rem] py-3 text-sm font-bold ${tab === key ? 'bg-coral text-white' : 'text-muted'}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <form className="mt-5 rounded-2xl bg-white p-4 shadow-soft" onSubmit={submit}>
        <h2 className="text-base font-bold">{editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cream p-3">
          <CategoryBadge category={form} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{form.name || 'ตัวอย่างหมวดหมู่'}</p>
            <p className="text-xs text-muted">{form.icon} / {form.color}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          <input
            className="w-full rounded-2xl border border-[#EAD8CA] px-4 py-3 outline-none focus:border-coral"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="ชื่อหมวดหมู่"
          />
          <div>
            <p className="text-sm font-semibold">เลือกไอคอน</p>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {iconOptions.map(([icon, label]) => (
                <button
                  key={icon}
                  type="button"
                  title={label}
                  aria-label={label}
                  className={`grid h-12 place-items-center rounded-2xl border bg-white text-muted ${
                    form.icon === icon ? 'border-coral text-coral ring-2 ring-[#F8D6C8]' : 'border-[#EAD8CA]'
                  }`}
                  onClick={() => setForm((current) => ({ ...current, icon }))}
                >
                  <Icon name={icon} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">เลือกสี</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {colorOptions.map(([value, label, hex]) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={label}
                  className={`grid h-11 w-11 place-items-center rounded-full border-2 ${
                    form.color === value ? 'border-coral ring-2 ring-[#F8D6C8]' : 'border-white'
                  }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setForm((current) => ({ ...current, color: value }))}
                >
                  {form.color === value ? <span className="h-3 w-3 rounded-full bg-white/90" /> : null}
                </button>
              ))}
            </div>
          </div>
          <select className="rounded-2xl border border-[#EAD8CA] bg-white px-4 py-3 outline-none focus:border-coral" value={form.grp} onChange={(event) => setForm((current) => ({ ...current, grp: event.target.value }))}>
            <option value="need">จำเป็น</option>
            <option value="want">อยากได้</option>
            <option value="saving">ออม/ลงทุน</option>
            <option value="reward">รางวัล</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-coral px-5 py-3 font-bold text-white disabled:opacity-60">
              {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
            </button>
            {editingId ? (
              <button type="button" className="rounded-2xl bg-cream px-5 py-3 font-bold text-muted" onClick={reset}>
                ยกเลิก
              </button>
            ) : null}
          </div>
          {actionError ? <p className="rounded-2xl bg-expenseSoft p-3 text-sm font-semibold text-expense">{actionError}</p> : null}
        </div>
      </form>

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold">หมวดหมู่{tab === 'expense' ? 'รายจ่าย' : 'รายรับ'}</h2>
        {error ? <p className="rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}
        {loading ? <p className="text-sm font-semibold text-muted">กำลังโหลดหมวดหมู่...</p> : null}
        {!loading && visibleCategories.length === 0 ? <EmptyState title="ยังไม่มีหมวดหมู่" /> : null}
        <div className="space-y-2">
          {visibleCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 rounded-[1rem] bg-white p-3 shadow-soft">
              <CategoryBadge category={category} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{category.name}</p>
                <p className="text-xs text-muted">{category.icon} / {category.color}</p>
              </div>
              <button type="button" className="min-h-[44px] rounded-xl bg-cream px-4 py-2 text-xs font-bold text-coral" onClick={() => edit(category)}>
                แก้ไข
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-xl bg-expenseSoft px-4 py-2 text-xs font-bold text-expense"
                onClick={() => {
                  setActionError('');
                  setPendingDelete(category);
                }}
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="ลบหมวดหมู่นี้?"
        description={pendingDelete ? `ลบ "${pendingDelete.name}" ใช่ไหม? รายการเดิมจะกลายเป็นไม่มีหมวดหมู่` : ''}
        error={actionError}
        confirmLabel="ลบ"
        loadingLabel="กำลังลบ..."
        loading={deleting}
        onCancel={() => {
          setPendingDelete(null);
          setActionError('');
        }}
        onConfirm={remove}
      />
    </div>
  );
}
