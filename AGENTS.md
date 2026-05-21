# keeptang — Project Rules

> Universal instructions ที่ทั้ง Claude Code และ Codex CLI อ่าน
> ไฟล์นี้คือ "ความจริงเดียว" ของโปรเจกต์ — ถ้าไฟล์อื่นขัดกับไฟล์นี้ ให้ยึดไฟล์นี้

---

## Role Assignment

ทั้ง 2 AI ทำหน้าที่ที่ต่างกัน:

- **Claude Code** → Planner + Reviewer
- **Codex CLI** → Implementer

ห้ามใครทำงานของอีกฝ่าย ห้ามแก้พร้อมกัน (เปิดคนละหน้าต่าง)

---

## Product

**keeptang** — เว็บแอปบันทึกรายรับรายจ่ายประจำวัน
- ภาษาไทย เงินบาทอย่างเดียว
- mobile-first + responsive ทั้งคอม
- PWA ติดตั้งบนมือถือได้

---

## Stack (สภาพจริง — ห้ามเดา ห้ามใส่ของที่ไม่มี)

- **Language:** JavaScript (ไฟล์ `.jsx` / `.js`) — **ไม่มี TypeScript** ห้ามเขียน `.tsx`/`.ts`
- **Framework:** React 18 + Vite 6
- **Styling:** Tailwind 3.4 + PostCSS + autoprefixer
- **Routing:** react-router-dom 6
- **Backend:** Supabase (Auth + Postgres + RLS) — `@supabase/supabase-js` 2
- **Charts:** recharts 3.8 *(ไม่ใช้ ResponsiveContainer — ใช้ inline style `width:100%, height:100%` + parent มี height ชัด)*
- **Date:** date-fns 3 + react-day-picker 10
- **Icons:** lucide-react
- **PWA:** vite-plugin-pwa
- **Package manager:** **npm** (lockfile = `package-lock.json`)
- **Test runner:** ไม่มี (ทุก verification เป็น manual test + `npm run build`)
- **Deploy:** Vercel (prod = `main` branch, preview = branches อื่น)
- **Auth keys:** Supabase publishable key รุ่นใหม่ `sb_publishable_...` (ไม่ใช่ JWT anon เก่า)

---

## Commands

```bash
npm run dev        # dev server (vite)
npm run build      # production build (รันก่อน merge ทุกครั้ง)
npm run preview    # preview build local
npm run lint       # eslint
```

---

## Project Structure (สภาพจริง)

```
src/
├── App.jsx                        ← routes
├── main.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── CategoryContext.jsx
├── hooks/
│   ├── useTransactions.js         ← { startDate, endDate, categoryId } → { transactions, loading, error, reload }
│   └── useCategories.js
├── lib/
│   ├── supabase.js
│   ├── format.js                  ← baht, localDate, monthBounds, monthLabel, dateLabel, groupByDate, summarize
│   ├── icons.jsx
│   ├── defaultCategories.js
│   └── seedCategories.js
├── components/
│   ├── AppShell.jsx
│   ├── BottomNav.jsx
│   ├── SidebarNav.jsx
│   ├── Header.jsx
│   ├── MonthPicker.jsx
│   ├── ThaiDatePicker.jsx         ← react-day-picker (พ.ศ. ไทย)
│   ├── Select.jsx                 ← custom dropdown (Phase 2 ใหม่ แทน <select>)
│   ├── CategoryBadge.jsx
│   ├── ConfirmDialog.jsx          ← แทน window.confirm
│   ├── EmptyState.jsx
│   ├── LoadingScreen.jsx
│   └── TransactionRow.jsx
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── AddTransaction.jsx         ← ใช้ทั้ง /add และ /edit/:id
    ├── Transactions.jsx
    ├── Stats.jsx                  ← donut + trend + 4 groups ทั้งหมด inline ในไฟล์เดียว
    └── Settings.jsx
```

**สำคัญ:** Stats.jsx เก็บ chart code (donut, trend bar, group cards) **inline ทั้งหมด** ไม่ใช่แยกเป็น component ใน `components/charts/`. ห้าม Codex สมมุติว่ามี folder `charts/` หรือ `cards/`

---

## Routes (จาก App.jsx)

| Path | Page | หมายเหตุ |
|---|---|---|
| `/login` | Login | public only |
| `/` | Dashboard | index |
| `/add` | AddTransaction | สร้างใหม่ |
| `/edit/:id` | AddTransaction | แก้ — ใช้ component เดียวกับ /add |
| `/transactions` | Transactions | |
| `/stats` | Stats | |
| `/settings` | Settings | |

หน้าแก้รายการใช้ route `/edit/:id` — ลิงก์ไปแก้ใช้ `navigate('/edit/' + id)` หรือ `<Link to={...}>`

---

## Design System — "อบอุ่น เป็นมิตร" (Style B)

- พื้นครีม `#FBF3E7`
- สีหลัก coral `#D85A30`
- รายรับเขียว `#1D9E75` (toneColors.income)
- รายจ่ายแดง `#993C1D` (toneColors.expense)
- ออม `#25638F` (toneColors.saving)
- การ์ดมุมโค้งบนพื้นพาสเทล + `shadow-soft`
- ฟอนต์ Noto Sans Thai / IBM Plex Sans Thai

chartColors palette: `amber, sky, pink, mint, coral, peach, lavender, butter, teal, leaf`

groupMeta keys: `need / want / saving / reward`

---

## Data Model (Supabase — จาก `supabase/schema.sql`)

```sql
categories   id uuid pk, user_id, name, icon, color,
             type ('income'|'expense'), grp ('need'|'want'|'saving'|'reward'),
             sort_order int, created_at
             unique (user_id, type, name)

transactions id uuid pk, user_id, amount numeric(12,2) > 0,
             type ('income'|'expense'), category_id (nullable on delete),
             note text, txn_date date, created_at
             index (user_id, txn_date desc)

auth.users   จัดการโดย Supabase Auth
             trigger seed_default_categories_on_signup สร้าง 13 หมวด default
```

**RLS:** ทั้ง 2 table เปิด policy "own X" — auth.uid() = user_id ทั้ง using และ with check

**กฎเหล็กของวันที่:** ปฏิทินแสดงผลเป็น **พ.ศ.** แต่ database เก็บเป็น **ค.ศ.** เสมอ (`txn_date` เป็น `date` type)
ห้ามเก็บ พ.ศ. ลง DB เด็ดขาด

---

## Reusable Helpers (อย่าเขียนซ้ำ — extend หรือ reuse)

### `src/lib/format.js`
- `baht(value)` — `฿1,234.50` (decimals เมื่อมีเศษ)
- `localDate(date)` — `yyyy-MM-dd`
- `monthBounds(monthDate)` → `{ startDate, endDate }` (yyyy-MM-dd ของวันที่ 1 และวันสิ้นเดือน)
- `monthLabel(monthDate)` — `"พฤศจิกายน 2025"` *(หมายเหตุ: year นี้คือ ค.ศ. — ถ้าต้องการ พ.ศ. แปลง +543 ที่ caller)*
- `dateLabel(value)` — `"วันนี้"` หรือ `"25 พฤศจิกายน 2025"`
- `groupByDate(transactions)` → `{ "yyyy-MM-dd": [...] }`
- `summarize(transactions)` → `{ income, expense, balance }`

### `src/hooks/useTransactions.js`
- รับ `{ startDate, endDate, categoryId }` ทั้งหมด optional
- Query Supabase: `gte('txn_date', startDate)` + `lte('txn_date', endDate)` + sort `txn_date desc, created_at desc`
- Returns `{ transactions, loading, error, reload }`
- **Phase 3 ใช้ hook นี้เลย — ไม่ต้องเขียน hook ใหม่** ส่ง bounds ของ range ที่เลือกเข้าไป

### `src/hooks/useCategories.js`
- proxy ของ `CategoryContext` — เรียกใช้ใน component ที่ต้องการ category list

---

## Pages (สภาพปัจจุบัน)

1. **Login/Register** — Supabase Auth email/password
2. **Dashboard** — เลือกเดือน (MonthPicker) + การ์ดสรุป 3 ใบ + รายการล่าสุด
3. **เพิ่ม/แก้รายการ** — input `inputmode="decimal"` + ตารางเลือกหมวด + ThaiDatePicker (พ.ศ.)
4. **รายการทั้งหมด** — กรอง 2 ขั้น (type → category) + จัดกลุ่มตามวัน
5. **สถิติ** — เลือกเดือน + โดนัทแยกหมวด + กราฟแนวโน้ม 6 เดือน + การ์ดสรุป 4 กลุ่ม *(Phase 3 จะเพิ่ม Day/Week/Year + รายการในช่วง)*
6. **ตั้งค่า** — จัดการหมวดหมู่ (เพิ่ม/แก้/ลบ) + custom dropdown (Select) + logout

---

## Layout

- **มือถือ (<768px):** คอลัมน์เดียว + BottomNav (หน้าแรก/รายการ/สถิติ/ตั้งค่า) + FAB "+" มุมขวาล่าง
- **คอม (≥768px):** SidebarNav ซ้าย + เนื้อหา `max-w-5xl` กึ่งกลาง + กราฟ 2 คอลัมน์ (`lg:grid-cols-[0.95fr_1.05fr]`) + ปุ่ม "+ เพิ่มรายการ" ใน sidebar

---

## Custom Components (ห้ามรื้อ)

ของพวกนี้สร้างเองเพราะ native มีปัญหาบน iOS Safari:

- **`Select.jsx`** — custom dropdown แทน `<select>` ทุกจุด รองรับไอคอน + สีในตัวเลือก
- **`ThaiDatePicker.jsx`** — ใช้ react-day-picker ป๊อปอัป พ.ศ. ภาษาไทย ธีม coral แทน `<input type="date">`
- **`ConfirmDialog.jsx`** — modal ยืนยัน แทน `window.confirm`/`alert`
- **`MonthPicker.jsx`** — เลือกเดือน พ.ศ.
- **ตารางเลือกไอคอน + วงเลือกสี** ในหน้าเพิ่ม/แก้หมวดหมู่ (อยู่ใน Settings)

ห้ามเปลี่ยนกลับเป็น `<select>`, `<input type="date">`, หรือ browser dialog เด็ดขาด

---

## Boundaries

### Always
- ทำบน **branch แยก** ทุก feature ใหม่ — รอ Vercel preview ก่อน merge
- ทดสอบบน **iPhone Safari จริง** ก่อน merge (ไม่พอที่จะเทสต์ Chrome อย่างเดียว)
- รัน `npm run build` ก่อนบอกว่า "phase complete"
- ใช้ component custom + helper ที่มีอยู่แล้ว แทนของใหม่ที่ทำหน้าที่ซ้ำ

### Ask First
- เพิ่ม dependency ใหม่ (ปัจจุบัน: recharts, react-day-picker, date-fns, lucide-react, @supabase/supabase-js, react-router-dom, vite-plugin-pwa)
- แก้ schema database (เพิ่ม column / table / index / migration)
- แก้ไฟล์นอก scope ของ phase ปัจจุบัน
- เปลี่ยน design token (สี ฟอนต์ spacing)
- เพิ่ม test runner (vitest/jest) — ตอนนี้ยังไม่มี

### Never
- เก็บ พ.ศ. ลง database
- รื้อ custom component กลับเป็น native
- แก้ของ phase เก่าที่ทำงานได้แล้ว — ระบุชัดทุกรอบว่า "ห้ามแตะอะไร"
- รัน `git push --force` หรือลบ migration ที่ deploy แล้ว
- แก้ `.env*` หรือ Supabase keys
- เขียน TypeScript (`.tsx`/`.ts`) — โปรเจกต์เป็น JS ล้วน

---

## Lessons Learned (อย่าทำผิดซ้ำ)

1. **iOS Safari ดื้อ** — `<input type="date">`, `<select>` มี style ฝังในตัว → ใช้ custom component
2. **ทดสอบ Chrome ไม่พอ** — ต้องเทสต์ iPhone Safari จริงด้วย
3. **Timezone ปนปั่น** — ระวังการแปลง พ.ศ./ค.ศ. และคำนวณช่วงสัปดาห์/เดือน (week ใช้ ISO จันทร์เริ่ม → `startOfWeek(date, { weekStartsOn: 1 })`)
4. **Codex ใช้ `space-between` มั่ว** — ทำให้เนื้อหาแยกห่างเพื่อ "สูงเท่ากัน" → ใช้ `min-height` แทน
5. **Codex หลุดเมื่อแก้ของเก่า** — ระบุชัดทุกรอบว่าอะไรห้ามแตะ และให้ทำบน branch แยก
6. **recharts ต้องมี height ชัด** — parent ต้องมี `min-h-[16rem]` หรือ explicit height ไม่งั้นกราฟล่ม
7. **แกน Y กราฟต้องมี width พอ** — ใช้ `<YAxis width={56}>` + `tickFormatter` ฟอร์แมต บาท ไม่ให้แท่งทับ
8. **Codex สมมุติโครงสร้างที่ไม่มี** — เช่น `components/charts/`, `selectedMonth` state, `.tsx` extension → ก่อนเริ่มต้อง verify ใน Stats.jsx ของจริง

---

## Phase Status

- ✅ **Phase 1** — บันทึก/แก้/ลบ + auth + RLS *(แก้ 3 รอบจนนิ่ง — docs ใน `docs/phase1/`)*
- ✅ **Phase 2** — หน้าสถิติ: โดนัท + กราฟแนวโน้ม + 4 กลุ่มรายจ่าย + custom dropdown *(docs ใน `docs/phase2/`)*
- 🔥 **Phase 3** — สรุปช่วงเวลา Day/Week/Month/Year + รายการพร้อมโน้ต *(in progress — branch `phase3`)*
- ⏳ **Phase 4** — งบประมาณ (Budget)
- ⏳ **Phase 5** — ผัง Flow (Sankey diagram)

---

## Branch Strategy

```
main              ← production (Vercel auto-deploy)
phase3            ← work in progress (Vercel preview)
hotfix/*          ← bug fixes
```

Plan documents อยู่ใน `plans/<feature-name>.md`
Past spec/docs อยู่ใน `docs/phase<N>/`
