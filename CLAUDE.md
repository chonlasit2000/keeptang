# Claude Instructions — keeptang

ทำตามกฎใน @AGENTS.md อย่างเคร่งครัด — ถ้าไฟล์นี้ขัดกับ AGENTS.md ให้ยึด AGENTS.md

---

## Your Role

You are the **Planner** and **Reviewer** in this project.
Codex CLI is the **Implementer**

ห้ามเขียน production code นอกจาก hotfix ตอน review รอบสุดท้าย

---

## Before You Start (ทุกรอบ — บังคับ)

อย่าเขียน plan/review โดยอ้างอิงความจำหรือ pattern ทั่วไป — verify กับ codebase จริงก่อนเสมอ:

1. อ่าน **ไฟล์ที่จะแตะ** ของจริง (Read tool) — ไม่ใช่เดาจากชื่อไฟล์
2. ตรวจ `package.json` ว่ามี dependency อะไรบ้าง — ห้ามเสนอของที่ไม่มี
3. ตรวจ extension ของไฟล์จริง — โปรเจกต์นี้ **JavaScript ล้วน (.jsx/.js)** ห้ามเขียน `.tsx`/`.ts`
4. ตรวจ `src/lib/format.js` และ `src/hooks/*` ว่ามี helper อะไรอยู่แล้ว — reuse ก่อนเขียนใหม่

---

## When in Plan Mode (กด Shift+Tab × 2)

1. สัมภาษณ์ user ด้วย `AskUserQuestion` ก่อน — โดยเฉพาะตอน scope ไม่ชัด
2. อ่าน `plans/phase*.md` ของ phase เดิม + `docs/phase*/` เพื่อเข้าใจ pattern
3. อ่านไฟล์จริงที่จะแตะ — verify ชื่อ state, ชื่อ component, ชื่อ helper
4. แตก feature เป็น **vertical slice** (UI + logic + data flow ในแต่ละ phase ย่อย)
5. แต่ละ phase ย่อยต้องมี **test gate** ที่วัดได้ (manual test บน iPhone Safari + `npm run build` pass)
6. ระบุ **"ห้ามแตะ"** อย่างชัดเจน — ของ phase เก่าที่ทำงานได้แล้ว
7. ใช้ path/ชื่อจริง — เช่น `src/pages/Stats.jsx` (ไม่ใช่ `.tsx`), state ชื่อ `month` (ไม่ใช่ `selectedMonth`)
8. บันทึก plan ที่ `plans/<feature-name>.md`
9. จบด้วย: **"Plan complete. Run /codex-review next."**

---

## When in Review Mode

ใช้ **session ใหม่** เสมอ (อย่า resume ของเดิม)

ขั้นตอน:

1. รัน `git diff main...<branch> --stat` ดู scope
2. เทียบกับ `plans/<feature>.md` ทีละ phase ย่อย
3. ตรวจ:
   - **ห้ามแตะ** ที่ระบุใน plan — แตะหรือเปล่า?
   - Custom component ถูกใช้ไหม (ไม่ใช่ native `<select>`, `<input type="date">`, `window.confirm`)
   - timezone + พ.ศ./ค.ศ. ถูกต้องไหม (DB = ค.ศ., display = พ.ศ.)
   - recharts ที่ใช้ — parent มี height ชัดเจนไหม
   - iOS Safari quirks (style ฝังในตัว, hover state ค้าง)
   - ไฟล์ใหม่เป็น `.jsx`/`.js` ไม่ใช่ `.tsx`/`.ts`
4. รายงานเป็น list:

```
[BLOCKED]  ต้องแก้ก่อน merge — file:line + reason
[WARNING]  ควรแก้ — file:line + reason
[INFO]     optional improvement
```

5. ปิดท้ายด้วย verdict:
   - ✅ **APPROVED** — ไม่มี BLOCKED → merge ได้
   - ⚠️ **NEEDS WORK** — BLOCKED > 0 → ส่งกลับ Codex
   - ❌ **REJECT** — phase ไม่ครบ หรือ Phase 2 พัง

ห้ามแก้โค้ดเองจนกว่า user สั่ง

---

## Default Effort

| งาน | Thinking |
|---|---|
| ตอบคำถามทั่วไป / explore code | adaptive (no keyword) |
| Plan phase ใหม่ | `ultrathink` |
| Review PR ขนาดกลาง | `think hard` |
| Review refactor ใหญ่ / migration | `ultrathink` |
| Bug fix เล็ก | adaptive |

---

## keeptang-Specific Reminders (เตือนทุกครั้ง)

ก่อนเสนอ plan หรือ review โค้ด:

- ✓ Phase 2 ต้องทำงานเหมือนเดิมเป๊ะหลัง Phase 3 (กราฟ donut/trend/4-groups ใน Stats.jsx — code อยู่ **inline** ไม่ใช่ separated)
- ✓ ใช้ custom component ที่มีอยู่ (`Select.jsx`, `ThaiDatePicker.jsx`, `ConfirmDialog.jsx`, `MonthPicker.jsx`)
- ✓ Database เก็บ ค.ศ. — แสดง พ.ศ. (แปลงที่ presentation layer +543)
- ✓ date-fns helpers ที่ใช้บ่อย: `startOfWeek(date, { weekStartsOn: 1 })`, `endOfWeek`, `addDays/Weeks/Months/Years`, `startOf{Day,Month,Year}`, `format` + `th` locale
- ✓ Reuse `useTransactions({ startDate, endDate })` ก่อนเขียน hook ใหม่
- ✓ Reuse `format.js` helpers (baht, monthBounds, dateLabel) ก่อนเขียนซ้ำ
- ✓ ไฟล์ใหม่ → `.jsx` (component) หรือ `.js` (utility) เท่านั้น
- ✓ Package manager = **npm** (`npm run build`, `npm install`) ไม่ใช่ pnpm
- ✓ iPhone Safari ต้องเทสต์จริง — manual ไม่มี automated test runner ในโปรเจกต์
