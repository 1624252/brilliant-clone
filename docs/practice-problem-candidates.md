# Practice Problem Candidates

Research draft for LensLab practice expansion. These are original candidate problems inspired by reputable optics teaching sources, not copied problem text. They are meant for review before any lesson or code changes.

## Source Themes

- OpenStax Physics and University Physics: thin-lens equation, magnification, image distance, power, and object-position boundary cases.
- LibreTexts and HyperPhysics: three principal rays, ray trace-backs, and real versus virtual image formation.
- Physics Classroom: classroom-friendly lens equation practice, diverging-lens invariants, and common sign-convention traps.
- PhET/OER activity descriptions: inquiry patterns where learners move object distance, focal length, or screen position and explain what changes.
- Physics education misconception notes: students often think virtual images cannot be seen, half a lens makes half an image, rays are physical objects, or object-at-F produces a normal finite image.

## Fit With Current Lessons

The existing course already teaches:

- `focusing-light`: convex real/virtual/upright/inverted targets.
- `concave-lenses`: concave virtual/upright and impossible real/inverted targets.
- `convex-concave`: curvature sign and flat-lens behavior.
- `ray-tracing`: drawing three principal rays.
- `thin-lens-equation`: magnifier, projector, and concave minification setups.

The candidates below should add more depth without changing the subject scope.

## Candidate Problems

### 1. Convex Lens: The 2F Same-Size Check

- Best lesson fit: `focusing-light` or `thin-lens-equation`
- Step type: `interactive`
- Concept target: at `d_o = 2f`, a convex lens makes a real, inverted, same-size image at `d_i = 2f`.
- Prompt: Move the candle until the image is flipped, real, and exactly the same size as the object.
- Expected setup: convex lens with `f = 20`, target `d_o ~= 40`, `d_i ~= 40`, `m ~= -1`.
- Correct feedback: At `2F`, the object and image trade places symmetrically: real, inverted, and same size.
- Hint: If the image is smaller, the object is too far beyond `2F`. If it is larger, the object is between `F` and `2F`.
- Source inspiration: OpenStax, Physics Classroom, HyperPhysics object-position tables.

### 2. Convex Lens: Object at F

- Best lesson fit: `focusing-light`
- Step type: `predict`
- Concept target: at the focal point, outgoing rays are parallel and no finite image forms.
- Prompt: The candle is placed exactly at `F`. What should the image diagram show?
- Choices:
  - No finite image; the outgoing rays leave parallel. Correct.
  - A real image at `2F`. Incorrect: that happens when the object is at `2F`.
  - A virtual upright image near the candle. Incorrect: inside `F` gives virtual, but exactly at `F` is the boundary.
- Reveal: The thin-lens equation gives `1/d_i = 0`, so the image is at infinity; visually, the outgoing rays do not cross.
- Source inspiration: Physics Classroom converging-lens boundary case, OpenStax University Physics.

### 3. Convex Lens: Screen or No Screen

- Best lesson fit: `focusing-light` or `thin-lens-equation`
- Step type: `predict`
- Concept target: real images can be projected on a screen; virtual images cannot, though they can be seen through the lens.
- Prompt: You place a screen on the far side of a convex lens. Which candle position can make a sharp image on the screen?
- Choices:
  - Outside `F`. Correct.
  - Inside `F`. Incorrect: the image is virtual and on the object side.
  - Exactly at `F`. Incorrect: the image is at infinity, not on a nearby screen.
- Reveal: A screen works only where solid outgoing rays actually meet.
- Source inspiration: OpenStax real image examples, Physics Classroom sign conventions.

### 4. Convex Magnifier: Make It Larger Without Projecting

- Best lesson fit: `thin-lens-equation`
- Step type: `interactive`
- Concept target: convex magnifier regime: object inside `F`, virtual, upright, magnified.
- Prompt: Make the image upright and larger than the object, but keep it impossible to catch on a screen.
- Expected setup: `0 < d_o < f`, preferably near `F` from the inside.
- Correct feedback: This is the magnifying-glass setup: virtual, upright, and enlarged.
- Hint: Move inside `F`; then creep closer to `F` to increase magnification.
- Source inspiration: OpenStax magnifying glass examples, Physics Classroom sample problems.

### 5. Concave Lens: Can It Ever Magnify?

- Best lesson fit: `concave-lenses`
- Step type: `predict` or `interactive` with choices
- Concept target: for a real object, a concave lens always makes a virtual, upright, reduced image.
- Prompt: A student says, "If I move the object close enough to a concave lens, the image should become larger." Try it and decide.
- Choices:
  - No; it gets less reduced but never larger than the object. Correct.
  - Yes; inside `F` it becomes magnified. Incorrect: that is a convex-lens rule.
  - Yes; far away it becomes magnified. Incorrect: far away makes the image tiny near `F`.
- Reveal: With `f < 0` and real-object `d_o > 0`, the image distance remains negative and `0 < m < 1`.
- Source inspiration: Physics Classroom diverging lenses, HyperPhysics concave lens summary.

### 6. Concave Lens: Object at the Virtual F Distance

- Best lesson fit: `concave-lenses` or `thin-lens-equation`
- Step type: `predict`
- Concept target: unlike a convex lens at `F`, a concave lens with `d_o = |f|` still forms a finite virtual image.
- Prompt: A concave lens has `f = -20`. The candle is `20` units from the lens. Where is the image?
- Choices:
  - Halfway to the virtual focus on the object side. Correct.
  - At infinity. Incorrect: that is the convex object-at-F boundary.
  - At `2F` on the far side. Incorrect: a concave lens does not make a real image from a real object.
- Expected answer: `d_i = -10`, `m = 0.5`.
- Reveal: `1/d_i = 1/(-20) - 1/20 = -1/10`, so `d_i = -10`.
- Source inspiration: thin-lens equation calculators and concave-lens simulator explanations; should be verified against the local engine before implementation.

### 7. Ray Tracing: Find the Wrong Ray

- Best lesson fit: `ray-tracing`
- Step type: `predict` or future custom review step
- Concept target: learners distinguish the three principal ray rules.
- Prompt: In this convex-lens sketch, one ray is wrong. Which rule was broken?
- Options:
  - The parallel ray should leave through far `F`.
  - The chief ray should pass straight through the center.
  - The focal ray should leave parallel to the axis.
- Correct feedback: The rule names should explain the physical path, not just mark the answer.
- Hint: Check one ray at a time: before the lens, at the lens, after the lens.
- Source inspiration: LibreTexts, HyperPhysics, Physics Classroom ray-diagram methods.
- Implementation note: this may need either fixed visual choices or a small renderer extension; do not implement without review.

### 8. Ray Tracing: Virtual Back-Trace Check

- Best lesson fit: `ray-tracing`
- Step type: `plot-rays`
- Concept target: virtual images come from dotted back-traces, not solid ray crossings.
- Prompt: Concave lens: draw the rays and make the dotted back-traces meet at the image point.
- Expected setup: `d_o = 20`, `f = -20`, image at `d_i = -10`.
- Correct feedback: The solid rays spread apart; only their backward extensions meet.
- Hint: For the parallel ray, the outgoing ray should point away as if it came from near-side `F`.
- Source inspiration: Physics Classroom diverging ray diagrams, LibreTexts trace-back explanation.

### 9. Equation to Diagram: Match the Sign

- Best lesson fit: `thin-lens-equation`
- Step type: `predict`
- Concept target: `d_i < 0` means same side as object and virtual; `m > 0` means upright.
- Prompt: The equation panel shows `d_i = -15` and `m = +2.5`. Which diagram should appear?
- Choices:
  - Same-side, upright, enlarged image. Correct.
  - Opposite-side, inverted image. Incorrect: that would have positive `d_i` and negative `m`.
  - Same-side, inverted image. Incorrect: positive magnification means upright.
- Reveal: The signs encode the image type before you even look at the rays.
- Source inspiration: OpenStax, Physics Classroom sign convention tables.

### 10. Equation to Setup: Build a Projector

- Best lesson fit: `thin-lens-equation`
- Step type: `interactive`
- Concept target: projector requires a real magnified image: `f < d_o < 2f`.
- Prompt: Make the equation show a negative magnification whose magnitude is greater than `1`.
- Expected setup: convex lens, `20 < d_o < 40` when `f = 20`.
- Correct feedback: Negative means inverted; magnitude greater than `1` means enlarged. That is the projector range.
- Hint: Stay outside `F`, but move closer to `F` than `2F`.
- Source inspiration: OpenStax projector/real-image examples, Physics Classroom lens math.

### 11. Half-Covered Lens Misconception

- Best lesson fit: later review lesson or enrichment step
- Step type: `predict`
- Concept target: blocking half a lens dims the whole image; it does not remove half the image.
- Prompt: A card covers the top half of a convex lens that was making a real image. What happens to the image?
- Choices:
  - The whole image remains, but dimmer. Correct.
  - The top half of the image disappears. Incorrect: many rays from each object point still pass through the uncovered part.
  - The image flips upright. Incorrect: orientation is set by ray geometry, not by covering part of the lens.
- Reveal: Each point on the object sends many rays through different parts of the lens. Fewer rays means less brightness, not a cropped image.
- Source inspiration: Physics Classroom Teacher Toolkit, optics misconception literature.
- Implementation note: current renderer may not show aperture/brightness, so this is probably best as a predict-only misconception check first.

### 12. Virtual Images Can Be Seen

- Best lesson fit: `focusing-light` or a review step after `concave-lenses`
- Step type: `predict`
- Concept target: virtual images cannot be projected, but they are visible when looking through the lens.
- Prompt: The dotted back-traces meet on the object side. Which statement is true?
- Choices:
  - You can see the image through the lens, but cannot catch it on a screen there. Correct.
  - The image is imaginary and cannot be seen. Incorrect: virtual images are visible; they just are not formed by solid rays meeting there.
  - The image must be inverted. Incorrect: these LensLab virtual cases are upright.
- Reveal: "Virtual" means apparent ray origin, not fake or invisible.
- Source inspiration: Physics Classroom Teacher Toolkit, real/virtual image misconception notes.

## Suggested First Batch

If we add only a small number, the best first batch is:

1. Convex Lens: Object at F.
2. Convex Lens: The 2F Same-Size Check.
3. Concave Lens: Can It Ever Magnify?
4. Equation to Diagram: Match the Sign.
5. Half-Covered Lens Misconception.

This set adds high-value boundary and misconception practice without requiring new physics beyond the current chapter.

## Open Questions Before Implementation

- Should these become new steps inside the five current lessons, or a separate review/practice lesson after `thin-lens-equation`?
- Should we keep every candidate deterministic and hand-authored for MVP, with no generated content?
- Should sources be cited in developer docs only, or also surfaced in a learner-facing "references" section?
