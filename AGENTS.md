# keeptang — Project Rules

> Universal instructions ที่ทั้ง Claude Code และ Codex CLI อ่าน
> ไฟล์นี้คือ "ความจริงเดียว" ของโปรเจกต์

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

## Stack

- **Frontend:** React (Vite) + Tailwind
- **Backend:** Supabase (Auth + Postgres + RLS)
- **Charts:** recharts
- **Date:** date-fns + react-day-picker
- **Icons:** lucide-react
- **Deploy:** Vercel (prod = main branch, preview = branches อื่น)
- **Auth keys:** Supabase publishable key รุ่นใหม่ `sb_publishable_...` (ไม่ใช่ JWT anon เก่า)

---

## Design System — "อบอุ่น เป็นมิตร" (Style B)

- พื้นครีม `#FBF3E7`
- สีหลัก coral `#D85A30`
- รายรับเขียว `#1D9E75`
- รายจ่ายแดงอมชมพู
- การ์ดมุมโค้งบนพื้นพาสเทล
- ฟอนต์ Noto Sans Thai / IBM Plex Sans Thai

---

## Data Model (Supabase)

3 ตารางหลัก ทุกตารางเปิด RLS แล้ว:

```
categories   id, user_id, name, icon, color,
             type(income/expense), grp(need/want/saving/reward),
             sort_order

transactions id, user_id, amount, type, category_id, note,
             txn_date(เก็บ ค.ศ.), created_at

auth.users   จัดการโดย Supabase Auth
```

**กฎเหล็กของวันที่:** ปฏิทินแสดงผลเป็น **พ.ศ.** แต่ database เก็บเป็น **ค.ศ.** เสมอ
ห้ามเก็บ พ.ศ. ลง DB เด็ดขาด

---

## Pages

1. **Login/Register** — Supabase Auth email/password
2. **Dashboard** — เลือกเดือน + การ์ดสรุป 3 ใบ + รายการล่าสุด
3. **เพิ่ม/แก้รายการ** — input `inputmode="decimal"` + ตารางเลือกหมวด + react-day-picker (พ.ศ.)
4. **รายการทั้งหมด** — กรอง 2 ขั้น (type → category) + จัดกลุ่มตามวัน
5. **สถิติ** — เลือกเดือน + โดนัทแยกหมวด + กราฟแนวโน้ม 6 เดือน + การ์ดสรุป 4 กลุ่ม
6. **ตั้งค่า** — จัดการหมวดหมู่ + custom dropdown + logout

---

## Layout

- **มือถือ (<768px):** คอลัมน์เดียว + bottom nav (หน้าแรก/รายการ/สถิติ/ตั้งค่า) + FAB "+" มุมขวาล่าง
- **คอม (≥768px):** sidebar ซ้าย + เนื้อหา `max-w-5xl` กึ่งกลาง + กราฟ 2 คอลัมน์ + ปุ่ม "+ เพิ่มรายการ" ใน sidebar

---

## Custom Components (ห้ามรื้อ)

ของพวกนี้สร้างเองเพราะ native มีปัญหาบน iOS Safari:

- **Custom dropdown** — แทน `<select>` ทุกจุด รองรับไอคอน+สีในตัวเลือก
- **react-day-picker** — ป๊อปอัป พ.ศ. ภาษาไทย ธีม coral
- **Modal ยืนยัน** — แทน `window.confirm`/`alert`
- **ตารางเลือกไอคอน + วงเลือกสี** ในหน้าเพิ่ม/แก้หมวดหมู่

ห้ามเปลี่ยนกลับเป็น `<select>`, `<input type="date">`, หรือ browser dialog เด็ดขาด

---

## Boundaries

### Always
- ทำบน **branch แยก** ทุก feature ใหม่ — รอ Vercel preview ก่อน merge
- เทสต์บน **iPhone Safari จริง** ก่อน merge (ไม่พอที่จะเทสต์ Chrome อย่างเดียว)
- รัน build ก่อนบอกว่า "phase complete"
- ใช้ component custom ที่มีอยู่แล้ว แทน native ที่มีปัญหา

### Ask First
- เพิ่ม dependency ใหม่ (เคยเพิ่ม recharts, react-day-picker, date-fns, lucide-react)
- แก้ schema database
- แก้ไฟล์นอก scope ของ phase ปัจจุบัน
- เปลี่ยน design token (สี ฟอนต์ spacing)

### Never
- เก็บ พ.ศ. ลง database
- รื้อ custom component กลับเป็น native
- แก้ของ phase เก่าที่ทำงานได้แล้ว — ระบุชัดทุกรอบว่า "ห้ามแตะอะไร"
- รัน `git push --force` หรือลบ migration ที่ deploy แล้ว
- แก้ `.env*` หรือ Supabase keys

---

## Lessons Learned (อย่าทำผิดซ้ำ)

1. **iOS Safari ดื้อ** — `<input type="date">`, `<select>` มี style ฝังในตัว → ใช้ custom component
2. **ทดสอบ Chrome ไม่พอ** — ต้องเทสต์ iPhone Safari จริงด้วย
3. **Timezone ปนปั่น** — ระวังการแปลง พ.ศ./ค.ศ. และคำนวณช่วงสัปดาห์/เดือน
4. **Codex ใช้ `space-between` มั่ว** — ทำให้เนื้อหาแยกห่างเพื่อ "สูงเท่ากัน" → ใช้ `min-height` แทน
5. **Codex หลุดเมื่อแก้ของเก่า** — ระบุชัดทุกรอบว่าอะไรห้ามแตะ และให้ทำบน branch แยก
6. **ResponsiveContainer ของ recharts ต้องมี height ชัด** — ไม่งั้นล่ม
7. **แกน Y กราฟต้องมี margin/width พอ** — ไม่ให้แท่งทับ

---

## Phase Status

- ✅ **Phase 1** — บันทึก/แก้/ลบ + auth + RLS *(แก้ 3 รอบจนนิ่ง)*
- ✅ **Phase 2** — หน้าสถิติ: โดนัท + กราฟแนวโน้ม + 4 กลุ่มรายจ่าย
- 🔥 **Phase 3** — สรุปช่วงเวลา Day/Week/Month/Year + รายการพร้อมโน้ต *(in progress)*
- ⏳ **Phase 4** — งบประมาณ (Budget)
- ⏳ **Phase 5** — ผัง Flow (Sankey diagram)

---

## Commands

```bash
pnpm dev        # dev server
pnpm build      # production build (รันก่อน merge)
pnpm preview    # preview build local
```

## Branch Strategy

```
main              ← production (Vercel auto-deploy)
phase3            ← work in progress (Vercel preview)
hotfix/*          ← bug fixes
```
