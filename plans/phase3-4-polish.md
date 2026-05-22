# Phase 3.4 — Polish + Edge Cases (สำหรับ Stats.jsx)

> **Branch:** `phase3`
> **Plan reference:** `plans/phase3-time-ranges.md` (lines 319–355)
> **Scope:** Stats.jsx + dateRange.js เท่านั้น

---

## Context

Phase 3.1–3.3 ส่ง Day/Week/Month/Year toggle + รายการในช่วง + infinite scroll ครบแล้ว ใช้ได้จริงทั้ง 4 mode

แต่ยังเหลือ rough edges 3 จุดที่ Phase 3.4 ต้องเก็บ:

1. **Loading UX มี blank flash** — ตอน toggle mode/anchor ใหม่ ข้อความ `กำลังโหลดสถิติ...` ใต้ header โผล่ขึ้นทับเนื้อหาเก่า → ผู้ใช้รู้สึกว่าหน้ากระพริบ
2. **Switch mode แล้วเสีย context** — ดูเดือน ก.พ. 2569 อยู่ → toggle ไป Day → `clampAnchorToToday` ดึงไปวันนี้ (พ.ค. 22) เสมอ ผู้ใช้ไม่ได้ดูวันใน ก.พ. ที่ดูอยู่
3. **Group card 4 ใบยังโผล่เป็น `฿0` 0%** ตอนช่วงไม่มีรายจ่ายเลย → noisy + ไม่สม่ำเสมอกับ donut/trend ที่มี EmptyState แล้ว

Phase 3.4 = แก้ 3 จุดนี้โดยไม่กระทบ Phase 2 (Month mode) และไม่แตะ flow Phase 3.1–3.3 ที่ผ่าน test gate แล้ว

---

## Inventory (verified)

ตรวจไฟล์จริงแล้ว — ของพวกนี้ทำเสร็จแล้ว ห้าม Codex แตะ:

| Task | File:line | Status |
|------|-----------|--------|
| Initial loading text `กำลังโหลดสถิติ...` | Stats.jsx:193 | ✅ |
| Next arrow disable + `isNextRangeInFuture` | RangeNav.jsx + dateRange.js:84 | ✅ |
| `clampAnchorToToday` | dateRange.js:89 | ✅ |
| `visibleCount` reset on range change | Stats.jsx:161-163 | ✅ |
| Infinite scroll + `requestIdRef` race guard | Stats.jsx:165 + useTransactions.js | ✅ |
| RangeToggle active = coral | RangeToggle.jsx:52 | ✅ |
| EmptyState — donut/trend/list | Stats.jsx:199/243/309 | ✅ |
| Mode-switch handler (clamp only) | Stats.jsx:150-153 | ⚠️ partial |
| Group card empty state | Stats.jsx:287-299 | ❌ |
| Overlay during refetch | — | ❌ |

---

## Tasks

### Task 1 — Loading overlay + committed view model (Stats.jsx)

**Goal:** ระหว่าง refetch ให้ render **มุมมองเดิม** (ของ committed range) แบบ dim — ไม่ flash blank, ไม่ flash EmptyState, ไม่โชว์ขยะจาก "old transactions ที่ filter ด้วย bounds ใหม่"

**Why this matters (จาก review):** ถ้าครอบแค่ overlay opacity แต่ปล่อยให้ `selectedBounds`, `trendBuckets`, `selectedTransactions`, `categoryData`, `copy` คำนวณจาก live `rangeMode/anchor` ทันที — ระหว่าง refetch เนื้อหาที่ dim **ไม่ใช่เนื้อหาเก่าจริง** แต่เป็น **bounds ใหม่ filter ของเก่า** → empty/ผิดได้ + EmptyState flash ได้

**Approach — "committed view (range + transactions)" + pending flag + loading transition:**

แยก state เป็น 2 ชั้น:
- **Live state** (`rangeMode`, `anchor`) — update ทันทีเมื่อ user toggle/nav. ใช้สำหรับ RangeNav label + คำนวณ `queryBounds` ส่งเข้า `useTransactions`
- **Committed state** (`committedRange = { mode, anchor }` + `committedTransactions: Transaction[]`) — update **คู่กันในเฟรมเดียว** เฉพาะตอน detect loading transition true → false. ใช้สำหรับ derived view (bounds, trendBuckets, copy, **rangeMode + transactions** ที่ส่งเข้า build* helpers)
- **`hasPending` state** — set true ใน handler ทันทีตอน user เปลี่ยน range. clear เมื่อ commit สำเร็จ. ใช้คุม overlay ให้ขึ้น **ทันทีในเฟรมแรก** (ก่อนที่ hook จะมีโอกาส setLoading(true))

**Why pending flag + transition detection (จาก review รอบ 2):**
- `if (!loading) setCommittedRange(...)` แบบไร้เงื่อนไข transition จะ commit ทันทีใน render แรกหลัง user toggle — เพราะ hook ยังคืน `loading=false` ของ request เก่า (setLoading(true) ของ request ใหม่อยู่ใน hook's effect ที่ run หลัง render) → commit ผิด, committed pattern พังทันที
- `isRefetching = loading && hasLoadedOnceRef.current` ก็เป็น false ใน render แรก → overlay ไม่ขึ้น ≥1 frame
- แก้ทั้งคู่ด้วย: `pending` state ตั้งใน handler + เปรียบเทียบ `loading` กับ previous loading (`prevLoadingRef`) เพื่อ detect transition จริง

**Why commit transactions ด้วย ไม่ใช่ range อย่างเดียว (จาก review รอบ 4):**
- ตอน fetch สำเร็จ `useTransactions` ทำ `setTransactions(rows) + setLoading(false)` ใน batch เดียวกัน → ก่อน commit effect รัน จะมี **1 render frame** ที่ `transactions=NEW, loading=false, committedRange=OLD`
- ระหว่าง frame นั้น overlay ยังขึ้น (hasPending=true) แต่ derived view ที่ใช้ `transactions` สด + `committedRange` เก่า = bucket/bounds เก่า ผสม data ใหม่ → กราฟ/list ผิด, EmptyState อาจโผล่ (ถ้าไม่กระทบ visual เพราะ overlay dim อยู่ก็ตาม แต่ไม่ตรงกับ goal "render มุมมองเดิมจริง")
- แก้ด้วย `committedTransactions` state ที่ commit **คู่กับ `committedRange`** ในเฟรมเดียว → ทุก derived view freeze ครบชุด ไม่มี frame ผิด

```js
const [rangeMode, setRangeMode] = useState('month');
const [anchor, setAnchor] = useState(new Date());
const [committedRange, setCommittedRange] = useState(() => ({ mode: 'month', anchor: new Date() }));
const [committedTransactions, setCommittedTransactions] = useState([]);
const [hasPending, setHasPending] = useState(false);
const hasLoadedOnceRef = useRef(false);
const prevLoadingRef = useRef(false);

const queryBounds = useMemo(() => getQueryBounds(rangeMode, anchor), [rangeMode, anchor]);
const { transactions, loading, error } = useTransactions(queryBounds);

// helper เรียกใช้ในทุก handler ที่เปลี่ยน range — มี no-op guard
const updateRange = (nextMode, nextAnchor) => {
  // No-op ถ้า bounds จริงไม่เปลี่ยน เพื่อกัน overlay ค้าง:
  // RangeToggle fire onChange แม้กด tab ที่ active อยู่ (RangeToggle.jsx:60)
  // ถ้า setHasPending(true) โดยที่ queryBounds ไม่เปลี่ยน → ไม่มี fetch ใหม่
  // → ไม่มี loading true→false transition มา clear pending → overlay ค้างถาวร
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
const handlePrev = () => updateRange(rangeMode, shiftAnchor(rangeMode, anchor, -1));
const handleNext = () => updateRange(
  rangeMode,
  clampAnchorToToday(rangeMode, shiftAnchor(rangeMode, anchor, 1))
);

// commit เฉพาะ true → false transition (ไม่ใช่ทุก render ที่ !loading)
// commit range + transactions พร้อมกันในเฟรมเดียวกัน
useEffect(() => {
  const wasLoading = prevLoadingRef.current;
  prevLoadingRef.current = loading;
  if (wasLoading && !loading) {
    if (!error) {
      setCommittedRange({ mode: rangeMode, anchor });
      setCommittedTransactions(transactions);    // ⚠️ commit data คู่กับ range
      hasLoadedOnceRef.current = true;
    }
    setHasPending(false);            // clear แม้ error เพื่อปลด overlay
  }
}, [loading, error, rangeMode, anchor, transactions]);

const isInitialLoading = loading && !hasLoadedOnceRef.current;
const isRefetching = hasLoadedOnceRef.current && (loading || hasPending);

// ทุก derived view อ่านจาก committedRange + committedTransactions — freeze ครบชุดระหว่าง refetch
const selectedBounds = useMemo(
  () => getRangeBounds(committedRange.mode, committedRange.anchor),
  [committedRange]
);
const trendBuckets = useMemo(
  () => getTrendBuckets(committedRange.mode, committedRange.anchor),
  [committedRange]
);
const copy = rangeCopy[committedRange.mode];

// ⚠️ ใช้ committedTransactions + committedRange.mode — ห้าม mix กับ live transactions/rangeMode
const selectedTransactions = useMemo(
  () =>
    committedTransactions.filter(
      (t) => t.txn_date >= selectedBounds.startDate && t.txn_date <= selectedBounds.endDate
    ),
  [committedTransactions, selectedBounds.startDate, selectedBounds.endDate]
);
const trendData = useMemo(
  () => buildTrendData(committedTransactions, trendBuckets, committedRange.mode),
  [committedTransactions, trendBuckets, committedRange.mode]
);
// selectedExpenses, categoryData, totalExpense, groupData, visibleTransactions derive ต่อจาก selectedTransactions ตามปกติ — ไม่ต้องแก้
```

**ลำดับเหตุการณ์ที่คาดหวัง (Month → Day toggle):**

| Frame | event | live | committedRange | committedTxns | loading | hasPending | isRefetching | view |
|---|---|---|---|---|---|---|---|---|
| 0 | idle | Month/Nov-15 | Month/Nov-15 | Nov txns | false | false | false | Month เต็มจอ |
| 1 | click Day → updateRange | Day/today | Month/Nov-15 | Nov txns | false (stale) | **true** | **true** | Month + overlay ✅ |
| 2 | hook starts query | Day/today | Month/Nov-15 | Nov txns | true | true | true | Month + overlay ✅ |
| 3 | query done — hook batch setTransactions(NEW) + setLoading(false) | Day/today | Month/Nov-15 | **Nov txns (ยังไม่ commit)** | false | true | true | Month + overlay ✅ (data ยัง freeze) |
| 4 | commit effect: setCommittedRange + setCommittedTransactions + setHasPending(false) | Day/today | **Day/today** | **Day txns** | false | false | false | **Day** fresh ✅ |

**Key insight (Frame 3):** ก่อนใช้ `committedTransactions` — frame นี้จะ derive view จาก `transactions=NEW + committedRange=OLD` → กราฟผิด/EmptyState flash ใต้ overlay. ใช้ committedTransactions แล้ว → freeze data ครบจน frame 4 ค่อย flip ทั้งชุด

**ผลลัพธ์:**
- user toggle Month → Day: RangeNav label เปลี่ยนเป็นวันใหม่ทันที (live state) ✅
- ระหว่าง refetch: charts/cards ยังเป็นของ Month เดิมเป๊ะ (committed range ยังไม่ update) + overlay dim ✅
- load เสร็จ: committedRange flip → view model fresh ของ Day mode ✅

**JSX changes:**
- บรรทัด 193 (`กำลังโหลดสถิติ...`): เปลี่ยน condition `loading` → `isInitialLoading` (Phase 2 fallback คงเดิม)
- เพิ่ม spinner ใต้ `<RangeNav>` แสดงเมื่อ `isRefetching`:
  - `<Loader2>` จาก `lucide-react` + `animate-spin`
  - คลาส: `mt-2 flex items-center gap-2 text-xs font-semibold text-muted`
  - ข้อความ: `กำลังโหลดข้อมูลช่วงใหม่...`
- ครอบ content block หลัก (line 195 `<div className="mt-5 grid ...">` จนถึงปิด section "รายการในช่วงนี้") ด้วย wrapper:
  - คลาสคงที่: `transition-opacity duration-200`
  - คลาส conditional: `opacity-50 pointer-events-none` เมื่อ `isRefetching`
  - **ห้ามใช้ skeleton** — overlay บน layout เดิมเท่านั้น
- **Empty state guards ยังคงใช้ `!loading &&` เหมือนเดิม** (ห้ามเปลี่ยนเป็น `!isInitialLoading`):
  - ระหว่าง initial load: `!loading` = false → ไม่ render EmptyState (มีข้อความ `กำลังโหลดสถิติ...` แทน)
  - ระหว่าง refetch: `!loading` = false → ไม่ render EmptyState (มี committed content + overlay แทน)
  - หลัง load จริง: `!loading` = true → render EmptyState ตามเดิม
  - ครอบครบทุกเคส ไม่ flash

**Edge cases:**
- `error` เกิด: ไม่ update committedRange (คง committed เดิม) แต่ `setHasPending(false)` เพื่อปลด overlay + แสดง error message ด้านบน. ผู้ใช้เห็น content เก่ายังคงอยู่ + error banner
- **Initial mount**: committedRange = default match กับ live state. hasLoadedOnceRef = false → `isInitialLoading = loading && true`. Empty state guards ใช้ `!loading` → ไม่ flash EmptyState ระหว่าง initial. หลัง first load เสร็จ commit effect flip hasLoadedOnceRef = true → ทุกครั้งต่อไปใช้ overlay path
- **Empty state guards ยังคงใช้ `!loading &&`** เหมือนเดิม (ห้ามเปลี่ยน):
  - initial: `!loading` = false → ไม่ render EmptyState (มีข้อความ `กำลังโหลดสถิติ...`)
  - refetch ใน frame 1-3 (loading อาจ false): isRefetching จะคุม overlay; แต่ committed view ยังเป็นของเดิม → ถ้าเดิมมี content ก็ render ของเดิม + dim, ถ้าเดิม empty ก็ render EmptyState ของเดิม + dim (ถูก, เป็น snapshot ของเดิม)
  - หลัง commit: ถ้าใหม่ empty → render EmptyState ของใหม่ (ถูก)
- `visibleCount` reset effect (line 161-163) deps เป็น `selectedBounds.startDate/endDate` ซึ่งตอนนี้มาจาก committed range → reset เกิดตอน commit สำเร็จและ view ใหม่โผล่ (เหมาะ — user เห็น list ใหม่จากต้น)
- **Race condition (rapid toggle):**
  - Click 1: setHasPending(true), live=A. Fetch 1 start.
  - Click 2 mid-fetch: setHasPending(true) (no-op), live=B. queryBounds เปลี่ยน → useTransactions re-fire, `requestIdRef` ใน hook (Phase 3.1) discard response ของ fetch 1
  - Fetch 2 done: loading true→false → commit (live=B) ✅
  - ไม่มี commit ของ A ผิดเพราะ commit เกิด transition จริงเดียวเท่านั้น

### Task 2 — Smart anchor on mode switch (dateRange.js + Stats.jsx)

**Goal:** สลับ mode แล้ว anchor อยู่ใน "ที่เดียวกัน" ตามมุมมองใหม่ ไม่ดึงกลับวันนี้ทุกครั้ง

**Implementation — เพิ่ม helper ใน `src/lib/dateRange.js`:**

```js
export function pickAnchorForMode(fromMode, toMode, currentAnchor) {
  if (fromMode === toMode) return currentAnchor;

  let candidate = currentAnchor;
  if (toMode === 'day') {
    if (fromMode === 'month') candidate = endOfMonth(currentAnchor);
    else if (fromMode === 'year') candidate = endOfYear(currentAnchor);
    else if (fromMode === 'week') candidate = endOfWeek(currentAnchor, weekOptions);
  } else if (toMode === 'month') {
    if (fromMode === 'year') candidate = endOfYear(currentAnchor);
  }
  // week, year, และเคสที่ scope แคบ→กว้าง (day→month, day→year, week→year, month→year)
  // ใช้ anchor เดิมพอ — anchor อยู่ใน week/month/year นั้นๆ อยู่แล้ว

  return clampAnchorToToday(toMode, candidate);
}
```

- `endOfMonth`, `endOfYear`, `endOfWeek` import อยู่แล้วในไฟล์
- `weekOptions` constant มีอยู่แล้ว
- `clampAnchorToToday` reuse — ไม่ duplicate logic clamp

**ใน `Stats.jsx`:**
- เพิ่ม import: `pickAnchorForMode` ในบรรทัด 33
- `handleRangeModeChange` **ต้องเรียก `updateRange`** (helper จาก Task 1) เพื่อตั้ง `hasPending` พร้อมกับ set live state — ไม่ใช่ `setAnchor + setRangeMode` ตรงๆ ไม่งั้น overlay ไม่ขึ้น
  ```js
  const handleRangeModeChange = (nextMode) => {
    updateRange(nextMode, pickAnchorForMode(rangeMode, nextMode, anchor));
  };
  ```
- `updateRange` มี no-op guard อยู่แล้ว (Task 1) → กรณีคลิก tab เดิม (rangeMode === nextMode, `pickAnchorForMode` คืน anchor เดิม) จะ return ออกก่อน setHasPending ไม่ทำให้ overlay ค้าง

**ตัวอย่างพฤติกรรมที่คาดหวัง:**
| from → to | anchor เดิม | anchor ใหม่ |
|-----------|------------|------------|
| Month (ก.พ. 2569) → Day | 2026-02-15 | 2026-02-28 (วันสุดท้ายของ ก.พ.) |
| Month (พ.ค. 2569 ปัจจุบัน) → Day | 2026-05-15 | 2026-05-22 (clamp = วันนี้) |
| Year (2568 อดีต) → Month | 2025-06-01 | 2025-12-31 (เดือน ธ.ค. 2568) |
| Year (2569 ปัจจุบัน) → Month | 2026-06-01 | 2026-05-22 (clamp = เดือนนี้) |
| Day (15 ก.พ.) → Month | 2026-02-15 | 2026-02-15 (anchor เดิม) |
| Week → Month | (สัปดาห์ใดๆ) | anchor เดิม → fall ใน month นั้น |

### Task 3 — Group card empty state (Stats.jsx)

**Goal:** ช่วงไม่มีรายจ่าย → แสดง EmptyState ใต้ SectionHeader "สรุปรายจ่าย 4 กลุ่ม" แทน 4 cards เป็น `฿0`

**Approach (line 287-299):**
- เงื่อนไข: `totalExpense === 0` (มีอยู่แล้ว line 132 — คำนวณจาก `categoryData`)
- ถ้า empty + ไม่ใช่ initial loading → แสดง EmptyState ใน section
- ถ้ามีรายจ่าย → render grid 4 cards เหมือนเดิม

```jsx
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
```

**Logic table:**

| state | render |
|---|---|
| `isInitialLoading=true` | `null` (มีข้อความ `กำลังโหลดสถิติ...` ด้านบน section) |
| `!isInitialLoading && totalExpense === 0` | EmptyState |
| `!isInitialLoading && totalExpense > 0` | 4 GroupCards |

หลีกเลี่ยง bug ที่ flat `!isInitialLoading && totalExpense === 0 ? Empty : Grid` จะ render grid 4 ใบเป็น `฿0` ระหว่าง initial loading (เพราะ condition แรกเป็น false → fall through ไป grid)

- Copy ภาษาไทย consistent กับ donut empty state (`ยังไม่มีรายจ่ายใน...`)
- ห้ามแก้ `GroupCard` component (เผื่อ Phase 4 budget reuse)

---

## Files Modified

1. `src/lib/dateRange.js` — **เพิ่ม export `pickAnchorForMode`** เท่านั้น (ของเดิม 9 export ห้ามแตะ)
2. `src/pages/Stats.jsx` — แก้:
   - import: เพิ่ม `pickAnchorForMode`, `Loader2` (จาก lucide-react)
   - state: เพิ่ม `committedRange` + **`committedTransactions`** + `hasPending` state, `hasLoadedOnceRef`, `prevLoadingRef`, commit effect ที่ detect transition `loading: true → false` (commit ทั้ง range + transactions พร้อมกัน)
   - derive view ที่ต้องเปลี่ยนจาก live → committed:
     - `selectedBounds` ← `committedRange.mode/anchor`
     - `trendBuckets` ← `committedRange.mode/anchor`
     - `copy` ← `rangeCopy[committedRange.mode]`
     - **`selectedTransactions`** filter from **`committedTransactions`** (ไม่ใช่ live `transactions`)
     - **`trendData`** อ่าน **`committedTransactions`** + `committedRange.mode` (ห้าม mix กับ live `transactions`/`rangeMode` — ไม่งั้น frame 3 จะ render bucket เก่าผสม data ใหม่)
     - `selectedExpenses`/`categoryData`/`totalExpense`/`groupData`/`visibleTransactions` derive ต่อจาก `selectedTransactions` — ไม่ต้องแก้
   - `queryBounds` **ยังอ่าน live** `rangeMode/anchor` (เพื่อ trigger refetch ทันที)
   - JSX: spinner ใต้ RangeNav (เฉพาะ `isRefetching`), overlay wrapper ครอบ content block (`opacity-50 pointer-events-none transition-opacity duration-200`), group card empty branch
   - **ห้ามเปลี่ยน** `!loading &&` ใน empty state guards (line 199, 243, 309, 331)
   - handlers: ทุกตัวที่เปลี่ยน range (`handleRangeModeChange`, `handlePrev`, `handleNext`) เรียก helper `updateRange` (มี no-op guard ใน) ที่ตั้ง `hasPending = true` พร้อม set live state
   - `handleRangeModeChange` ใช้ `pickAnchorForMode` แทน `clampAnchorToToday`

---

## ห้ามแตะ

- **Phase 2 Month mode behavior** — chart values, donut visual, axis label ต้องเหมือนเดิมเป๊ะ
- `useTransactions.js`, `MonthPicker.jsx`, `RangeToggle.jsx`, `RangeNav.jsx`, `Select.jsx`, `ThaiDatePicker.jsx`, `ConfirmDialog.jsx`, `TransactionRow.jsx`
- หน้า Dashboard, Transactions, Settings, AddTransaction, Login
- `src/lib/format.js`
- Logic infinite scroll / IntersectionObserver / `visibleCount` reset ของ Phase 3.3
- `getTrendBuckets`, `buildTrendData`, `buildCategoryData`, `buildGroupData` — pure logic ไม่แตะ
- Existing 9 exports ใน `dateRange.js`

---

## Verification (Test Gate ของ Phase 3.4)

1. [ ] `npm run build` ผ่านไม่มี warning ใหม่
2. [ ] **Loading overlay + committed view:**
   - Initial mount → เห็นข้อความ `กำลังโหลดสถิติ...` (Phase 2 behavior คงเดิม) ไม่มี EmptyState โผล่
   - Toggle Month (มีรายจ่าย) → Day ติดๆ → **ตั้งแต่เฟรมแรก** (ก่อน hook setLoading(true)) content เป็นของ Month เดิม + dim + spinner ใต้ RangeNav, label เปลี่ยนเป็นวันใหม่ทันที — **ไม่มี flash 1 frame ที่ content เก่ายังไม่ dim**
   - **Verify ไม่ commit เร็วเกิน**: เปิด React DevTools, toggle mode → `committedRange` state ต้องอยู่กับของเก่า "ตลอด" จนกว่า `loading` จะเป็น true แล้วกลับมา false; ถ้าเห็น committedRange flip ขณะ loading ยังเป็น false หลัง toggle = bug commit timing
   - หลังโหลดเสร็จ → opacity กลับเต็ม, spinner หาย, view flip เป็น Day mode พร้อม data ใหม่
   - Toggle ไปช่วงที่ไม่มีรายจ่าย → ระหว่าง refetch ไม่ flash EmptyState ของช่วงใหม่ (committed view ของเดิมยัง render)
   - กด ◀▶ เร็วๆ 5 ครั้ง → ระหว่าง refetch แต่ละครั้ง charts ไม่กระพริบเป็นข้อมูลผิดช่วง; commit เกิดครั้งเดียวตอน fetch สุดท้ายจบ
   - **Trend chart verify after switch**: Month → Day → รอ commit → trend chart เป็น 7 แท่งวัน (ไม่ใช่ 6 เดือนของ Month เก่า, ไม่ใช่ก้นว่างจาก mode/bucket mismatch)
   - **Frame-3 verify (committedTransactions)**: ใช้ React DevTools throttle network → toggle mode → ระหว่าง refetch ดู state — เมื่อ `loading` กลับเป็น `false` ก่อน commit effect รัน (1 frame) ต้องไม่เห็นกราฟกระพริบเป็น "bucket เก่า + data ใหม่". `committedTransactions` ต้องเปลี่ยนพร้อม `committedRange` ใน update เดียว
   - **Error path**: ตัด network → toggle mode → error banner ขึ้น + committed view คงของเดิม + overlay หายไป (hasPending clear แม้ error)
   - **No-op guard**: ใน Day mode (active) → คลิก tab "วัน" ซ้ำอีกครั้ง → ไม่มี overlay/spinner โผล่ (updateRange return ออกก่อน setHasPending). ทดสอบทุก mode ครบ 4 tab
3. [ ] **Smart anchor:**
   - ไปดูเดือน ก.พ. 2569 → toggle Day → เห็น 28 ก.พ. (ไม่ใช่วันนี้ 22 พ.ค.)
   - ไปดูปี 2568 → toggle Month → เห็น ธ.ค. 2568
   - ดูเดือนปัจจุบัน (พ.ค. 2569) → toggle Day → เห็นวันนี้ (clamp)
   - ดูวันที่ 15 ก.พ. 2569 → toggle Month → เห็น ก.พ. 2569
4. [ ] **Group card empty state:**
   - เลือกวันที่ไม่มีรายจ่าย (Day mode) → เห็น EmptyState ใต้ "สรุปรายจ่าย 4 กลุ่ม" ไม่เห็น 4 cards เป็น `฿0`
   - เลือกวันที่มีรายจ่าย → 4 cards กลับมาเหมือนเดิม
   - **Initial loading (hard refresh หน้า /stats)** → section "สรุปรายจ่าย 4 กลุ่ม" ไม่ render grid `฿0` 4 ใบระหว่างโหลด — ให้ render `null` (มี `กำลังโหลดสถิติ...` ด้านบนพอ)
5. [ ] **Next button disable** (verify ไม่ regress):
   - Day/Week/Month/Year ปัจจุบัน → ปุ่ม `▶` disabled
6. [ ] **Month mode (Phase 2) regression check:**
   - เปิด Month mode → donut + trend + 4 group cards + ตัวเลข เหมือน main branch เป๊ะ
   - Tap ◀ ไปอดีต 3 เดือน → ▶ กลับ → ข้อมูลตรงทุก step
7. [ ] **Dashboard และ Transactions** ยังโหลดปกติ (useTransactions ไม่ถูกแตะ — เผื่อ Codex หลุดเข้าไป)
8. [ ] **iPhone Safari จริง:** ทดสอบ overlay + spinner + smart anchor + group empty + tap targets ≥44px
9. [ ] (Optional) Lighthouse mobile — performance ไม่ลดเกิน 5 คะแนนจาก main

---

## Out of Scope (ไม่ทำใน Phase 3.4)

- Lighthouse audit เป็น blocker (optional ทำเมื่อพร้อม)
- Skeleton loader / shimmer effect — ใช้ overlay พอ
- URL params / shareable link — Phase 6+
- Budget tracking (Phase 4)
- Refactor `Stats.jsx` แยก component — รอ cleanup phase

---

## Workflow

1. **Stage plan file ก่อน implement** — `git add plans/phase3-4-polish.md` แล้ว commit ลง branch `phase3` (ไม่งั้น Codex อาจมองไม่เห็นไฟล์)
2. Codex implement Task 1-3 ตามลำดับ — Task 1 (committed view + overlay) → Task 2 (smart anchor) → Task 3 (group empty)
3. หยุดที่ test gate ของแต่ละ task
4. `npm run build` + manual test iPhone Safari → /verify → merge `phase3` → `main`
