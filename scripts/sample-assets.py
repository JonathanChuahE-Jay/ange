#!/usr/bin/env python3
"""Generate sample assets for the love site: illustrated "memory" photos (no
real people) and short gentle instrumental tracks. Output: data/sample/.

Usage: python3 scripts/sample-assets.py
"""
import math
import random
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "data" / "sample"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1000, 1250  # 4:5, matches the polaroid crop
rng = random.Random(14)


# ---------------------------------------------------------------- helpers
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def vgradient(stops):
    """stops: [(t, '#hex'), ...] top→bottom"""
    img = Image.new("RGB", (W, H))
    px = img.load()
    cols = [(t, hexrgb(c)) for t, c in stops]
    for y in range(H):
        t = y / (H - 1)
        for i in range(len(cols) - 1):
            if cols[i][0] <= t <= cols[i + 1][0]:
                a, b = cols[i], cols[i + 1]
                c = lerp(a[1], b[1], (t - a[0]) / max(1e-6, b[0] - a[0]))
                break
        for x in range(W):
            px[x, y] = c
    return img


def glow(img, xy, r, color, alpha=170, blur=60):
    # transparent pixels carry the glow colour, so blurring only fades alpha (no dark halo)
    layer = Image.new("RGBA", img.size, hexrgb(color) + (0,))
    d = ImageDraw.Draw(layer)
    x, y = xy
    d.ellipse((x - r, y - r, x + r, y + r), fill=hexrgb(color) + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(layer)


def heart(d, cx, cy, s, fill):
    pts = []
    for i in range(80):
        t = i / 80 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * s / 17, cy - y * s / 17))
    d.polygon(pts, fill=fill)


def stars(img, n, max_y, seed):
    r = random.Random(seed)
    d = ImageDraw.Draw(img)
    for _ in range(n):
        x, y = r.randrange(W), r.randrange(int(max_y))
        s = r.choice([1, 1, 2, 2, 3])
        a = r.randrange(120, 255)
        d.ellipse((x, y, x + s, y + s), fill=(255, 255, 255, a))


def hills(img, base, amp, color, seed, freq=2.0):
    r = random.Random(seed)
    phase = r.random() * 6
    d = ImageDraw.Draw(img)
    pts = [(0, H)]
    for x in range(0, W + 10, 10):
        y = base + amp * math.sin(x / W * math.pi * freq + phase) + amp * 0.4 * math.sin(x / W * math.pi * freq * 2.7 + phase * 2)
        pts.append((x, y))
    pts.append((W, H))
    d.polygon(pts, fill=color)


def grain(img, amount=10):
    arr = np.asarray(img).astype(np.int16)
    noise = np.random.default_rng(7).integers(-amount, amount + 1, size=arr.shape[:2])[..., None]
    arr[..., :3] = np.clip(arr[..., :3] + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), img.mode)


def save(img, name):
    img = grain(img.convert("RGBA")).convert("RGB")
    img.save(OUT / name, "JPEG", quality=86, optimize=True)
    print("photo", name)


# ---------------------------------------------------------------- scenes
def beach_sunset():
    img = vgradient([(0, "#3A1F5C"), (0.35, "#C2537A"), (0.55, "#F79A6B"), (0.62, "#FFD29A"), (0.62, "#5A6FA8"), (1, "#24305E")]).convert("RGBA")
    glow(img, (W // 2, int(H * 0.6)), 150, "#FFE2A8", 255, 30)
    glow(img, (W // 2, int(H * 0.6)), 260, "#FF9A7A", 120, 90)
    d = ImageDraw.Draw(img)
    for i in range(14):  # sun reflection
        y = int(H * 0.64) + i * 26
        w = 220 - i * 13
        d.rounded_rectangle((W // 2 - w // 2, y, W // 2 + w // 2, y + 6), 3, fill=(255, 214, 160, 150 - i * 9))
    d.polygon([(0, H), (0, H * 0.86), (W * 0.35, H * 0.9), (W * 0.7, H * 0.84), (W, H * 0.88), (W, H)], fill=(40, 24, 50, 255))
    heart(d, W * 0.24, H * 0.9, 34, (255, 140, 160, 230))
    return img


def city_night():
    img = vgradient([(0, "#140A24"), (0.6, "#3A1840"), (1, "#7A2D52")]).convert("RGBA")
    stars(img, 140, H * 0.5, 3)
    glow(img, (int(W * 0.78), int(H * 0.17)), 70, "#FFF2D6", 255, 6)
    glow(img, (int(W * 0.78), int(H * 0.17)), 160, "#FFD9E6", 90, 70)
    d = ImageDraw.Draw(img)
    r = random.Random(5)
    x = 0
    while x < W:
        bw = r.randrange(70, 150)
        bh = r.randrange(int(H * 0.22), int(H * 0.5))
        top = H - bh
        d.rectangle((x, top, x + bw, H), fill=(28, 14, 38, 255))
        for wy in range(top + 20, H - 20, 34):
            for wx in range(x + 12, x + bw - 16, 26):
                if r.random() < 0.42:
                    d.rectangle((wx, wy, wx + 12, wy + 16), fill=(255, 205, 140, r.randrange(150, 240)))
        x += bw + r.randrange(4, 14)
    glow(img, (W // 2, H), 420, "#D64560", 70, 120)
    return img


def mountains():
    img = vgradient([(0, "#F7C8C9"), (0.45, "#FBE3D3"), (1, "#E9C3D6")]).convert("RGBA")
    glow(img, (int(W * 0.3), int(H * 0.3)), 110, "#FFF4E0", 255, 20)
    hills(img, H * 0.55, 90, (196, 140, 170, 255), 11, 1.6)
    hills(img, H * 0.66, 70, (156, 98, 140, 255), 12, 2.2)
    hills(img, H * 0.78, 50, (102, 58, 98, 255), 13, 2.9)
    hills(img, H * 0.9, 30, (64, 34, 64, 255), 14, 3.5)
    d = ImageDraw.Draw(img)
    for i, (bx, by) in enumerate([(0.62, 0.22), (0.68, 0.25), (0.72, 0.21)]):  # birds
        x, y = W * bx, H * by
        d.line([(x - 18, y - 6), (x, y + 4), (x + 18, y - 6)], fill=(110, 60, 100, 220), width=4)
    return img


def rainy_window():
    img = vgradient([(0, "#5B6B8C"), (1, "#2E3550")]).convert("RGBA")
    for i, c in enumerate(["#FFB86B", "#FF8FA6", "#9FD3FF", "#FFE08A", "#C9A7FF"]):  # bokeh
        for _ in range(5):
            glow(img, (rng.randrange(W), rng.randrange(int(H * 0.15), int(H * 0.85))), rng.randrange(30, 70), c, 120, 18)
    d = ImageDraw.Draw(img)
    r = random.Random(9)
    for _ in range(170):  # drops
        x, y = r.randrange(W), r.randrange(H)
        L = r.randrange(14, 46)
        d.line([(x, y), (x - 3, y + L)], fill=(220, 235, 255, r.randrange(70, 150)), width=2)
    d.rectangle((0, 0, W, H), outline=(30, 22, 34, 255), width=34)  # frame
    d.rectangle((W // 2 - 10, 0, W // 2 + 10, H), fill=(30, 22, 34, 255))
    d.rectangle((0, H // 2 - 10, W, H // 2 + 10), fill=(30, 22, 34, 255))
    heart(d, W * 0.28, H * 0.3, 60, (255, 255, 255, 60))  # drawn in the fog
    return img


def coffee_morning():
    img = vgradient([(0, "#FFF1E2"), (1, "#F2D2BC")]).convert("RGBA")
    glow(img, (int(W * 0.85), int(H * 0.1)), 300, "#FFE6B8", 200, 120)
    d = ImageDraw.Draw(img)
    d.rectangle((0, H * 0.7, W, H), fill=(168, 112, 84, 255))  # table
    for i in range(6):
        d.line([(0, H * 0.7 + i * 64), (W, H * 0.7 + i * 64)], fill=(150, 98, 72, 255), width=3)
    for cx in (W * 0.34, W * 0.66):  # two cups
        d.ellipse((cx - 150, H * 0.66, cx + 150, H * 0.74), fill=(250, 246, 240, 255))
        d.rounded_rectangle((cx - 120, H * 0.5, cx + 120, H * 0.7), 40, fill=(255, 252, 248, 255))
        d.ellipse((cx - 120, H * 0.47, cx + 120, H * 0.54), fill=(255, 252, 248, 255))
        d.ellipse((cx - 104, H * 0.48, cx + 104, H * 0.53), fill=(122, 74, 48, 255))
        d.arc((cx + 90, H * 0.54, cx + 170, H * 0.64), -90, 90, fill=(255, 252, 248, 255), width=22)
        heart(d, cx, H * 0.505, 26, (238, 214, 190, 255))  # latte art
        for k in range(3):  # steam
            sx = cx - 40 + k * 40
            d.line([(sx, H * 0.44), (sx + 10, H * 0.4), (sx - 6, H * 0.36), (sx + 6, H * 0.32)], fill=(255, 255, 255, 140), width=6, joint="curve")
    return img


def ferris_wheel():
    img = vgradient([(0, "#2A1440"), (0.55, "#7A2E62"), (1, "#E07A7A")]).convert("RGBA")
    stars(img, 80, H * 0.4, 21)
    d = ImageDraw.Draw(img)
    cx, cy, R = W * 0.55, H * 0.52, 300
    d.ellipse((cx - R, cy - R, cx + R, cy + R), outline=(255, 220, 230, 230), width=8)
    for k in range(16):
        a = k / 16 * 2 * math.pi
        x, y = cx + R * math.cos(a), cy + R * math.sin(a)
        d.line([(cx, cy), (x, y)], fill=(255, 220, 230, 140), width=3)
        col = [(255, 190, 120), (255, 140, 170), (190, 160, 255)][k % 3]
        d.rounded_rectangle((x - 22, y - 10, x + 22, y + 30), 8, fill=col + (255,))
        glow(img, (int(x), int(y)), 26, "#FFE2B0", 120, 14)
    d = ImageDraw.Draw(img)
    d.polygon([(cx, cy), (cx - 180, H), (cx - 150, H), (cx, cy + 40)], fill=(40, 20, 50, 255))
    d.polygon([(cx, cy), (cx + 180, H), (cx + 150, H), (cx, cy + 40)], fill=(40, 20, 50, 255))
    d.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=(255, 220, 230, 255))
    return img


def flower_field():
    img = vgradient([(0, "#BFE0F5"), (0.5, "#FCE7EF"), (0.5, "#9CC58A"), (1, "#5E8E55")]).convert("RGBA")
    glow(img, (int(W * 0.75), int(H * 0.15)), 120, "#FFF6D8", 255, 30)
    d = ImageDraw.Draw(img)
    r = random.Random(33)
    for _ in range(420):
        y = r.uniform(H * 0.5, H)
        depth = (y - H * 0.5) / (H * 0.5)
        x = r.uniform(0, W)
        s = 4 + depth * 22
        col = r.choice([(255, 120, 150), (255, 190, 205), (255, 230, 120), (250, 250, 250), (214, 69, 96)])
        for k in range(5):
            a = k / 5 * 2 * math.pi
            px, py = x + math.cos(a) * s * 0.6, y + math.sin(a) * s * 0.6
            d.ellipse((px - s * 0.45, py - s * 0.45, px + s * 0.45, py + s * 0.45), fill=col + (255,))
        d.ellipse((x - s * 0.25, y - s * 0.25, x + s * 0.25, y + s * 0.25), fill=(255, 210, 80, 255))
    return img


def starry_picnic():
    img = vgradient([(0, "#0E0A26"), (0.7, "#2B1A4A"), (1, "#3C2350")]).convert("RGBA")
    stars(img, 380, H * 0.75, 44)
    d = ImageDraw.Draw(img)
    pts = [(W * 0.1 + i * W * 0.09, H * 0.22 + math.sin(i * 1.3) * 60) for i in range(9)]  # constellation
    d.line(pts, fill=(255, 220, 240, 110), width=2)
    for p in pts:
        d.ellipse((p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5), fill=(255, 240, 250, 255))
    glow(img, (int(W * 0.3), int(H * 0.45)), 200, "#8A6BFF", 50, 120)
    hills(img, H * 0.82, 30, (24, 16, 34, 255), 51, 1.4)
    d = ImageDraw.Draw(img)
    d.polygon([(W * 0.42, H * 0.86), (W * 0.78, H * 0.84), (W * 0.82, H * 0.92), (W * 0.38, H * 0.94)], fill=(214, 69, 96, 255))  # blanket
    for i in range(6):
        d.line([(W * 0.42 + i * 60, H * 0.86), (W * 0.38 + i * 72, H * 0.94)], fill=(255, 200, 210, 160), width=4)
    glow(img, (int(W * 0.7), int(H * 0.83)), 30, "#FFD27A", 255, 8)  # lantern
    glow(img, (int(W * 0.7), int(H * 0.83)), 110, "#FFB25A", 110, 50)
    return img


SCENES = [
    ("01-beach-sunset.jpg", beach_sunset),
    ("02-city-night.jpg", city_night),
    ("03-mountains.jpg", mountains),
    ("04-rainy-window.jpg", rainy_window),
    ("05-coffee-morning.jpg", coffee_morning),
    ("06-ferris-wheel.jpg", ferris_wheel),
    ("07-flower-field.jpg", flower_field),
    ("08-starry-picnic.jpg", starry_picnic),
]


# ---------------------------------------------------------------- music
SR = 44100


def note_freq(n):  # MIDI → Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def piano(freq, dur, vel=0.5):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 2.6) * (1 - np.exp(-t * 180))
    tone = (
        np.sin(2 * np.pi * freq * t)
        + 0.42 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 1.5)
        + 0.18 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 3)
        + 0.06 * np.sin(2 * np.pi * freq * 4.01 * t) * np.exp(-t * 4)
    )
    return vel * env * tone


def pad(freqs, dur):
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.2)
    sig = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t)) for f in freqs)
    return 0.05 * env * sig


def song(chords, bpm, bars_per_chord, pattern, seed, length_s=48):
    r = random.Random(seed)
    beat = 60 / bpm
    total = int(SR * (length_s + 3))
    mix = np.zeros(total)
    t0 = 0.0
    while t0 < length_s:
        for chord in chords:
            if t0 >= length_s:
                break
            span = beat * 4 * bars_per_chord
            # pad
            p = pad([note_freq(n - 12) for n in chord], span + 0.5)
            i = int(t0 * SR)
            mix[i : i + len(p)] += p[: total - i]
            # bass
            b = piano(note_freq(chord[0] - 24), beat * 4, 0.35)
            for bar in range(bars_per_chord):
                j = int((t0 + bar * beat * 4) * SR)
                mix[j : j + len(b)] += b[: total - j]
            # arpeggio
            steps = int(4 * bars_per_chord * len(pattern) / 4)
            for s in range(steps):
                idx = pattern[s % len(pattern)]
                n = chord[idx % len(chord)] + 12 * (idx // len(chord))
                at = t0 + s * beat * 4 / len(pattern)
                v = 0.22 + 0.08 * r.random()
                x = piano(note_freq(n), 1.6, v)
                j = int(at * SR)
                mix[j : j + len(x)] += x[: total - j]
            t0 += span
    # simple room reverb (a few decaying echoes)
    wet = np.zeros_like(mix)
    for d, g in [(0.031, 0.35), (0.047, 0.3), (0.073, 0.24), (0.11, 0.18), (0.17, 0.12)]:
        k = int(d * SR)
        wet[k:] += g * mix[:-k]
    out = mix + 0.6 * wet
    fade = int(SR * 3)
    out[-fade:] *= np.linspace(1, 0, fade)
    out /= np.max(np.abs(out)) * 1.15
    return out


TRACKS = [
    # (file, title, artist, chords (MIDI), bpm, bars/chord, arp pattern)
    ("first-light.mp3", "First Light", "Ange & Adam (demo)", [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], 76, 1, [0, 2, 1, 3, 4, 3, 1, 2]),
    ("slow-mornings.mp3", "Slow Mornings", "Ange & Adam (demo)", [[62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70], [57, 60, 64, 67]], 68, 1, [0, 1, 2, 4, 2, 1]),
    ("under-the-same-sky.mp3", "Under the Same Sky", "Ange & Adam (demo)", [[57, 60, 64, 67], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 67]], 84, 1, [0, 2, 4, 2, 3, 1, 2, 4]),
]


def main():
    for name, fn in SCENES:
        save(fn(), name)
    for i, (fname, title, *_rest) in enumerate(TRACKS):
        chords, bpm, bpc, pat = _rest[1], _rest[2], _rest[3], _rest[4]
        audio = song(chords, bpm, bpc, pat, seed=i)
        wav = OUT / fname.replace(".mp3", ".wav")
        import wave

        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((audio * 32767).astype(np.int16).tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "128k", str(OUT / fname)], check=True)
        wav.unlink()
        print("track", fname)


if __name__ == "__main__":
    main()
