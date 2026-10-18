# แก๊งเด็กบ้านนา — หมายเหตุสำหรับ Claude

เกมแนวโปเกมอนออฟไลน์ ภาษาไทย ฉากหมู่บ้านอีสาน ผู้ใช้สื่อสารภาษาไทย ให้ตอบเป็นภาษาไทย

## โครงสร้าง
- `index.html` เปิดตรงๆ ได้ (file://) ใช้ classic script บน `window.G` ห้ามเปลี่ยนเป็น ES module
- ลำดับ script: data, formulas, battle, sprites, audio, ui, world, battleui, story, guide, hud, main
- `data_src/` (CSV/txt/json) → `python3 tools/build_data.py` → `js/data.js` ห้ามแก้ `js/data.js` ด้วยมือ
- `js/battle.js` = ตรรกะล้วน คืน event list, `js/battleui.js` = เล่น event บนจอ
- `js/story.js` = สคริปต์เนื้อเรื่อง (async), `js/guide.js` = เควสต์/ลูกศรนำทาง, `js/hud.js` = แผงทีม มินิแมพ แผนที่ใหญ่
- ภาพตัวละครเป็นพิกเซล ASCII 16×16 ใน `js/sprites.js`, เพลง/เสียงสังเคราะห์ใน `js/audio.js`

## ตรวจงาน
- `python3 tools/build_data.py` (มี validation)
- `node tools/test_battle.js`
- `python3 tools/simulate.py` สมดุลเด็ก 4 คน
- `python3 tools/pack.py` → `dist/` ไฟล์ HTML เดียว + zip (ไม่ commit)
- Playwright headless: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`

## สถานะ
เสร็จ: หมู่บ้าน, ทุ่งนา, ตลาด, เลือกเด็กเริ่มต้น, คู่แข่ง, ชวนผีเข้าแก๊ง, บอสคางคก, ยิม 1 พี่ออสซี่, โหมดง่าย (EXP×3 แบ่งทั้งแก๊ง, คริฝั่งเรา 25%)
ยังไม่ทำ: ยิม 2 พี่เฟรนด์ (วิศวะ มข.), ยิม 3 พี่บูม (หมอ), ยิม 4 พี่ต้นน้ำ (ผู้หญิง ถือไม้เรียว), เด็กคนที่ 3–4 เข้าแก๊ง, ดอนปู่ตา, หลายช่องเซฟ
