---
name: character-prompt
description: Final character prompt specification — four-view live-action identity sheet (front body view / back body view / front head-and-shoulders close-up / right 45-degree head-and-shoulders close-up), serving as the appearance anchor for all subsequent generation
---

# Final Character Prompt (four-view live-action identity sheet)

What is generated is a character reference sheet with a fixed composition:

- **Left: front body view** — showing the body from below the shoulders to the soles, clearly showing the front body proportions, clothing, and visible accessories below the shoulders; the head, face, chin, ears, hair, and neck must be completely outside the frame
- **Middle: back body view** — showing the body from below the shoulders to the soles, clearly showing the back clothing structure and body proportions; the head, face, chin, ears, hair, and neck must be completely outside the frame
- **Right: two head-and-shoulders close-ups** — the front head close-up above and the right 45-degree head close-up below, clearly showing the same face, hairstyle, and skin texture

**Core principle: consistency > beauty.** This image is the appearance anchor for all subsequent character images and video references; it must be neutral, clear, and reusable — do not pursue the artistry of a single image.

## Output Structure (assemble a single coherent passage in this order, following the session language directive)

```
Character reference sheet, a seamless horizontal canvas naturally divided into three equal-width zones without divider lines.
The same character appears in four views: the left zone shows the front body view and the middle zone shows the back body view, both showing the body from below the shoulders to the soles with the head, face, chin, ears, hair, and neck completely outside the frame; the right zone stacks two head-and-shoulders close-ups, with the front head close-up above and the right 45-degree head close-up below;
[age impression + gender impression + physique], [facial features], [hairstyle], [clothing + accessories];
the same fictional human actor appears in all four views; the two body views share the same proportions, clothing, and necessary accessories, while the two close-ups share the same face, hairstyle, and skin texture;
pure white background, soft even lighting, cinematic quality
```

## Description Order Rules

Put the **most recognizable features first**, covering every key element of `appearance` (looks) and `styling` (hair/clothing/makeup) in this order, with no omissions:

1. Identity anchors: age impression (e.g. "early twenties"), gender impression, physique (height and build, posture habits)
2. Facial features: face shape, eyes, other notable features (scars, moles, glasses, etc.) — the front-face close-up depends on this part especially
3. Hairstyle: color, length, style
4. Clothing: style, color, material, condition (e.g. "a wrinkled work uniform with solder marks on the cuffs")
5. Accessories: write only the recognizable ones; do not pile them on

Convert the character's personality traits into outward bearing and expression descriptions (e.g. "haggard" → "weary eyes, slightly slumped shoulders"); personality words must not appear directly.

## Composition & Consistency

- Left front body view: from below the shoulders to the soles, neutral stance, with clothing structure, materials, and visible accessories below the shoulders clearly shown; the head, face, chin, ears, hair, and neck are completely outside the frame
- Middle back body view: from below the shoulders to the soles, the same height and spacing as the left body view, with the back clothing structure clearly shown; the head, face, chin, ears, hair, and neck are completely outside the frame
- Upper-right front head-and-shoulders close-up: facing the camera directly, neutral expression, top of head to shoulders fully in frame
- Lower-right right 45-degree head-and-shoulders close-up: showing the same character's right-side facial contour at 45 degrees, top of head to shoulders fully in frame
- All four views must belong to the same fictional human character; the two close-ups share the same face, hairstyle, and skin texture, and the two body views share the same proportions, clothing, and accessories
- Neutral stance, natural expression — easy to reuse as a reference image
- Soft, even studio lighting; no dramatic light and shadow (the reference image must work in every kind of scene)
- Do not mix unrelated words into the output

## Prohibitions

- Dynamic poses, exaggerated expressions, props in hand, being in frame with other people
- Incorrect cropping: both body views must show the body from below the shoulders to the soles, with the head, face, chin, ears, hair, and neck completely outside the frame; both head-and-shoulders close-ups must show the top of the head through the shoulders
- Text, labels, watermarks, signatures
- Heavy shadows, colored background lighting, background props

## Saving

Call `save_character_final_prompt`: the prompt parameter contains no style words — **the project's visual style is automatically injected by the tool at the very front of the final prompt**.
