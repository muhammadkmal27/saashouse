from PIL import Image
from collections import Counter
import sys

def rgb_to_hex(r, g, b):
    return '#{:02x}{:02x}{:02x}'.format(r, g, b)

img_path = r"c:\Users\mypc\Desktop\saas_house\screencapture-id-preview-30e19e3b-7dda-4532-91f4-fdf34c2397c7-lovable-app-2026-04-15-22_07_44.png"
try:
    img = Image.open(img_path)
    img = img.convert("RGB")
    pixels = list(img.getdata())
    
    greens = [p for p in pixels if p[1] > p[0] + 30 and p[1] > p[2] + 30]
    oranges = [p for p in pixels if p[0] > p[1] + 30 and p[0] > p[2] + 50 and p[1] > p[2] * 1.5]
    
    c_greens = Counter(greens)
    c_oranges = Counter(oranges)
    
    print("Top Greens:")
    for c, count in c_greens.most_common(5): print(rgb_to_hex(*c))
        
    print("\nTop Oranges:")
    for c, count in c_oranges.most_common(5): print(rgb_to_hex(*c))
except Exception as e:
    print(e)
