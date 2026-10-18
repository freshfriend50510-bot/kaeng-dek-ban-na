"""จำลองให้เด็ก 4 คนสู้กันเองเพื่อดูความสมดุล

ใช้: python tools/simulate.py [จำนวนรอบ] [เลเวล]
สูตรสเตตัสและดาเมจตรงกับ js/formulas.js (ถ้าแก้ฝั่งหนึ่ง ต้องแก้อีกฝั่งด้วย)
"""
import csv, random, sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "data_src"
rd = lambda n: list(csv.DictReader(open(SRC / n, encoding="utf-8")))
CHART = {r["attack"]: {k: float(v) for k, v in r.items() if k != "attack"} for r in rd("types.csv")}
MOVES = {r["id"]: r for r in rd("moves.csv")}
for m in MOVES.values():
    for k in ("power", "acc", "pp", "priority", "chance"):
        m[k] = int(m[k])
SP = {r["id"]: r for r in rd("species.csv")}
STATS = ("hp", "atk", "def", "spa", "spd", "spe")


def stage_mult(lv): return 1.75 if lv >= 32 else 1.35 if lv >= 16 else 1


def stats(sid, lv, iv=15):
    s = SP[sid]; m = stage_mult(lv) if s["kind"] == "kid" else 1; out = {}
    for k in STATS:
        b = round(int(s[k]) * m); core = (2 * b + iv) * lv // 100
        out[k] = core + lv + 10 if k == "hp" else core + 5
    return out


def sf(s): return (2 + s) / 2 if s >= 0 else 2 / (2 - s)


def damage(att, dfn, mv, crit, rand, other):
    phys = mv["cat"] == "phys"
    a_st, d_st = (att["st"]["atk"], dfn["st"]["def"]) if phys else (att["st"]["spa"], dfn["st"]["spd"])
    if crit: a_st, d_st = max(0, a_st), min(0, d_st)
    A = att["s"]["atk" if phys else "spa"] * sf(a_st); D = dfn["s"]["def" if phys else "spd"] * sf(d_st)
    dmg = int(int((int(2 * att["lv"] / 5) + 2) * mv["power"] * A / D) / 50) + 2
    if crit: dmg = int(dmg * 1.5)
    dmg = int(dmg * rand / 100)
    if mv["type"] == SP[att["id"]]["type"]: dmg = int(dmg * 1.5)
    eff = CHART[mv["type"]][SP[dfn["id"]]["type"]]
    dmg = int(dmg * eff); dmg = int(dmg * other)
    return max(1, dmg) if eff > 0 else 0


def mon(sid, lv):
    moves = [m for l, m in (p.split(":") for p in SP[sid]["learnset"].split(";")) if int(l) <= lv][-4:]
    s = stats(sid, lv)
    return dict(id=sid, lv=lv, s=s, hp=s["hp"], moves=moves, st={"atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0, "acc": 0}, status=None, slp=0, cnf=0, turns=0)


def pick(me, foe, r):
    if r.random() < 0.7:
        best = max(me["moves"], key=lambda m: MOVES[m]["power"] * CHART[MOVES[m]["type"]][SP[foe["id"]]["type"]] * (1.5 if MOVES[m]["type"] == SP[me["id"]]["type"] else 1))
        if MOVES[best]["power"] > 0: return best
    return r.choice(me["moves"])


def act(u, t, mid, second, r):
    u["turns"] += 1
    if u["status"] == "slp":
        if u["slp"] > 0: u["slp"] -= 1; return
        u["status"] = None
    if u["status"] == "par" and r.random() < 0.25: return
    if u["cnf"] > 0:
        u["cnf"] -= 1
        if u["cnf"] and r.random() < 1 / 3:
            A, D = u["s"]["atk"] * sf(u["st"]["atk"]), u["s"]["def"] * sf(u["st"]["def"])
            u["hp"] -= int(int((int(2 * u["lv"] / 5) + 2) * 40 * A / D) / 50) + 2   # มึนจนตีตัวเอง
            return
    mv = MOVES[mid]
    if mv["acc"] and r.random() * 100 >= mv["acc"] * ((3 + u["st"]["acc"]) / 3 if u["st"]["acc"] >= 0 else 3 / (3 - u["st"]["acc"])): return
    if mv["cat"] != "status":
        other = 1; ab = SP[u["id"]]["ability"]
        if ab == "rage" and mv["type"] == "earth" and u["hp"] <= u["s"]["hp"] / 3: other *= 1.5
        if ab == "analyze" and second: other *= 1.3
        t["hp"] -= damage(u, t, mv, r.random() < 1 / 16, r.randint(85, 100), other)
        if t["hp"] > 0 and mv["effect"] and r.random() * 100 < mv["chance"]: eff(mv["effect"], u, t, r)
    else:
        eff(mv["effect"], u, t, r)


def eff(e, u, t, r):
    if e.startswith(("self_", "foe_")):
        who = u if e.startswith("self_") else t
        k, d = e.split("_", 1)[1][:-2], int(e[-2:])
        who["st"][k] = max(-6, min(6, who["st"][k] + d))
    elif e == "heal50": u["hp"] = min(u["s"]["hp"], u["hp"] + u["s"]["hp"] // 2)
    elif e == "cnf" and not t["cnf"]: t["cnf"] = r.randint(2, 5) + 1
    elif e in ("par", "slp") and not t["status"]:
        t["status"] = e; t["slp"] = r.randint(1, 3) if e == "slp" else 0


def speed(m): return m["s"]["spe"] * sf(m["st"]["spe"]) * (0.5 if m["status"] == "par" else 1)


def duel(a, b, lv, r):
    A, B = mon(a, lv), mon(b, lv)
    for _ in range(100):
        ma, mb = pick(A, B, r), pick(B, A, r)
        pa = MOVES[ma]["priority"] + (0.5 if SP[a]["ability"] == "quick" and A["turns"] == 0 else 0)
        pb = MOVES[mb]["priority"] + (0.5 if SP[b]["ability"] == "quick" and B["turns"] == 0 else 0)
        first = pa > pb or (pa == pb and (speed(A) > speed(B) or (speed(A) == speed(B) and r.random() < .5)))
        order = [(A, B, ma), (B, A, mb)] if first else [(B, A, mb), (A, B, ma)]
        for i, (u, t, m) in enumerate(order):
            if u["hp"] > 0 and t["hp"] > 0: act(u, t, m, i == 1, r)
        for m in (A, B):
            if m["hp"] > 0 and SP[m["id"]]["ability"] == "eater":
                m["hp"] = min(m["s"]["hp"], m["hp"] + max(1, m["s"]["hp"] // 16))
        if A["hp"] <= 0 or B["hp"] <= 0: break
    return a if B["hp"] <= 0 and A["hp"] > 0 else b if A["hp"] <= 0 else None


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    lv = int(sys.argv[2]) if len(sys.argv) > 2 else 15
    kids = [k for k, s in SP.items() if s["kind"] == "kid"]
    r = random.Random(1)
    print(f"เด็กสู้กันเอง เลเวล {lv} คู่ละ {n} รอบ (ตัวเลข = % ที่แถวชนะคอลัมน์)\n")
    print("        " + "".join(f"{SP[k]['name']:>8}" for k in kids))
    totals = {k: 0 for k in kids}
    for a in kids:
        row = f"{SP[a]['name']:<8}"
        for b in kids:
            if a == b: row += f"{'-':>8}"; continue
            w = sum(duel(a, b, lv, r) == a for _ in range(n)) / n * 100
            totals[a] += w; row += f"{w:7.0f}%"
        print(row)
    print("\nอัตราชนะเฉลี่ย (เป้าหมาย 40–60%):")
    for k in kids:
        avg = totals[k] / (len(kids) - 1)
        flag = "" if 40 <= avg <= 60 else "  <- ควรปรับค่าพลัง"
        print(f"  {SP[k]['name']}: {avg:.0f}%{flag}")


if __name__ == "__main__":
    main()
