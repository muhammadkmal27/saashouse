from PIL import Image
from collections import Counter
import sys

def rgb_to_hex(r, g, b):
    return '#{:02x}{:02x}{:02x}'.format(r, g, b)

def is_accent_color(r, g, b):
    # Ignore shades of gray, white, and very dark colors
    if max(r,g,b) - min(r,g,b) < 20: return False
    if r > 240 and g > 240 and b > 240: return False
    if r < 30 and g < 30 and b < 30: return False
    return True

img_path = r"c:\Users\mypc\Desktop\saas_house\screencapture-id-preview-30e19e3b-7dda-4532-91f4-fdf34c2397c7-lovable-app-2026-04-15-22_07_44.png"
try:
    img = Image.open(img_path)
    img = img.convert("RGB")
    # Resize to speed up and naturally cluster colors
    img = img.resize((300, 300))
    pixels = list(img.getdata())
    
    accents = [p for p in pixels if is_accent_color(*p)]
    counter = Counter(accents)
    
    print("Top 15 Accent Colors found in image:")
    for color, count in counter.most_common(15):
        print(f"Count: {count} \t HEX: {rgb_to_hex(*color)} \t RGB: {color}")
except Exception as e:
    print("Error:", e)
