"""Музыка для видео: своя весёлая аранжировка «Happy Birthday» (мелодия — общественное достояние).

3/4, 120 BPM: доля 0.5 с, такт 1.5 с. 50 тактов = 75 секунд.
Разделы совпадают со сценами видео (см. scenes.js):
  0–4   интро (музыкальная шкатулка, нарастание)
  4–12  куплет 1 «Как росла королева»
  12–16 вставка «Мне 7!»
  16–24 куплет 2 «Смешные моменты» (пружинки-boing)
  24–32 куплет 3 «Звезда и модель» (щелчки фотокамер)
  32–40 куплет 4 «С семьёй» (тепло)
  40–48 куплет 5 «Красная дорожка» (на тон выше, торжественно)
  48–50 финальный аккорд
Запуск: python3 video/music.py video/build/music.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt
import wave

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 3
BARS = 50
LEN = BARS * BAR + 1.5
rng = np.random.default_rng(7)

L = np.zeros(int(LEN * SR))
R = np.zeros(int(LEN * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= len(L):
        return
    n = min(len(sig), len(L) - i)
    lg = gain * np.cos((pan + 1) * np.pi / 4)
    rg = gain * np.sin((pan + 1) * np.pi / 4)
    L[i:i + n] += sig[:n] * lg
    R[i:i + n] += sig[:n] * rg


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.1, dur=None):
    t = np.arange(n) / SR
    dur = dur if dur is not None else n / SR - r
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / d, e)
    e = np.where(t >= a + d, s, e)
    rel = np.clip((t - dur) / r, 0, 1)
    return e * (1 - rel)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)


# ---------- инструменты ----------
def musicbox(m, dur=1.2):
    f = mtof(m)
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
    s += 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 6)
    s += 0.12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 10)
    return s * np.minimum(1, t / 0.002)


def lead(m, dur, vib=True, bright=1.0):
    f = mtof(m)
    n = int((dur + 0.15) * SR)
    t = np.arange(n) / SR
    v = 1 + (0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.15) / 0.2, 0, 1) if vib else 0)
    ph = 2 * np.pi * f * np.cumsum(v) / SR
    s = sum((1 / k) * np.sin(k * ph) for k in (1, 3, 5, 7, 9))
    s += 0.3 * sum((1 / k) * np.sin(k * ph * 1.003) for k in (1, 2, 3))
    s = lp(s, min(9000, 2200 * bright + f * 2))
    return s * env_adsr(n, 0.015, 0.12, 0.75, 0.12, dur)


def brass(m, dur):
    f = mtof(m)
    n = int((dur + 0.2) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.004, 0, 0.004):
        ph = 2 * np.pi * f * (1 + det) * t
        s += sum((1 / k) * np.sin(k * ph) for k in range(1, 12))
    cutoff = 800 + 3200 * np.clip(t / 0.08, 0, 1)
    s = lp(s, 3500) * 0.5
    return s * env_adsr(n, 0.04, 0.2, 0.8, 0.15, dur)


def pluck(m, dur=0.4):
    f = mtof(m)
    n = int((dur + 0.3) * SR)
    t = np.arange(n) / SR
    s = (2 * np.abs(2 * ((f * t) % 1) - 1) - 1) * np.exp(-t * 7)
    s += 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 12)
    return s


def pad(ms, dur):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in ms:
        f = mtof(m)
        for det in (-0.006, 0.0, 0.007):
            ph = 2 * np.pi * f * (1 + det) * t + rng.random() * 6
            s += sum((1 / k) * np.sin(k * ph) for k in range(1, 8))
    s = lp(s, 1800) / (len(ms) * 3)
    return s * env_adsr(n, 0.25, 0.3, 0.8, 0.5, dur)


def bass(m, dur):
    f = mtof(m)
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.4 * lp(2 * ((f * t) % 1) - 1, 700)
    return s * env_adsr(n, 0.005, 0.1, 0.7, 0.06, dur)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    s[:200] += rng.standard_normal(200) * 0.3 * np.linspace(1, 0, 200)
    return s


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def clap():
    s = np.zeros(int(0.25 * SR))
    for k in range(3):
        b = bp(noise(0.03), 900, 2600) * np.exp(-np.arange(int(0.03 * SR)) / SR * 60)
        i = int(k * 0.011 * SR)
        s[i:i + len(b)] += b
    tail = bp(noise(0.2), 900, 2400) * np.exp(-np.arange(int(0.2 * SR)) / SR * 18)
    s[int(0.033 * SR):int(0.033 * SR) + len(tail)] += tail * 0.8
    return s


def hat(open_=False):
    d = 0.18 if open_ else 0.045
    return hp(noise(d), 7000) * np.exp(-np.arange(int(d * SR)) / SR * (14 if open_ else 70))


def crash(d=2.0):
    return hp(noise(d), 4500) * np.exp(-np.arange(int(d * SR)) / SR * 2.2)


def riser(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    s = bp(noise(d), 1500, 6000) * (t / d) ** 2
    return s


def snare_roll(d):
    s = np.zeros(int(d * SR) + SR // 4)
    t = 0.0
    while t < d:
        k = t / d
        hit = bp(noise(0.05), 1200, 5000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 50) * (0.15 + 0.85 * k)
        i = int(t * SR)
        s[i:i + len(hit)] += hit
        t += 0.06 - 0.03 * k
    return s


def boing(f0=330):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.5 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 6)) * (1 + t * 0.8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)


def shutter():
    a = hp(noise(0.02), 3000) * np.linspace(1, 0, int(0.02 * SR))
    b = bp(noise(0.035), 1500, 6000) * np.linspace(1, 0, int(0.035 * SR))
    s = np.zeros(int(0.12 * SR))
    s[:len(a)] += a
    s[int(0.06 * SR):int(0.06 * SR) + len(b)] += b * 0.8
    return s


def whoosh(d=0.6):
    n = int(d * SR)
    t = np.arange(n) / SR
    return bp(noise(d), 400, 3000) * np.sin(np.pi * t / d) ** 2


# ---------- мелодия ----------
G4, A4, B4, C5, D5, E5, F5, G5 = 67, 69, 71, 72, 74, 76, 77, 79
MELODY = [(-1.0, .75, G4), (-.25, .25, G4),
          (0, 1, A4), (1, 1, G4), (2, 1, C5), (3, 2, B4), (5, .75, G4), (5.75, .25, G4),
          (6, 1, A4), (7, 1, G4), (8, 1, D5), (9, 2, C5), (11, .75, G4), (11.75, .25, G4),
          (12, 1, G5), (13, 1, E5), (14, 1, C5), (15, 1, B4), (16, 1, A4), (17, .75, F5), (17.75, .25, F5),
          (18, 1, E5), (19, 1, C5), (20, 1, D5), (21, 3, C5)]
CH = {'C': [60, 64, 67], 'G': [55, 59, 62], 'G7': [55, 59, 65], 'C7': [60, 64, 70], 'F': [53, 57, 60], 'Am': [57, 60, 64]}
CHORDS = ['C', 'G', 'G7', 'C', 'C7', 'F', ('C', 'G7'), 'C']


def bar_t(b):
    return b * BAR


def chord_at(bar_in_song, beat):
    c = CHORDS[bar_in_song]
    if isinstance(c, tuple):
        c = c[0] if beat < 2 else c[1]
    return CH[c]


def verse(start_bar, style, tr=0):
    t0 = bar_t(start_bar)
    for (b, d, m) in MELODY:
        t = t0 + b * BEAT
        dd = d * BEAT
        if b == 21 and style != 'grand':
            dd = 2 * BEAT
        if style == 'box':
            add(musicbox(m + 12 + tr, dd * 2 + 0.4), t, 0.2, 0.30)
            add(lead(m + tr, dd * 0.9, bright=0.6), t, -0.1, 0.10)
        elif style == 'bouncy':
            add(lead(m + tr, dd * 0.55, vib=False, bright=1.2), t, 0, 0.17)
            add(pluck(m + 12 + tr, 0.3), t, 0.4, 0.10)
        elif style == 'band':
            add(lead(m + tr, dd * 0.9, bright=1.4), t, 0, 0.19)
            add(lead(m + 12 + tr, dd * 0.9, bright=0.8), t, 0.3, 0.05)
        elif style == 'warm':
            add(musicbox(m + 12 + tr, dd * 2 + 0.6), t, -0.3, 0.22)
            add(lead(m + tr, dd * 0.95, bright=0.5), t, 0.2, 0.12)
        elif style == 'grand':
            add(brass(m + tr, dd * 0.95), t, -0.15, 0.24)
            add(brass(m - 12 + tr, dd * 0.95), t, 0.15, 0.10)
            add(musicbox(m + 24 + tr, dd + 0.5), t, 0.5, 0.10)
    for k in range(8):
        tb = t0 + k * BAR
        for beat in range(3):
            notes = [n + tr for n in chord_at(k, beat)]
            tt = tb + beat * BEAT
            if beat == 0:
                add(bass(notes[0] - 12, BEAT * 0.9), tt, 0, 0.32)
                add(kick(), tt, 0, 0.55 if style != 'box' else 0.35)
                if style in ('band', 'grand'):
                    add(pad(notes, BAR * 0.95), tt, 0, 0.30)
                if style == 'warm':
                    add(pad(notes, BAR * 0.98), tt, 0, 0.26)
            else:
                vol = 0.09 if style in ('box', 'warm') else 0.12
                for i, n in enumerate(notes):
                    add(pluck(n, 0.25), tt, -0.4 + 0.4 * i, vol)
                add(hat(), tt, 0.3, 0.12)
                if style in ('band', 'grand', 'bouncy') and beat in (1, 2):
                    add(clap(), tt, 0, 0.18 if style != 'bouncy' else 0.10)
            if style in ('band', 'grand'):
                add(hat(), tt + BEAT / 2, -0.3, 0.07)


# интро
for k, m in enumerate([72, 76, 79, 84, 79, 76, 72, 76, 79, 84, 88, 84]):
    add(musicbox(m, 1.0), k * BEAT, 0.3 * ((-1) ** k), 0.20)
add(pad(CH['C'], 4 * BAR), 0, 0, 0.18)
add(riser(2.2), bar_t(3) + 0.0, 0, 0.12)
add(snare_roll(1.0), bar_t(3) + 0.5, 0, 0.18)

verse(4, 'box')
# вставка «Мне 7!»: удары и аккорды
for k in range(4):
    tb = bar_t(12 + k)
    ch = [CH['F'], CH['G'], CH['Am'], CH['G7']][k]
    for beat in range(3):
        add(kick(), tb + beat * BEAT, 0, 0.5)
        add(hat(True), tb + beat * BEAT + BEAT / 2, 0.2, 0.08)
        for n in ch:
            add(lead(n, 0.18, vib=False), tb + beat * BEAT, 0, 0.05)
    add(bass(ch[0] - 12, BAR * 0.9), tb, 0, 0.32)
add(crash(2.4), bar_t(13), 0, 0.35)
add(snare_roll(1.5), bar_t(15), 0, 0.2)
add(riser(1.5), bar_t(15), 0, 0.12)

verse(16, 'bouncy')
for b in (16, 18, 20, 22):
    add(boing(300 + (b - 16) * 25), bar_t(b) + 0.05, 0.3, 0.30)
add(crash(1.6), bar_t(16), 0, 0.2)

verse(24, 'band')
for b in range(24, 32):
    for beat in (0, 2):
        add(shutter(), bar_t(b) + beat * BEAT + 0.02, (beat - 1) * 0.5, 0.35)
add(crash(2.0), bar_t(24), 0, 0.3)

verse(32, 'warm')
add(whoosh(0.8), bar_t(32) - 0.4, 0, 0.12)

add(snare_roll(1.0), bar_t(39) + 0.5, 0, 0.22)
verse(40, 'grand', tr=2)
add(crash(2.5), bar_t(40), 0, 0.38)

# финальный аккорд
for i, n in enumerate([62, 66, 69, 74, 78]):
    add(brass(n, 2.6), bar_t(48), -0.4 + 0.2 * i, 0.10)
    add(musicbox(n + 12, 2.8), bar_t(48) + i * 0.08, 0.4 - 0.2 * i, 0.12)
add(kick(), bar_t(48), 0, 0.6)
add(crash(3.0), bar_t(48), 0, 0.35)
add(pad([50, 62, 66, 69], 2.8), bar_t(48), 0, 0.3)

# сведение
mix = np.stack([L, R], 1)
mix = hp(mix.T, 30).T
peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.4) * 0.89
fade = int(1.2 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', out, len(mix) / SR, 'sec')
