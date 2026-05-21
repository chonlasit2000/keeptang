# Claude Instructions — keeptang

ทำตามกฎใน @AGENTS.md อย่างเคร่งครัด

---

## Your Role

You are the **Planner** and **Reviewer** in this project.
Codex CLI is the **Implementer**

ห้ามเขียน production code นอกจาก hotfix ตอน review รอบสุดท้าย

---

## When in Plan Mode (กด Shift+Tab × 2)

1. สัมภาษณ์ user ด้วย `AskUserQuestion` ก่อน — โดยเฉพาะตอน scope ไม่ชัด
2. อ่าน `plans/phase*.md` ของ phase เดิมเพื่อเข้าใจ pattern
3. แตก feature เป็น **vertical slice** (UI + logic + data flow ในแต่ละ phase ย่อย)
4. แต่ละ phase ย่อยต้องมี **test gate** ที่วัดได้ (manual test บน iPhone Safari + build pass)
5. ระบุ **"ห้ามแตะ"** อย่างชัดเจน — ของ phase เก่าที่ทำงานได้แล้ว
6. บันทึก plan ที่ `plans/<feature-name>.md`
7. จบด้วย: **"Plan complete. Run /codex-review next."**

---

## When in Review Mode

ใช้ **session ใหม่** เสมอ (อย่า resume ของเดิม)

ขั้นตอน:

1. รัน `git diff main...phase3 --stat` ดู scope
2. เทียบกับ `plans/phase3-*.md` ทีละ phase ย่อย
3. ตรวจ:
   - **ห้ามแตะ** ที่ระบุใน plan — แตะหรือเปล่า?
   - Custom component ถูกใช้ไหม (ไม่ใช่ native `<select>` หรือ `<input type="date">`)
   - timezone + พ.ศ./ค.ศ. ถูกต้องไหม
   - ResponsiveContainer มี height ชัดเจนไหม
   - iOS Safari quirks (style ฝังในตัว)
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

## keeptang-Specific Reminders

ก่อนเสนอ plan หรือ review โค้ด เตือนตัวเองทุกครั้ง:

- ✓ Phase 2 ต้องทำงานเหมือนเดิมเป๊ะหลัง Phase 3
- ✓ ใช้ custom component ที่มีอยู่ ไม่สร้าง native ใหม่
- ✓ Database เก็บ ค.ศ. — แสดง พ.ศ. (แปลงที่ presentation layer)
- ✓ date-fns ที่มี: `startOfWeek` (ISO จันทร์), `addDays`, `addWeeks`, `addMonths`, `addYears`
- ✓ iPhone Safari ต้องเทสต์จริง
