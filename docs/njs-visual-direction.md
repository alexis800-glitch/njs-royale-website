# NJS Royale — Visual Direction Rulebook

> This document governs all visual decisions for the NJS Royale Beach Resort website and concept media.
> Apply it to every Higgsfield generation brief, hero selection, gallery update, and AI-generated asset.

---

## 1. Resort Identity at a Glance

| Property        | Value                                      |
|-----------------|--------------------------------------------|
| Name            | NJS Royale Beach Resort                    |
| Location        | Richland Garden Estate, Ibeju-Lekki, Lagos |
| Waterfront      | Atlantic Ocean                             |
| Scale           | ~9 floors · ~300 rooms                     |
| Stage           | Concept / Development Preview              |

---

## 2. Architectural Scale — CRITICAL

**NJS Royale is not a boutique hotel. It is not a villa resort. It is not a low-rise beach lodge.**

It is a **large-scale, 9-floor, approximately 300-room oceanfront luxury resort.**

All concept imagery and generated visuals of the main hotel building must communicate this:

- Tall, commanding waterfront presence
- Wide, substantial building massing
- Multiple floor levels clearly visible
- The building should dominate the oceanfront horizon — not sit quietly beside it

---

## 3. Architectural Reference Direction

**The authoritative building reference is the client's actual building render:**
`public/images/njs-reference/njs-real-building-reference-01.png`
(secondary angle: `njs-real-building-reference-02.png`)

All AI-generated building visuals must preserve from this reference:

- The overall massing and proportions — same building, not a lookalike
- The long horizontal accommodation wing
- The rhythmic rows of recessed balconies
- The tall glass side tower / vertical circulation feature
- Refined stone and concrete cladding panels
- The large glazed double-height podium base with warm interior lighting
- Clean, contemporary architectural lines

What generated media may change: the *setting* (Atlantic beachfront, tropical
landscaping, lighting mood) — never the building itself.

### Logo / signage placement

- The NJS logo/signage sits at the **top of the building** — upper façade /
  rooftop level of the main block
- It must NOT sit on the lower side wall or podium
- Style: premium hotel identity mark — clearly visible, elegant, large,
  classy and believable; never flashy or oversized

**On-building signage is a post-production / final architectural render item.**
AI video generation must NOT force signage or lettering onto the building:
tested 2026-07-02, signage prompts consistently trigger platform moderation
("nsfw" false positives) and AI-rendered text is unreliable regardless.
For Phase 1, the website branding, navbar logo, and hero copy carry the
brand identity — no generated signage required.

### Pool rule — rooftop only

- The **rooftop infinity pool is the resort's only signature pool experience**
- NO separate ground-level swimming pool at the base or front of the building
  in any generated visual
- Ground level must read as landscaped arrival: tropical gardens, palms,
  lit walkways, beachfront greenery, elegant frontage, access paths to shore
- If a pool appears in a hero visual, it is the rooftop pool — subtle and
  integrated into the top of the building, never competing at ground level

---

## 4. What to Avoid

Do NOT generate or select visuals that show the main hotel as:

| Avoid                          | Reason                                          |
|--------------------------------|-------------------------------------------------|
| Low-rise (1–3 floors)          | Misrepresents the actual building scale         |
| Boutique or villa-style        | Wrong brand category                            |
| Small intimate beach lodge     | Undersells the 300-room resort identity         |
| Bungalow or cabana clusters    | These are ancillary structures, not the main building |
| Generic tropical hotel imagery | Must feel specific to NJS Royale's premium tier |

---

## 5. Ocean-Facing Visual Rule

When generating or selecting any exterior or hero image:

- The Atlantic Ocean should face **a tall 9-floor resort building**, not a small structure
- Wide-angle exteriors should show the full height and width of the resort
- Drone-perspective or low-angle shots looking up at the building are preferred for hero use
- Evening / golden hour / dusk lighting preferred — warm interiors glowing, ocean in background

---

## 6. Concept Media Labelling

All AI-generated images and videos are **concept-stage media only**.

They must be:

- Treated as illustrative previews, not confirmed final renders
- Labelled in the UI as: `"Concept media for presentation purposes"` or `"Phase 1 Concept Visual"`
- Never presented as confirmed architectural renders or photography
- Not used as a substitute for actual photography or approved renders when available

This applies to the ConceptVideo section, hero video, gallery placeholders, and any Higgsfield-generated assets.

---

## 7. Hero Visual Criteria

A hero visual (video or image) is approved for use on the NJS Royale website if it:

- Shows or implies a large-scale, multi-storey oceanfront resort
- Carries a premium, calm, cinematic quality
- Uses navy, gold, sand, or tropical natural tones
- Has space for text overlay without visual clutter
- Feels aspirational and refined — not crowded or hyperactive

A hero visual is **rejected** if it:

- Shows a small, low-rise, or boutique-looking building
- Looks like a generic 3-star beach hotel
- Is too busy or fast-cutting for a luxury brand tone
- Lacks cinematic quality suitable for full-screen display

---

## 8. Gallery Visual Criteria

Gallery images must show:

- Grand interior spaces (entrance hall, lounge, bar, dining)
- Exterior architectural details at scale
- Rooftop leisure / infinity pool area
- Refined finishes — marble, glass, warm wood, ambient lighting

Gallery images should **not** show:

- Technical rooms, service corridors, storage areas
- Salon imagery with unrelated branding
- Unfinished or construction-phase views unless clearly labelled
- Images that confuse the resort identity

---

## 9. Higgsfield Generation Prompt Guidelines

When generating concept media via Higgsfield AI, the base prompt for the hotel building must include language such as:

```
9-floor large-scale oceanfront luxury resort, approximately 300 rooms,
modern multi-storey hotel facade, glass curtain walls, tiered balconies,
stone and concrete cladding, tropical landscaping, Atlantic Ocean waterfront,
commanding premium resort presence, cinematic dusk lighting
```

Always pass `njs-real-building-reference-01.png` as the reference image and
instruct the model to preserve the exact building architecture (see Section 3).

Additionally always include:
- Elegant NJS signage at the top of the building (upper façade / rooftop level)
- Rooftop infinity pool subtly integrated into the top of the building
- Explicitly: "no ground-level swimming pool anywhere in the scene"
- Ground level: landscaped arrival, gardens, palms, lit paths to the shoreline

Do not include:
- "boutique", "intimate", "villa", "bungalow", "low-rise", "small hotel"
- Anything that implies a smaller-than-9-floor structure for the main building
- Any separate pool, pool deck, or water feature at the base of the building

---

## 10. Design Palette Reference

| Token   | Hex       | Usage                              |
|---------|-----------|------------------------------------|
| Navy    | `#0A1628` | Primary background, overlays       |
| NavyDark| `#060E1A` | Deepest background sections        |
| Gold    | `#C9A84C` | Accent, CTA, eyebrow text          |
| Sand    | `#F5F0E8` | Light sections, card backgrounds   |
| Ivory   | `#FFFDF7` | Text on dark, subtle backgrounds   |

Typography: Cormorant Garamond (headings) · Inter (body, UI)

---

*Last updated: 2026-07-01*
*Applies to: website, Higgsfield generation, gallery, hero, all concept media*
