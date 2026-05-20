import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import Header from '../components/Header.jsx';
import MonthPicker from '../components/MonthPicker.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useTransactions } from '../hooks/useTransactions.js';
import { baht, monthBounds } from '../lib/format.js';

const chartColors = {
  amber: '#F2B84B',
  sky: '#5CA8E8',
  pink: '#E77BA2',
  mint: '#5DC68B',
  coral: '#D85A30',
  peach: '#F59E5B',
  lavender: '#9B7BE8',
  butter: '#E7C744',
  teal: '#55BDB4',
  leaf: '#89BE55'
};

const toneColors = {
  income: '#1D9E75',
  expense: '#993C1D',
  saving: '#25638F'
};

const groupMeta = {
  need: { label: 'จำเป็น', color: '#D85A30', bg: 'bg-[#F8D6C8]', text: 'text-coral' },
  want: { label: 'ฟุ่มเฟือย', color: '#E77BA2', bg: 'bg-pinkSoft', text: 'text-[#9D3F62]' },
  saving: { label: 'ออม/ลงทุน', color: toneColors.saving, bg: 'bg-skySoft', text: 'text-[#25638F]' },
  reward: { label: 'ให้รางวัลตัวเอง', color: '#F2B84B', bg: 'bg-amberSoft', text: 'text-[#8A5A00]' }
};

const groupOrder = ['need', 'want', 'saving', 'reward'];

export default function Stats() {
  const [month, setMonth] = useState(new Date());
  const selectedBounds = useMemo(() => monthBounds(month), [month]);
  const trendMonths = useMemo(() => getTrendMonths(month), [month]);
  const trendBounds = useMemo(
    () => ({
      startDate: format(startOfMonth(trendMonths[0].date), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(month), 'yyyy-MM-dd')
    }),
    [month, trendMonths]
  );
  const { transactions, loading, error } = useTransactions(trendBounds);

  const selectedTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.txn_date >= selectedBounds.startDate && transaction.txn_date <= selectedBounds.endDate
      ),
    [selectedBounds.endDate, selectedBounds.startDate, transactions]
  );
  const selectedExpenses = useMemo(
    () => selectedTransactions.filter((transaction) => transaction.type === 'expense'),
    [selectedTransactions]
  );
  const categoryData = useMemo(() => buildCategoryData(selectedExpenses), [selectedExpenses]);
  const totalExpense = useMemo(() => categoryData.reduce((sum, item) => sum + item.amount, 0), [categoryData]);
  const trendData = useMemo(() => buildTrendData(transactions, trendMonths), [transactions, trendMonths]);
  const groupSummary = useMemo(() => buildGroupData(selectedExpenses), [selectedExpenses]);
  const groupData = groupSummary.groups;
  const hasTrendData = trendData.some((item) => item.income > 0 || item.expense > 0);

  return (
    <div>
      <Header eyebrow="สถิติ" title="เห็นภาพรวมเงินของคุณ" />
      <MonthPicker value={month} onChange={setMonth} />

      {error ? <p className="mt-4 rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm font-semibold text-muted">กำลังโหลดสถิติ...</p> : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl bg-white p-4 shadow-soft md:p-5">
          <SectionHeader title="รายจ่ายตามหมวด" description="สัดส่วนรายจ่ายของเดือนที่เลือก" />

          {!loading && categoryData.length === 0 ? (
            <EmptyState title="ยังไม่มีรายจ่ายในเดือนนี้" description="เมื่อบันทึกรายจ่ายแล้ว กราฟโดนัทจะแสดงสัดส่วนตามหมวดหมู่" />
          ) : null}

          {categoryData.length > 0 ? (
            <div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr] lg:grid-cols-1 xl:grid-cols-[13rem_1fr]">
              <div className="relative mx-auto h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={100} paddingAngle={3}>
                      {categoryData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<MoneyTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-xs font-bold text-muted">รวมรายจ่าย</p>
                    <p className="mt-1 text-xl font-bold text-expense">{baht(totalExpense)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      <p className="text-xs font-semibold text-muted">{item.percent.toFixed(1)}%</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-expense">{baht(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-soft md:p-5">
          <SectionHeader title="แนวโน้ม 6 เดือน" description="เปรียบเทียบรายรับและรายจ่ายย้อนหลัง" />

          {!loading && !hasTrendData ? (
            <EmptyState title="ยังไม่มีข้อมูลย้อนหลัง" description="บันทึกรายรับหรือรายจ่ายเพื่อดูแนวโน้มรายเดือน" />
          ) : null}

          {hasTrendData ? (
            <div className="mt-5 h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barGap={4}>
                  <CartesianGrid stroke="#F0DED1" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8B7569', fontSize: 12, fontWeight: 700 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8B7569', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(value) => compactBaht(value)}
                    width={72}
                  />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: '#FBF3E7' }} />
                  <Bar dataKey="income" name="รายรับ" fill={toneColors.income} radius={[10, 10, 4, 4]} maxBarSize={22} />
                  <Bar dataKey="expense" name="รายจ่าย" fill={toneColors.expense} radius={[10, 10, 4, 4]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-5">
        <SectionHeader title="สรุปรายจ่าย 4 กลุ่ม" description="คำนวณจากกลุ่มของหมวดหมู่ในเดือนที่เลือก" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groupData.map((group) => (
            <GroupCard key={group.key} group={group} />
          ))}
        </div>
        {groupSummary.ungroupedAmount > 0 ? (
          <p className="mt-3 rounded-2xl bg-cream p-3 text-xs font-semibold text-muted">
            มีรายจ่าย {baht(groupSummary.ungroupedAmount)} ที่ไม่มีข้อมูลกลุ่ม จึงไม่รวมในสรุป 4 กลุ่ม
          </p>
        ) : null}
      </section>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-muted">{description}</p>
    </div>
  );
}

function GroupCard({ group }) {
  const meta = groupMeta[group.key];

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{meta.label}</p>
          <p className={`mt-2 text-2xl font-bold ${meta.text}`}>{baht(group.amount)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${meta.bg} ${meta.text}`}>{group.percent}%</span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full" style={{ width: `${group.percent}%`, backgroundColor: meta.color }} />
      </div>
    </article>
  );
}

function MoneyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-2xl border border-[#EAD8CA] bg-white px-3 py-2 text-sm shadow-soft">
      <p className="font-bold">{item.name}</p>
      <p className="font-semibold text-expense">{baht(item.amount)}</p>
      <p className="text-xs font-semibold text-muted">{item.percent.toFixed(1)}%</p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[#EAD8CA] bg-white px-3 py-2 text-sm shadow-soft">
      <p className="font-bold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="font-semibold" style={{ color: item.color }}>
          {item.name}: {baht(item.value)}
        </p>
      ))}
    </div>
  );
}

function buildCategoryData(expenses) {
  const byCategory = expenses.reduce((items, transaction) => {
    const category = transaction.category;
    const key = category?.id || 'uncategorized';
    const amount = Number(transaction.amount || 0);

    if (!items[key]) {
      items[key] = {
        name: category?.name || 'ไม่ระบุหมวด',
        amount: 0,
        color: chartColors[category?.color] || chartColors.coral
      };
    }

    items[key].amount += amount;
    return items;
  }, {});

  const total = Object.values(byCategory).reduce((sum, item) => sum + item.amount, 0);

  return Object.values(byCategory)
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      ...item,
      percent: total > 0 ? (item.amount / total) * 100 : 0
    }));
}

function buildTrendData(transactions, trendMonths) {
  const rows = trendMonths.map((month) => ({
    key: month.key,
    label: month.label,
    income: 0,
    expense: 0
  }));
  const rowMap = Object.fromEntries(rows.map((row) => [row.key, row]));

  transactions.forEach((transaction) => {
    const row = rowMap[transaction.txn_date.slice(0, 7)];
    if (!row) return;
    const amount = Number(transaction.amount || 0);
    if (transaction.type === 'income') row.income += amount;
    if (transaction.type === 'expense') row.expense += amount;
  });

  return rows;
}

function buildGroupData(expenses) {
  const totals = Object.fromEntries(groupOrder.map((key) => [key, 0]));

  expenses.forEach((transaction) => {
    const key = transaction.category?.grp;
    if (!groupOrder.includes(key)) return;
    totals[key] += Number(transaction.amount || 0);
  });

  const amounts = groupOrder.map((key) => totals[key]);
  const percents = allocateWholePercent(amounts);

  return {
    groups: groupOrder.map((key, index) => ({
      key,
      amount: totals[key],
      percent: percents[index]
    })),
    ungroupedAmount: expenses.reduce((sum, transaction) => {
      if (groupOrder.includes(transaction.category?.grp)) return sum;
      return sum + Number(transaction.amount || 0);
    }, 0)
  };
}

function getTrendMonths(month) {
  const selectedMonth = startOfMonth(month);
  return Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(selectedMonth, index - 5);
    return {
      date,
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMM', { locale: th })
    };
  });
}

function allocateWholePercent(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);

  const raw = values.map((value, index) => {
    const exact = (value / total) * 100;
    return { index, whole: Math.floor(exact), remainder: exact % 1 };
  });
  let remaining = 100 - raw.reduce((sum, item) => sum + item.whole, 0);

  [...raw]
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((item) => {
      if (remaining <= 0) return;
      item.whole += 1;
      remaining -= 1;
    });

  return raw.sort((a, b) => a.index - b.index).map((item) => item.whole);
}

function compactBaht(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `฿${Math.round(amount / 1000)}K`;
  return `฿${amount}`;
}
