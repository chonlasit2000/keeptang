# Plan — Stats card height: ยืดตามเนื้อหา + สูงเท่ากัน

**Branch:** `phase3`
**Scope:** Bug fix เล็ก (CSS 2 บรรทัด)
**Status:** Ready for Codex

---

## ปัญหา

หลัง commit `cdb79cb fix(stats): equal card heights on desktop + iOS single-tap on RangeToggle` การ์ดสองใบในหน้า Stats (desktop ≥1024px) ถูกบังคับให้สูง 28rem ขั้นต่ำ ด้วย `lg:min-h-[28rem]`

ผลข้างเคียง: เมื่อสลับ range toggle จาก month → day การ์ดหมวดหมู่ (ซ้าย) มีรายการน้อยลง แต่การ์ดยังสูง 28rem เหมือนเดิม → เหลือพื้นที่ว่างเยอะใต้รายการ

ความต้องการของผู้ใช้:
- การ์ดสองใบ **สูงเท่ากันเสมอ** (ตามที่ commit `cdb79cb` ตั้งใจ — ✓ ต้องคงไว้)
- การ์ด **ยืด/หดตามเนื้อหาที่ยาวกว่า** ของแต่ละ range — ไม่ใช่ floor ที่ตายตัว

---

## วิเคราะห์ root cause

Grid parent ใน `src/pages/Stats.jsx:195`:

```jsx
<div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
```

CSS Grid `align-items` default = `stretch` → grid items ในแถวเดียวกันสูงเท่ากันโดยอัตโนมัติ ตามเนื้อหาที่ยาวกว่า

ดังนั้น `lg:min-h-[28rem]` ไม่จำเป็นต่อการทำให้สูงเท่ากัน — มันแค่เพิ่ม floor ขั้นต่ำ ซึ่งเป็นต้นเหตุของปัญหา

**ทำไม commit `59a2e35 fix(stats): left card sizes to content, trend chart keeps own height` (ที่ถูก revert) เดิมการ์ดไม่เท่ากัน?**

สมมุติฐาน: commit นั้นน่าจะใส่ `lg:self-start` / `items-start` / `align-self: start` ที่ไหนสักที่ ซึ่งไป override grid stretch ทำให้ฝั่งซ้ายไม่ยืด ส่วนฝั่งขวายืดตาม trend chart → สูงไม่เท่ากัน

**Plan นี้:** ลบ `lg:min-h-[28rem]` ออกอย่างเดียว และ**ห้ามใส่ `self-start` / `items-start` ใดๆ** เพื่อให้ grid stretch default ทำงาน

---

## ไฟล์ที่แตะ

| ไฟล์ | บรรทัด | การเปลี่ยนแปลง |
|---|---|---|
| `src/pages/Stats.jsx` | 196 | ลบ `lg:min-h-[28rem]` จาก left section className |
| `src/pages/Stats.jsx` | 240 | ลบ `lg:min-h-[28rem]` จาก right section className |

---

## Diff ที่ต้องการ

```jsx
// src/pages/Stats.jsx:196 (left section — donut + category list)
- <section className="min-w-0 rounded-2xl bg-white p-4 shadow-soft md:p-5 lg:min-h-[28rem]">
+ <section className="min-w-0 rounded-2xl bg-white p-4 shadow-soft md:p-5">

// src/pages/Stats.jsx:240 (right section — trend bar chart)
- <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-soft md:p-5 lg:min-h-[28rem]">
+ <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-soft md:p-5">
```

---

## ห้ามแตะ

- `src/components/RangeToggle.jsx` — เพิ่งแก้ iOS tap delay ใน commit เดียวกัน
- `src/components/RangeNav.jsx`
- `flex flex-col` ที่ section ขวา — จำเป็นต่อ layout chart
- `flex-1 min-h-[16rem]` ที่ chart container (บรรทัด 250) — floor ขั้นต่ำให้ trend chart render ได้
- `lg:max-h-[20rem] lg:overflow-y-auto` ที่ category list (บรรทัด 224) — cap ไม่ให้ลิสต์ยาวเกิน
- **ห้ามใส่** `lg:self-start`, `items-start`, `align-self`, `align-items: start` ที่ grid parent หรือ section ใดๆ — จะพังเงื่อนไข "สูงเท่ากัน"
- ห้ามแก้ logic / hook / data flow — เป็น CSS-only fix
- ห้ามแตะ Phase 2 code (donut, trend, 4-groups inline ใน Stats.jsx)

---

## Test gates (manual)

1. **Build:** `npm run build` pass (ไม่มี warning ใหม่)
2. **Desktop ≥1024px, month view (มีหลายหมวด):**
   - การ์ดซ้าย-ขวาสูงเท่ากันพอดี
   - trend chart มองเห็นชัด ไม่เตี้ยจนอ่านยาก
3. **Desktop ≥1024px, day view (หมวดน้อยหรือ 0):**
   - การ์ดทั้งสองหดลงพร้อมกัน
   - ยังสูงเท่ากัน (ไม่มีใบใดสั้นกว่าอีก)
   - trend chart ยังสูง ≥16rem (จาก `min-h-[16rem]` ที่ chart container)
4. **Desktop, สลับ RangeToggle day ↔ week ↔ month ↔ year:**
   - การ์ดสองใบยืด/หดพร้อมกันทุก range — ไม่มี jump/lag
5. **Mobile (<768px):**
   - ไม่กระทบ เพราะ `lg:` modifier ไม่ active บน mobile
   - การ์ดเรียงคอลัมน์เดียวเหมือนเดิม
6. **iPhone Safari จริง:**
   - เปิดหน้า /stats สลับ range → ความสูงปรับตามเนื้อหา smooth
   - ไม่มี layout shift แปลกๆ

---

## Risk / Edge cases

- **Day view มี 0 หมวด:** ซ้ายใช้ empty state `min-h-[20rem]`, ขวาใช้ header + chart empty state `min-h-[20rem]` → grid stretch ทั้งสองไป ~22rem ใกล้เคียงกัน ✓
- **Day view มี 1 หมวด:** ซ้ายสูง ≈ header + donut 13rem + 1 row ≈ 22rem, ขวา ≈ header + chart 16rem ≈ 21rem → grid stretch ทั้งสองไป 22rem ✓
- **Month view มีหมวดเยอะ:** ซ้ายสูง ≈ header + donut 13rem + list (cap 20rem) ≈ 38rem, ขวายืดตาม → trend chart ได้ความสูงมากขึ้น (38rem - header) ✓

---

## Verdict criteria (สำหรับ review รอบหน้า)

✅ APPROVED ถ้า:
- diff = แก้ Stats.jsx 2 บรรทัดตามที่กำหนด
- ไม่มีไฟล์อื่นถูกแตะ
- `npm run build` pass
- Manual test 6 ข้อข้างต้นผ่าน

⚠️ NEEDS WORK ถ้า:
- มี `self-start` / `items-start` / `align-*` ถูกเพิ่มที่ใด
- มีการแก้ไฟล์อื่นนอก Stats.jsx
- การ์ดสูงไม่เท่ากันหลังเปลี่ยน range

❌ REJECT ถ้า:
- แตะ RangeToggle / RangeNav / hook / data flow
- Phase 2 chart (donut, trend, 4-groups) พัง
