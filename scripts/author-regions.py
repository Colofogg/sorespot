#!/usr/bin/env python3
"""Hand-tuned body regions traced from the normalized photos.

Coordinates are pixels in the 416×1200 WebP images (head top at y=28,
feet at y=1172, head centered at x=208). Re-run after changing a cut:

  python3 scripts/author-regions.py
"""

from __future__ import annotations

import os
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BODY_DIR = os.path.join(ROOT, "public", "bodies")
OUT_TS = os.path.join(ROOT, "src", "components", "body", "regions.ts")
OVERLAY_DIR = os.path.join("/tmp", "sore-overlay")

W, H = 416, 1200
HEAD_Y = 28
FEET_Y = 1172
BODY = FEET_Y - HEAD_Y
CX = 208.0

# A pad this wide/tall is about 44px once the figure fills a 390px phone.
MIN_PAD = 86

# Paint order: later shapes win when two highlights overlap.
ORDER = [
    "neck",
    "shoulders",
    "upper-back",
    "mid-back",
    "lower-back",
    "chest",
    "abs",
    "hips-glutes-l",
    "hips-glutes-r",
    "quads-l",
    "quads-r",
    "hamstrings-l",
    "hamstrings-r",
    "calves-l",
    "calves-r",
    "knees-l",
    "knees-r",
    "ankles-l",
    "ankles-r",
    "it-band-l",
    "it-band-r",
    "soles-feet",
    "elbows-forearms",
    "wrists-hands",
]

FRONT_IDS = [
    "neck",
    "shoulders",
    "chest",
    "abs",
    "hips-glutes-l",
    "hips-glutes-r",
    "quads-l",
    "quads-r",
    "it-band-l",
    "it-band-r",
    "knees-l",
    "knees-r",
    "calves-l",
    "calves-r",
    "ankles-l",
    "ankles-r",
    "soles-feet",
    "elbows-forearms",
    "wrists-hands",
]
BACK_IDS = [
    "neck",
    "shoulders",
    "upper-back",
    "mid-back",
    "lower-back",
    "hips-glutes-l",
    "hips-glutes-r",
    "hamstrings-l",
    "hamstrings-r",
    "it-band-l",
    "it-band-r",
    "knees-l",
    "knees-r",
    "calves-l",
    "calves-r",
    "ankles-l",
    "ankles-r",
    "soles-feet",
    "elbows-forearms",
    "wrists-hands",
]
SIDE_IDS = [
    "neck",
    "shoulders",
    "chest",
    "upper-back",
    "abs",
    "mid-back",
    "lower-back",
    "hips-glutes-r",
    "quads-r",
    "hamstrings-r",
    "it-band-r",
    "knees-r",
    "calves-r",
    "ankles-r",
    "soles-feet",
    "elbows-forearms",
    "wrists-hands",
]
THREE_IDS = [
    "neck",
    "shoulders",
    "chest",
    "abs",
    "upper-back",
    "mid-back",
    "lower-back",
    "hips-glutes-l",
    "hips-glutes-r",
    "quads-l",
    "quads-r",
    "hamstrings-r",
    "it-band-l",
    "it-band-r",
    "knees-l",
    "knees-r",
    "calves-l",
    "calves-r",
    "ankles-l",
    "ankles-r",
    "soles-feet",
    "elbows-forearms",
    "wrists-hands",
]


def y_at(pct: float) -> int:
    return int(round(HEAD_Y + BODY * pct))


def load_mask(name: str) -> np.ndarray:
    im = Image.open(os.path.join(BODY_DIR, f"{name}.webp")).convert("RGBA")
    return np.array(im)[:, :, 3] > 48


def runs_of(row: np.ndarray, min_w: int = 14, gap: int = 8) -> list[tuple[int, int]]:
    cols = np.where(row)[0]
    if len(cols) == 0:
        return []
    breaks = np.where(np.diff(cols) > gap)[0]
    edges = [0, *(int(b) + 1 for b in breaks), len(cols)]
    out = []
    for i in range(len(edges) - 1):
        seg = cols[edges[i] : edges[i + 1]]
        if len(seg) >= min_w:
            out.append((int(seg[0]), int(seg[-1])))
    return out


def find_crotch(mask: np.ndarray) -> float:
    for pct_i in range(520, 700):
        pct = pct_i / 1000
        rs = runs_of(mask[y_at(pct)])
        wide = [r for r in rs if r[1] - r[0] >= 58]
        if len(wide) < 2:
            continue
        wide = sorted(wide, key=lambda r: (r[0] + r[1]) / 2)
        for i in range(len(wide) - 1):
            a, b = wide[i], wide[i + 1]
            gap = b[0] - a[1]
            mid = (a[1] + b[0]) / 2
            if 4 <= gap <= 48 and abs(mid - CX) < 46 and a[0] < CX < b[1]:
                return pct
    return 0.60


def arm_width(pct: float, span: float) -> float:
    t = (pct - 0.245) / (0.62 - 0.245)
    t = max(0.0, min(1.0, t))
    return min(28 + t * 18, span * 0.24)


def row_layout(row: np.ndarray, pct: float, crotch: float) -> dict[str, tuple[float, float]]:
    """Split one scanline into torso / arms / legs. Screen-left is L."""
    rs = runs_of(row)
    if not rs:
        return {}
    out: dict[str, tuple[float, float]] = {}

    if pct < crotch - 0.004:
        if pct < 0.245:
            x0 = min(r[0] for r in rs)
            x1 = max(r[1] for r in rs)
            out["torso"] = (x0, x1)
            return out
        widest = max(rs, key=lambda r: r[1] - r[0])
        arm_l = arm_r = None
        for r in rs:
            if r == widest:
                continue
            if (r[0] + r[1]) / 2 < (widest[0] + widest[1]) / 2:
                arm_l = r
            else:
                arm_r = r
        x0, x1 = float(widest[0]), float(widest[1])
        if arm_l is None:
            aw = arm_width(pct, x1 - x0)
            arm_l = (x0, x0 + aw)
            x0 = x0 + aw
        else:
            arm_l = (float(arm_l[0]), float(arm_l[1]))
        if arm_r is None:
            aw = arm_width(pct, x1 - x0)
            arm_r = (x1 - aw, x1)
            x1 = x1 - aw
        else:
            arm_r = (float(arm_r[0]), float(arm_r[1]))
        if x1 - x0 > 20:
            out["torso"] = (x0, x1)
        out["armL"] = arm_l
        out["armR"] = arm_r
        return out

    # Ankles are narrower than thighs, but they are still legs.
    min_leg = 22 if pct >= 0.78 else 46
    wide = [r for r in rs if r[1] - r[0] >= min_leg]
    narrow = [r for r in rs if r[1] - r[0] < min_leg]
    if len(wide) >= 2:
        pair = sorted(wide, key=lambda r: abs((r[0] + r[1]) / 2 - CX))[:2]
        pair = sorted(pair, key=lambda r: r[0])
        out["legL"] = (float(pair[0][0]), float(pair[0][1]))
        out["legR"] = (float(pair[1][0]), float(pair[1][1]))
    elif len(wide) == 1:
        x0, x1 = wide[0]
        mid = (x0 + x1) / 2
        out["legL"] = (float(x0), float(mid))
        out["legR"] = (float(mid), float(x1))
    for r in narrow:
        if (r[0] + r[1]) / 2 <= CX:
            out["armL"] = (float(r[0]), float(r[1]))
        else:
            out["armR"] = (float(r[0]), float(r[1]))
    return out


def smooth(edges: list[tuple[int, float, float]]) -> list[tuple[int, float, float]]:
    if len(edges) < 5:
        return edges
    ys = [e[0] for e in edges]
    x0 = np.array([e[1] for e in edges], dtype=float)
    x1 = np.array([e[2] for e in edges], dtype=float)
    kernel = np.array([1, 2, 3, 2, 1], dtype=float)
    kernel /= kernel.sum()

    def conv(a: np.ndarray) -> np.ndarray:
        return np.convolve(np.pad(a, 2, mode="edge"), kernel, mode="valid")

    s0, s1 = conv(x0), conv(x1)
    return [(ys[i], float(s0[i]), float(s1[i])) for i in range(len(ys))]


def poly_from_edges(edges: list[tuple[int, float, float]]) -> list[list[float]] | None:
    edges = [e for e in edges if e[2] - e[1] >= 8]
    if len(edges) < 3:
        return None
    edges = smooth(edges)
    sampled = [edges[0]]
    for e in edges[1:-1]:
        if e[0] - sampled[-1][0] >= 8:
            sampled.append(e)
    if edges[-1][0] != sampled[-1][0]:
        sampled.append(edges[-1])
    if len(sampled) < 3:
        return None
    left = [[round(x0, 1), y] for y, x0, _x1 in sampled]
    right = [[round(x1, 1), y] for y, _x0, x1 in sampled][::-1]
    return left + right


def clip_span(span: tuple[float, float] | None, f0: float, f1: float) -> tuple[float, float] | None:
    if span is None:
        return None
    x0, x1 = span
    w = x1 - x0
    if w < 8:
        return None
    a = x0 + w * f0
    b = x0 + w * f1
    if b - a < 6:
        return None
    return (a, b)


def collect(mask: np.ndarray, crotch: float, y0p: float, y1p: float, picker) -> list[list[float]] | None:
    y0, y1 = y_at(y0p), y_at(y1p)
    edges = []
    for y in range(y0, y1 + 1, 2):
        pct = (y - HEAD_Y) / BODY
        layout = row_layout(mask[y], pct, crotch)
        span = picker(layout)
        if span:
            edges.append((y, span[0], span[1]))
    return poly_from_edges(edges)


def sided(screen_left_is_person_right: bool, base: str, screen: str) -> str:
    if screen_left_is_person_right:
        suffix = "r" if screen == "L" else "l"
    else:
        suffix = "l" if screen == "L" else "r"
    return f"{base}-{suffix}"


def add(parts: dict[str, list], region_id: str, poly) -> None:
    if poly:
        parts[region_id].append(poly)


def author_bilateral(mask: np.ndarray, kind: str) -> dict[str, list]:
    """kind: front | back | three-quarter.

    On front and 3/4 the person's right is screen-left.
    On the back the person's right is screen-right.
    """
    crotch = find_crotch(mask)
    person_right_on_screen_left = kind != "back"
    parts: dict[str, list] = defaultdict(list)

    def torso(layout):
        return layout.get("torso")

    def arm(screen):
        return lambda layout: layout.get("armL" if screen == "L" else "armR")

    def leg(screen):
        return lambda layout: layout.get("legL" if screen == "L" else "legR")

    add(parts, "neck", collect(mask, crotch, 0.105, 0.168, torso))
    add(parts, "shoulders", collect(mask, crotch, 0.168, 0.248, torso))

    hip_end = crotch - 0.008
    hip_start = min(0.50, hip_end - 0.05)
    low_back_end = hip_start
    low_back_start = low_back_end - 0.07

    if kind == "front":
        add(parts, "chest", collect(mask, crotch, 0.248, 0.372, torso))
        add(parts, "abs", collect(mask, crotch, 0.372, hip_start, torso))
    elif kind == "back":
        add(parts, "upper-back", collect(mask, crotch, 0.248, 0.355, torso))
        add(parts, "mid-back", collect(mask, crotch, 0.355, low_back_start, torso))
        add(parts, "lower-back", collect(mask, crotch, low_back_start, low_back_end, torso))
    else:
        # 3/4: chest and stomach face us; the back is the screen-right edge.
        def torso_frac(f0, f1):
            return lambda layout: clip_span(layout.get("torso"), f0, f1)

        add(parts, "chest", collect(mask, crotch, 0.248, 0.372, torso_frac(0.0, 0.78)))
        add(parts, "upper-back", collect(mask, crotch, 0.22, 0.36, torso_frac(0.70, 1.0)))
        add(parts, "abs", collect(mask, crotch, 0.372, hip_start, torso_frac(0.0, 0.82)))
        add(parts, "mid-back", collect(mask, crotch, 0.36, low_back_start, torso_frac(0.74, 1.0)))
        add(parts, "lower-back", collect(mask, crotch, low_back_start, low_back_end, torso_frac(0.68, 1.0)))

    for screen in ("L", "R"):
        def hip_picker(layout, screen=screen):
            span = layout.get("torso")
            if span is None and "legL" in layout and "legR" in layout:
                span = (layout["legL"][0], layout["legR"][1])
            if span is None:
                return None
            mid = (span[0] + span[1]) / 2
            if screen == "L":
                return (span[0], mid)
            return (mid, span[1])

        add(
            parts,
            sided(person_right_on_screen_left, "hips-glutes", screen),
            collect(mask, crotch, hip_start, hip_end, hip_picker),
        )

    thigh_end = 0.748
    # Outer ~42% of each thigh is the IT band. The rest is quads (front) or hamstrings (back).
    for screen, outer_left in (("L", True), ("R", False)):
        def slice_leg(f_outer0, f_outer1, screen=screen, outer_left=outer_left):
            def picker(layout):
                span = layout.get("legL" if screen == "L" else "legR")
                if span is None:
                    return None
                x0, x1 = span
                w = x1 - x0
                if outer_left:
                    return (x0 + w * f_outer0, x0 + w * f_outer1)
                return (x1 - w * f_outer1, x1 - w * f_outer0)
            return picker

        thigh_id = "hamstrings" if kind == "back" else "quads"
        add(
            parts,
            sided(person_right_on_screen_left, thigh_id, screen),
            collect(mask, crotch, crotch, thigh_end, slice_leg(0.40, 1.0)),
        )
        add(
            parts,
            sided(person_right_on_screen_left, "it-band", screen),
            collect(mask, crotch, crotch, thigh_end, slice_leg(0.0, 0.46)),
        )
        if kind == "three-quarter" and screen == "L":
            # Near leg is the person's right. The inner/back edge of that thigh
            # is the hamstring; keep it clear of the quad's middle.
            add(
                parts,
                "hamstrings-r",
                collect(mask, crotch, crotch + 0.015, thigh_end - 0.02, slice_leg(0.78, 1.0)),
            )

    for base, y0, y1 in (
        ("knees", 0.738, 0.818),
        ("calves", 0.812, 0.902),
        ("ankles", 0.894, 0.948),
    ):
        for screen in ("L", "R"):
            add(
                parts,
                sided(person_right_on_screen_left, base, screen),
                collect(mask, crotch, y0, y1, leg(screen)),
            )

    for screen in ("L", "R"):
        add(parts, "soles-feet", collect(mask, crotch, 0.942, 0.998, leg(screen)))

    for screen in ("L", "R"):
        add(parts, "elbows-forearms", collect(mask, crotch, 0.248, 0.50, arm(screen)))
        add(parts, "wrists-hands", collect(mask, crotch, 0.495, 0.615, arm(screen)))

    return parts


def side_silhouette(mask: np.ndarray, y0p: float, y1p: float, f0: float, f1: float):
    edges = []
    for y in range(y_at(y0p), y_at(y1p) + 1, 2):
        rs = runs_of(mask[y], min_w=10)
        if not rs:
            continue
        x0, x1 = max(rs, key=lambda r: r[1] - r[0])
        w = x1 - x0
        edges.append((y, x0 + w * f0, x0 + w * f1))
    return poly_from_edges(edges)


def author_side(mask: np.ndarray) -> dict[str, list]:
    """Left-facing profile. The near side is the person's right.

    Fractions run from the front of the body (screen left, 0) to the back (1).
    The hand rests on the front of the hip, so the hand shape is painted above it.
    """
    # (id, y0, y1, front-fraction, back-fraction)
    bands = [
        ("neck", 0.10, 0.17, 0.18, 0.82),
        ("shoulders", 0.16, 0.26, 0.00, 1.00),
        ("chest", 0.24, 0.40, 0.16, 0.56),
        ("upper-back", 0.22, 0.37, 0.52, 1.00),
        ("abs", 0.38, 0.53, 0.26, 0.55),
        ("mid-back", 0.35, 0.49, 0.50, 1.00),
        ("lower-back", 0.46, 0.54, 0.55, 1.00),
        ("hips-glutes-r", 0.54, 0.66, 0.32, 1.00),
        ("elbows-forearms", 0.25, 0.50, 0.00, 0.26),
        ("wrists-hands", 0.48, 0.645, 0.00, 0.34),
        ("quads-r", 0.62, 0.76, 0.00, 0.38),
        ("hamstrings-r", 0.62, 0.76, 0.60, 1.00),
        ("it-band-r", 0.615, 0.765, 0.28, 0.72),
        ("knees-r", 0.745, 0.835, 0.00, 1.00),
        ("calves-r", 0.825, 0.915, 0.02, 0.98),
        ("ankles-r", 0.90, 0.955, 0.00, 1.00),
        ("soles-feet", 0.94, 1.00, 0.00, 1.00),
    ]
    parts: dict[str, list] = defaultdict(list)
    for region_id, y0, y1, f0, f1 in bands:
        add(parts, region_id, side_silhouette(mask, y0, y1, f0, f1))
    return parts


def bbox(poly: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    return min(xs), max(xs), min(ys), max(ys)


def pads_for(poly: list[list[float]]) -> list[dict]:
    minx, maxx, miny, maxy = bbox(poly)
    w, h = maxx - minx, maxy - miny
    if w >= MIN_PAD and h >= MIN_PAD:
        return []
    return [
        {
            "cx": round((minx + maxx) / 2, 1),
            "cy": round((miny + maxy) / 2, 1),
            "rx": round(max(w, MIN_PAD) / 2, 1),
            "ry": round(max(h, MIN_PAD) / 2, 1),
        }
    ]


def point_in_poly(x: float, y: float, poly: list[list[float]]) -> bool:
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y):
            xcross = (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi
            if x < xcross:
                inside = not inside
        j = i
    return inside


def in_ellipse(x, y, pad) -> bool:
    return ((x - pad["cx"]) / pad["rx"]) ** 2 + ((y - pad["cy"]) / pad["ry"]) ** 2 <= 1


def centroid(poly: list[list[float]]) -> tuple[float, float]:
    """A point that sits inside the band, not merely inside its bounding box."""
    n = len(poly)
    ax = sum(p[0] for p in poly) / n
    ay = sum(p[1] for p in poly) / n
    if point_in_poly(ax, ay, poly):
        return ax, ay
    a = poly[n // 4]
    b = poly[(3 * n) // 4]
    return (a[0] + b[0]) / 2, (a[1] + b[1]) / 2


def region_at(x: float, y: float, ordered: list[dict]) -> str | None:
    for part in reversed(ordered):
        for shape in part["shapes"]:
            if point_in_poly(x, y, shape):
                return part["id"]
    for part in reversed(ordered):
        for pad in part["pads"]:
            if in_ellipse(x, y, pad):
                return part["id"]
    return None


def finalize(parts: dict[str, list]) -> list[dict]:
    ordered = []
    seen = set()
    for region_id in ORDER:
        shapes = parts.get(region_id) or []
        if not shapes:
            continue
        seen.add(region_id)
        pads = []
        for shape in shapes:
            pads.extend(pads_for(shape))
        ordered.append({"id": region_id, "shapes": shapes, "pads": pads})
    extra = [k for k in parts if k not in seen and parts[k]]
    if extra:
        raise SystemExit(f"regions missing from ORDER: {extra}")
    return ordered


def check(name: str, ordered: list[dict], required: list[str]) -> list[str]:
    fails = []
    ids = [p["id"] for p in ordered]
    for region_id in required:
        if region_id not in ids:
            fails.append(f"{name}: missing {region_id}")
    for part in ordered:
        for shape in part["shapes"]:
            minx, maxx, miny, maxy = bbox(shape)
            if minx < -2 or maxx > W + 2 or miny < -2 or maxy > H + 2:
                fails.append(f"{name}: {part['id']} outside canvas ({minx:.0f},{miny:.0f})-({maxx:.0f},{maxy:.0f})")
            cx, cy = centroid(shape)
            hit = region_at(cx, cy, ordered)
            if hit != part["id"]:
                fails.append(f"{name}: center of {part['id']} at ({cx:.0f},{cy:.0f}) hits {hit}")
            w, h = maxx - minx, maxy - miny
            if w < 12 or h < 12:
                fails.append(f"{name}: {part['id']} shape is tiny {w:.0f}×{h:.0f}")
        for pad in part["pads"]:
            if pad["rx"] * 2 < MIN_PAD - 0.1 or pad["ry"] * 2 < MIN_PAD - 0.1:
                fails.append(f"{name}: pad {part['id']} under minimum")
    # Anatomical left/right: on the back, -l is screen-left. On front and 3/4, -r is.
    screen_left_suffix = "l" if name.endswith("back") else "r"
    for base in ("quads", "hamstrings", "it-band", "knees", "hips-glutes", "calves", "ankles"):
        left = next((p for p in ordered if p["id"] == f"{base}-{screen_left_suffix}"), None)
        other = "l" if screen_left_suffix == "r" else "r"
        right = next((p for p in ordered if p["id"] == f"{base}-{other}"), None)
        if not left or not right:
            continue
        lx = centroid(left["shapes"][0])[0]
        rx = centroid(right["shapes"][0])[0]
        if not lx < rx:
            fails.append(f"{name}: {left['id']} x={lx:.0f} is not screen-left of {right['id']} x={rx:.0f}")
    return fails


def emit_ts(all_parts: dict) -> None:
    lines = [
        "/**",
        " * Tap regions for the photographic bodies.",
        " * Points are pixels in the 416×1200 images (they scale with the photo).",
        " * Generated by scripts/author-regions.py — edit the cuts there, then re-run.",
        " */",
        "import type { Gender, ViewAngle } from '../../types'",
        "",
        "export const BODY_IMAGE = { width: 416, height: 1200 } as const",
        "",
        "export type Pt = [number, number]",
        "",
        "export interface HitPad {",
        "  cx: number",
        "  cy: number",
        "  rx: number",
        "  ry: number",
        "}",
        "",
        "export interface BodyPart {",
        "  id: string",
        "  /** Highlight drawn on the body. Later parts win overlaps. */",
        "  shapes: Pt[][]",
        "  /** Invisible near-miss pads so a small part still has a ~44px target. */",
        "  pads: HitPad[]",
        "}",
        "",
        "export const bodyParts: Record<Gender, Record<ViewAngle, BodyPart[]>> = {",
    ]

    def fmt_poly(poly: list[list[float]]) -> str:
        pts = ", ".join(f"[{p[0]}, {p[1]}]" for p in poly)
        return f"[{pts}]"

    for gender in ("male", "female"):
        lines.append(f"  {gender}: {{")
        for view in ("front", "three-quarter", "side", "back"):
            key = f"'{view}'" if view == "three-quarter" else view
            lines.append(f"    {key}: [")
            for part in all_parts[gender][view]:
                shapes = ", ".join(fmt_poly(s) for s in part["shapes"])
                pads = ", ".join(
                    f"{{ cx: {p['cx']}, cy: {p['cy']}, rx: {p['rx']}, ry: {p['ry']} }}"
                    for p in part["pads"]
                )
                lines.append(f"      {{ id: '{part['id']}', shapes: [{shapes}], pads: [{pads}] }},")
            lines.append("    ],")
        lines.append("  },")
    lines.append("}")
    lines.append("")
    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


COLORS = {
    "neck": (120, 90, 200),
    "shoulders": (40, 120, 200),
    "chest": (220, 80, 80),
    "abs": (230, 140, 40),
    "upper-back": (40, 90, 180),
    "mid-back": (30, 140, 160),
    "lower-back": (20, 120, 90),
    "hips-glutes": (180, 70, 160),
    "quads": (60, 160, 60),
    "hamstrings": (140, 90, 40),
    "it-band": (200, 60, 140),
    "knees": (80, 80, 200),
    "calves": (40, 150, 120),
    "ankles": (180, 140, 40),
    "soles-feet": (90, 90, 90),
    "elbows-forearms": (200, 120, 40),
    "wrists-hands": (180, 50, 50),
}


def base_id(region_id: str) -> str:
    for suffix in ("-l", "-r"):
        if region_id.endswith(suffix):
            return region_id[: -len(suffix)]
    return region_id


def render_overlay(name: str, ordered: list[dict]) -> None:
    os.makedirs(OVERLAY_DIR, exist_ok=True)
    photo = Image.open(os.path.join(BODY_DIR, f"{name}.webp")).convert("RGBA")
    bg = Image.new("RGBA", photo.size, (244, 247, 246, 255))
    bg.alpha_composite(photo)
    overlay = Image.new("RGBA", photo.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for part in ordered:
        color = COLORS.get(base_id(part["id"]), (0, 0, 0))
        for shape in part["shapes"]:
            flat = [tuple(p) for p in shape]
            draw.polygon(flat, fill=color + (110,), outline=color + (230,))
        for pad in part["pads"]:
            draw.ellipse(
                [
                    pad["cx"] - pad["rx"],
                    pad["cy"] - pad["ry"],
                    pad["cx"] + pad["rx"],
                    pad["cy"] + pad["ry"],
                ],
                outline=(255, 255, 255, 180),
            )
    bg.alpha_composite(overlay)
    rgb = bg.convert("RGB")
    label = ImageDraw.Draw(rgb)
    for part in ordered:
        if not part["shapes"]:
            continue
        cx, cy = centroid(part["shapes"][0])
        label.text((cx - 18, cy - 6), part["id"].replace("hips-glutes", "hip").replace("elbows-forearms", "arm").replace("wrists-hands", "hand").replace("it-band", "it"), fill=(0, 0, 0))
    rgb.resize((W // 2, H // 2), Image.Resampling.BILINEAR).save(
        os.path.join(OVERLAY_DIR, f"{name}.jpg"), quality=80
    )


def main() -> None:
    genders = ("male", "female")
    views = {
        "front": (author_bilateral, "front", FRONT_IDS),
        "back": (author_bilateral, "back", BACK_IDS),
        "three-quarter": (author_bilateral, "three-quarter", THREE_IDS),
        "side": (author_side, None, SIDE_IDS),
    }
    all_parts: dict = {g: {} for g in genders}
    fails: list[str] = []
    for gender in genders:
        for view, (fn, kind, required) in views.items():
            mask = load_mask(f"{gender}-{view}")
            raw = fn(mask) if kind is None else fn(mask, kind)
            ordered = finalize(raw)
            all_parts[gender][view] = ordered
            fails.extend(check(f"{gender} {view}", ordered, required))
            render_overlay(f"{gender}-{view}", ordered)
            crotch = find_crotch(mask) if view != "side" else None
            print(f"{gender} {view}: {len(ordered)} parts, crotch={crotch}")
    emit_ts(all_parts)
    print("wrote", OUT_TS)
    if fails:
        print(f"\n{len(fails)} CHECK FAILURES")
        for f in fails:
            print(" -", f)
        raise SystemExit(1)
    print("all geometric checks passed")


if __name__ == "__main__":
    main()
