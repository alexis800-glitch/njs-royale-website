"""Playback check for the caption repair — run on the ENCODED clip, not on stills.

Stills cannot reveal a repair that pops, flickers or crawls. This decodes the
delivered mp4 and measures, frame to frame, the temporal behaviour of the repaired
road against a CONTROL strip of the same road that was never touched:

  flicker(t) = | f(t) - (f(t-1) + f(t+1)) / 2 |   averaged over the region

A repair that breathes with the caption's original fade in/out would spike at the
fade boundaries (frames 22 and 114) and sit above the control everywhere else.
Reported per clip, plus the worst frames, so a regression is obvious.
"""
import os, sys
import numpy as np
from PIL import Image

S = os.path.dirname(os.path.abspath(__file__))

# caption bbox measured on the 1920x1080 master: x[629..1288] y[880..932]
CAP = (629 / 1920, 880 / 1080, 1289 / 1920, 933 / 1080)
CTL = (629 / 1920, 700 / 1080, 1289 / 1920, 753 / 1080)   # same size, same road, never captioned
FADE_IN, FADE_OUT = 22, 114


def box(shape, rel):
    h, w = shape[:2]
    return (round(rel[0] * w), round(rel[1] * h), round(rel[2] * w), round(rel[3] * h))


def run(label, d):
    files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    frames = [np.asarray(Image.open(os.path.join(d, f)).convert("RGB"), np.float32).mean(axis=2)
              for f in files]
    cb = box(frames[0].shape, CAP)
    tb = box(frames[0].shape, CTL)
    cap, ctl = [], []
    for i in range(1, len(frames) - 1):
        mid = 0.5 * (frames[i - 1] + frames[i + 1])
        fl = np.abs(frames[i] - mid)
        cap.append(fl[cb[1]:cb[3], cb[0]:cb[2]].mean())
        ctl.append(fl[tb[1]:tb[3], tb[0]:tb[2]].mean())
    cap, ctl = np.array(cap), np.array(ctl)
    ratio = cap.mean() / ctl.mean()
    print(f"\n{label}  ({len(files)} frames, {frames[0].shape[1]}x{frames[0].shape[0]})")
    print(f"   repaired road  flicker: mean {cap.mean():.4f}  max {cap.max():.4f}")
    print(f"   control  road  flicker: mean {ctl.mean():.4f}  max {ctl.max():.4f}")
    print(f"   ratio repaired/control: {ratio:.3f}   ({'OK' if ratio < 1.25 else 'INVESTIGATE'})")
    for name, f in (("fade-in", FADE_IN), ("fade-out", FADE_OUT)):
        j = f - 1
        if 0 <= j < len(cap):
            print(f"   at the original {name} (frame {f}): repaired {cap[j]:.4f} vs control {ctl[j]:.4f}")
    worst = np.argsort(-cap)[:3]
    print("   worst frames:", ", ".join(f"f{int(w)+2:04d} {cap[w]:.4f} (ctl {ctl[w]:.4f})" for w in worst))
    return ratio


ratios = []
for label, sub in (("BASELINE caption-free clip ", "dec_clean"),
                   ("DELIVERED desktop 1920x1080", "dec_desktop"),
                   ("DELIVERED mobile  1280x720", "dec_mobile"),
                   ("ORIGINAL captioned vL_C    ", "dec_orig")):
    p = os.path.join(S, "verify", sub)
    if os.path.isdir(p):
        ratios.append((label, run(label, p)))

print("\n" + "=" * 62)
# The caption box sits nearer the camera than the control strip, so it moves faster
# and flickers more even with no repair in it. The caption-free clip of this same
# shot gives that geometric baseline; a delivered tier is clean when it matches it.
base = dict(ratios).get("BASELINE caption-free clip ")
if base:
    print(f"geometric baseline from the caption-free clip: ratio {base:.3f}")
    bad = [l for l, r in ratios if "DELIVERED" in l and r > base * 1.08]
    print("RESULT:", "clean in motion on every delivered tier" if not bad else f"CHECK {bad}")
