# keeptang — เว็บบันทึกรายรับรายจ่าย (Phase 1)

> สเปกงานสำหรับ AI coding tool (Codex, Claude Code ฯลฯ)
> คัดลอกเนื้อหาทั้งไฟล์นี้ไปวางในเครื่องมือ หรือวางไฟล์ไว้ในโฟลเดอร์โปรเจกต์แล้วสั่งให้อ่าน
> ถ้ายังไม่มีโปรเจกต์ Supabase ให้แจ้งผู้ใช้ขั้นตอนสมัคร แล้วใส่ค่า key เป็น placeholder ไว้ใน `.env`
>
> **Workflow:** Codex เป็นตัวเขียนโค้ด — Claude Code เป็นตัวตรวจ (ดูส่วน "เกณฑ์การตรวจโค้ด" ท้ายไฟล์)

---

## เป้าหมายของโปรเจกต์

สร้างเว็บแอปชื่อ **keeptang** สำหรับบันทึก **รายรับรายจ่ายประจำวันจริง** แบ่งตามหมวดหมู่ ใช้งานบนมือถือเป็นหลัก (mobile-first, PWA)
มีระบบบัญชีผู้ใช้เพื่อ sync ข้อมูลข้ามอุปกรณ์ สกุลเงินบาท (฿) อย่างเดียว ภาษาไทย

- **ชื่อแบรนด์ที่โชว์ในแอป:** keeptang (แสดงบนหน้า Login และ manifest ของ PWA)
- **ชื่อโฟลเดอร์โปรเจกต์:** `keeptang`

**ขอบเขต Phase 1 นี้:** ระบบ login + บันทึก/แก้/ลบรายการ + หมวดหมู่ + หน้าสรุปยอด + เลือกช่วงเวลา
**ยังไม่ทำใน Phase 1:** กราฟ, งบประมาณ, รายการเกิดซ้ำ, หลายกระเป๋าเงิน, การใช้งาน offline เต็มรูปแบบ (ทำเป็น PWA ติดตั้งได้ก็พอ)

---

## Tech stack

- **React 18 + Vite** (JavaScript, ไม่ต้องใช้ TypeScript)
- **Tailwind CSS** สำหรับ styling
- **React Router** สำหรับ routing
- **Supabase** — Auth (email/password) + Postgres database (`@supabase/supabase-js`)
- **lucide-react** สำหรับไอคอน
- **date-fns** สำหรับจัดการวันที่ (รองรับ locale ไทย)
- **vite-plugin-pwa** ทำให้ติดตั้งบนมือถือได้ (manifest + service worker พื้นฐาน)
- เป้าหมาย deploy: Vercel

ตั้งค่า Supabase ผ่าน environment variables ใน `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## โครงสร้างโฟลเดอร์ที่ต้องการ

```
src/
  lib/supabase.js          # สร้าง supabase client
  contexts/AuthContext.jsx # จัดการ session ผู้ใช้
  hooks/                   # custom hooks (useTransactions, useCategories)
  components/              # UI components ที่ใช้ซ้ำ
  pages/
    Login.jsx
    Dashboard.jsx
    AddTransaction.jsx
    Transactions.jsx
    Settings.jsx
  App.jsx                  # routing + protected routes
  main.jsx
```

---

## ฐานข้อมูล (Supabase) — รัน SQL นี้ใน SQL Editor

```sql
-- ตารางหมวดหมู่
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default 'coral',
  type text not null check (type in ('income','expense')),
  grp text not null default 'need' check (grp in ('need','want','saving','reward')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ตารางรายการรายรับรายจ่าย
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income','expense')),
  category_id uuid references categories(id) on delete set null,
  note text,
  txn_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions(user_id, txn_date desc);

-- เปิด Row Level Security
alter table categories enable row level security;
alter table transactions enable row level security;

-- policy: ผู้ใช้เห็น/แก้ได้เฉพาะข้อมูลตัวเอง
create policy "own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**หมวดหมู่เริ่มต้น:** เมื่อผู้ใช้สมัครใหม่และยังไม่มีหมวดหมู่เลย ให้ฝั่ง client insert หมวดหมู่ตั้งต้นเหล่านี้ให้อัตโนมัติ:

รายจ่าย: อาหาร (need), เดินทาง (need), ช้อปปิ้ง (want), บิล/ค่าน้ำค่าไฟ (need), ความบันเทิง (want), สุขภาพ (need), เงินออม/ลงทุน (saving), ของขวัญ/รางวัลตัวเอง (reward), อื่นๆ (need)

รายรับ: เงินเดือน, งานเสริม, โบนัส, อื่นๆ

แต่ละหมวดกำหนด `icon` (ชื่อไอคอน lucide) และ `color` ให้เหมาะสม

---

## ดีไซน์ — สไตล์ "อบอุ่น เป็นมิตร" (Style B)

อารมณ์: การ์ดมนๆ สีพาสเทล ดูน่าใช้ ไม่ทางการเกินไป มุมโค้งเยอะ

**โทนสี (ใส่ใน tailwind.config หรือใช้เป็นค่าอ้างอิง):**
- พื้นหลังแอป: ครีม `#FBF3E7`
- สีหลัก / ปุ่มเด่น: coral `#D85A30`
- รายรับ (บวก): เขียว `#1D9E75` บนพื้น `#E1F5EE`
- รายจ่าย (ลบ): แดงอมชมพู `#993C1D` บนพื้น `#FBEAF0`
- การ์ด: พื้นขาว `#FFFFFF` มุมโค้ง 14–16px
- ชิปไอคอนหมวดหมู่: พื้นพาสเทล (อำพัน/ฟ้า/ชมพู/เขียวอ่อน) ตามสีของหมวด

**ฟอนต์:** ใช้ฟอนต์ที่รองรับภาษาไทยและดูเป็นมิตร เช่น `IBM Plex Sans Thai` หรือ `Noto Sans Thai` (โหลดจาก Google Fonts)

**หลักการ:** มุมโค้งมาก, การ์ดมีพื้นที่หายใจ, ปุ่มใหญ่กดง่าย, แสดงเงินบาทด้วยรูปแบบ `฿1,234` (มี comma คั่นหลักพัน), ไม่มี gradient

---

## หน้าจอที่ต้องสร้าง (Phase 1)

### 1. หน้า Login / Register (`Login.jsx`)
- เข้าสู่ระบบและสมัครสมาชิกด้วย email + password ผ่าน Supabase Auth
- สลับโหมด เข้าสู่ระบบ / สมัคร ในหน้าเดียว
- ตรวจสอบ input เบื้องต้น, แสดง error ถ้า login ไม่ผ่าน
- เมื่อ login สำเร็จ พาไปหน้า Dashboard

### 2. หน้าแรก / Dashboard (`Dashboard.jsx`)
- ตัวเลือกเดือน (เลื่อนเดือนก่อนหน้า/ถัดไปได้) — ค่าเริ่มต้นเดือนปัจจุบัน
- การ์ดสรุป 3 ค่า ของเดือนที่เลือก: **รายรับรวม**, **รายจ่ายรวม**, **เงินคงเหลือ** (รายรับ − รายจ่าย) — ตามดีไซน์ mockup แบบ B
- รายการ "วันนี้" และ "ล่าสุด" จัดกลุ่มตามวันที่ แต่ละแถวมี: ไอคอนหมวด, ชื่อรายการ/โน้ต, ชื่อหมวด, จำนวนเงิน (รายรับสีเขียว / รายจ่ายสีแดง)
- ปุ่มลอย (+) มุมขวาล่าง สีหลัก กดแล้วไปหน้าเพิ่มรายการ
- มีแถบเมนูล่าง (bottom nav): หน้าแรก / รายการ / ตั้งค่า

### 3. หน้าเพิ่ม/แก้รายการ (`AddTransaction.jsx`)
หน้านี้ต้องเร็วที่สุด — เป้าหมายกดเพิ่มเสร็จใน ~5 วินาที
- ปุ่มสลับ **รายจ่าย / รายรับ** ด้านบน
- ช่องจำนวนเงินตัวใหญ่ พร้อม **แป้นตัวเลขในหน้า** (numpad ของแอปเอง ไม่ต้องพึ่ง keyboard มือถือ)
- เลือกหมวดหมู่แบบ grid ไอคอน แตะครั้งเดียว (กรองตามชนิดรายรับ/รายจ่ายที่เลือก)
- เลือกวันที่ (ค่าเริ่มต้น = วันนี้)
- ช่องโน้ต (ไม่บังคับ)
- ปุ่มบันทึก — insert ลง Supabase แล้วกลับหน้า Dashboard
- รองรับโหมดแก้ไข: ถ้าเปิดหน้านี้พร้อม id รายการเดิม ให้โหลดค่ามาใส่และเป็นการ update

### 4. หน้ารายการทั้งหมด (`Transactions.jsx`)
- แสดงรายการทั้งหมด จัดกลุ่มตามวันที่ (ใหม่สุดก่อน) พร้อมยอดรวมรายรับ/รายจ่ายของแต่ละวัน
- กรองได้: ตามเดือน และ ตามหมวดหมู่
- แตะรายการเพื่อแก้ไข, ปัด/ปุ่มเพื่อลบ (มียืนยันก่อนลบ)

### 5. หน้าตั้งค่า (`Settings.jsx`)
- จัดการหมวดหมู่: ดูรายการ, เพิ่ม, แก้ชื่อ/ไอคอน/สี, ลบ (แยกแท็บรายรับ/รายจ่าย)
- แสดง email ผู้ใช้ที่ login อยู่
- ปุ่มออกจากระบบ

---

## ฟังก์ชันที่ต้องทำงานได้ (Acceptance criteria)

- [ ] สมัคร + login + logout ได้ และ session คงอยู่เมื่อรีเฟรชหน้า
- [ ] หน้าที่ต้อง login ถูกป้องกัน (protected route) — ยังไม่ login เด้งไปหน้า Login
- [ ] ผู้ใช้ใหม่ได้หมวดหมู่ตั้งต้นอัตโนมัติ
- [ ] เพิ่ม / แก้ / ลบ รายการได้ และข้อมูลบันทึกลง Supabase จริง
- [ ] Dashboard คำนวณยอดรวมรายรับ/รายจ่าย/คงเหลือของเดือนที่เลือกถูกต้อง
- [ ] เปลี่ยนเดือนแล้วตัวเลขและรายการอัปเดตตาม
- [ ] กรองรายการตามหมวด/เดือนได้
- [ ] จัดการหมวดหมู่ (เพิ่ม/แก้/ลบ) ได้
- [ ] ข้อมูลแยกตามผู้ใช้ (RLS ทำงาน) — login คนละบัญชีเห็นข้อมูลไม่ปนกัน
- [ ] ใช้งานได้ดีบนจอมือถือ และติดตั้งเป็น PWA ได้
- [ ] จำนวนเงินทุกที่แสดงรูปแบบ `฿1,234`

---

## ลำดับงานที่แนะนำ

1. ตั้งโปรเจกต์ Vite + React + Tailwind + React Router + dependencies ทั้งหมด
2. ตั้งค่า `.env` และสร้าง `lib/supabase.js`
3. ทำ `AuthContext` + หน้า Login + protected routing
4. (แจ้งให้ผู้ใช้รัน SQL schema ด้านบนใน Supabase)
5. ทำ hooks ดึง/เขียนข้อมูล (`useCategories`, `useTransactions`) + logic สร้างหมวดหมู่ตั้งต้น
6. ทำหน้า Dashboard + bottom nav
7. ทำหน้าเพิ่ม/แก้รายการ (numpad + เลือกหมวด)
8. ทำหน้ารายการทั้งหมด + ตัวกรอง
9. ทำหน้าตั้งค่า + จัดการหมวดหมู่
10. ใส่ vite-plugin-pwa (manifest ตั้งชื่อแอป "keeptang", ไอคอน) + เก็บงานดีไซน์ให้ตรงสไตล์ B

ทำให้แต่ละขั้นรันได้จริงก่อนค่อยไปขั้นถัดไป และอธิบายสั้นๆ ว่าแต่ละไฟล์ทำอะไร

---

## เกณฑ์การตรวจโค้ด (สำหรับ Claude Code)

> ส่วนนี้ใช้ตอนรีวิวโค้ดที่ Codex เขียนเสร็จแล้ว
> คำสั่งที่แนะนำ: "อ่านไฟล์สเปกนี้ แล้วรีวิวโค้ดทั้งโปรเจกต์เทียบกับเกณฑ์ด้านล่าง — รายงานจุดที่ขาด/ผิด/เสี่ยงเป็นรายการ จัดลำดับความสำคัญ แต่ยังไม่ต้องแก้ รอผู้ใช้ตัดสินใจก่อน"

ตรวจ 6 ด้านนี้:

1. **ตรงสเปกไหม** — มีครบทั้ง 5 หน้าจอ, ทำงานได้ตาม Acceptance criteria ทุกข้อ, ไม่มีหน้าจอหรือฟังก์ชันที่ขาดหาย
2. **ความปลอดภัย** — ไม่มี key หรือความลับ hardcode ในโค้ด (ต้องอยู่ใน `.env` เท่านั้น), RLS policy ครบ, ไม่เผลอใช้ service role key ฝั่ง client
3. **ความถูกต้องของข้อมูล** — การคำนวณยอดรวมรายรับ/รายจ่าย/คงเหลือถูกต้อง, การกรองตามเดือน/หมวดถูกต้อง, จัดการ timezone ของวันที่ไม่ให้เพี้ยน
4. **การจัดการ error และ edge case** — มี loading/error state, จัดการกรณีไม่มีข้อมูล (empty state), กันการกดบันทึกซ้ำ, ตรวจ input (จำนวนเงินต้องมากกว่า 0)
5. **คุณภาพโค้ด** — ไม่มีโค้ดซ้ำซ้อนเกินจำเป็น, แยก component สมเหตุสมผล, ไม่มี console.log ตกค้าง, ไม่มี dependency ที่ไม่ได้ใช้
6. **ดีไซน์และ UX** — ตรงสไตล์ B (สี/มุมโค้ง/ฟอนต์ตามที่ระบุ), ใช้งานบนจอมือถือได้จริง, แสดงเงินรูปแบบ `฿1,234` ทุกที่, ติดตั้งเป็น PWA ได้

รูปแบบรายงานที่ต้องการ: แยกเป็น 🔴 ต้องแก้ก่อนใช้ / 🟡 ควรแก้ / 🟢 ข้อเสนอแนะ — แต่ละข้อบอกไฟล์และบรรทัดที่เกี่ยวข้อง
