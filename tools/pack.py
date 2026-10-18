"""รวมเกมเป็นไฟล์ HTML ไฟล์เดียว (ส่งให้เพื่อนเล่นหรือเปิดบนมือถือได้ทันที) และทำ zip ของทั้งโปรเจกต์

ใช้: python tools/pack.py
ผลลัพธ์อยู่ในโฟลเดอร์ dist/
"""
import re, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


def main():
    subprocess.run([sys.executable, str(ROOT / "tools" / "build_data.py")], check=True)
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + css + "\n</style>")

    def inline(m):
        code = (ROOT / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
        return "<script>\n" + code + "\n</script>"

    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    DIST.mkdir(exist_ok=True)
    single = DIST / "kaeng-dek-ban-na.html"
    single.write_text(html, encoding="utf-8")

    z = DIST / "kaeng-dek-ban-na-project.zip"
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in ROOT.rglob("*"):
            if p.is_file() and "dist" not in p.relative_to(ROOT).parts and "__pycache__" not in p.parts:
                zf.write(p, Path("kaeng-dek-ban-na") / p.relative_to(ROOT))
    print(f"ไฟล์เดียว: {single.relative_to(ROOT)} ({single.stat().st_size // 1024} KB)")
    print(f"โปรเจกต์: {z.relative_to(ROOT)} ({z.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
