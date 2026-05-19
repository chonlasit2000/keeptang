# keeptang

เว็บแอปบันทึกรายรับรายจ่ายภาษาไทยแบบ mobile-first สำหรับ Phase 1 ใช้ React 18, Vite, Tailwind CSS, Supabase Auth/Postgres และ PWA manifest พื้นฐาน

## เริ่มต้น

1. ติดตั้ง Node.js 18+ และ dependencies

```bash
npm install
```

2. ตั้งค่า Supabase ใน `.env`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. เปิด Supabase SQL Editor แล้วรันไฟล์ `supabase/schema.sql`

   ไฟล์นี้มี trigger บน `auth.users` เพื่อสร้างหมวดหมู่ตั้งต้นให้ผู้ใช้ใหม่จากฝั่งฐานข้อมูล จึงทำงานได้แม้ผู้ใช้สมัครและยืนยันอีเมลคนละอุปกรณ์

4. รันแอป

```bash
npm run dev
```

## คำสั่งหลัก

- `npm run dev` รัน development server
- `npm run build` build สำหรับ deploy
- `npm run preview` preview ไฟล์ build
- `npm run lint` ตรวจ lint

## โครงสร้าง

- `src/contexts/AuthContext.jsx` จัดการ session และ auth actions
- `src/hooks/` ดึง/เขียนข้อมูล Supabase
- `src/pages/` หน้า Login, Dashboard, Add/Edit, Transactions, Settings
- `src/components/` component UI ที่ใช้ซ้ำ
- `supabase/schema.sql` schema, index และ RLS policies

## หมายเหตุ Supabase

ถ้าเคยรัน schema เวอร์ชันเก่าก่อนหน้านี้ ให้รัน `supabase/schema.sql` ซ้ำอีกครั้งเพื่อเพิ่ม trigger สร้างหมวดหมู่ตั้งต้น และปรับ default icon จาก `circle` เป็น `Circle`
