#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 500
# Brand gradient (byggexp blue #5FA4E7 -> darker)
top = (95, 164, 231)
bot = (37, 99, 165)
img = Image.new("RGB", (W, H), top)
px = img.load()
for y in range(H):
    t = y / H
    r = int(top[0] * (1 - t) + bot[0] * t)
    g = int(top[1] * (1 - t) + bot[1] * t)
    b = int(top[2] * (1 - t) + bot[2] * t)
    for x in range(W):
        px[x, y] = (r, g, b)

draw = ImageDraw.Draw(img)

def font(sz, bold=True):
    p = "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"
    return ImageFont.truetype(p, sz)

# App icon on the left, rounded
icon = Image.open("src/assets/icon.png").convert("RGBA").resize((240, 240))
mask = Image.new("L", (240, 240), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, 240, 240], radius=52, fill=255)
img.paste(icon, (90, (H - 240) // 2), mask)

# Text block
tx = 380
draw.text((tx, 150), "ByggExp", font=font(96), fill=(255, 255, 255))
draw.text((tx, 265), "Skift, projekt och team", font=font(38, bold=False), fill=(235, 244, 255))
draw.text((tx, 315), "– allt-i-ett för byggbranschen", font=font(38, bold=False), fill=(235, 244, 255))

img.save("play-feature-graphic-1024x500.png")
print("saved play-feature-graphic-1024x500.png", img.size)
