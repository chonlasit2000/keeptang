# Phase 3 — สรุปช่วงเวลา (Day / Week / Month / Year) + รายการพร้อมโน้ต

> **Branch:** `phase3`
> **Status:** Ready for Codex audit
> **Prerequisite:** Phase 2 (สถิติเดือน) ทำงานได้สมบูรณ์

---

## Context

ขยายหน้าสถิติเดิม เพิ่มความสามารถดูข้อมูลในช่วงเวลาต่างๆ และดูรายการ + โน้ตที่ผู้ใช้กรอกในช่วงนั้น

**Problem:** ตอนนี้หน้าสถิติดูได้แค่ "เดือน" — ผู้ใช้อยากย้อนดูวันใดวันหนึ่ง สัปดาห์ที่ผ่านมา หรือทั้งปี และอยากเห็นโน้ตที่จดไว้

**Users:** ผู้ใช้ปัจจุบันที่ใช้แอปเก็บข้อมูลเป็นสัปดาห์/เดือน

**Success criteria:**
- เลือกช่วงเวลาได้ 4 โหมด → กราฟ + การ์ดทุกตัวอัปเดตตามช่วงที่เลือก
- รายการในช่วงพร้อมโน้ตแสดงท้ายหน้า คลิกเข้าหน้าแก้ไขได้
- **โหมด Month ต้องทำงานเหมือน Phase 2 เดิมเป๊ะ** ไม่มี regression

---

## Decisions

✅ **Already decided:**
- ใช้ date-fns ที่มีอยู่แล้ว (ไม่ลง library เพิ่ม)
- Week ใช้ ISO standard (จันทร์–อาทิตย์)
- ไม่แตะ database schema
- ทำบน branch `phase3` แยก → Vercel preview → merge เข้า main

🟡 **[DECISION PENDING]** — ถามก่อน implement:
- ตำแหน่งของแถบสลับ Day/Week/Month/Year (เหนือกราฟทั้งหมด หรือใน header การ์ดเลือกช่วง)
- รายการในช่วง: pagination แบบ "show more" หรือ infinite scroll
- จำนวน item ต่อหน้า (10 / 20 / 30?)

---

## Scope

### In Scope
- Time range toggle (Day/Week/Month/Year) ที่หน้าสถิติ
- Navigation arrows ก่อนหน้า/ถัดไป สำหรับแต่ละโหมด
- กราฟทั้งหมดจาก Phase 2 อัปเดตตามช่วงที่เลือก
- ส่วนใหม่ "รายการในช่วงนี้" ท้ายหน้า

### Out of Scope (ทำใน Phase 4-5)
- Budget tracking
- Sankey diagram
- Export ข้อมูล
- Filter เพิ่มเติม (หมวด / type) ในส่วน "รายการในช่วงนี้" — รอ Phase 6

---

## Phase 3.1 — Time Range Infrastructure

**Vertical slice:** state + URL params + navigation UI (ยังไม่แตะกราฟ)

### Files
- `src/pages/Stats.tsx` — เพิ่ม `rangeMode` state + toggle UI
- `src/lib/dateRange.ts` *(new)* — helper functions:
  - `getRangeBounds(mode, anchor)` → `{ start, end, label }`
  - `prevRange(mode, anchor)` / `nextRange(mode, anchor)`
  - `formatRangeLabel(mode, bounds)` — แสดงเป็น พ.ศ. ภาษาไทย
- `src/components/RangeToggle.tsx` *(new)* — ปุ่ม segmented (Day/Week/Month/Year)
- `src/components/RangeNav.tsx` *(new)* — ลูกศร ◀ [label] ▶

### Behavior
- Default = `Month` (เพื่อให้พฤติกรรมเดิมคงอยู่)
- ลูกศร ◀▶ เปลี่ยน anchor ตามโหมด:
  - Day: `addDays(anchor, ±1)`
  - Week: `addWeeks(anchor, ±1)` — anchor = วันจันทร์ของสัปดาห์
  - Month: `addMonths(anchor, ±1)` — anchor = วันที่ 1
  - Year: `addYears(anchor, ±1)` — anchor = 1 ม.ค.
- Label แสดงเป็น พ.ศ.:
  - Day: "อังคาร 25 พฤศจิกายน 2568"
  - Week: "25 พ.ย. – 1 ธ.ค. 2568"
  - Month: "พฤศจิกายน 2568"
  - Year: "2568"

### ห้ามแตะ
- **Phase 2 กราฟทั้งหมด** — ยังใช้ logic เดิมที่ดู `selectedMonth` state ไปก่อน
- Layout ของหน้าสถิติ — แค่เพิ่ม toggle ด้านบน
- Custom dropdown ของหน้าตั้งค่า

### Test Gate
- [ ] `pnpm build` ผ่าน
- [ ] เปิดหน้าสถิติ → toggle 4 โหมด → label เปลี่ยนถูก
- [ ] ลูกศร ◀▶ ทำงานทั้ง 4 โหมด — เดือนเปลี่ยนแบบเดิม (default = Month)
- [ ] โหมด Month ยังโชว์กราฟ + การ์ดเหมือน Phase 2 เป๊ะ
- [ ] ทดสอบบน iPhone Safari จริง

---

## Phase 3.2 — Wire Graphs to Range

**Vertical slice:** เปลี่ยนกราฟทั้งหมดให้รับ range bounds แทน `selectedMonth`

### Files
- `src/pages/Stats.tsx` — pass `{ start, end }` แทน `selectedMonth`
- `src/components/charts/CategoryDonut.tsx` — เปลี่ยน filter
- `src/components/charts/TrendChart.tsx` — เปลี่ยน logic:
  - Day → 7 วันย้อนหลัง (รวมวันที่เลือก)
  - Week → 6 สัปดาห์ย้อนหลัง
  - Month → 6 เดือน (ของเดิม — ห้ามเปลี่ยน)
  - Year → 5 ปีย้อนหลัง
- `src/components/cards/GroupSummary.tsx` — 4 กลุ่มใช้ data ของ range

### Behavior
- Query Supabase ใช้ `txn_date >= start AND txn_date <= end`
- การ์ด 3 ใบบนสุด (รายรับ/รายจ่าย/คงเหลือ) คำนวณจาก range
- กราฟแนวโน้ม — แกน X เปลี่ยน label ตามโหมด:
  - Day → "จ" "อ" "พ" ... (ชื่อย่อวัน)
  - Week → "สัปดาห์ 47" หรือช่วงวันที่
  - Month → "พ.ย. 67" (ของเดิม)
  - Year → "2566" "2567" "2568"

### ห้ามแตะ
- **โหมด Month ทุก behavior ต้องเหมือนเดิมเป๊ะ** — verify ด้วย screenshot diff
- Custom component พื้นฐาน (dropdown, modal, day-picker)
- Database query สำหรับ Dashboard และหน้ารายการ — ใช้ของเดิมไม่กระทบ

### Test Gate
- [ ] `pnpm build` ผ่าน
- [ ] โหมด Month → กราฟ + การ์ดเหมือน Phase 2 เป๊ะ (เทียบ screenshot)
- [ ] โหมด Day → กราฟแนวโน้ม 7 วัน, โดนัทใช้ data วันเดียว
- [ ] โหมด Week → 6 สัปดาห์, ขอบเขตวันจันทร์–อาทิตย์ถูก
- [ ] โหมด Year → 5 ปี, แกน X เป็น พ.ศ.
- [ ] ResponsiveContainer ทุกตัวมี `height` ชัดเจน
- [ ] iPhone Safari ทดสอบทุกโหมด

---

## Phase 3.3 — "รายการในช่วงนี้" Section

**Vertical slice:** ส่วนใหม่ท้ายหน้า แสดงรายการ + โน้ต

### Files
- `src/components/RangeTransactionList.tsx` *(new)*
- `src/pages/Stats.tsx` — เพิ่ม section นี้หลังการ์ด 4 กลุ่ม

### Behavior
- Header: "รายการในช่วงนี้ (X รายการ)"
- เรียงล่าสุดก่อน (`txn_date desc, created_at desc`)
- แต่ละรายการแสดง:
  - ไอคอน + ชื่อหมวด (สี + icon ของหมวด)
  - จำนวนเงิน (เขียวสำหรับรายรับ, แดงสำหรับรายจ่าย)
  - **โน้ตของผู้ใช้** — แสดงเด่นชัด (font ใหญ่กว่าหมวด สีเข้ม)
  - วันที่ในรูปแบบ พ.ศ.
- คลิกที่ item → navigate ไปหน้าแก้ไข
- Empty state: "ไม่มีรายการในช่วงนี้" + ไอคอน
- Pagination แบบ "show more" — 20 รายการ/หน้า

### ห้ามแตะ
- หน้าแก้ไขรายการ — ใช้ route + props pattern เดิม
- Logic ของ transactions table — query เพิ่มเฉพาะที่หน้านี้

### Test Gate
- [ ] `pnpm build` ผ่าน
- [ ] รายการเรียงถูก (ล่าสุดก่อน)
- [ ] โน้ตแสดงเด่นชัด (อ่านง่าย ไม่ถูกซ่อน)
- [ ] คลิก → ไปหน้าแก้ไข พร้อมข้อมูลถูก
- [ ] Empty state แสดงเมื่อช่วงไม่มีรายการ
- [ ] Show more โหลดเพิ่มได้ถึงครบ
- [ ] iPhone Safari ทดสอบ tap targets + scroll

---

## Phase 3.4 — Polish + Edge Cases

**Vertical slice:** จัดการขอบเขตและ UX rough edges

### Tasks
- Loading state ตอน switch โหมด (skeleton, ไม่ใช่ blank)
- Disable ลูกศร "next" เมื่อ range อยู่ในอนาคต
- Handle empty range — กราฟต้องไม่ crash, แสดง empty state
- ตอน switch จาก Month → Day → ใช้วันสุดท้ายของเดือนที่เลือกไว้เป็น anchor (UX จำต่อ)
- Highlight ปุ่ม toggle ที่ active (สี coral)

### ห้ามแตะ
- Logic ของ phase 3.1-3.3 ที่ผ่านแล้ว
- Phase 2 ทั้งหมด

### Test Gate
- [ ] `pnpm build` ผ่าน
- [ ] Switch โหมดไป-มา → ไม่มี blank screen
- [ ] ปุ่ม next ใน "วันนี้" ถูก disable
- [ ] เดือนที่ไม่มีรายการ → empty state ไม่ crash
- [ ] รัน Vercel preview build จาก branch `phase3`
- [ ] ทดสอบ Safari iPhone จริง 1 รอบเต็ม ทุก feature
- [ ] รัน Lighthouse mobile — performance score ไม่ลดจาก main

---

## Risks & Rollback

### Risks
1. **Regression ใน Phase 2 (Month mode)** — risk สูง เพราะแก้ component เดิม
   - Mitigation: screenshot diff ก่อน-หลัง, test gate บังคับ
2. **Date-fns week boundary ผิด** — ISO vs locale week start
   - Mitigation: ระบุชัดใน plan + unit test สำหรับ `getRangeBounds`
3. **Performance ตอน Year mode** — query data ทั้งปี อาจช้า
   - Mitigation: Supabase index บน `(user_id, txn_date)` (มีอยู่แล้ว) + measure ใน 3.4

### Rollback
- ทำบน branch `phase3` — ถ้าพังให้ revert merge
- ไม่มี database migration → ไม่ต้อง rollback DB
- Feature ไม่ behind flag (เพราะเป็น additive — เปลี่ยน UI หน้าเดียว)

---

## Workflow

```
1. /codex-review plans/phase3-time-ranges.md
   → Codex audit plan (read-only)
   → กลับมา update plan ตาม finding

2. Codex implement:
   codex --full-auto -c model_reasoning_effort=medium
   > Implement plans/phase3-time-ranges.md phase by phase.
     หยุดที่ test gate ของแต่ละ phase ย่อย
     ห้ามแตะของ Phase 2 — verify ด้วย screenshot diff
     ทำบน branch phase3

3. /verify plans/phase3-time-ranges.md
   → Claude review diff vs plan (fresh session)
   → BLOCKED/WARNING/INFO

4. Loop: ถ้า BLOCKED > 0 → กลับ step 2 (max 3 รอบ)

5. APPROVED → merge phase3 → main
```

---

## Notes

- โน้ตของผู้ใช้ใน transactions table มีอยู่แล้ว field `note` — แค่แสดงให้เด่น ไม่ต้องเพิ่ม column
- date-fns ที่ใช้: `startOfWeek({ weekStartsOn: 1 })`, `endOfWeek`, `addDays/Weeks/Months/Years`, `startOf{Day,Month,Year}`
- ปฏิทินที่มีอยู่ใช้ พ.ศ. แล้ว — reuse pattern เดียวกันสำหรับ label
