import type { Point } from '../engine'

// Maps optical coordinates (origin at lens center, +x right, +y up) to SVG user
// space (origin top-left, +y down) and back. Kept pure so it can be unit-tested
// and shared by the renderer and the drag interaction.

export interface SceneParams {
  /** SVG user-space size (the viewBox). The element scales responsively via CSS. */
  viewWidth: number
  viewHeight: number
  /** Optical half-extents shown: x spans [-halfWidth, +halfWidth], y similarly. */
  halfWidth: number
  halfHeight: number
}

export const DEFAULT_SCENE: SceneParams = {
  viewWidth: 600,
  viewHeight: 400,
  halfWidth: 60,
  halfHeight: 40,
}

/** Pixels per optical unit. Same on both axes so the diagram isn't distorted. */
export function scaleOf(scene: SceneParams): number {
  return Math.min(
    scene.viewWidth / 2 / scene.halfWidth,
    scene.viewHeight / 2 / scene.halfHeight,
  )
}

/** Right edge of the scene in optical units; outgoing rays extend to here. */
export function sceneRightX(scene: SceneParams): number {
  return scene.halfWidth
}

/** Optical point -> SVG user-space point. */
export function toSvg(p: Point, scene: SceneParams): Point {
  const scale = scaleOf(scene)
  return {
    x: scene.viewWidth / 2 + p.x * scale,
    y: scene.viewHeight / 2 - p.y * scale,
  }
}

/** SVG user-space x -> optical x (used when dragging along the axis). */
export function svgXToOpticalX(svgX: number, scene: SceneParams): number {
  return (svgX - scene.viewWidth / 2) / scaleOf(scene)
}

/** SVG user-space y -> optical y (y grows downward in SVG, upward in optics). */
export function svgYToOpticalY(svgY: number, scene: SceneParams): number {
  return (scene.viewHeight / 2 - svgY) / scaleOf(scene)
}
