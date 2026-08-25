# Arrival Experience — caption removal and verification

The Arrival Experience section plays a silent loop of Shot C from
`NJS_Royale_Beach_Resort_FINAL_v7.mp4` — the approved car park, gate and perimeter
fence. The film burns the caption *"A refined arrival experience"* into the picture,
which cannot appear behind the section's own HTML heading. This records how it was
removed and how the result was proved clean.

## The problem

Two sources exist, and neither is directly usable:

| Source | Caption | Approved day grade |
|---|---|---|
| `working/SHOT_C_carpark.mp4` | no | **no** |
| `working/dC/` (and every graded C from `vG_C` on) | **yes** | yes |

Cropping the caption out would have cost the bottom of the frame. Re-running the
full grade chain on the clean source would have meant reproducing `palm_grade` →
`palm_recolour` → two further passes → `day_light`, each with its own config.

## The repair — `decaption.py`

The grade delta `D = dC - clean` varies smoothly across a road surface. So inside
the caption the graded pixels are discarded, the authentic pixels are taken from the
clean source, and `D` is reconstructed by normalised-convolution fill from the ring
of valid pixels around each letter. Nothing outside the caption is written.

The mask is built **once**, from the peak per-pixel difference across the whole clip,
and applied to **every** frame.

> A first version thresholded each frame on its own and left faint ghosts at
> f0021 and f0114–f0116, where the caption's alpha is too low to clear any sane
> per-frame threshold. Still-frame checks passed; the filmstrip caught it. Because
> the repair reconstructs the same value it replaces, applying the union mask to
> frames carrying no text is a no-op, so there is no cost to being exhaustive.

Union mask: **51,380 px**, bbox x[605..1303] y[830..984].

## Verification

Three independent checks, all run on the **delivered encodes**, not on stills or
intermediate PNGs. Re-run any of them from this directory.

### 1. Static residual — `verify_decaption.py`

High-frequency residual inside the caption box against a control strip of the same
road that was never captioned.

```
caption region : max 9.58   mean 0.075
control region : max 16.43  mean 0.779
frames where the caption residual exceeds the control ceiling: 0 / 121
```

The repaired area is **an order of magnitude smoother** than untouched road.

### 2. Text-shaped signal — `verify_glyph.py`

The decisive test. Correlates each frame's fine detail (image minus a 6 px blur,
which strips road structure but keeps letter strokes) against the glyph mask, and
judges each tier against a control at **its own resolution and bitrate** — the
caption-free source, downscaled and encoded with identical settings.

```
a real caption (positive control) : +0.0463
desktop 1920x1080 : delivered +0.0004  matched control +0.0004  -> residual -0.17%
mobile  1280x720  : delivered -0.0001  matched control +0.0002  -> residual -0.47%
```

The metric is sensitive — a real caption lifts it **over a hundredfold** above the
floor. Both delivered tiers carry **under half a percent of a caption's worth of
signal**, i.e. they sit on their controls.

`MOVING` is reported for completeness only. The positive control shows it does *not*
rise when a caption is present — a static overlay does not flicker — so it cannot
prove presence or absence of one.

### 3. Playback flicker — `verify_arrival_motion.py`

Frame-to-frame flicker in the repaired road against a control strip.

```
caption-free baseline : ratio 1.365   <- geometric, the box is nearer the camera
delivered desktop     : ratio 1.392
delivered mobile      : ratio 1.430
```

The caption box sits closer to camera than the control strip, so it moves faster and
flickers more **with no repair in it at all** — the caption-free clip of this same
shot gives 1.365. Both tiers sit on that baseline. The worst frames (f0061, f0062,
f0065) are identical in the delivered clips and in the controls: a lamp post crossing
the box, i.e. scene motion.

### 4. Visual — `caption-repair-filmstrip.jpg`

Consecutive decoded frames across both of the caption's original fade boundaries
(f0020–f0024 and f0112–f0116), the frames where the earlier per-frame version
ghosted. Clean road throughout.

## Re-running

`decaption.py` reads `working/segC_frames`, `working/dC` and the clean frames
extracted from `SHOT_C_carpark.mp4`; the verify scripts read decoded frame folders.
Paths point at `C:\Users\840 g5\NJS-Royale-Film-Production\working`.

## Delivered assets

- `public/videos/njs-arrival-carpark-desktop.mp4` — 1920×1080, 5.04 s, silent
- `public/videos/njs-arrival-carpark-mobile.mp4` — 1280×720, 5.04 s, silent
- `public/images/njs-arrival-carpark-poster.jpg` — reduced-motion fallback
- `public/videos/njs-resort-film.mp4` — the full v7, click-to-play only
