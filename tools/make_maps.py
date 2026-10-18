# สร้างแผนที่ตั้งต้น: python tools/make_maps.py data_src
# ใช้สร้างแผนที่ชุดแรกเท่านั้น (ตอนนี้ data_src ถูกแก้ด้วยมือและเพิ่มแมพ มข./ในตึกแล้ว ห้ามรันทับ)
# คำเตือน: จะเขียนทับ data_src/*.txt และ world.json ทั้งไฟล์ ไฟล์ใน data_src อาจถูกแก้ด้วยมือหลังจากนี้ ให้ตรวจ git diff ก่อน commit
import json, sys
out = sys.argv[1]

def blank(w, h):
    g = [['.'] * w for _ in range(h)]
    for x in range(w):
        g[0][x] = g[h-1][x] = '#'
    for y in range(h):
        g[y][0] = g[y][w-1] = '#'
    return g

def fill(g, x0, y0, x1, y1, c):
    for y in range(y0, y1+1):
        for x in range(x0, x1+1):
            g[y][x] = c

def house(g, x, y, w, roof='R', wall='H', door=None):
    fill(g, x, y, x+w-1, y+1, roof)
    fill(g, x, y+2, x+w-1, y+2, wall)
    d = x + (w // 2) if door is None else door
    g[y+2][d] = 'D'
    return (d, y+2)

def path_h(g, x0, x1, y):
    for x in range(min(x0, x1), max(x0, x1)+1):
        if g[y][x] in '.f':
            g[y][x] = ':'

def path_v(g, x, y0, y1):
    for y in range(min(y0, y1), max(y0, y1)+1):
        if g[y][x] in '.f':
            g[y][x] = ':'

# ---------------- village 32x28 ----------------
V = blank(32, 28)
fill(V, 1, 1, 6, 4, 'P'); V[2][3] = '^'; V[3][3] = ':'; V[4][3] = ':'
fill(V, 9, 1, 14, 2, 'M'); fill(V, 9, 3, 14, 3, 'm'); V[3][11] = 'D'
fill(V, 22, 1, 28, 2, 'r'); fill(V, 22, 3, 28, 3, 'h'); V[3][25] = 'D'
path_h(V, 1, 30, 5)
home = house(V, 2, 8, 5)
fill(V, 9, 7, 14, 8, 'A'); V[9][9] = 'I'; V[9][14] = 'I'; fill(V, 10, 9, 13, 9, 'L')
shop = house(V, 18, 8, 5, 'r', 'h')
osm = house(V, 24, 8, 5, 'r', 'h')
path_h(V, 1, 30, 12)
path_v(V, 16, 5, 26)
for d in (home, shop, osm):
    path_v(V, d[0], d[1]+1, 12)
path_v(V, 11, 4, 5); path_v(V, 25, 4, 5); path_v(V, 3, 5, 5)
beeh = house(V, 2, 14, 5)
amh = house(V, 8, 14, 5, 'r', 'h')
tleh = house(V, 19, 14, 5)
terh = house(V, 25, 14, 4)
path_h(V, 1, 30, 18)
for d in (beeh, amh, tleh, terh):
    path_v(V, d[0], d[1]+1, 18)
fill(V, 2, 20, 8, 24, 'w'); V[20][2] = '.'; V[24][8] = '.'; V[20][8] = 'f'
fill(V, 19, 23, 28, 25, 'T')
fill(V, 23, 20, 25, 20, 'R'); fill(V, 23, 21, 25, 21, 'H'); V[21][24] = 'D'
path_v(V, 24, 18, 22)
V[22][21] = 'o'; V[22][27] = 'o'; V[19][10] = 'b'
for (x, y) in [(13, 4), (20, 4), (7, 6), (29, 6), (12, 20), (13, 21), (14, 23), (10, 25)]:
    V[y][x] = 'f'
for (x, y) in [(11, 20), (11, 22), (13, 25), (29, 21), (9, 6)]:
    V[y][x] = '#'
V[27][16] = ':'; V[27][15] = '#'
signs_v = {(5, 11): 'บ้านเรา', (17, 9): 'ศาลากลางบ้าน — ผู้ใหญ่บ้านสมบัติ',
           (17, 11): 'ร้านชำป้าสมร — ข้าวเหนียว ยา ขนม', (29, 11): 'ศาลา อสม. ป้านวล — รักษาฟรี',
           (12, 4): 'วัดบ้านโนนสะอาด', (24, 4): 'โรงเรียนบ้านโนนสะอาด',
           (17, 26): 'ทางลงทุ่งนาหลังหมู่บ้าน', (2, 6): 'ดอนปู่ตา ห้ามเข้า'}
for (x, y) in signs_v:
    V[y][x] = 'S'

# ---------------- field 30x22 ----------------
Fm = blank(30, 22)
fill(Fm, 2, 2, 12, 8, 'T'); fill(Fm, 18, 2, 27, 7, 'T'); fill(Fm, 2, 11, 10, 19, 'T')
fill(Fm, 21, 12, 27, 18, 'w')
path_v(Fm, 15, 0, 20); path_h(Fm, 1, 28, 10); path_h(Fm, 16, 28, 9)
path_h(Fm, 11, 20, 15); Fm[0][15] = ':'
fill(Fm, 12, 17, 13, 19, 'T')
for (x, y) in [(14, 3), (17, 12), (11, 10), (20, 9)]:
    Fm[y][x] = 'o' if (x, y) == (14, 3) else Fm[y][x]
Fm[15][29] = ':'
fill(Fm, 28, 11, 28, 20, '#'); fill(Fm, 21, 15, 28, 15, ':')
for (x, y) in [(1, 9), (28, 8), (19, 19), (18, 20)]:
    Fm[y][x] = '#'
Fm[13][15] = 'S'; Fm[13][14] = ':'
path_v(Fm, 14, 12, 14)
signs_f = {(15, 13): 'หนองใหญ่ ระวังคางคกเจ้าหนอง'}
for (x, y) in signs_f:
    Fm[y][x] = 'S'
path_v(Fm, 16, 15, 15)

# ---------------- market 24x16 ----------------
Mk = blank(24, 16)
path_h(Mk, 0, 22, 8); Mk[8][0] = ':'
for x0 in (3, 9):
    fill(Mk, x0, 3, x0+3, 4, 'r'); fill(Mk, x0, 5, x0+3, 5, 'h')
fill(Mk, 3, 11, 6, 11, 'r'); fill(Mk, 3, 12, 6, 12, 'h')
fill(Mk, 9, 11, 12, 11, 'r'); fill(Mk, 9, 12, 12, 12, 'h')
fill(Mk, 15, 2, 21, 3, 'K'); fill(Mk, 15, 4, 21, 4, 'n'); Mk[4][18] = 'D'
path_v(Mk, 18, 5, 8)
for (x, y) in [(2, 6), (14, 6), (21, 12), (16, 12)]:
    Mk[y][x] = 'f'
Mk[6][17] = 'S'
signs_m = {(17, 6): 'ร้านราเมงลมทุ่ง — ฐานแก๊งพี่ออสซี่ (ยิม 1)'}

def dump(name, g):
    with open(f'{out}/{name}.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(''.join(r) for r in g) + '\n')

dump('village', V); dump('field', Fm); dump('market', Mk)

def sg(m, d):
    return [{'map': m, 'x': x, 'y': y, 'text': t} for (x, y), t in d.items()]

world = {
  'start': {'map': 'village', 'x': 4, 'y': 11, 'dir': 'down'},
  'maps': {
    'village': {'name': 'บ้านโนนสะอาด', 'music': 'village'},
    'field': {'name': 'ทุ่งนาหลังหมู่บ้าน', 'music': 'field', 'encounter': True},
    'market': {'name': 'ตลาดนัดตำบล', 'music': 'village'}},
  'warps': [
    {'map': 'village', 'x': 16, 'y': 27, 'to': 'field', 'tx': 15, 'ty': 1},
    {'map': 'field', 'x': 15, 'y': 0, 'to': 'village', 'tx': 16, 'ty': 26},
    {'map': 'field', 'x': 29, 'y': 15, 'to': 'market', 'tx': 1, 'ty': 8},
    {'map': 'market', 'x': 0, 'y': 8, 'to': 'field', 'tx': 28, 'ty': 15}],
  'doors': [
    {'map': 'village', 'x': home[0], 'y': home[1], 'script': 'door_home'},
    {'map': 'village', 'x': shop[0], 'y': shop[1], 'script': 'door_shop'},
    {'map': 'village', 'x': osm[0], 'y': osm[1], 'script': 'door_osm'},
    {'map': 'village', 'x': 11, 'y': 3, 'script': 'door_temple'},
    {'map': 'village', 'x': 25, 'y': 3, 'script': 'door_school'},
    {'map': 'village', 'x': beeh[0], 'y': beeh[1], 'script': 'door_bee'},
    {'map': 'village', 'x': amh[0], 'y': amh[1], 'script': 'door_am'},
    {'map': 'village', 'x': tleh[0], 'y': tleh[1], 'script': 'door_tle'},
    {'map': 'village', 'x': terh[0], 'y': terh[1], 'script': 'door_ter'},
    {'map': 'village', 'x': 24, 'y': 21, 'script': 'door_tiang'},
    {'map': 'market', 'x': 18, 'y': 4, 'script': 'door_ramen'}],
  'signs': sg('village', signs_v) + sg('field', signs_f) + sg('market', signs_m),
  'npcs': [
    {'id': 'mom', 'name': 'แม่', 'map': 'village', 'x': 6, 'y': 11, 'look': 'mom', 'dir': 'left', 'script': 'mom'},
    {'id': 'elder', 'name': 'ผู้ใหญ่บ้านสมบัติ', 'map': 'village', 'x': 11, 'y': 9, 'look': 'elder', 'dir': 'down', 'script': 'elder'},
    {'id': 'kid_bee', 'name': 'บี', 'map': 'village', 'x': 10, 'y': 11, 'look': 'bee', 'dir': 'up', 'script': 'kid', 'hideIf': 'starter_chosen'},
    {'id': 'kid_am', 'name': 'แอม', 'map': 'village', 'x': 11, 'y': 11, 'look': 'am', 'dir': 'up', 'script': 'kid', 'hideIf': 'starter_chosen'},
    {'id': 'kid_tle', 'name': 'เติ้ล', 'map': 'village', 'x': 12, 'y': 11, 'look': 'tle', 'dir': 'up', 'script': 'kid', 'hideIf': 'starter_chosen'},
    {'id': 'kid_ter', 'name': 'เต๋อ', 'map': 'village', 'x': 13, 'y': 11, 'look': 'ter', 'dir': 'up', 'script': 'kid', 'hideIf': 'starter_chosen'},
    {'id': 'samorn', 'name': 'ป้าสมร', 'map': 'village', 'x': 21, 'y': 11, 'look': 'samorn', 'dir': 'down', 'script': 'samorn'},
    {'id': 'nual', 'name': 'ป้านวล อสม.', 'map': 'village', 'x': 27, 'y': 11, 'look': 'nual', 'dir': 'down', 'script': 'nual'},
    {'id': 'teacher', 'name': 'ครูบุญมี', 'map': 'village', 'x': 27, 'y': 4, 'look': 'teacher', 'dir': 'down', 'script': 'teacher'},
    {'id': 'monk', 'name': 'หลวงตา', 'map': 'village', 'x': 9, 'y': 4, 'look': 'monk', 'dir': 'down', 'script': 'monk'},
    {'id': 'jam', 'name': 'เฒ่าจ้ำ', 'map': 'village', 'x': 3, 'y': 5, 'look': 'jam', 'dir': 'down', 'script': 'jam'},
    {'id': 'tasi', 'name': 'ตาสี', 'map': 'village', 'x': 25, 'y': 22, 'look': 'tasi', 'dir': 'left', 'script': 'tasi'},
    {'id': 'beedad', 'name': 'พ่อบี', 'map': 'village', 'x': 6, 'y': 17, 'look': 'beedad', 'dir': 'down', 'script': 'beedad'},
    {'id': 'buffalo', 'name': 'ควาย', 'map': 'village', 'x': 16, 'y': 26, 'look': 'buffalo', 'dir': 'down', 'script': 'buffalo', 'hideIf': 'field_open'},
    {'id': 'rival', 'name': 'โจ้', 'map': 'village', 'x': 16, 'y': 13, 'look': 'rival', 'dir': 'up', 'script': 'rival', 'showIf': 'starter_chosen', 'hideIf': 'rival1_done'},
    {'id': 'student1', 'name': 'เด็กนักเรียนจ๊อบ', 'map': 'field', 'x': 15, 'y': 5, 'look': 'student1', 'dir': 'down', 'script': 'trainer',
     'trainer': {'name': 'เด็กนักเรียนจ๊อบ', 'team': [['pob', 5]], 'money': 60, 'sight': 3, 'flag': 'tr_student1',
                 'intro': 'เฮ้ย! เห็นหน้ากันแล้วต้องสู้!', 'lose': 'โห เก่งแท้!'}},
    {'id': 'student2', 'name': 'เด็กนักเรียนแนน', 'map': 'field', 'x': 8, 'y': 10, 'look': 'student2', 'dir': 'right', 'script': 'trainer',
     'trainer': {'name': 'เด็กนักเรียนแนน', 'team': [['phrai', 5], ['kongkoi', 6]], 'money': 80, 'sight': 4, 'flag': 'tr_student2',
                 'intro': 'ผีของเราฝึกมาดีนะ!', 'lose': 'กลับไปฝึกใหม่ก่อน...'}},
    {'id': 'toad', 'name': 'คางคกเจ้าหนอง', 'map': 'field', 'x': 20, 'y': 15, 'look': 'toad', 'dir': 'left', 'script': 'toad', 'hideIf': 'boss1_done'},
    {'id': 'item1', 'name': 'ของตกอยู่', 'map': 'field', 'x': 3, 'y': 10, 'look': 'item', 'dir': 'down', 'script': 'item', 'item': 'herb', 'flag': 'it1', 'hideIf': 'it1'},
    {'id': 'item2', 'name': 'ของตกอยู่', 'map': 'field', 'x': 27, 'y': 9, 'look': 'item', 'dir': 'down', 'script': 'item', 'item': 'rice_ball', 'flag': 'it2', 'hideIf': 'it2'},
    {'id': 'hench1', 'name': 'ลูกน้องแก๊งต้อม', 'map': 'market', 'x': 8, 'y': 8, 'look': 'henchman', 'dir': 'left', 'script': 'trainer',
     'trainer': {'name': 'ลูกน้องแก๊งต้อม', 'team': [['krahang', 7], ['pob', 7]], 'money': 120, 'sight': 4, 'flag': 'tr_hench1',
                 'intro': 'ตลาดนี้เขตพี่ออสซี่ ใครผ่านต้องสู้!', 'lose': 'พี่ออสซี่ไม่ปล่อยไว้แน่...'}},
    {'id': 'hench2', 'name': 'ลูกน้องแก๊งเปา', 'map': 'market', 'x': 18, 'y': 7, 'look': 'henchman2', 'dir': 'down', 'script': 'trainer',
     'trainer': {'name': 'ลูกน้องแก๊งเปา', 'team': [['krahang', 8], ['phong', 8]], 'money': 140, 'sight': 2, 'flag': 'tr_hench2',
                 'intro': 'จะพบพี่ออสซี่ต้องผ่านเราก่อน!', 'lose': 'เชิญ... พี่รออยู่ข้างใน'}},
    {'id': 'vendor', 'name': 'พ่อค้าลูกชิ้น', 'map': 'market', 'x': 5, 'y': 6, 'look': 'vendor', 'dir': 'down', 'script': 'vendor'},
    {'id': 'vendor2', 'name': 'แม่ค้าหมูปิ้ง', 'map': 'market', 'x': 11, 'y': 13, 'look': 'samorn', 'dir': 'up', 'script': 'vendor2'}]
}
with open(f'{out}/world.json', 'w', encoding='utf-8') as f:
    json.dump(world, f, ensure_ascii=False, indent=1)
print(open(f'{out}/village.txt').read()); print(open(f'{out}/field.txt').read()); print(open(f'{out}/market.txt').read())
