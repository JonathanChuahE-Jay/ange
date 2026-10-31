#!/usr/bin/env python3
"""Fill the love site with a consistent sample story (Adam & Ange) through the
admin API, so every item passes the same validation as the admin panel.
REPLACES existing timeline / photos / chats / loves / quiz / prizes / tracks.

Usage:
  python3 scripts/sample-assets.py      # once: generates data/sample/*
  python3 scripts/seed-sample.py [base_url]   (default http://127.0.0.1:3000)
Reads ADMIN_PASSWORD from .env.local / .env.
"""
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000").rstrip("/")
SAMPLE = ROOT / "data" / "sample"


def admin_password():
    for name in (".env.local", ".env"):
        f = ROOT / name
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith("ADMIN_PASSWORD="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return "ange-admin"


s = requests.Session()


def call(method, path, **kw):
    r = s.request(method, BASE + path, timeout=60, **kw)
    if not r.ok:
        raise SystemExit(f"{method} {path} → {r.status_code}: {r.text[:300]}")
    return r.json() if r.content else None


def wipe(resource):
    items = call("GET", f"/api/admin/{resource}?pageSize=100")["items"]
    for it in items:
        call("DELETE", f"/api/admin/{resource}/{it['id']}")
    return len(items)


# ------------------------------------------------------------------ content
SETTINGS = {
    "askerName": "Adam",
    "partnerName": "Ange",
    "question": "Will you be my Valentine, again and always?",
    "questionSubtext": "I built you a little corner of the internet. Every page of it is about you.",
    "yesResponse": "You just made me the happiest person alive. Scroll down, there's so much more.",
    "noIsDodger": True,
    "anniversaryDate": "2024-02-14",  # the Secret door date (dd/mm/yyyy = 14/02/2024)
    "countdownTitle": "Counting every second until our third Valentine's",
    "countdownTarget": "2027-02-14T11:00:00.000Z",  # 7:00 pm in UTC+8
    "letterTitle": "To my favourite person",
    "letterBody": (
        "Ange,\n\n"
        "I still remember the exact moment you laughed at my terrible joke at Mei's party. "
        "I didn't know it yet, but my whole life quietly rearranged itself around that sound.\n\n"
        "Thank you for the slow mornings, for stealing my hoodies, for holding my hand on the Ferris wheel "
        "even though you pretended you weren't scared. Thank you for choosing me on the easy days and the hard ones.\n\n"
        "I don't need a special occasion to celebrate you, but I made you this anyway, because you deserve "
        "a whole website. Honestly, you deserve the whole internet.\n\n"
        "Here's to every chapter we haven't written yet."
    ),
    "letterSignoff": "Forever yours, Adam",
}

TIMELINE = [
    ("12 Aug 2023", "The night we met", "Mei's birthday party. You laughed at my worst joke, and I made it my life's mission to hear that laugh again."),
    ("2 Sep 2023", "Our first date", "Coffee that turned into dinner, dinner that turned into a walk, a walk that ended at 2 am. Nobody wanted to say goodnight first."),
    ("14 Feb 2024", "Officially us", "I asked. You said yes before I even finished the sentence. Best Valentine's Day in history."),
    ("June 2024", "Our first trip", "Penang. Wrong turns, too much char kway teow, a sunset on the beach and zero regrets."),
    ("Dec 2024", "Fairy lights & Ferris wheels", "You pretended you weren't scared at the top. You held my hand the whole way round."),
    ("Today", "Still choosing you", "Every single day, it's you. It has always been you."),
]

PHOTO_CAPTIONS = {
    "01-beach-sunset.jpg": "Penang sunset, our first trip",
    "02-city-night.jpg": "The walk home that lasted until 2 am",
    "03-mountains.jpg": "That hike you complained about (and loved)",
    "04-rainy-window.jpg": "Rainy days in, my favourite kind",
    "05-coffee-morning.jpg": "Slow mornings, two cups",
    "06-ferris-wheel.jpg": "You weren't scared. Sure.",
    "07-flower-field.jpg": "Cameron Highlands flower farm",
    "08-starry-picnic.jpg": "Midnight picnic under the stars",
}

CHATS = [
    ("partner", "are you awake?", "1:47 am"),
    ("me", "always, for you", "1:47 am"),
    ("partner", "I can't stop thinking about tonight", "1:48 am"),
    ("me", "me neither. you looked so happy at the Ferris wheel", "1:48 am"),
    ("partner", "because I was with you, silly", "1:49 am"),
    ("me", "okay my heart can't handle this at 2 am", "1:49 am"),
    ("partner", "good night, I love you", "1:51 am"),
    ("me", "I love you more. screenshot saved forever", "1:51 am"),
]

LOVES = [
    "Your laugh at my bad jokes",
    "Slow Sunday mornings",
    "Stealing my hoodies",
    "Late-night drives",
    "Mango sticky rice",
    "Rainy days in",
    "Sunsets at the beach",
    "Your sleepy voice",
    "Movie marathons",
    "Holding hands everywhere",
]

QUIZ = [
    ("Where did we first meet?", ["At a café", "Mei's birthday party", "At work", "Online"], 1),
    ("What did we eat on our first date?", ["Sushi", "Pizza", "Nasi lemak", "Ramen"], 3),
    ("Where was our first trip together?", ["Penang", "Bali", "Bangkok", "Singapore"], 0),
    ("What's our go-to late-night snack?", ["Instant noodles", "Mango sticky rice", "Fries", "Toast"], 1),
    ("Who said “I love you” first?", ["Adam", "Ange", "Both at once", "Still waiting"], 0),
    ("What's my favourite thing about you?", ["Your laugh", "Your eyes", "Your kindness", "All of the above"], 3),
]

PRIZES = [
    ("One big hug", "#D64560", 3),
    ("Movie night, you pick", "#C9973F", 2),
    ("Dinner date, my treat", "#B03052", 2),
    ("Breakfast in bed", "#E8879C", 2),
    ("Massage coupon", "#8E3B5E", 1),
    ("A kiss, obviously", "#D98E04", 3),
]

TRACKS = [
    ("first-light.mp3", "First Light", "Demo track"),
    ("slow-mornings.mp3", "Slow Mornings", "Demo track"),
    ("under-the-same-sky.mp3", "Under the Same Sky", "Demo track"),
]


def main():
    if not SAMPLE.exists() or not any(SAMPLE.glob("*.jpg")):
        raise SystemExit("Run scripts/sample-assets.py first (generates data/sample/).")

    call("POST", "/api/auth/session", json={"password": admin_password()})
    # production sets the cookie Secure; browsers accept that on localhost, but
    # requests won't send it over plain http — relax it for this local script only
    for c in s.cookies:
        c.secure = False
    print("logged in")

    call("PUT", "/api/admin/settings", json=SETTINGS)
    print("settings ✓  (Secret door: 14/02/2024)")

    for res in ("timeline", "chats", "loves", "quiz", "prizes", "photos", "tracks"):
        print(f"cleared {wipe(res)} {res}")

    for date, title, desc in TIMELINE:
        call("POST", "/api/admin/timeline", json={"date": date, "title": title, "description": desc})
    for side, text, time in CHATS:
        call("POST", "/api/admin/chats", json={"side": side, "text": text, "timeLabel": time})
    for text in LOVES:
        call("POST", "/api/admin/loves", json={"text": text})
    for q, opts, ans in QUIZ:
        call("POST", "/api/admin/quiz", json={"question": q, "options": opts, "answerIndex": ans})
    for label, color, weight in PRIZES:
        call("POST", "/api/admin/prizes", json={"label": label, "color": color, "weight": weight})
    print(f"added {len(TIMELINE)} timeline · {len(CHATS)} chats · {len(LOVES)} loves · {len(QUIZ)} quiz · {len(PRIZES)} prizes")

    for name, caption in PHOTO_CAPTIONS.items():
        with open(SAMPLE / name, "rb") as fh:
            call("POST", "/api/admin/photos", files={"file": (name, fh, "image/jpeg")}, data={"caption": caption})
    print(f"uploaded {len(PHOTO_CAPTIONS)} photos")

    for fname, title, artist in TRACKS:
        with open(SAMPLE / fname, "rb") as fh:
            call("POST", "/api/admin/tracks", files={"file": (fname, fh, "audio/mpeg")}, data={"title": title, "artist": artist})
    print(f"uploaded {len(TRACKS)} tracks")
    print("done ✓")


if __name__ == "__main__":
    main()
