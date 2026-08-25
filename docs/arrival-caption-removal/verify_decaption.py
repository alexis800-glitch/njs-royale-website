"""Residual-text check: out - clean should be a SMOOTH grade delta everywhere.
Text residue shows up as high-frequency structure inside the caption bbox that a
control strip of the same road does not have."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage
S = os.path.dirname(os.path.abspath(__file__))
CLEAN = os.path.join(S, "arrival", "clean")
CLIP = os.path.join(S, "arrival", "clip")
BB = (629, 880, 1289, 933)          # measured caption bbox
CT = (629, 700, 1289, 753)          # same size, same road, never captioned
def hp(d):
    return np.abs(d - ndimage.gaussian_filter(d, 3.0))
rows = []
for fn in sorted(os.listdir(CLEAN)):
    a = np.asarray(Image.open(os.path.join(CLEAN, fn)).convert("RGB"), float).mean(axis=2)
    b = np.asarray(Image.open(os.path.join(CLIP, fn)).convert("RGB"), float).mean(axis=2)
    d = b - a
    cap = hp(d[BB[1]:BB[3], BB[0]:BB[2]])
    ctl = hp(d[CT[1]:CT[3], CT[0]:CT[2]])
    rows.append((int(fn[1:5]), cap.max(), ctl.max(), cap.mean(), ctl.mean()))
r = np.array(rows)
print(f"caption-region high-freq residual : max {r[:,1].max():.2f}  mean {r[:,3].mean():.3f}")
print(f"control-region high-freq residual : max {r[:,2].max():.2f}  mean {r[:,4].mean():.3f}")
worst = r[np.argsort(-r[:, 1])][:5]
print("worst frames (frame, cap_max, ctl_max):")
for w in worst:
    print(f"   f{int(w[0]):04d}   {w[1]:.2f}   {w[2]:.2f}")
over = r[r[:, 1] > r[:, 2].max()]
print(f"frames where caption residual exceeds the control ceiling: {len(over)} / {len(r)}")
