# แผนเปลี่ยน Logo — keeptang

## Context

ตอนนี้ logo / brand mark ในแอป **ไม่ได้ใช้ logo จริง** — เป็นไอคอน `WalletCards` ของ lucide-react ใส่ไว้ในกล่อง `bg-[#F8D6C8]` แทน. ส่วน PWA / favicon ใช้ SVG ชั่วคราว (`public/keeptang-icon.svg`) ที่วาดเป็นตัว B สีคอรัล. user เตรียม logo จริงเป็น PNG ไว้แล้ว และอยากเปลี่ยนทุกจุดที่เป็นไปได้ + ใส่ logo ลง LoadingScreen ด้วย.

**เป้าหมาย:** เอา logo จริงไปแทนทุกจุดที่แสดง brand (favicon, PWA install icon, Login, Sidebar, LoadingScreen) โดยเตรียมไฟล์ครั้งเดียวให้ครบทุกขนาด/รูปแบบ

---

## Prerequisites (ก่อน implement)

- สร้าง branch ใหม่: `git checkout -b feat/logo`
- ย้าย uncommitted changes (icons ใน `public/icons/`, `public/keeptang-icon.png`, `plans/logo.md`) ไปด้วย
- **ห้าม implement บน main** (ตาม `AGENTS.md:214` — ทุก feature ต้อง branch แยก)
- หมายเหตุ: ขั้น implement จะย้าย `public/keeptang-icon.png` → `docs/assets/keeptang-icon-master.png` ด้วย (ดูข้อ 1.2)

---

## ส่วนที่ 1 — ไฟล์ Logo ที่ต้องเตรียม (PNG ล้วน)

Logo ต้นฉบับเป็น PNG squircle ที่มี background ครีม `#FBF3E7` ในตัวแล้ว — ใช้ PNG ได้ทุกจุดโดยไม่ต้อง transparent

### 1.1 ไฟล์ที่ต้องส่งมอบ (วางใน `public/icons/`)

| ไฟล์ | ขนาด | วิธีทำ |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | resize ต้นฉบับ — **ใช้เป็น brand asset หลัก** (favicon + UI ทุกจุด) |
| `public/icons/icon-512.png` | 512×512 | resize ต้นฉบับ — สำหรับ PWA install icon ใน manifest |
| `public/icons/maskable-512.png` | 512×512 | ดูข้อ 1.2 ด้านล่าง |

**Status:** user เตรียมไฟล์ครบแล้ว — ตรวจสอบขนาดจริงแล้ว 192/512/512 ตรง

**ทำไม UI/favicon ใช้ 192 ไม่ใช่ 512:** icon-192 = 35 KB / icon-512 = 233 KB. Display size สูงสุดในแอป = 80px (Login `h-20`) → 192 source เพียงพอ. 512 เก็บไว้เฉพาะ manifest install icon ที่ต้องการความละเอียดสูง

### 1.2 Master file — ห้ามอยู่ใน `public/`

ไฟล์ master 1254×1254 (`public/keeptang-icon.png`, 1.3 MB) **ต้องย้ายออกจาก `public/`** ก่อน build เพราะ:
- `vite.config.js:48` มี `globPatterns: ['**/*.png']` → workbox service worker จะ precache PNG ทุกไฟล์ใน `dist/`
- ไฟล์ใน `public/` ถูก copy เข้า `dist/` ตอน build
- ถึงไม่มี UI reference, SW ก็จะโหลด 1.3 MB ให้ผู้ใช้ทุกคน

**Action (รัน 5 ขั้นตอนตามลำดับ):**
```powershell
# 1. สร้าง folder
New-Item -ItemType Directory -Force docs/assets

# 2. ย้าย master — public/keeptang-icon.png ยัง untracked, git mv ใช้ไม่ได้
Move-Item public/keeptang-icon.png docs/assets/keeptang-icon-master.png

# 3. stage ปลายทาง (untracked file ที่ย้ายมา)
git add docs/assets/keeptang-icon-master.png

# 4. ลบ SVG เก่า — public/keeptang-icon.svg tracked อยู่, git rm จะ stage delete ให้เลย
git rm public/keeptang-icon.svg

# 5. Verify ทันที — public/keeptang-icon.png ต้องออก, .svg ต้อง staged delete
git status --short public/
# expect:
# - ไม่เจอ "?? public/keeptang-icon.png" (ย้ายไป docs/assets/ แล้ว — ไม่เป็น untracked)
# - เห็น "D  public/keeptang-icon.svg" (git rm staged delete — รอ commit)
```
- ห้ามรันก่อนสร้าง folder — Move-Item จะ fail ถ้า target ไม่มี
- เหตุที่ใช้ Move-Item ไม่ใช่ git mv: source file ยังไม่ tracked → ไม่มี rename history ให้รักษา

**วิธี resize อย่างเร็ว:** Canva / Squoosh / macOS Preview / Windows Paint → เปิดภาพ → resize เป็นขนาดที่ต้องการ → export PNG

### 1.3 Maskable icon — ต้องทำพิเศษ

Logo ต้นฉบับมีมุมโค้ง (squircle) — Android จะ crop ซ้ำอีกชั้น ทำให้ขอบโค้งซ้อนกัน ดูประหลาด

วิธีทำ `maskable-512.png`:
1. เปิด Canva (ฟรี) → สร้าง canvas 512×512
2. เติมพื้นหลังสีครีม `#FBF3E7` เต็มขอบ (ไม่โค้ง)
3. วาง logo ตรงกลาง ย่อให้ขนาดไม่เกิน **410px** (80% ของ 512)
4. Export → PNG

ทดสอบที่ maskable.app/editor ก่อน commit

---

## ส่วนที่ 2 — จุดที่ logo จะถูกวาง (5 จุด)

### A. PWA install icon (home screen มือถือ)
**ไฟล์:** `vite.config.js:20-44` (icons array)
- 3 ไฟล์ใน `public/icons/` มีอยู่แล้วและตรงตาม manifest → **ไม่ต้องแก้ icons array (line 20-38)**
- แต่ต้องลบ entry SVG (line 39-44) — ดูข้อ B

### B. Favicon + ลบ SVG fallback (แท็บ browser + manifest cleanup)
**ไฟล์:** `index.html:11` + `vite.config.js:10` + `vite.config.js:39-44`

1. `index.html:11` → เปลี่ยนเป็น:
   ```html
   <link rel="icon" href="/icons/icon-192.png" type="image/png">
   ```
2. `vite.config.js:10` → **ลบบรรทัด `includeAssets: ['keeptang-icon.svg'],` ทั้งบรรทัด** (ไม่ต้องเปลี่ยนเป็น PNG)

   เหตุผล: `includeAssets` ปัจจุบันชี้ `keeptang-icon.svg` ที่กำลังจะลบทิ้ง — ไม่มีประโยชน์อีก. manifest icons array (`vite.config.js:20-38`) + workbox `globPatterns` (`vite.config.js:48`) ดูแลการ precache PNG อยู่แล้ว ไม่ต้องการ `includeAssets` เพิ่ม

3. `vite.config.js:39-44` → **ลบ entry SVG ทั้ง object ออก** (PNG ครบ 3 ตัวแล้ว ไม่ต้องการ fallback SVG)
   ```js
   // ลบทั้ง block นี้ออก:
   {
     src: '/keeptang-icon.svg',
     sizes: 'any',
     type: 'image/svg+xml',
     purpose: 'any'
   }
   ```

### C. Apple touch icon (เพิ่มลง home screen iOS)
**ไฟล์:** `index.html:12` — ชี้ไปที่ `/icons/icon-192.png` (ไม่ต้องแก้)

> **Note:** iOS conventional size = 180×180. ใช้ 192×192 → iOS scale ลง 180 ได้สวย ยอมรับ scaling นี้ — ไม่เพิ่ม asset 180×180 แยก (ไม่คุ้ม maintenance สำหรับ project ขนาดนี้)

### D. Login screen (กล่อง logo เหนือฟอร์ม)
**ไฟล์:** `src/pages/Login.jsx:44-46`

```jsx
// ปัจจุบัน
<div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F8D6C8] text-coral">
  <WalletCards className="h-8 w-8" />
</div>

// หลังเปลี่ยน (logo มี background ในตัวแล้ว — ตัด div กล่องทิ้ง)
// alt="" เพราะมี <h1>keeptang</h1> ที่ Login.jsx:49 อยู่แล้ว — รูปเป็น decorative
<img src="/icons/icon-192.png" alt="" className="mx-auto h-20 w-20 rounded-2xl" />
```

- ลบ `import { WalletCards } from 'lucide-react'` (Login.jsx:3)
- logo มี squircle shape + cream bg ในตัวอยู่แล้ว ไม่ต้องใส่ `bg-[#F8D6C8]` อีก

### E. Sidebar (โลโก้บนซ้ายในจอคอม)
**ไฟล์:** `src/components/SidebarNav.jsx:14-22`

```jsx
// ปัจจุบัน
<span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F8D6C8] text-coral">
  <WalletCards className="h-6 w-6" />
</span>

// หลังเปลี่ยน
<img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-2xl" />
```

- ลบ `WalletCards` จาก import (SidebarNav.jsx:2) ถ้าไม่มีที่อื่นใช้

### F. LoadingScreen (จอโหลดตอนเปิดแอป)
**ไฟล์:** `src/components/LoadingScreen.jsx:5`

```jsx
// ปัจจุบัน
<div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-coral" />

// หลังเปลี่ยน
<img src="/icons/icon-192.png" alt="" className="mx-auto h-16 w-16 animate-pulse rounded-2xl" />
```

ใช้ `animate-pulse` ของ Tailwind ที่มีอยู่แล้ว — ไม่ต้องเขียน CSS เพิ่ม

---

## ห้ามแตะ

- `vite.config.js:11-19` (manifest metadata: name, short_name, theme_color, background_color, display, start_url, lang)
- `vite.config.js:20-38` (icons array 3 entry PNG — มีอยู่แล้วถูกต้อง)
- `vite.config.js:47-49` (workbox globPatterns)
- `vite.config.js:52-78` (build / rollupOptions / manualChunks)
- `index.html:12` (apple-touch-icon path คงเดิม `/icons/icon-192.png`)
- `index.html:5-10, 13` (viewport, theme-color, description, mobile-web-app metadata, title)
- `BottomNav.jsx`, `Header.jsx`, `AppShell.jsx` — ไม่มี logo อยู่แล้ว
- หน้า Dashboard / Stats / Transactions / Settings — ไม่มี brand mark
- `public/icons/*.png` ทั้ง 3 ไฟล์ — มีอยู่แล้วถูกต้อง ห้ามเขียนทับ
- `docs/assets/keeptang-icon-master.png` (1254×1254, ย้ายมาจาก `public/keeptang-icon.png`) — master source ห้ามแก้ ห้ามลบ
- `vite.config.js:48` (workbox globPatterns) — คงเดิม master ที่ย้ายไป `docs/` ก็จะไม่โดน precache เพราะอยู่นอก `dist/`

---

## Verification

1. ไฟล์ PNG ครบใน `public/icons/` (192, 512, maskable-512) — user เตรียมแล้ว ตรวจสอบขนาดแล้วถูกต้อง
2. **Master ย้ายแล้ว ไม่อยู่ใน `public/`:**
   - `docs/assets/keeptang-icon-master.png` มีอยู่
   - `public/keeptang-icon.png` ถูกลบ/ย้ายแล้ว
   - `public/keeptang-icon.svg` ถูกลบแล้ว
3. **ไม่มี reference เก่าหลงเหลือใน codebase** (รวม `public/`):
   ```bash
   rg -n "keeptang-icon" src index.html vite.config.js public
   # expect: 0 matches
   ```
4. `npm run build` — pass ไม่มี warning เรื่อง asset
5. `npm run dev` แล้วเช็คใน Chrome:
   - แท็บ browser: favicon เป็น logo ใหม่ (`/icons/icon-192.png`)
   - Login (`/login`): กล่อง logo เหนือคำว่า "keeptang" (alt="" — SR ไม่อ่านซ้ำ)
   - Sidebar (จอ ≥768px): logo ตรงมุมซ้ายบน
   - กด refresh ตอนยังไม่ login: LoadingScreen แสดง logo กระพริบ
6. iPhone Safari (จริง):
   - เปิดเว็บ → favicon ถูกที่แท็บ
   - "เพิ่มไปยังหน้าจอหลัก" → icon บน home screen เป็น logo ใหม่ (192→180 scale)
   - เปิด PWA จาก home screen → icon ตอนเปิดถูกต้อง
7. Android Chrome (ถ้ามี):
   - Install PWA → ดู icon บน home screen ว่า maskable ไม่ถูก crop ตัด logo
8. ทดสอบ maskable.app/editor โดยอัปโหลด `maskable-512.png` — ดูพรีวิวว่า logo ไม่ชิดขอบ
9. Service worker precache — ตรวจ `dist/sw.js` หรือ DevTools > Application > Cache Storage ว่าไม่มี `keeptang-icon.png` 1.3 MB อยู่ใน precache list
10. **Pre-commit staging checklist** — รัน `git status` แล้วต้องเห็นครบทุกข้อนี้ก่อน commit:

    **Added (new files):**
    - `docs/assets/keeptang-icon-master.png` (ย้ายมาจาก public/)
    - `plans/logo.md` (untracked → ต้อง git add)

    **Modified:**
    - `index.html` (favicon path → /icons/icon-192.png)
    - `vite.config.js` (ลบ includeAssets + ลบ SVG entry)
    - `src/pages/Login.jsx` (WalletCards → img)
    - `src/components/SidebarNav.jsx` (WalletCards → img)
    - `src/components/LoadingScreen.jsx` (div → img)
    - `public/icons/icon-192.png` (replaced)
    - `public/icons/icon-512.png` (replaced)
    - `public/icons/maskable-512.png` (replaced)

    **Deleted (staged via git rm):**
    - `public/keeptang-icon.svg`

    **ต้องไม่เห็น (ห้ามหลุด):**
    - `public/keeptang-icon.png` ← ย้ายไป docs/assets/ แล้ว ถ้ายังเห็นที่นี่ = build จะมี 1.3 MB หลุดเข้า dist
    - ไฟล์อื่นนอก scope (เช่น node_modules, .env, build artifact)
