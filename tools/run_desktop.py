"""เปิดเกมเป็นหน้าต่างโปรแกรมของตัวเอง (ไม่ต้องเปิดเบราว์เซอร์)

ติดตั้งครั้งเดียว:  pip install pywebview
เปิดเกม:            python tools/run_desktop.py
ทำเป็น .exe:        pip install pyinstaller
                    python tools/pack.py
                    pyinstaller --onefile --windowed --add-data "dist/kaeng-dek-ban-na.html;." tools/run_desktop.py
                    (บน macOS/Linux ใช้ ":" แทน ";" ใน --add-data)
"""
import sys
from pathlib import Path

try:
    import webview
except ImportError:
    sys.exit("ยังไม่ได้ติดตั้ง pywebview — รัน: pip install pywebview")

base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent.parent))
page = base / "kaeng-dek-ban-na.html"
if not page.exists():
    page = base / "index.html"
webview.create_window("แก๊งเด็กบ้านนา", page.as_uri(), width=960, height=680, min_size=(480, 360))
webview.start(private_mode=False)  # private_mode=False ให้เซฟเกมค้างไว้ระหว่างเปิดปิดโปรแกรม
