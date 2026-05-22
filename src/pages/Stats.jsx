import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  getISOWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear
} from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CategoryBadge from '../components/CategoryBadge.jsx';
import Header from '../components/Header.jsx';
import EmptyState from '../components/EmptyState.jsx';
import RangeNav from '../components/RangeNav.jsx';
import RangeToggle from '../components/RangeToggle.jsx';
import { useTransactions } from '../hooks/useTransactions.js';
import {
  clampAnchorToToday,
  formatThaiDate,
  getRangeBounds,
  getQueryBounds,
  pickAnchorForMode,
  shiftAnchor
} from '../lib/dateRange.js';
import { baht } from '../lib/format.js';

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
const transactionPageSize = 20;

const rangeCopy = {
  day: {
    categoryDescription: 'สัดส่วนรายจ่ายของวันที่เลือก',
    categoryEmptyTitle: 'ยังไม่มีรายจ่ายในวันนี้',
    trendTitle: 'แนวโน้ม 7 วัน',
    trendDescription: 'เปรียบเทียบรายรับและรายจ่ายรายวัน',
    trendEmptyTitle: 'ยังไม่มีข้อมูลย้อนหลัง',
    trendEmptyDescription: 'บันทึกรายรับหรือรายจ่ายเพื่อดูแนวโน้มรายวัน',
    groupDescription: 'คำนวณจากกลุ่มของหมวดหมู่ในวันที่เลือก'
  },
  week: {
    categoryDescription: 'สัดส่วนรายจ่ายของสัปดาห์ที่เลือก',
    categoryEmptyTitle: 'ยังไม่มีรายจ่ายในสัปดาห์นี้',
    trendTitle: 'แนวโน้ม 6 สัปดาห์',
    trendDescription: 'เปรียบเทียบรายรับและรายจ่ายรายสัปดาห์',
    trendEmptyTitle: 'ยังไม่มีข้อมูลย้อนหลัง',
    trendEmptyDescription: 'บันทึกรายรับหรือรายจ่ายเพื่อดูแนวโน้มรายสัปดาห์',
    groupDescription: 'คำนวณจากกลุ่มของหมวดหมู่ในสัปดาห์ที่เลือก'
  },
  month: {
    categoryDescription: 'สัดส่วนรายจ่ายของเดือนที่เลือก',
    categoryEmptyTitle: 'ยังไม่มีรายจ่ายในเดือนนี้',
    trendTitle: 'แนวโน้ม 6 เดือน',
    trendDescription: 'เปรียบเทียบรายรับและรายจ่ายย้อนหลัง',
    trendEmptyTitle: 'ยังไม่มีข้อมูลย้อนหลัง',
    trendEmptyDescription: 'บันทึกรายรับหรือรายจ่ายเพื่อดูแนวโน้มรายเดือน',
    groupDescription: 'คำนวณจากกลุ่มของหมวดหมู่ในเดือนที่เลือก'
  },
  year: {
    categoryDescription: 'สัดส่วนรายจ่ายของปีที่เลือก',
    categoryEmptyTitle: 'ยังไม่มีรายจ่ายในปีนี้',
    trendTitle: 'แนวโน้ม 5 ปี',
    trendDescription: 'เปรียบเทียบรายรับและรายจ่ายรายปี',
    trendEmptyTitle: 'ยังไม่มีข้อมูลย้อนหลัง',
    trendEmptyDescription: 'บันทึกรายรับหรือรายจ่ายเพื่อดูแนวโน้มรายปี',
    groupDescription: 'คำนวณจากกลุ่มของหมวดหมู่ในปีที่เลือก'
  }
};

export default function Stats() {
  const navigate = useNavigate();
  const [rangeMode, setRangeMode] = useState('month');
  const [anchor, setAnchor] = useState(new Date());
  const [committedRange, setCommittedRange] = useState(() => ({ mode: 'month', anchor: new Date() }));
  const [committedTransactions, setCommittedTransactions] = useState([]);
  const [hasPending, setHasPending] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [visibleCount, setVisibleCount] = useState(transactionPageSize);
  const prevLoadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);
  const copy = rangeCopy[committedRange.mode];
  const selectedBounds = useMemo(
    () => getRangeBounds(committedRange.mode, committedRange.anchor),
    [committedRange.anchor, committedRange.mode]
  );
  const trendBuckets = useMemo(
    () => getTrendBuckets(committedRange.mode, committedRange.anchor),
    [committedRange.anchor, committedRange.mode]
  );
  const queryBounds = useMemo(
    () => getQueryBounds(rangeMode, anchor),
    [anchor, rangeMode]
  );
  const { transactions, loading, error } = useTransactions(queryBounds);

  const selectedTransactions = useMemo(
    () =>
      committedTransactions.filter(
        (transaction) => transaction.txn_date >= selectedBounds.startDate && transaction.txn_date <= selectedBounds.endDate
      ),
    [committedTransactions, selectedBounds.endDate, selectedBounds.startDate]
  );
  const selectedExpenses = useMemo(
    () => selectedTransactions.filter((transaction) => transaction.type === 'expense'),
    [selectedTransactions]
  );
  const categoryData = useMemo(() => buildCategoryData(selectedExpenses), [selectedExpenses]);
  const totalExpense = useMemo(() => categoryData.reduce((sum, item) => sum + item.amount, 0), [categoryData]);
  const trendData = useMemo(
    () => buildTrendData(committedTransactions, trendBuckets, committedRange.mode),
    [committedRange.mode, committedTransactions, trendBuckets]
  );
  const trendYAxis = useMemo(() => {
    const max = Math.max(0, ...trendData.flatMap((row) => [row.income, row.expense]));
    const niceMax = niceCeil(max);
    return {
      domain: [0, niceMax],
      ticks: [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax]
    };
  }, [trendData]);
  const groupSummary = useMemo(() => buildGroupData(selectedExpenses), [selectedExpenses]);
  const groupData = groupSummary.groups;
  const hasTrendData = trendData.some((item) => item.income > 0 || item.expense > 0);
  const visibleTransactions = useMemo(
    () => selectedTransactions.slice(0, visibleCount),
    [selectedTransactions, visibleCount]
  );
  const hasMoreTransactions = visibleCount < selectedTransactions.length;
  const updateRange = (nextMode, nextAnchor) => {
    const currentBounds = getRangeBounds(rangeMode, anchor);
    const nextBounds = getRangeBounds(nextMode, nextAnchor);
    if (
      nextMode === rangeMode &&
      currentBounds.startDate === nextBounds.startDate &&
      currentBounds.endDate === nextBounds.endDate
    ) {
      return;
    }

    setRangeMode(nextMode);
    setAnchor(nextAnchor);
    setHasPending(true);
  };
  const handleRangeModeChange = (nextMode) => {
    updateRange(nextMode, pickAnchorForMode(rangeMode, nextMode, anchor));
  };
  const handlePrev = () => {
    updateRange(rangeMode, shiftAnchor(rangeMode, anchor, -1));
  };
  const handleNext = () => {
    updateRange(rangeMode, clampAnchorToToday(rangeMode, shiftAnchor(rangeMode, anchor, 1)));
  };
  const isInitialLoading = !hasLoadedOnce && !error;
  const isRefetching = hasLoadedOnce && (loading || hasPending);

  useEffect(() => {
    setVisibleCount(transactionPageSize);
  }, [selectedBounds.endDate, selectedBounds.startDate]);

  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    if (!wasLoading || loading) return;

    if (!error) {
      setCommittedRange({ mode: rangeMode, anchor });
      setCommittedTransactions(transactions);
      setHasLoadedOnce(true);
    }
    setHasPending(false);
  }, [anchor, error, loading, rangeMode, transactions]);

  useEffect(() => {
    if (!hasMoreTransactions || typeof IntersectionObserver === 'undefined') return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setVisibleCount((count) => Math.min(count + transactionPageSize, selectedTransactions.length));
        window.requestAnimationFrame(() => {
          loadingMoreRef.current = false;
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreTransactions, selectedTransactions.length]);

  return (
    <div>
      <Header eyebrow="สถิติ" title="เห็นภาพรวมเงินของคุณ" />
      <RangeToggle value={rangeMode} onChange={handleRangeModeChange} />
      <RangeNav mode={rangeMode} anchor={anchor} onPrev={handlePrev} onNext={handleNext} />

      {error ? <p className="mt-4 rounded-2xl bg-expenseSoft p-4 text-sm font-semibold text-expense">{error}</p> : null}
      {isInitialLoading ? <p className="mt-4 text-sm font-semibold text-muted">กำลังโหลดสถิติ...</p> : null}
      {isRefetching ? (
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          กำลังโหลดข้อมูลช่วงใหม่...
        </p>
      ) : null}

      <div className={`transition-opacity duration-200 ${isRefetching ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="min-w-0 rounded-2xl bg-white p-4 shadow-soft md:p-5">
            <SectionHeader title="รายจ่ายตามหมวด" description={copy.categoryDescription} />

            {!isInitialLoading && categoryData.length === 0 ? (
              <div className="grid min-h-[20rem] place-items-center">
                <EmptyState title={copy.categoryEmptyTitle} description="เมื่อบันทึกรายจ่ายแล้ว กราฟโดนัทจะแสดงสัดส่วนตามหมวดหมู่" />
              </div>
            ) : null}

            {categoryData.length > 0 ? (
              <div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr] lg:grid-cols-1">
                <div className="keeptang-chart relative mx-auto h-52 w-52">
                  <PieChart width={208} height={208} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie data={categoryData} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                      {categoryData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<MoneyTooltip />} offset={16} wrapperStyle={{ pointerEvents: 'none', zIndex: 10 }} />
                  </PieChart>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-xs font-bold text-muted">รวมรายจ่าย</p>
                      <p className="mt-1 text-xl font-bold text-expense">{baht(totalExpense)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 lg:max-h-[20rem] lg:overflow-y-auto lg:pr-1">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-bold leading-snug">{item.name}</p>
                        <p className="text-xs font-semibold text-muted">{item.percent.toFixed(1)}%</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-expense">{baht(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-soft md:p-5">
            <SectionHeader title={copy.trendTitle} description={copy.trendDescription} />

            {!isInitialLoading && !hasTrendData ? (
              <div className="grid flex-1 min-h-[20rem] place-items-center">
                <EmptyState title={copy.trendEmptyTitle} description={copy.trendEmptyDescription} />
              </div>
            ) : null}

            {hasTrendData ? (
              <div className="keeptang-chart mt-5 flex-1 min-h-[16rem] w-full max-w-full min-w-0 overflow-hidden">
                <BarChart
                  responsive
                  style={{ width: '100%', height: '100%', minWidth: 0 }}
                  data={trendData}
                  margin={{ top: 20, right: 12, bottom: 0, left: 0 }}
                  barCategoryGap="10%"
                  barGap={6}
                >
                  <CartesianGrid stroke="#F0DED1" vertical={false} />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    minTickGap={0}
                    padding={{ left: 0, right: 0 }}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8B7569', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={trendYAxis.domain}
                    ticks={trendYAxis.ticks}
                    width={56}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8B7569', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={bahtAxisLabel}
                  />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: '#FBF3E7' }} />
                  <Bar dataKey="income" name="รายรับ" fill={toneColors.income} radius={[10, 10, 4, 4]} maxBarSize={32} />
                  <Bar dataKey="expense" name="รายจ่าย" fill={toneColors.expense} radius={[10, 10, 4, 4]} maxBarSize={32} />
                </BarChart>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-5">
          <SectionHeader title="สรุปรายจ่าย 4 กลุ่ม" description={copy.groupDescription} />
          {!isInitialLoading ? (
            totalExpense === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="ยังไม่มีรายจ่ายให้แยกกลุ่ม"
                  description="เมื่อมีรายจ่าย จะเห็นสัดส่วน 4 กลุ่ม (จำเป็น/ฟุ่มเฟือย/ออม/ให้รางวัล) ตรงนี้"
                />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {groupData.map((group) => (
                  <GroupCard key={group.key} group={group} />
                ))}
              </div>
            )
          ) : null}
          {groupSummary.ungroupedAmount > 0 ? (
            <p className="mt-3 rounded-2xl bg-cream p-3 text-xs font-semibold text-muted">
              มีรายจ่าย {baht(groupSummary.ungroupedAmount)} ที่ไม่มีข้อมูลกลุ่ม จึงไม่รวมในสรุป 4 กลุ่ม
            </p>
          ) : null}
        </section>

        <section className="mt-5">
          <SectionHeader
            title={`รายการในช่วงนี้ (${selectedTransactions.length} รายการ)`}
            description="โน้ตและรายละเอียดรายการที่อยู่ในช่วงเวลาที่เลือก"
          />

          {error ? null : (
            <div className="mt-3">
              {!isInitialLoading && selectedTransactions.length === 0 ? (
                <EmptyState title="ไม่มีรายการในช่วงนี้" description="ลองเลือกช่วงเวลาอื่น หรือเพิ่มรายการใหม่เพื่อดูรายละเอียดตรงนี้" />
              ) : null}

              {visibleTransactions.length > 0 ? (
                <div className="space-y-2">
                  {visibleTransactions.map((transaction) => (
                    <StatsTxnRow
                      key={transaction.id}
                      transaction={transaction}
                      onClick={() => navigate(`/edit/${transaction.id}`)}
                    />
                  ))}
                </div>
              ) : null}

              {hasMoreTransactions ? (
                <div ref={sentinelRef} className="grid min-h-[4rem] place-items-center">
                  <p className="text-xs font-semibold text-muted">กำลังโหลดรายการเพิ่ม...</p>
                </div>
              ) : null}

              {!isInitialLoading && selectedTransactions.length > 0 && !hasMoreTransactions ? (
                <p className="mt-3 text-center text-xs font-semibold text-muted">
                  แสดงครบทั้งหมด {selectedTransactions.length} รายการ
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
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
    <article className="flex h-full min-h-[136px] flex-col rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex min-h-[2.5rem] items-start justify-between gap-3">
        <p className="min-w-0 pr-2 text-sm font-bold leading-snug">{meta.label}</p>
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${meta.bg} ${meta.text}`}>{group.percent}%</span>
      </div>
      <p className={`mt-2 text-2xl font-bold leading-tight ${meta.text}`}>{baht(group.amount)}</p>
      <div className="mt-auto h-2.5 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full" style={{ width: `${group.percent}%`, backgroundColor: meta.color }} />
      </div>
    </article>
  );
}

function StatsTxnRow({ transaction, onClick }) {
  const category = transaction.category;
  const note = transaction.note?.trim();
  const title = note || category?.name || 'ไม่ระบุหมวด';
  const date = formatThaiDate(transaction.txn_date, 'd MMM yyyy');
  const isIncome = transaction.type === 'income';
  const amountClass = isIncome ? 'text-income' : 'text-expense';

  return (
    <button
      type="button"
      className="grid min-h-[64px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(51,37,31,0.1)]"
      onClick={onClick}
    >
      <CategoryBadge category={category} />
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-bold leading-snug text-ink">{title}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-muted">
          {note ? `${category?.name || 'ไม่มีหมวดหมู่'} • ${date}` : date}
        </span>
      </span>
      <span className={`shrink-0 text-right text-sm font-bold ${amountClass}`}>
        {isIncome ? '+' : '-'}{baht(transaction.amount)}
      </span>
    </button>
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
  const tooltipLabel = payload[0].payload.tooltipLabel || label;
  return (
    <div className="rounded-2xl border border-[#EAD8CA] bg-white px-3 py-2 text-sm shadow-soft">
      <p className="font-bold">{tooltipLabel}</p>
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

function buildTrendData(transactions, trendBuckets, mode) {
  const rows = trendBuckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    tooltipLabel: bucket.tooltipLabel,
    income: 0,
    expense: 0
  }));
  const rowMap = Object.fromEntries(rows.map((row) => [row.key, row]));

  transactions.forEach((transaction) => {
    const row = rowMap[getTrendKey(mode, transaction.txn_date)];
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

function getTrendBuckets(mode, anchor) {
  if (mode === 'day') {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(anchor, index - 6);
      return {
        date,
        key: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEEEE', { locale: th }),
        tooltipLabel: formatThaiDate(date, 'EEEE d MMM yyyy')
      };
    });
  }

  if (mode === 'week') {
    const selectedWeek = startOfWeek(anchor, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, index) => {
      const date = addWeeks(selectedWeek, index - 5);
      const end = addDays(date, 6);
      return {
        date,
        key: format(date, 'yyyy-MM-dd'),
        label: String(getISOWeek(date)),
        tooltipLabel: `สัปดาห์ที่ ${getISOWeek(date)} (${formatWeekTooltipRange(date, end)})`
      };
    });
  }

  if (mode === 'year') {
    const selectedYear = startOfYear(anchor);
    return Array.from({ length: 5 }, (_, index) => {
      const date = addYears(selectedYear, index - 4);
      return {
        date,
        key: format(date, 'yyyy'),
        label: formatThaiDate(date, 'yyyy'),
        tooltipLabel: `พ.ศ. ${formatThaiDate(date, 'yyyy')}`
      };
    });
  }

  const selectedMonth = startOfMonth(anchor);
  return Array.from({ length: 6 }, (_, index) => {
    const date = addMonths(selectedMonth, index - 5);
    return {
      date,
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMM', { locale: th }),
      tooltipLabel: formatThaiDate(date, 'MMMM yyyy')
    };
  });
}

function getTrendKey(mode, txnDate) {
  if (mode === 'day') return txnDate;
  if (mode === 'week') return format(startOfWeek(parseISO(txnDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  if (mode === 'year') return txnDate.slice(0, 4);
  return txnDate.slice(0, 7);
}

function formatWeekTooltipRange(start, end) {
  const sameYear = format(start, 'yyyy') === format(end, 'yyyy');
  const sameMonth = sameYear && format(start, 'MM') === format(end, 'MM');

  if (sameMonth) return `${format(start, 'd', { locale: th })} – ${formatThaiDate(end, 'd MMM yyyy')}`;
  if (sameYear) return `${formatThaiDate(start, 'd MMM')} – ${formatThaiDate(end, 'd MMM yyyy')}`;
  return `${formatThaiDate(start, 'd MMM yyyy')} – ${formatThaiDate(end, 'd MMM yyyy')}`;
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

function bahtAxisLabel(value) {
  const amount = Number(value || 0);
  return `฿${Math.round(amount).toLocaleString('th-TH')}`;
}

function niceCeil(value) {
  if (value <= 0) return 1000;
  let magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  let fraction = value / magnitude;
  if (fraction < 1.5) {
    magnitude /= 10;
    fraction = value / magnitude;
  }
  const nice = [2, 4, 8, 12, 16, 20, 40, 80, 100].find((n) => n >= fraction) ?? 100;
  return nice * magnitude;
}
