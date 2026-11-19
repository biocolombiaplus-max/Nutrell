"""Genera las imágenes web de cada producto.
Requiere: _fuentes/originales/<slug>.jpg y _fuentes/recortes/<slug>.png (fondo transparente, hecho con rembg).
Uso: python3 tools/imagenes.py
"""
import json, os
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets/img/p")
data = json.load(open(os.path.join(ROOT, "data/productos.json"), encoding="utf-8"))
os.makedirs(OUT, exist_ok=True)

def hex2rgb(h): h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

for p in data["productos"]:
    s = p["slug"]
    cut = Image.open(f"{ROOT}/_fuentes/recortes/{s}.png").convert("RGBA")
    a = cut.split()[3].point(lambda v: 255 if v > 20 else 0)
    bb = a.getbbox(); cut = cut.crop(bb)
    big = cut.copy(); big.thumbnail((1000, 1100), Image.LANCZOS); big.save(f"{OUT}/{s}.webp", quality=88, method=6)
    sm = cut.copy(); sm.thumbnail((440, 520), Image.LANCZOS); sm.save(f"{OUT}/{s}-sm.webp", quality=85, method=6)
    orig = Image.open(f"{ROOT}/_fuentes/originales/{s}.jpg").convert("RGB")
    o = orig.copy(); o.thumbnail((1100, 1400), Image.LANCZOS); o.save(f"{OUT}/{s}-foto.jpg", quality=86, optimize=True)
    # Acercamientos de la etiqueta (sobre el recorte, en coordenadas del original)
    x0, y0, x1, y1 = bb; w, h = x1 - x0, y1 - y0
    if w > h:  # caja horizontal
        boxes = [(x0, y0, x0 + int(w * .62), y1), (x0 + int(w * .38), y0, x1, y1)]
    else:
        boxes = [(x0, y0 + int(h * .12), x1, y0 + int(h * .62)), (x0, y0 + int(h * .45), x1, y0 + int(h * .95))]
    for i, b in enumerate(boxes, 1):
        c = cut.crop((b[0] - x0, b[1] - y0, b[2] - x0, b[3] - y0)); c.thumbnail((900, 900), Image.LANCZOS)
        c.save(f"{OUT}/{s}-d{i}.webp", quality=86, method=6)
    # Imagen para compartir en redes (1200x630)
    acc = hex2rgb(p["tema"]["acento"])
    og = Image.new("RGB", (1200, 630), (13, 13, 14))
    glow = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    g = Image.new("RGBA", (700, 700), acc + (150,)).filter(ImageFilter.GaussianBlur(0))
    mask = Image.new("L", (700, 700), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse((60, 60, 640, 640), fill=170); mask = mask.filter(ImageFilter.GaussianBlur(90))
    glow.paste(Image.new("RGBA", (700, 700), acc + (255,)), (250, -35), mask)
    og.paste(glow, (0, 0), glow)
    pr = cut.copy(); pr.thumbnail((520, 560), Image.LANCZOS)
    og.paste(pr, (600 - pr.width // 2, 315 - pr.height // 2), pr)
    og.save(f"{OUT}/{s}-og.jpg", quality=86)
    print("ok", s)
