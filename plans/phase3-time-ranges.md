# Phase 3 — สรุปช่วงเวลา (Day / Week / Month / Year) + รายการพร้อมโน้ต

> **Branch:** `phase3`
> **Status:** Ready for Codex audit
> **Prerequisite:** Phase 2 (สถิติเดือน) ทำงานได้สมบูรณ์ — donut + bar trend 6 เดือน + 4 group cards

---

## Context

ขยายหน้าสถิติเดิม เพิ่มความสามารถดูข้อมูลในช่วงเวลาต่างๆ และดูรายการ + โน้ตที่ผู้ใช้กรอกในช่วงนั้น

**Problem:** ตอนนี้หน้าสถิติดูได้แค่ "เดือน" — ผู้ใช้อยากย้อนดูวันใดวันหนึ่ง สัปดาห์ที่ผ่านมา หรือทั้งปี และอยากเห็นโน้ตที่จดไว้

**Users:** ผู้ใช้ปัจจุบันที่ใช้แอปเก็บข้อมูลเป็นสัปดาห์/เดือน

**Success criteria:**
- เลือกช่วงเวลาได้ 4 โหมด → กราฟ + การ์ดทุกตัวอัปเดตตามช่วงที่เลือก
- รายการในช่วงพร้อมโน้ตแสดงท้ายหน้า คลิกเข้าหน้าแก้ไขได้ (route `/edit/:id`)
- **โหมด Month ต้องทำงานเหมือน Phase 2 เดิมเป๊ะ** ไม่มี regression *(definition ของ "เป๊ะ" — ดูใน Decisions: data + chart values + bar/donut visual + แกน X label + section copy; ยกเว้น nav guard, navigator label พ.ศ., และ trend tooltip)*

---

## Decisions

✅ **Already decided:**
- ใช้ date-fns 3 ที่มีอยู่แล้ว (ไม่ลง library เพิ่ม)
- Week ใช้ ISO standard (จันทร์–อาทิตย์) ผ่าน `startOfWeek(date, { weekStartsOn: 1 })`
- ไม่แตะ database schema
- ทำบน branch `phase3` แยก → Vercel preview → merge เข้า main
- **ทำ inline ใน `Stats.jsx`** — ไม่ extract เป็น `components/charts/` ใหม่ (ลด blast radius กับ Phase 2)
- **ไม่ทำ URL params** — state ใน memory พอ (refresh = reset เป็น default Month)
- Reuse `useTransactions({ startDate, endDate })` hook เดิม ส่ง bounds ของ range เข้าไป
- **Layout ส่วน header สถิติ** (จากบนลงล่าง):
  1. `Header` (eyebrow + title) — ของเดิม
  2. `RangeToggle` *(new)* — segmented `[วัน] [สัปดาห์] [เดือน] [ปี]`
  3. `RangeNav` *(new)* — `◀ <label พ.ศ.> ▶` ใช้ทั้ง 4 modes
- **ใน Stats.jsx ไม่ใช้ `MonthPicker.jsx` อีกต่อไป** — `RangeNav` generalize หน้าที่ของ MonthPicker (◀ label ▶) ครอบทุก mode. **ห้ามแตะไฟล์ `MonthPicker.jsx`** เพราะ Dashboard.jsx และ Transactions.jsx ยังใช้อยู่ (Phase 1-2)
- **State หลักของหน้า Stats:** ลบ `month` ทิ้ง — ใช้ `anchor: Date` เป็น single source of truth + `rangeMode: 'day'|'week'|'month'|'year'` (default `'month'`)
- **Pagination "รายการในช่วงนี้":** infinite scroll ผ่าน `IntersectionObserver` + sentinel element ล่างสุด
- **Items per load:** 20 รายการ (ทั้ง initial และ each subsequent load)
- **ปุ่ม `▶` disable ทุก mode รวม Month** เมื่อ range ถัดไปอยู่ในอนาคต — UX consistent ระหว่าง 4 modes. **ยอมรับการเปลี่ยน UX จาก Phase 2** (MonthPicker เดิมไปเดือนอนาคตได้)
- **Month label ใน RangeNav แสดงเป็น พ.ศ.** (เช่น `"พฤศจิกายน 2568"`) ต่างจาก MonthPicker เดิมที่แสดง ค.ศ. (`"พฤศจิกายน 2025"`) — **intentional display improvement** สอดคล้องกับ ThaiDatePicker (พ.ศ. แล้ว). ไม่ถือเป็น Phase 2 regression
- **Trend chart tooltip ของ Month เปลี่ยนจาก `"พ.ย."` → `"พฤศจิกายน 2568"`** — intentional UX improvement (เดิม tooltip ก็คลุมเครือเมื่อ 6 เดือนคาบปี). XAxis label ยังเป็น `"พ.ย."` เหมือนเดิม — เปลี่ยนเฉพาะ tooltip
- **คำว่า "เหมือน Phase 2 เป๊ะ" ในแผนนี้** หมายถึง **data + chart values + chart bar/donut visual + แกน X label เท่านั้น** ไม่รวม: navigation guard (disable next), navigator label (ค.ศ.→พ.ศ.), trend tooltip (สั้น→ยาว)
- **Year mode + Supabase row limit:** ขยาย `useTransactions` ให้ทำ pagination loop ภายใน (`.range(0, 999)` ซ้ำจนกว่าจะได้น้อยกว่า 1000) — **signature + return shape ไม่เปลี่ยน** Dashboard/Transactions ไม่กระทบ

🟡 ไม่มี decision pending — พร้อม implement

---

## Scope

### In Scope
- Time range toggle (Day/Week/Month/Year) ที่หน้าสถิติ
- Navigation arrows ก่อนหน้า/ถัดไป สำหรับแต่ละโหมด
- กราฟทั้งหมดจาก Phase 2 อัปเดตตามช่วงที่เลือก
- ส่วนใหม่ "รายการในช่วงนี้" ท้ายหน้า (คลิก → `/edit/:id`)

### Out of Scope (ทำใน Phase 4-5 หรือทีหลัง)
- Budget tracking
- Sankey diagram
- Export ข้อมูล
- Filter เพิ่มเติม (หมวด / type) ในส่วน "รายการในช่วงนี้" — รอ Phase 6
- URL params / shareable link
- Extract chart code เป็น separate components — รอ cleanup phase

---

## Phase 3.1 — Time Range Infrastructure

**Vertical slice:** state + navigation UI (ยังไม่แตะกราฟ)

### Files
- `src/pages/Stats.jsx` —
  - **ลบ** `import MonthPicker` + การใช้ `<MonthPicker>` ในไฟล์
  - **ลบ** `const [month, setMonth] = useState(new Date())`
  - **เพิ่ม** `const [rangeMode, setRangeMode] = useState('month')` + `const [anchor, setAnchor] = useState(new Date())`
  - วาง `<RangeToggle>` แล้ว `<RangeNav>` แทนตำแหน่งเดิมของ MonthPicker
  - กราฟทุกตัวยังใช้ logic เดิม **ภายใต้สมมุติ `rangeMode === 'month'` + anchor** (เปลี่ยนทุกอย่างใน 3.2)
- `src/lib/dateRange.js` *(new — utility)* — pure functions ทั้งหมด:
  - `getRangeBounds(mode, anchor)` → `{ startDate, endDate }` *(format `yyyy-MM-dd`)* — ขอบเขตแคบของ donut/group/list
  - `getQueryBounds(mode, anchor)` → `{ startDate, endDate }` — ขอบเขตกว้างพอครอบ trend buckets ทั้งหมด (Day=7 วัน, Week=6 สัปดาห์, Month=6 เดือน, Year=5 ปี) — ใช้ตอนเรียก `useTransactions`
  - `shiftAnchor(mode, anchor, direction)` → Date ใหม่ (`direction` = `-1` หรือ `+1`)
  - `formatRangeLabel(mode, anchor)` → string พ.ศ. ภาษาไทย (เช่น `"พฤศจิกายน 2568"`, `"25 พ.ย. – 1 ธ.ค. 2568"`)
  - `formatThaiDate(input, pattern)` → format date เป็น พ.ศ. (เช่น `formatThaiDate(d, 'd MMM yyyy')` → `"25 พ.ย. 2568"`) — ใช้ทั้ง label และ row วันที่ในรายการ
    - **ต้องรองรับทั้ง `Date` object และ string `yyyy-MM-dd`** — ถ้า input เป็น string ให้ `parseISO(input)` ก่อน format. `txn_date` จาก Supabase เป็น string ตลอด ห้าม `new Date(string)` ตรงๆ (timezone drift)
    - **Implementation:** แทน `yyyy` ใน pattern ด้วย placeholder ที่ escape เป็น literal (single quote ใน date-fns) ก่อน format แล้วค่อย replace placeholder กลับเป็นปี พ.ศ.:
      ```js
      const buddhistYear = String(getYear(date) + 543);            // "2568"
      const safePattern = pattern.replace(/yyyy/g, "'__BE_YEAR__'"); // escape เป็น literal
      return format(date, safePattern, { locale: th })
        .replace(/__BE_YEAR__/g, buddhistYear);
      ```
    - **เหตุผลที่ใช้ placeholder แทน `replaceAll(gregorian, buddhist)`:** ปี ค.ศ. 4 หลัก อาจชนกับเลขอื่นในผลลัพธ์ (เช่น ปี 2025 + วัน 25 → string `"25"` ซ้ำ). placeholder approach แยก token ชัด ไม่มีโอกาสชน
    - **ห้ามใช้ `addYears(date, 543)`** — leap day drift (29 ก.พ. ค.ศ. → 1 มี.ค. พ.ศ. คลาดเคลื่อน)
    - **รองรับเฉพาะ pattern ที่ใช้ `yyyy` (4 หลัก)** — `yy` (2 หลัก) ไม่ replace, จะออกมาเป็น ค.ศ. 2 หลัก. ถ้าต้องการ พ.ศ. 2 หลัก ต้อง extend regex
    - **ห้ามใช้ single quote `'` ใน pattern อื่นๆ** — date-fns ใช้ `'` เป็น escape char, placeholder pattern ใช้ `'` แล้ว ถ้า caller ใส่ literal text ด้วย `'...'` อาจชนกัน (ปัจจุบันไม่มี caller ทำแบบนี้)
  - `isNextRangeInFuture(mode, anchor)` → boolean — เช็ค **range ถัดไป** (`shiftAnchor(mode, anchor, +1)`) ว่าเริ่มหลังวันนี้หรือไม่ → ใช้ disable ปุ่ม `▶`
  - `clampAnchorToToday(mode, anchor)` → Date — ใช้ตอน switch mode กันไปอนาคต
- `src/components/RangeToggle.jsx` *(new)* — ปุ่ม segmented `[วัน] [สัปดาห์] [เดือน] [ปี]` — active = coral, inactive = cream + text muted, tap target ≥ 44px
- `src/components/RangeNav.jsx` *(new)* — ลูกศร `◀ [label] ▶`:
  - ส่ง prop: `mode`, `anchor`, `onPrev`, `onNext`
  - ใช้ `formatRangeLabel(mode, anchor)` แสดง label กลาง
  - ปุ่ม `▶` disable เมื่อ `isNextRangeInFuture(mode, anchor)` คืน true
  - **Pattern UI ต้องตรงกับ MonthPicker เดิม** แต่ปรับ tap target ให้ได้ ≥44px:
    - Hit area: `h-11 w-11` (44×44) — clickable region
    - Visual circle: `h-10 w-10` (40×40) cream + coral icon ภายใน hit area + `place-items-center`
    - label `font-bold text-base` ตรงกลาง — เพื่อความต่อเนื่อง visual กับ Dashboard/Transactions
- `src/hooks/useTransactions.js` — **ขยาย pagination internal** (signature + return ไม่เปลี่ยน):
  - ใช้ factory `buildQuery()` สร้าง query builder ใหม่ทุก batch — Supabase v2 builder chain เป็น mutable, reuse ตัวเดิมหลาย batch จะได้ filter/order/range ซ้ำ:
    ```js
    function buildQuery() {
      let q = supabase.from('transactions').select(transactionSelect)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (startDate) q = q.gte('txn_date', startDate);
      if (endDate) q = q.lte('txn_date', endDate);
      if (categoryId) q = q.eq('category_id', categoryId);
      return q;
    }
    ```
  - แก้ `loadTransactions` ให้ทำ `await buildQuery().range(from, from + 999)` loop จนกว่าจะได้ rows < 1000
  - `from = 0, then 1000, 2000, …` — concat ผลทุก batch เข้า array เดียว
  - คง sort `.order('txn_date', desc).order('created_at', desc)` เดิม (sort ทำที่ DB ทุก batch — แต่ ranges ต่อกันด้วย index → ลำดับยังถูก)
  - ถ้า batch ใดได้ error → setError + หยุด loop
  - **กัน race condition ด้วย `requestIdRef`**:
    - `const requestIdRef = useRef(0)` ที่ระดับ hook
    - ทุกครั้งที่ `loadTransactions` รัน: `const myId = ++requestIdRef.current`
    - **ก่อน `setState`** (transactions, error, loading): เช็ค `if (myId !== requestIdRef.current) return` — ถ้า id ไม่ตรง = มี request ใหม่แล้ว ปล่อยให้ request ใหม่ชนะ
    - **เช็คทุก batch ของ pagination loop** ก่อน push เข้า accumulator ด้วย — กัน Year mode (หลาย batch) ค้างยาวระหว่าง user toggle เร็วๆ
    - ไม่ต้องใช้ AbortController (Supabase v2 ยังไม่ first-class) — `requestIdRef` พอ
  - **ห้ามแก้:** signature ของ `useTransactions({startDate, endDate, categoryId})`, shape ของ return `{ transactions, loading, error, reload }`, ลำดับการ sort, ฟังก์ชัน `getTransaction/saveTransaction/deleteTransaction`

### Behavior
- Default state: `rangeMode = 'month'`, `anchor = new Date()` (เพื่อให้พฤติกรรม Month เหมือนเดิม)
- **`anchor` = single source of truth ของวันที่หลัก** — ไม่มี `month` state แยก
- `shiftAnchor` ตามโหมด:
  - Day: `addDays(anchor, ±1)`
  - Week: `addWeeks(anchor, ±1)`
  - Month: `addMonths(anchor, ±1)`
  - Year: `addYears(anchor, ±1)`
- `getRangeBounds` (ขอบเขตแคบ — donut/group/list):
  - Day: `startOfDay(anchor)` → `endOfDay(anchor)`
  - Week: `startOfWeek(anchor, { weekStartsOn: 1 })` → `endOfWeek(anchor, { weekStartsOn: 1 })`
  - Month: `startOfMonth(anchor)` → `endOfMonth(anchor)`
  - Year: `startOfYear(anchor)` → `endOfYear(anchor)`
- `getQueryBounds` (ขอบเขตกว้าง — สำหรับเรียก useTransactions ครั้งเดียวให้ครอบทั้ง trend):
  - Day: `startOfDay(subDays(anchor, 6))` → `endOfDay(anchor)` *(7 วัน)*
  - Week: `startOfWeek(subWeeks(anchor, 5), {weekStartsOn:1})` → `endOfWeek(anchor, {weekStartsOn:1})` *(6 สัปดาห์)*
  - Month: `startOfMonth(subMonths(anchor, 5))` → `endOfMonth(anchor)` *(6 เดือน — ตรงกับ Phase 2)*
  - Year: `startOfYear(subYears(anchor, 4))` → `endOfYear(anchor)` *(5 ปี)*
- Label พ.ศ. ผ่าน `formatRangeLabel`:
  - Day: `"อังคาร 25 พฤศจิกายน 2568"`
  - Week:
    - เดือนเดียวกัน: `"3 – 9 พ.ย. 2568"`
    - ข้ามเดือน (ปีเดียวกัน): `"25 พ.ย. – 1 ธ.ค. 2568"`
    - **ข้ามปี**: `"29 ธ.ค. 2568 – 4 ม.ค. 2569"` *(แสดงปีทั้ง 2 ฝั่ง)*
  - Month: `"พฤศจิกายน 2568"`
  - Year: `"2568"`
- `formatThaiDate` แปลง year +543 internally — caller ไม่ต้องคิดเอง
- `isNextRangeInFuture(mode, anchor)`: คำนวณ `next = shiftAnchor(mode, anchor, +1)` แล้วเช็ค `getRangeBounds(mode, next).startDate > localDate(today)`

### ห้ามแตะ
- **Phase 2 กราฟทั้งหมดใน `Stats.jsx`** — donut/trend/4-groups ยังใช้ logic เดิม โดยให้ผูกกับ `anchor` ใน Month mode (ทำงานเหมือน `month` เดิมเป๊ะ) — Phase 3.2 ค่อยขยาย mode อื่น
- `Select.jsx`, **`MonthPicker.jsx`** (Dashboard/Transactions ยังใช้), `ThaiDatePicker.jsx`, `ConfirmDialog.jsx` — custom component พื้นฐาน
- หน้า Dashboard, Transactions, Settings, AddTransaction
- `src/lib/format.js` ของเดิม — เพิ่ม helper ที่ `dateRange.js` แทน

*หมายเหตุ:* `useTransactions.js` แตะได้เฉพาะภายใน `loadTransactions` (เพิ่ม pagination loop) — signature, return shape, sort order ห้ามเปลี่ยน

### Test Gate
- [ ] `npm run build` ผ่าน
- [ ] เปิดหน้าสถิติ → toggle 4 โหมด → label พ.ศ. เปลี่ยนถูก ไม่มี ค.ศ. หลุด
- [ ] ลูกศร ◀▶ ทำงานทั้ง 4 โหมด — Month mode chart/data เหมือน MonthPicker เดิมเป๊ะ (default = Month)
- [ ] โหมด Month ยังโชว์กราฟ + การ์ดเหมือน Phase 2 เป๊ะ (graphs อ่าน `anchor` ใต้สมมุติ month mode)
- [ ] ปุ่ม `▶` ที่ range ปัจจุบัน (วันนี้/สัปดาห์นี้/เดือนนี้/ปีนี้) → **disable ทุก mode รวม Month** (UX consistent ระหว่าง 4 modes — ยอมรับว่าต่างจาก Phase 2 เฉพาะเรื่อง navigation guard)
- [ ] กดทดสอบ Month mode ◀ ไปอดีต 3 เดือน แล้ว ▶ กลับ — ข้อมูล + label sync กันตลอด
- [ ] **Week mode**: เลือก anchor วันที่ 30 ธ.ค. → label แสดง 2 ปี (`"29 ธ.ค. 2568 – 4 ม.ค. 2569"`)
- [ ] **Race condition test**: เปิด Year mode → กดปุ่ม ◀ เร็วๆ 5 ครั้ง → ข้อมูลตรงกับ anchor สุดท้าย (ไม่ใช่ของ anchor กลางทาง)
- [ ] **`useTransactions` pagination**: Dashboard และ Transactions ยังโหลดรายการปกติ — verify ทั้ง 2 หน้า + ตัวเลขสรุปไม่เปลี่ยน
- [ ] Dashboard และ Transactions ยังใช้ MonthPicker ปกติ ไม่กระทบ
- [ ] ทดสอบบน iPhone Safari จริง — toggle + arrow tap targets ใหญ่พอ (≥44px)

---

## Phase 3.2 — Wire Graphs to Range

**Vertical slice:** ทำให้กราฟทั้งหมดใน `Stats.jsx` รับ range bounds แทนการอ้าง `month` state ตรงๆ

### Files
- `src/pages/Stats.jsx` — แก้ logic ภายในไฟล์เดียว:
  - **แยก 2 bounds ชัด**:
    - `selectedBounds = useMemo(() => getRangeBounds(rangeMode, anchor), [rangeMode, anchor])` → ใช้ filter `selectedTransactions` สำหรับ donut/group cards/list
    - `queryBounds = useMemo(() => getQueryBounds(rangeMode, anchor), [rangeMode, anchor])` → ส่งเข้า `useTransactions(queryBounds)` ครอบทั้ง trend
  - ปรับ `buildCategoryData` ใช้ `selectedTransactions` ที่ filter ด้วย `selectedBounds`
  - แทน `getTrendMonths` + `buildTrendData` → generalize เป็น `getTrendBuckets(mode, anchor)` คืน array ของ `{ key, label, tooltipLabel, income, expense }`:
    - Day → 7 วันย้อนหลัง (รวมวันที่เลือก) — key = `yyyy-MM-dd`, label = `"จ"` `"อ"` ..., tooltipLabel = `"จันทร์ 24 พ.ย. 2568"`
    - Week → 6 สัปดาห์ย้อนหลัง:
      - **bucket key = `format(startOfWeek(parseISO(t.txn_date), { weekStartsOn: 1 }), 'yyyy-MM-dd')`** (วันจันทร์ของสัปดาห์)
      - **ห้ามใช้เลขสัปดาห์ ISO เป็น key** — ปีต่างกันแต่เลขสัปดาห์เท่ากันได้ (เช่น w45 ของ 2024 vs 2025) จะรวมเข้าด้วยกันผิด
      - label (visual) = เลขสัปดาห์ ISO เช่น `"45"`, `"46"`
      - tooltipLabel = `"สัปดาห์ที่ 45 (3 – 9 พ.ย. 2568)"`
      - bucket key ใช้คู่กับ `Map` หรือ object lookup ภายใน `buildTrendBuckets`
    - Month → 6 เดือน — key = `yyyy-MM`, label = `"พ.ย."` *(ของเดิม — รักษาไว้)*, tooltipLabel = `"พฤศจิกายน 2568"`
    - Year → 5 ปีย้อนหลัง — key = `yyyy`, label = `"2568"` (พ.ศ.), tooltipLabel = `"พ.ศ. 2568"`
  - **ปรับ `TrendTooltip` (line ~243)** ให้อ่าน `payload[0].payload.tooltipLabel` แทน prop `label` ที่มาจาก XAxis dataKey (XAxis ยังใช้ `label` แสดงแกน X — สั้น; tooltip ใช้ `tooltipLabel` — ยาว/ชัด)
  - ปรับ `buildGroupData` — ทำงานกับ expenses ของ `selectedBounds`
  - **Range-aware copy** — สร้าง `rangeCopy[mode]` object ใน Stats.jsx:
    - `donutDescription`: `"สัดส่วนรายจ่ายของวันที่เลือก"` (day) / `"...สัปดาห์ที่เลือก"` (week) / `"...เดือนที่เลือก"` (month — เดิม) / `"...ปีที่เลือก"` (year)
    - `donutEmpty`: `"ยังไม่มีรายจ่ายในวันนี้"` / `"...สัปดาห์นี้"` / `"...เดือนนี้"` (เดิม) / `"...ปีนี้"`
    - `trendTitle`: `"แนวโน้ม 7 วัน"` / `"แนวโน้ม 6 สัปดาห์"` / `"แนวโน้ม 6 เดือน"` (เดิม) / `"แนวโน้ม 5 ปี"`
    - `trendEmptyDescription`: `"...แนวโน้มรายวัน"` / `"...รายสัปดาห์"` / `"...รายเดือน"` (เดิม) / `"...รายปี"`
    - `groupDescription`: `"คำนวณจากกลุ่มของหมวดหมู่ในวันที่เลือก"` / `"...สัปดาห์ที่เลือก"` / `"...เดือนที่เลือก"` (เดิม) / `"...ปีที่เลือก"`
  - Month mode ของ copy ทั้งหมด **คงข้อความเดิมเป๊ะ** — copy ใหม่เฉพาะ Day/Week/Year

### Behavior
- **Query refetch เมื่อ `queryBounds` เปลี่ยน** (mode เปลี่ยน หรือ anchor เปลี่ยน) ผ่าน `useTransactions(queryBounds)`:
  - donut/group/trend/list ใช้ data ชุดเดียวกัน จาก fetch เดียวกัน
  - Infinite scroll ของ list ไม่ refetch — slice client-side จาก `selectedTransactions` (ดู Phase 3.3)
- `selectedTransactions = transactions.filter(t => t.txn_date >= selectedBounds.startDate && t.txn_date <= selectedBounds.endDate)`
- `trendData = buildTrendBuckets(transactions, mode, anchor)` — bucketize จาก `transactions` (ที่ queryBounds ครอบไว้แล้ว)
- แกน X label ตามโหมด (อยู่ใน `getTrendBuckets` แต่ละ bucket):
  - Day → `"จ"` `"อ"` `"พ"` ... — ใช้ `format(date, 'EEEEEE', { locale: th })`
  - Week → เลขสัปดาห์ ISO (`"45"`)
  - Month → `"พ.ย."` *(ของเดิม — รักษาไว้)*
  - Year → `"2568"` (ค.ศ. + 543)

### ห้ามแตะ
- **โหมด Month: chart values + bar/donut visual + แกน X label ต้องเหมือนเดิมเป๊ะ** — verify ด้วยตา + iPhone Safari. *(ยกเว้น tooltip + section copy ที่เปลี่ยนตามที่ระบุใน Decisions — ระบุชัดว่า copy Month คงเดิม, tooltip Month อัปเดตจาก `"พ.ย."` → `"พฤศจิกายน 2568"` เป็น intentional)*
- Custom component พื้นฐาน
- Hook `useTransactions` — ใช้ของเดิม ส่งแค่ bounds ที่กว้างพอ
- หน้า Dashboard ที่ใช้ `useTransactions(monthBounds(month))` — ไม่กระทบ
- `src/lib/format.js` ของเดิม (เพิ่มได้ — แก้ของเดิมห้าม)

### Test Gate
- [ ] `npm run build` ผ่าน
- [ ] โหมด Month → กราฟ donut + bar trend + 4 group cards เหมือน Phase 2 เป๊ะ (visual check + iPhone Safari)
- [ ] โหมด Day → trend chart 7 วัน, donut ใช้ data วันเดียว, group cards อิงรายจ่ายของวัน
- [ ] โหมด Week → trend 6 สัปดาห์, ขอบเขตวันจันทร์–อาทิตย์ถูก
- [ ] โหมด Year → trend 5 ปี, แกน X เป็น พ.ศ.
- [ ] กราฟทั้งหมดมี parent height ชัด (recharts ไม่ล่ม)
- [ ] **Tooltip verify**: hover trend bar ทุก mode → แสดง `tooltipLabel` ที่อ่านรู้เรื่อง (ไม่ใช่แค่ `"จ"` / `"45"`)
- [ ] **Copy verify**: Month mode 5 จุด copy (donut title/desc/empty + trend title/desc + group desc) เหมือน Phase 2 เป๊ะ; mode อื่นเปลี่ยนตาม `rangeCopy`
- [ ] iPhone Safari ทดสอบทุกโหมด

---

## Phase 3.3 — "รายการในช่วงนี้" Section

**Vertical slice:** ส่วนใหม่ท้ายหน้า แสดงรายการ + โน้ต

### Files
- `src/pages/Stats.jsx` — เพิ่ม section ใหม่หลังการ์ด 4 กลุ่ม + นิยาม `StatsTxnRow` (local component ในไฟล์เดียวกัน เหมือน `GroupCard` ที่เป็น local อยู่แล้ว)
- **ไม่ reuse `TransactionRow.jsx`** เพราะ:
  - มัน `truncate` ทั้ง title (note) และ subtitle (category) → note ยาวจะถูกตัด
  - ไม่มีฟิลด์วันที่ (Dashboard/Transactions แสดงวันที่ผ่าน group header ของวัน — Stats ต้องการวันที่ติด row เพราะ "รายการในช่วงนี้" ข้ามวันได้)
  - **ห้ามแก้ TransactionRow.jsx** เพราะ Dashboard/Transactions ใช้

### Behavior
- Header section: `"รายการในช่วงนี้ (X รายการ)"` — X = `selectedTransactions.length`
- เรียงล่าสุดก่อน (`useTransactions` sort `txn_date desc, created_at desc` แล้ว — เรียบร้อย)
- แต่ละ `StatsTxnRow` แสดง (layout grid 3 คอลัมน์):
  - **ซ้าย:** `CategoryBadge` (reuse component นี้ได้ — ไม่ใช่ row component)
  - **กลาง:** stack
    - บรรทัด 1: `transaction.note` *(ถ้ามี — `font-bold text-ink` ไม่ truncate, ใช้ `line-clamp-2` กัน row สูงเกินขีด)*
    - บรรทัด 1 (ถ้าไม่มี note): `category.name` แทน — `font-bold`
    - บรรทัด 2: ถ้ามี note → `category.name` + `" • "` + วันที่ พ.ศ.; ถ้าไม่มี note → แค่วันที่ พ.ศ. (`text-xs text-muted`)
  - **ขวา:** amount (`+฿1,234` เขียว / `-฿1,234` แดง) — ใช้ `toneColors.income/expense`
- วันที่ใช้ `formatThaiDate(txn_date, 'd MMM yyyy')` → `"25 พ.ย. 2568"`
- ทั้ง row คลิกได้ → `navigate('/edit/' + transaction.id)` — tap target สูง ≥ 56px
- Empty state: `<EmptyState title="ไม่มีรายการในช่วงนี้" description="..." />` (reuse component)
- **Pagination = infinite scroll**:
  - Initial render: 20 รายการแรก
  - Sentinel element ล่างสุดของรายการ — observe ด้วย `IntersectionObserver` (`rootMargin: '200px'` เผื่อ pre-load)
  - ระหว่างโหลด: แสดง spinner เล็กๆ ใต้รายการ (ใช้สี muted)
  - เมื่อหมด: ซ่อน sentinel + spinner, แสดงข้อความ `"แสดงครบทั้งหมด X รายการ"` แบบ subtle
  - **ไม่ refetch จาก Supabase**: `useTransactions(queryBounds)` ดึงครั้งเดียวต่อ queryBounds change. Infinite scroll = slice client-side จาก **`selectedTransactions`** (ไม่ใช่ `transactions` ดิบ — เพราะ `transactions` ครอบ queryBounds ที่กว้างกว่า range)
  - `visibleTransactions = selectedTransactions.slice(0, visibleCount)`
  - Count ใน header (`"รายการในช่วงนี้ (X รายการ)"`) และข้อความ `"แสดงครบทั้งหมด X รายการ"` ทั้งคู่อิง `selectedTransactions.length`
  - `hasMore = visibleCount < selectedTransactions.length`
  - **Re-entry guard** (กัน sentinel trigger ซ้ำใน 1 เฟรม + iOS bounce):
    - ใช้ **functional setState**: `setVisibleCount(prev => Math.min(prev + 20, selectedTransactions.length))` — กัน stale closure
    - `const loadingMoreRef = useRef(false)` — flag กันยิงซ้ำ
    - Callback ของ IntersectionObserver:
      ```js
      ([entry]) => {
        if (!entry.isIntersecting || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        setVisibleCount(prev => Math.min(prev + 20, selectedTransactions.length));
        requestAnimationFrame(() => { loadingMoreRef.current = false; });
      }
      ```
    - `requestAnimationFrame` ปลด flag หลัง browser commit re-render — ครอบ iOS bounce ที่ trigger ซ้ำในเฟรมเดียวกัน
    - **ห้าม unobserve เร็วเกินไป**: ปล่อยให้ IntersectionObserver ทำงานต่อจนกว่า `hasMore === false` แล้ว observer disconnect ที่ cleanup ของ useEffect

### ห้ามแตะ
- `AddTransaction.jsx` (route `/edit/:id`) — ใช้ตามที่มี
- `TransactionRow.jsx` — **ห้ามแก้** (Dashboard/Transactions ใช้) และ **ห้าม reuse ในหน้านี้** (ดู Files section ข้างบนว่าทำไม)
- `CategoryBadge.jsx`, `EmptyState.jsx` — reuse ได้ ห้ามแก้ของเดิม
- `useTransactions.js` — ใช้ของเดิม ไม่แก้

### Test Gate
- [ ] `npm run build` ผ่าน
- [ ] รายการเรียงล่าสุดก่อน (`txn_date desc`)
- [ ] โน้ตยาวแสดงเต็ม (อย่างน้อย 2 บรรทัด ก่อน clamp) — ไม่โดน `truncate` แบบ TransactionRow
- [ ] รายการที่ไม่มีโน้ตยังแสดงปกติ (บรรทัด 1 = category name)
- [ ] วันที่ พ.ศ. แสดงทุก row (สำคัญ — ไม่งั้นข้ามวันแล้วงง)
- [ ] คลิก → ไปหน้า `/edit/:id` พร้อมข้อมูลถูก
- [ ] Empty state แสดงเมื่อช่วงไม่มีรายการ
- [ ] Infinite scroll: เลื่อนถึงล่าง → โหลด 20 ใหม่อัตโนมัติ ทำได้จนครบ
- [ ] ครบทั้งหมด → แสดงข้อความ "แสดงครบทั้งหมด X รายการ" + sentinel หาย
- [ ] iPhone Safari: tap targets + scroll bounce ไม่ trigger load ซ้ำ
- [ ] **slice source verify**: Day mode + ช่วงที่มี 5 รายการ → `"รายการในช่วงนี้ (5 รายการ)"` ตรงกับจำนวน row ที่ render (ไม่นับรายการจากวันอื่นใน queryBounds 7 วัน)
- [ ] **Rapid scroll test**: เลื่อนเร็วๆ ลง-ขึ้น สลับกัน 5 ครั้ง → visibleCount เพิ่มทีละ 20 (ไม่ skip 40+ ใน 1 trigger), ไม่ค้างที่ค่าใดค่าหนึ่ง

---

## Phase 3.4 — Polish + Edge Cases

**Vertical slice:** จัดการขอบเขตและ UX rough edges

### Tasks
- **Loading state strategy** (เลือก approach ชัดเจน — ไม่ blank screen, ไม่ให้ label ใหม่กับ data เก่าโชว์คู่กัน):
  - **Initial mount** (ยังไม่มี content): ใช้ข้อความ `"กำลังโหลดสถิติ..."` เดิมจาก Phase 2 (line 94)
  - **Switch mode/range** (มี content เก่าอยู่):
    - **Keep previous content + overlay** ที่ครอบกราฟ+การ์ดทั้งหมด: `opacity-50 pointer-events-none` ระหว่าง `loading === true`
    - Spinner เล็กๆ ใต้ RangeNav บอกว่ากำลังโหลดช่วงใหม่
    - **RangeNav label อัปเดตทันที** เป็นช่วงใหม่ — overlay แสดงชัดว่าข้อมูลที่เห็นยังเป็นของช่วงเก่า (กัน mismatch UX ของ Codex INFO 2)
  - ห้ามใช้ skeleton placeholder ที่ flash เปลี่ยน layout — ใช้ overlay บน layout เดิมเท่านั้น
- Disable ลูกศร "next" เมื่อ range ถัดไปเข้าสู่อนาคต (ใช้ `isNextRangeInFuture(mode, anchor)` จาก `dateRange.js` — implement ใน Phase 3.1 แล้ว Phase 3.4 แค่ verify edge cases)
- Handle empty range — กราฟต้องไม่ crash, แสดง `EmptyState` ในแต่ละ section
- ตอน switch Mode → ใช้ anchor ที่เหมาะสม:
  - Month → Day: เลือกวันสุดท้ายของเดือนที่ดู (หรือวันนี้ถ้า month = ปัจจุบัน)
  - Year → Month: เดือนสุดท้ายของปีที่ดู (หรือเดือนปัจจุบัน)
  - Day → Month: ใช้เดือนของวันที่เลือก
  - กฎทั่วไป: clamp anchor ให้ไม่เกินวันนี้
- Highlight ปุ่ม toggle ที่ active (สี coral `#D85A30`)
- Reset `visibleCount` กลับเป็น 20 **เมื่อ range เปลี่ยน** (ไม่ใช่แค่ mode เปลี่ยน):
  - `useEffect(() => setVisibleCount(20), [selectedBounds.startDate, selectedBounds.endDate])`
  - ครอบทั้ง: switch mode, arrow ◀▶, และ initial mount — ทุกกรณีที่ range เปลี่ยน user เห็นรายการจากต้น

### ห้ามแตะ
- Logic ของ Phase 3.1-3.3 ที่ผ่าน test gate แล้ว
- Phase 2 ทั้งหมด

### Test Gate
- [ ] `npm run build` ผ่าน
- [ ] Switch โหมดไป-มา → ไม่มี blank screen
- [ ] ปุ่ม next ที่ "วันนี้" / "สัปดาห์นี้" / "เดือนนี้" / "ปีนี้" ถูก disable
- [ ] เดือน/ช่วงที่ไม่มีรายการ → empty state ไม่ crash
- [ ] รัน Vercel preview build จาก branch `phase3`
- [ ] ทดสอบ Safari iPhone จริง 1 รอบเต็ม ทุก feature
- [ ] Lighthouse mobile — performance score ไม่ลดเกิน 5 คะแนนจาก main

---

## Risks & Rollback

### Risks
1. **Regression ใน Phase 2 (Month mode chart/data)** — risk สูง เพราะแก้ logic ใน Stats.jsx ที่ใช้ร่วมกัน
   - Mitigation: visual check + iPhone Safari ทุก test gate, ระบุ "ห้ามแตะ Month chart/data behavior" ในทุก phase ย่อย *(navigation guard เปลี่ยนได้ — disable next button — ระบุชัดใน Decisions)*
2. **Regression ใน Dashboard/Transactions จาก pagination loop** — risk กลาง เพราะ `useTransactions` ใช้ทั้ง 3 หน้า
   - Mitigation: เปลี่ยนเฉพาะ internal ของ `loadTransactions` ห้ามแก้ signature/return/sort. Test gate 3.1 บังคับ verify Dashboard + Transactions
3. **Date-fns week boundary ผิด** — locale อาจเริ่มอาทิตย์โดย default
   - Mitigation: บังคับใช้ `{ weekStartsOn: 1 }` ในทุก `startOfWeek`/`endOfWeek` + manual verify ผ่าน console เลือก `2025-11-25` (อังคาร) แล้ว week จันทร์ที่ผ่านมา
4. **Performance ตอน Year mode** — query data 5 ปี + pagination loop = ช้าบน mobile
   - Mitigation: Supabase index `transactions_user_date_idx` มีอยู่แล้ว, ใช้ `gte/lte` ที่ DB side, measure timing ใน Phase 3.4 (Lighthouse mobile)
5. **`monthLabel` คืน ค.ศ. ไม่ใช่ พ.ศ.** — ของเดิมใน `format.js` ใช้ `format(date, 'MMMM yyyy')` คืน ค.ศ.
   - Mitigation: helper ใหม่ใน `dateRange.js` ต้องแปลง +543 เอง — ห้าม assume `format.js` ส่ง พ.ศ.
6. **`txn_date` string parsing** — DB เก็บเป็น `yyyy-MM-dd` string ห้าม `new Date(string)` ตรงๆ
   - Mitigation: `formatThaiDate` รับทั้ง `Date` และ string — ใช้ `parseISO` เมื่อ string. ระบุชัดใน Phase 3.1 spec ของ helper

### Rollback
- ทำบน branch `phase3` — ถ้าพังให้ revert merge (`git revert -m 1 <merge-commit>`)
- ไม่มี database migration → ไม่ต้อง rollback DB
- Feature ไม่ behind flag — เพราะเป็น additive UI หน้าเดียว (Stats.jsx) ถ้าพังเฉพาะ Stats

---

## Workflow

```
1. /codex-review plans/phase3-time-ranges.md
   → Claude audit plan (read-only, fresh session)
   → กลับมา update plan ตาม finding

2. Codex implement (CLI):
   codex --full-auto -c model_reasoning_effort=medium
   > Implement plans/phase3-time-ranges.md phase by phase.
   > หยุดที่ test gate ของแต่ละ phase ย่อย
   > ห้ามแตะของ Phase 2 — verify ด้วย visual check + iPhone Safari
   > ทำบน branch phase3 (already checked out)
   > ใช้ .jsx/.js เท่านั้น ไม่ใช่ .tsx/.ts
   > Reuse useTransactions, format.js helpers — ห้ามเขียนซ้ำ

3. /verify plans/phase3-time-ranges.md
   → Claude review diff vs plan (fresh session)
   → BLOCKED / WARNING / INFO

4. Loop: ถ้า BLOCKED > 0 → กลับ step 2 (max 3 รอบ)

5. APPROVED → merge phase3 → main → Vercel auto-deploy
```

---

## Notes

- `transaction.note` มีอยู่ใน schema แล้ว (`supabase/schema.sql:19`) — แค่แสดงให้เด่น ไม่ต้องเพิ่ม column
- date-fns API ที่ใช้: `startOfWeek({ weekStartsOn: 1 })`, `endOfWeek({ weekStartsOn: 1 })`, `addDays/Weeks/Months/Years`, `startOf{Day,Month,Year}`, `endOf{Day,Month,Year}`, `format` กับ `th` locale, `isAfter`
- `ThaiDatePicker.jsx` (react-day-picker) แสดง พ.ศ. ภาษาไทยแล้ว — reuse pattern เดียวกันสำหรับ label ในหน้านี้ (แปลง +543 ที่ presentation)
- **Project ใช้ npm** ไม่ใช่ pnpm — ทุก command ใน plan นี้ใช้ `npm run ...`
- ไฟล์ใหม่ทุกไฟล์เป็น `.jsx` หรือ `.js` — โปรเจกต์ไม่มี TypeScript
- Stats.jsx ขนาดปัจจุบัน ~380 บรรทัด, หลัง Phase 3 คาดประมาณ ~600 บรรทัด — ยังจัดการได้ ถ้าเกิน 700 ค่อยพิจารณา extract เป็น cleanup phase แยก
