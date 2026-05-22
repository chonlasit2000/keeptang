# Plan — Stats card height v2: ให้ left card หดตามเนื้อหาบน desktop

**Branch:** `phase3`
**Scope:** Bug fix เล็ก (CSS 1 บรรทัด)
**Status:** ❌ **ABANDONED** — implement แล้ว revert (commit `74220e6` → `997f7fe`)
**Predecessor:** `plans/stats-card-height.md` (merged แล้ว แต่แก้ไม่ครบ)

---

## ⚠️ Postmortem (อ่านก่อนคิดจะลองวิธีนี้อีก)

ลองลบ `lg:grid-cols-1` ออกจริงๆ แล้ว ผลคือ **list column แคบเกินไป (~212px)** ชื่อหมวด wrap ตัวอักษรเดียวต่อบรรทัด อ่านไม่ได้เลย (ดู `KT เละ.png`)

**Math ที่ plan v2 ประเมินผิด:**
- AppShell ใช้ `max-w-5xl` = 1024px (ไม่ใช่ 1440px อย่างที่คาด)
- Outer grid `lg:grid-cols-[0.95fr_1.05fr]` → left card = ~480px
- หัก padding p-5 (40px) + donut column 13rem (208px) + gap (20px) → list = **~212px**
- 212px แคบเกินไป — text content area เหลือเพียง ~80px หลังหัก dot/padding/amount

**สรุป:** `lg:grid-cols-1` มีอยู่เพื่อให้ list ได้ width เต็ม card (~440px) → อ่านชื่อหมวดยาวได้

**Trade-off ที่ยอมรับแล้ว:**
- card สูง ~22-38rem ตามจำนวนหมวด (donut h-52 dominate)
- day view มีพื้นที่ว่างใต้ list — **ยอม** เพราะ list อ่านง่ายสำคัญกว่า

**ถ้าจะลองอีกครั้งในอนาคต**, approach ที่ยังไม่ลอง:
- ลด donut size (`h-52` → `h-36`/`h-40`) + ลด text "รวมรายจ่าย/฿xxx" ในวง — ปัญหา: donut เล็กลงจน secondary
- ขยาย `max-w-5xl` ของหน้า Stats เป็น 6xl/7xl — กระทบ design system ทั้ง project
- รื้อโครง outer grid ratio (เช่น 1fr:0.8fr ให้ left card กว้างขึ้น) — chart ขวาแคบลง

---

---

## ปัญหาที่ยังเหลือหลัง v1

หลัง commit `02f4716 Merge branch 'phase3'` (ลบ `lg:min-h-[28rem]` แล้ว) เปิดบน Desktop browser:

- **Month view (มีหมวดเยอะ):** ความสูงการ์ด ~38rem
- **Day view (1-2 หมวด):** ความสูงการ์ด **ยัง ~30rem** — ไม่หดตามเนื้อหา
- มีพื้นที่ว่างขาวเยอะใต้รายการในการ์ดซ้าย

**ผู้ใช้สังเกตเอง:** บนหน้าจอแคบ (<1024px) การ์ดหดได้ดี — บน desktop ≥1024px มันไม่หด

ดูภาพประกอบ:
- `KT 1.png` — Month เต็มจอ (full card with scrolling list)
- `KT 2.png` — Day เต็มจอ (donut + 1 item + พื้นที่ว่างเยอะ ← ปัญหา)
- `KT 3.png` — จอแคบ + DevTools (การ์ดหดได้ปกติ)

---

## วิเคราะห์ root cause

ปัญหาไม่ได้อยู่ที่ `min-h-[28rem]` (v1 ลบไปแล้ว) แต่อยู่ที่ inner grid ของ left card ที่ `src/pages/Stats.jsx:206`:

```jsx
<div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr] lg:grid-cols-1">
```

ตรง `lg:grid-cols-1` คือต้นเหตุ — บน lg (≥1024px) บังคับให้ donut **stack อยู่บน** list (1 column)

ผลคือ left card minimum height = header + donut(13rem) + gap + list_min + padding ≈ **22rem ขั้นต่ำ** ไม่ว่ามีกี่หมวด เพราะ donut `h-52` (208px) เป็นความสูง fixed

- Day view 1 หมวด: list ~5rem → card ~22rem (มีพื้นที่ว่างใต้ list เยอะ)
- Month view 5+ หมวด: list cap ที่ 20rem → card ~38rem

ในขณะที่บน md (768-1023px) ใช้ `md:grid-cols-[13rem_1fr]` — donut อยู่**ข้าง** list → card height = max(donut, list) = หดได้ตามเนื้อหา

**Fix:** ลบ `lg:grid-cols-1` ออก ให้ใช้ `md:grid-cols-[13rem_1fr]` ตลอดทั้ง md และ lg → donut ข้าง list บน desktop ด้วย

---

## ทางเลือกที่พิจารณาแล้ว (และไม่เลือก)

| Option | ทำอะไร | ทำไมไม่เลือก |
|---|---|---|
| B | ลด donut `h-52` → `h-36`/`h-40` | แค่ย้ายปัญหา ยังคง stack + donut เล็กลง อ่านยอดในวงยากขึ้น |
| C | A + B รวมกัน | over-engineer สำหรับ structural layout fix |
| รื้อ outer grid `lg:grid-cols-[0.95fr_1.05fr]` | คิดเฉพาะ ratio outer | ไม่ใช่ที่ outer — outer ทำงานถูกแล้ว |

---

## ไฟล์ที่แตะ

| ไฟล์ | บรรทัด | การเปลี่ยนแปลง |
|---|---|---|
| `src/pages/Stats.jsx` | 206 | ลบ `lg:grid-cols-1` ออกจาก inner grid className |

---

## Diff ที่ต้องการ

```jsx
// src/pages/Stats.jsx:206 (inner grid ใน left card)
- <div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr] lg:grid-cols-1">
+ <div className="mt-4 grid gap-5 md:grid-cols-[13rem_1fr]">
```

**1 บรรทัดเท่านั้น** ไม่แตะอย่างอื่น

---

## ห้ามแตะ

- `src/components/RangeToggle.jsx` — เรื่อง iOS tap delay เก็บไว้แก้รอบหน้า
- `src/components/RangeNav.jsx`
- Outer grid `<div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">` (Stats.jsx:195) — ทำงานถูกแล้ว
- `<section>` ทั้งสองใบ (Stats.jsx:196, 240) — ไม่ใส่ min-h กลับ ไม่ใส่ self-start/align-*
- donut `h-52 w-52` (Stats.jsx:207) — ขนาด donut คงเดิม
- list `lg:max-h-[20rem] lg:overflow-y-auto` (Stats.jsx:224) — cap + scroll คงเดิม
- chart container `flex-1 min-h-[16rem]` (Stats.jsx:250) — floor 16rem คงเดิม
- ห้ามแก้ logic / hook / data flow / Phase 2 chart code

---

## ผลลัพธ์ที่คาดหวัง (math)

**บน desktop ≥1024px** (lg layout, outer grid 2 columns, left card ~47% viewport):

- inner grid: donut(13rem) ข้าง list(1fr)
- card height = max(donut 13rem, list content) + header + padding

| Range view | จำนวนหมวด | List height | Card height (left) |
|---|---|---|---|
| Day | 1 | ~4rem | ~13rem + header ≈ **17rem** |
| Day | 3 | ~12rem | ~13rem + header ≈ **17rem** |
| Day | 5 | ~20rem (cap) | ~20rem + header ≈ **24rem** |
| Month | 10+ | 20rem (cap+scroll) | ~20rem + header ≈ **24rem** |

Right card: chart `min-h-[16rem]` + header ≈ 20rem intrinsic
Grid stretch: ทั้งสองเป็น max(left, right)

- Day 1 หมวด: max(17, 20) = **20rem** (chart-dominant)
- Day 5 หมวด: max(24, 20) = **24rem**
- Month 10+ หมวด: max(24, 20) = **24rem**

เทียบกับสภาพปัจจุบัน (~30-38rem) → **หดลง 6-14rem ในทุก range** ✓

---

## Trade-off (ที่ผู้ใช้ต้องรับ)

- **list area บน lg แคบลง** — เดิม `lg:grid-cols-1` ให้ list ใช้ความกว้างเต็ม card. ใหม่ list ได้ ~270px (จอ 1024px) ถึง ~360px (จอ 1440px)
- ชื่อหมวดยาวๆ เช่น "ของขวัญ/รางวัลตัวเอง" จะ wrap 2 บรรทัด — มี `line-clamp-2` กั้นไว้แล้ว ไม่ overflow
- จำนวน `฿1,800` มี `shrink-0` ไม่ wrap → ปลอดภัย

---

## Test gates (manual)

1. **Build:** `npm run build` pass ไม่มี warning ใหม่
2. **Desktop ≥1024px, month view (มีหมวด 5+):**
   - donut อยู่ซ้าย, list อยู่ขวา (side by side ใน left card)
   - การ์ดสองใบสูงเท่ากัน, ~24rem
   - list มี scroll ถ้าเกิน 20rem
3. **Desktop ≥1024px, day view (1-3 หมวด):**
   - donut อยู่ซ้าย, list อยู่ขวา (side by side)
   - การ์ดทั้งสองหดเหลือ ~17-20rem
   - **ไม่มีพื้นที่ว่างใต้ list** (หรือมีน้อยมาก)
4. **Desktop, สลับ RangeToggle day ↔ month:**
   - การ์ดทั้งสองยืด/หดพร้อมกัน — month สูงกว่า day อย่างชัดเจน
5. **Tablet 768-1023px (md layout):**
   - ไม่กระทบเพราะ `md:grid-cols-[13rem_1fr]` ยังใช้เหมือนเดิม
6. **Mobile <768px:**
   - inner grid เป็น 1 column default (donut บน list) — ไม่กระทบ
7. **list มีชื่อยาว เช่น "ของขวัญ/รางวัลตัวเอง":**
   - wrap 2 บรรทัดด้วย `line-clamp-2` ไม่ overflow
   - จำนวนเงินยังอยู่ขวาสุด ไม่ wrap

---

## Risk / Edge cases

- **จอ 1024px พอดี (boundary):** lg active → layout ใหม่. list มี ~270px width. Worst case wrap. ทดสอบในข้อ 7
- **0 หมวด (empty state):** ไม่กระทบ — empty state ใช้ `<div className="grid min-h-[20rem] place-items-center">` ของตัวเอง ไม่ผ่าน inner grid
- **Donut ไม่กึ่งกลาง card อีกต่อไป:** เดิม `lg:grid-cols-1` + `mx-auto` → donut กึ่งกลาง. ใหม่ donut อยู่ใน column 13rem ซ้ายมือ + `mx-auto` ภายในคอลัมน์นั้น → ติดซ้าย card → ต้องดูว่าผู้ใช้รับได้ไหม. ถ้าไม่ rebalance ค่อยคุย

---

## Verdict criteria (สำหรับ review รอบหน้า)

✅ **APPROVED** ถ้า:
- diff = แก้ Stats.jsx 1 บรรทัด (ลบ `lg:grid-cols-1`) ตามที่กำหนด
- ไม่มีไฟล์อื่นถูกแตะ
- `npm run build` pass
- Manual test 7 ข้อข้างต้นผ่าน
- ทดสอบบน iPhone Safari (mobile) ไม่ regression

⚠️ **NEEDS WORK** ถ้า:
- มี class อื่นถูกเพิ่ม/แก้ใน Stats.jsx นอกจาก 1 บรรทัดนี้
- มีการแก้ไฟล์อื่นนอก Stats.jsx
- Day view การ์ดยังสูง > 22rem

❌ **REJECT** ถ้า:
- แตะ RangeToggle / RangeNav / hook / data flow
- Phase 2 chart (donut, trend, 4-groups) พัง
- Mobile/tablet layout เพี้ยน

---

## หลัง APPROVED

1. Merge phase3 → main (--no-ff ตาม pattern)
2. Push → Vercel auto-deploy prod
3. ทดสอบบน iPhone Safari + Edge desktop จริง
4. ถ้า ok ปิดเคส card height — ค่อยไปแก้ RangeToggle iOS tap delay ใน plan ถัดไป
