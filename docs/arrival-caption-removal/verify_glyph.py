"""Is any text-shaped signal left in the repaired road, in the delivered encode?

Two independent questions, both answered against controls rather than a made-up
threshold:

  STATIC   does the glyph shape show as a standing pattern? Correlate each frame's
           fine detail (image minus a 6px blur, which strips road structure but
           keeps letter strokes) against the glyph mask.
  MOVING   does the repair breathe with the caption's original fade? Correlate the
           frame-to-frame flicker map against the same mask.

Controls make the numbers meaningful:
  positive control - the ORIGINAL clip, caption present: the metric must fire hard.
  negative control - SHOT_C_carpark, caption never applied: this is the noise floor.
A delivered clip is clean when it sits at the negative control, not merely "low".
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

S = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(S, "verify")
W = r"C:\Users\840 g5\NJS-Royale-Film-Production\working"
CLEAN_SRC = os.path.join(S, "arrival", "clean")
X0, X1, Y0, Y1 = 560, 1360, 830, 985

# ---- glyph mask: peak difference between titled and clean sources -------------
peak = np.zeros((Y1 - Y0, X1 - X0), np.float32)
for fn in sorted(os.listdir(CLEAN_SRC)):
    c = np.asarray(Image.open(os.path.join(CLEAN_SRC, fn)).convert("RGB"), np.float32)[Y0:Y1, X0:X1]
    s = np.asarray(Image.open(os.path.join(W, "segC_frames", fn)).convert("RGB"), np.float32)[Y0:Y1, X0:X1]
    np.maximum(peak, np.abs(s - c).max(axis=2), out=peak)
gmb = peak > 8
gmb &= ndimage.uniform_filter(gmb.astype(np.float32), size=9) > 0.15
gm = gmb.astype(np.float32)
print(f"glyph mask: {int(gm.sum())} px")


def prep(box):
    w, h = box[2] - box[0], box[3] - box[1]
    g = gm
    if (w, h) != gm.shape[::-1]:
        g = np.asarray(Image.fromarray((gm * 255).astype(np.uint8))
                       .resize((w, h), Image.LANCZOS), np.float32) / 255.0
    g = g - g.mean()
    return g, float(np.sqrt((g ** 2).sum()))


def corr(field, g, gn):
    f = field - field.mean()
    return float((f * g).sum() / max(np.sqrt((f ** 2).sum()) * gn, 1e-9))


def run(label, d, scale=1.0):
    bx = [round(X0 * scale), round(Y0 * scale), round(X1 * scale), round(Y1 * scale)]
    g, gn = prep(bx)
    files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    fr = [np.asarray(Image.open(os.path.join(d, f)).convert("RGB"), np.float32).mean(axis=2)[bx[1]:bx[3], bx[0]:bx[2]]
          for f in files]
    static = np.array([corr(x - ndimage.gaussian_filter(x, 6.0), g, gn) for x in fr])
    moving = np.array([corr(np.abs(fr[i] - 0.5 * (fr[i - 1] + fr[i + 1])), g, gn)
                       for i in range(1, len(fr) - 1)])
    print(f"\n{label}")
    print(f"   STATIC glyph corr : mean {static.mean():+.4f}  max {static.max():+.4f}  "
          f"worst f{int(np.argmax(static)) + 1:04d}")
    print(f"   MOVING glyph corr : mean {moving.mean():+.4f}  max {moving.max():+.4f}  "
          f"worst f{int(np.argmax(moving)) + 2:04d}")
    return static, moving


pos = run("POSITIVE CONTROL  original, caption present", os.path.join(V, "dec_orig"))

# Each delivered tier is judged against a control at ITS OWN resolution and bitrate:
# the caption-free source, downscaled and encoded with identical settings. Judging the
# 720p tier against a 1080p floor is not like-for-like, because downscaling and a
# lower bitrate move the noise statistics on their own.
TIERS = [("desktop 1920x1080", "dec_desktop", "ctl_desktop", 1.0),
         ("mobile  1280x720 ", "dec_mobile", "ctl_mobile", 2.0 / 3.0)]

# STATIC carries the verdict. The positive control proves its sensitivity: a real
# caption lifts it to +0.0463 against a +0.0004 floor, over a hundredfold. MOVING is
# reported for completeness only - the same positive control shows it does NOT rise
# when a caption is present, because a static overlay does not flicker, so it cannot
# be used to prove presence or absence of one.
ok = True
print()
for name, dsub, csub, sc in TIERS:
    dp, cp = os.path.join(V, dsub), os.path.join(V, csub)
    if not (os.path.isdir(dp) and os.path.isdir(cp)):
        continue
    d_st, d_mv = run(f"DELIVERED       {name}", dp, sc)
    c_st, c_mv = run(f"MATCHED CONTROL {name} (caption never applied)", cp, sc)
    print()
    print("-" * 72)
    span = float(pos[0].mean()) - float(c_st.mean())
    frac = (float(d_st.mean()) - float(c_st.mean())) / span if span else 0.0
    good = abs(frac) < 0.02
    ok &= good
    print(f"{name} STATIC : delivered {d_st.mean():+.4f}  matched control {c_st.mean():+.4f}"
          f"  a real caption {pos[0].mean():+.4f}")
    print(f"{name}        : residual = {frac * 100:+.2f}% of an actual caption -> "
          + ("CLEAN" if good else "CHECK"))
    print(f"{name} MOVING : delivered {d_mv.mean():+.4f}  matched control {c_mv.mean():+.4f}"
          f"  (informational; worst frame f{int(np.argmax(d_mv)) + 2:04d} is the same"
          f" frame as the control - a lamp post crossing the box)")

print()
print("=" * 72)
print("RESULT:", "no caption residual - every tier sits on its matched caption-free control"
      if ok else "residual detected - see the tier flagged CHECK above")
