"""แปลงข้อมูลใน data_src/ (CSV, แผนที่ .txt, world.json) เป็น js/data.js ที่เกมโหลด

ใช้: python tools/build_data.py
แก้ข้อมูลในสเปรดชีตหรือแผนที่แล้วรันใหม่ทุกครั้ง สคริปต์จะตรวจความถูกต้องก่อนเขียนไฟล์
"""
import csv, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data_src"
OUT = ROOT / "js" / "data.js"
TILES = ".:#PwTRrHhDSFobf^MmAILKn"   # อักษรที่แผนที่ใช้ได้ (ดูความหมายใน js/world.js)


def read_csv(name):
    with open(SRC / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(v):
    try:
        return int(v)
    except ValueError:
        return float(v)


def load():
    types_rows = read_csv("types.csv")
    types = [k for k in types_rows[0] if k != "attack"]
    chart = {r["attack"]: {t: float(r[t]) for t in types} for r in types_rows}

    moves = {}
    for r in read_csv("moves.csv"):
        moves[r["id"]] = {k: (num(v) if k in ("power", "acc", "pp", "priority", "chance") else v) for k, v in r.items()}

    species = {}
    for r in read_csv("species.csv"):
        s = {k: v for k, v in r.items()}
        for k in ("hp", "atk", "def", "spa", "spd", "spe", "catch", "baseexp"):
            s[k] = int(s[k])
        s["learnset"] = [[int(p.split(":")[0]), p.split(":")[1]] for p in r["learnset"].split(";") if p]
        species[r["id"]] = s

    items = {r["id"]: {**r, "price": int(r["price"]), "value": float(r["value"])} for r in read_csv("items.csv")}

    enc = {}
    for r in read_csv("encounters.csv"):
        enc.setdefault(r["map"], []).append({"sp": r["species"], "min": int(r["minlv"]), "max": int(r["maxlv"]),
                                             "day": int(r["day"]), "night": int(r["night"])})

    world = json.loads((SRC / "world.json").read_text(encoding="utf-8"))
    maps = {}
    for mid in world["maps"]:
        rows = (SRC / f"{mid}.txt").read_text(encoding="utf-8").rstrip("\n").split("\n")
        maps[mid] = rows
    return dict(types=types, chart=chart, moves=moves, species=species, items=items,
                encounters=enc, world=world, maps=maps)


def validate(d):
    errs = []
    T = set(d["types"])
    for a in d["chart"]:
        if a not in T:
            errs.append(f"types.csv: ธาตุแถว '{a}' ไม่อยู่ในหัวคอลัมน์")
    for mid, m in d["moves"].items():
        if m["type"] not in T: errs.append(f"moves.csv {mid}: ธาตุ '{m['type']}' ไม่มีอยู่")
        if m["cat"] not in ("phys", "spec", "status"): errs.append(f"moves.csv {mid}: ประเภท '{m['cat']}' ต้องเป็น phys/spec/status")
        if m["pp"] <= 0: errs.append(f"moves.csv {mid}: PP ต้องมากกว่า 0")
    for sid, s in d["species"].items():
        if s["type"] not in T: errs.append(f"species.csv {sid}: ธาตุ '{s['type']}' ไม่มีอยู่")
        for lv, mv in s["learnset"]:
            if mv not in d["moves"]: errs.append(f"species.csv {sid}: ท่า '{mv}' ไม่มีใน moves.csv")
        if s["kind"] == "kid":
            total = sum(s[k] for k in ("hp", "atk", "def", "spa", "spd", "spe"))
            if total != 300: errs.append(f"species.csv {sid}: เด็กเริ่มต้นควรมีค่าพลังรวม 300 (ตอนนี้ {total})")
    for mp, lst in d["encounters"].items():
        if mp not in d["maps"]: errs.append(f"encounters.csv: ไม่มีแผนที่ '{mp}'")
        for e in lst:
            if e["sp"] not in d["species"]: errs.append(f"encounters.csv: ไม่มีผี '{e['sp']}'")
        for tod in ("day", "night"):
            tot = sum(e[tod] for e in lst)
            if tot != 100: errs.append(f"encounters.csv {mp}: อัตราเจอ{tod} รวม {tot}% (ต้องเป็น 100)")
    for mid, rows in d["maps"].items():
        w = len(rows[0])
        for y, r in enumerate(rows):
            if len(r) != w: errs.append(f"{mid}.txt แถว {y}: กว้าง {len(r)} ไม่เท่าแถวแรก ({w})")
            for x, c in enumerate(r):
                if c not in TILES: errs.append(f"{mid}.txt ({x},{y}): อักษร '{c}' ไม่รู้จัก")
    W = d["world"]
    def at(m, x, y):
        rows = d["maps"].get(m)
        return rows[y][x] if rows and 0 <= y < len(rows) and 0 <= x < len(rows[0]) else None
    for n in W["npcs"]:
        c = at(n["map"], n["x"], n["y"])
        if c is None: errs.append(f"world.json npc {n['id']}: อยู่นอกแผนที่")
        elif c not in ".:fTL": errs.append(f"world.json npc {n['id']}: ยืนบนช่อง '{c}' ที่เดินไม่ได้")
        for sp, lv in n.get("trainer", {}).get("team", []):
            if sp not in d["species"]: errs.append(f"world.json {n['id']}: ไม่มีผี '{sp}'")
        if "item" in n and n["item"] not in d["items"]: errs.append(f"world.json {n['id']}: ไม่มีไอเท็ม '{n['item']}'")
    for s in W["signs"]:
        if at(s["map"], s["x"], s["y"]) != "S": errs.append(f"world.json ป้าย '{s['text']}': ช่อง ({s['x']},{s['y']}) ไม่ใช่ S")
    for dr in W["doors"]:
        if at(dr["map"], dr["x"], dr["y"]) != "D": errs.append(f"world.json ประตู {dr['script']}: ช่องไม่ใช่ D")
    for wp in W["warps"]:
        if at(wp["to"], wp["tx"], wp["ty"]) not in ".:": errs.append(f"world.json วาร์ปไป {wp['to']} ({wp['tx']},{wp['ty']}): ช่องปลายทางเดินไม่ได้")
    return errs


def main():
    d = load()
    errs = validate(d)
    if errs:
        print("พบข้อผิดพลาด %d ข้อ:" % len(errs))
        for e in errs: print("  -", e)
        sys.exit(1)
    OUT.write_text("// สร้างอัตโนมัติจาก data_src/ ด้วย tools/build_data.py — ห้ามแก้ไฟล์นี้ตรงๆ\nwindow.GAME_DATA = "
                   + json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"เขียน {OUT.relative_to(ROOT)} แล้ว: ตัวละคร {len(d['species'])} ท่า {len(d['moves'])} ไอเท็ม {len(d['items'])} แผนที่ {len(d['maps'])}")


if __name__ == "__main__":
    main()
