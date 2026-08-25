"""Remove the burned-in film caption from the graded car-park shot.

dC carries the approved day grade but also the burned caption. SHOT_C_carpark is
caption-free but ungraded. The grade delta D = dC - clean varies smoothly across a
surface, so inside the caption we discard dC's pixels, take the authentic pixels
from clean, and add D reconstructed by normalised-convolution fill from the ring of
valid pixels around the text. Nothing outside the caption is touched.

The mask is built ONCE, from the peak per-pixel difference across the whole clip,
and then applied to EVERY frame. A first version thresholded each frame on its own
and left faint ghosts on the lowest-alpha fade frames, where the text is too weak
to clear any sane per-frame threshold. Because the repair reconstructs the same
value it replaces, applying the union mask on frames that carry no text is a no-op,
so there is no cost to being exhaustive.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

W = r"C:\Users\840 g5\NJS-Royale-Film-Production\working"
S = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(S, "arrival", "clean")
OUT = os.path.join(S, "arrival", "clip")
os.makedirs(OUT, exist_ok=True)

X0, X1, Y0, Y1 = 560, 1360, 830, 985     # band around the text plus its blurred shadow
SIG = 14.0

files = sorted(f for f in os.listdir(CLEAN) if f.endswith(".png"))

# ---- one union mask, from the PEAK difference over the whole clip --------------
peak = np.zeros((Y1 - Y0, X1 - X0), np.float32)
for fn in files:
    c = np.asarray(Image.open(os.path.join(CLEAN, fn)).convert("RGB"), np.float32)[Y0:Y1, X0:X1]
    s = np.asarray(Image.open(os.path.join(W, "segC_frames", fn)).convert("RGB"), np.float32)[Y0:Y1, X0:X1]
    np.maximum(peak, np.abs(s - c).max(axis=2), out=peak)

m = peak > 8                                    # low, because this is a PEAK map
m &= ndimage.uniform_filter(m.astype(float), size=9) > 0.15   # drop isolated codec noise
m = ndimage.binary_closing(m, np.ones((3, 3)))
m = ndimage.binary_dilation(m, iterations=6)     # cover anti-aliasing and the soft shadow
ys, xs = np.where(m)
print(f"union caption mask: {int(m.sum())} px, bbox x[{X0+xs.min()}..{X0+xs.max()}] "
      f"y[{Y0+ys.min()}..{Y0+ys.max()}]")

valid = (~m).astype(np.float32)
den = ndimage.gaussian_filter(valid, SIG)[..., None]
alpha = np.clip(ndimage.gaussian_filter(m.astype(np.float32), 2.0) * 1.6, 0, 1)[..., None]

# ---- apply to every frame -----------------------------------------------------
for fn in files:
    clean = np.asarray(Image.open(os.path.join(CLEAN, fn)).convert("RGB"), np.float32)
    dc = np.asarray(Image.open(os.path.join(W, "dC", fn)).convert("RGB"), np.float32)
    c = clean[Y0:Y1, X0:X1]
    g = dc[Y0:Y1, X0:X1]

    D = g - c
    num = np.stack([ndimage.gaussian_filter(D[..., k] * valid, SIG) for k in range(3)], -1)
    rebuilt = np.clip(c + num / np.maximum(den, 1e-4), 0, 255)

    out = dc.copy()
    out[Y0:Y1, X0:X1] = g * (1 - alpha) + rebuilt * alpha
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(OUT, fn))

print(f"repaired all {len(files)} frames through the union mask -> {OUT}")
