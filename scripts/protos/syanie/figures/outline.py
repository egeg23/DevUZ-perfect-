# Белый контур врача (владелец, 20.11.2026: «вокруг контура врача белый контур, сделай
# красиво»): тонкая белая линия по силуэту и мягкое белое свечение за ней. Толщина — доля
# роста фигуры (h — высота рамки фигуры в точках этой картинки), поэтому в кадре лицом, спиной
# и в ролике контур одинаковый при любом размере на экране.
#   python3 -I outline.py <вход.webp> <выход.webp> <высота рамки фигуры> <поле>
# — картинку врача без контура (кадр лицом или спиной) расширяет на поле со всех сторон
# (контуру и свечению нужно место) и обводит.
import sys
import numpy as np
from PIL import Image, ImageFilter

LINE, GLOW, GLOW_A = 0.0042, 0.014, 0.32


def ring(im, h):
    """(цвет RGB, прозрачность L): фигура поверх белого, прозрачность — фигура, линия и свечение."""
    a = np.asarray(im.convert("RGBA"), dtype=np.float32) / 255
    af = a[..., 3]
    w = max(1, int(round(LINE * h)))
    core = Image.fromarray(((af > 0.45) * 255).astype(np.uint8))
    line = core.filter(ImageFilter.MaxFilter(2 * w + 1)).filter(ImageFilter.GaussianBlur(0.7))
    ln = np.asarray(line, dtype=np.float32) / 255
    glow = np.asarray(line.filter(ImageFilter.GaussianBlur(GLOW * h)), dtype=np.float32) / 255 * GLOW_A
    A = np.maximum(af, np.maximum(ln, glow))
    rgb = a[..., :3] * af[..., None] + (1 - af[..., None])
    return (Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8), "RGB"),
            Image.fromarray((np.clip(A, 0, 1) * 255).astype(np.uint8), "L"))


def outlined(im, h):
    rgb, A = ring(im, h)
    r, g, b = rgb.split()
    return Image.merge("RGBA", (r, g, b, A))


if __name__ == "__main__":
    src, dst, h, e = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
    im = Image.open(src).convert("RGBA")
    big = Image.new("RGBA", (im.width + 2 * e, im.height + 2 * e), (0, 0, 0, 0))
    big.paste(im, (e, e))
    outlined(big, h).save(dst, "WEBP", quality=84, alpha_quality=90, method=6)
    print(big.size)
