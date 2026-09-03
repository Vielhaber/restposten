#!/usr/bin/env python3
"""Generates PWA app icons for Restposten Platform.

Brand: deep slate-blue background (matches --primary in globals.css,
oklch(0.32 0.06 260) ~= #1f3350), white wordmark glyph. Two variants:
  - icon-*.png        full-bleed, safe for "any" purpose + apple-touch-icon
  - icon-maskable-*.png  glyph kept inside the 80% safe-zone circle so
                          Android's adaptive-icon mask doesn't clip it
"""
import math
from PIL import Image, ImageDraw, ImageFont

NAVY = (31, 51, 80, 255)  # #1f3350
WHITE = (251, 251, 251, 255)  # near --primary-foreground
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

OUT_DIR = "public/icons"


def rounded_square(size: int, radius_ratio: float) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=NAVY)
    return img


def draw_glyph(img: Image.Image, size: int, glyph_scale: float) -> None:
    draw = ImageDraw.Draw(img)
    font_size = int(size * glyph_scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = "R"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    # Nudge up slightly to visually center a capital letter (descender-free baseline bias).
    y = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((x, y), text, font=font, fill=WHITE)


def make_any(size: int) -> Image.Image:
    img = rounded_square(size, radius_ratio=0.22)
    draw_glyph(img, size, glyph_scale=0.56)
    return img


def make_maskable(size: int) -> Image.Image:
    # Full-bleed square (no corner rounding — the OS applies its own mask shape),
    # glyph scaled down so it stays inside the ~80% safe-zone circle.
    img = Image.new("RGBA", (size, size), NAVY)
    draw_glyph(img, size, glyph_scale=0.42)
    return img


def make_apple_touch(size: int = 180) -> Image.Image:
    # iOS applies its own corner rounding — deliver an opaque full-bleed square.
    img = Image.new("RGBA", (size, size), NAVY)
    draw_glyph(img, size, glyph_scale=0.56)
    return img.convert("RGB")


import os

os.makedirs(OUT_DIR, exist_ok=True)

for size in (192, 512):
    make_any(size).save(f"{OUT_DIR}/icon-{size}.png")
    make_maskable(size).save(f"{OUT_DIR}/icon-maskable-{size}.png")

make_apple_touch(180).save("public/apple-touch-icon.png")

print("done")
