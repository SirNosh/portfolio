"use client";

/* eslint-disable react/no-unknown-property */

import { cn } from "@/lib/utils";
import { blendStudio, contactShadowMaterial, contactShadowTexture, createStudioEnvironment, isDarkTheme, watchTheme } from "@/lib/studio";
import { stage, subscribeDriven, toShelf } from "@/lib/stage";
import { Canvas, type ThreeEvent, useFrame, useThree, useLoader } from "@react-three/fiber";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface NewsletterBookPage {
  title: string;
  status?: string;
  workingTitle?: string;
  paragraphs?: string[];
  steps?: string[];
  more?: string[];
  roles?: [string, string][];
  layers?: [string, string][];
  decisions?: [string, string][];
  tiles?: [string, string][];
  quiet?: string;
  links?: { href: string; label: string }[];
  aside?: string;
  href?: string;
}

export interface NewsletterBookshelfItem {
  id: string;
  title: string;
  date: string;
  subtitle?: string;
  href?: string;
  color?: string;
  foil?: string;
  /** 0 = new, 1 = heavily worn: rubbed edges, bumped corners, faded spine, stains, rubbed foil. */
  wear?: number;
  pages?: NewsletterBookPage[];
}

export interface NewsletterBookshelfProps {
  items?: NewsletterBookshelfItem[];
  className?: string;
  height?: number | string;
  onSelect?: (item: NewsletterBookshelfItem, index: number) => void;
  onClose?: () => void;
}

type BookLayout = NewsletterBookshelfItem & {
  x: number;
  width: number;
  bookHeight: number;
  depth: number;
  motif: number;
  color: string;
  foil: string;
};

const PALETTE = [
  "#0b1e4b",
  "#16277a",
  "#2233b8",
  "#4040ff",
  "#6b7bff",
  "#9fb0ff",
  "#dce4ff",
  "#faf7ee",
  "#efe8d4",
  "#f4f2ec",
  "#25252a",
  "#3a3a40",
];

const defaultTitles = [
  "The systems issue",
  "A field guide to good taste",
  "The small team advantage",
  "Notes on building in public",
  "A better creative workflow",
  "The useful AI playbook",
  "Designing for momentum",
  "The quiet automation stack",
  "How ideas become products",
  "The founder's operating manual",
  "A week of useful experiments",
  "The leverage edition",
  "What we learned shipping early",
  "Tools worth keeping",
  "The case for fewer meetings",
  "A practical guide to agents",
  "Making software feel human",
  "The compounding details",
  "Build the smallest useful thing",
  "The creative director in your pocket",
  "Signals from the frontier",
  "A calmer way to move fast",
  "The prototype-first company",
  "Workflows that actually stick",
  "The one-person studio",
  "Notes from a strange future",
  "The high-agency handbook",
  "A new interface for work",
  "The craft issue",
  "Ideas with a pulse",
  "The independent builder",
  "A map for the next chapter",
];

export const defaultNewsletterBooks: NewsletterBookshelfItem[] =
  defaultTitles.map((title, index) => ({
    id: `edition-${defaultTitles.length - index}`,
    title,
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(Date.UTC(2026, 6, 31 - index * 7, 12)))
      .toUpperCase(),
    subtitle:
      "A concise collection of practical notes, experiments, and ideas for people building what comes next.",
  }));

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function luminance(hex: string) {
  const color = Number.parseInt(hex.slice(1), 16);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (
    channel((color >> 16) & 255) * 0.2126 +
    channel((color >> 8) & 255) * 0.7152 +
    channel(color & 255) * 0.0722
  );
}

function deriveLayout(items: NewsletterBookshelfItem[]) {
  let cursor = 0;
  return items.map<BookLayout>((item) => {
    const random = seeded(hash(item.id));
    const fallbackColor = PALETTE[Math.floor(random() * PALETTE.length)]!;
    const width = 0.34 + random() * 0.3;
    const bookHeight = 3.65 + (random() * 2 - 1) * 0.22;
    const color = item.color ?? fallbackColor;
    const foil =
      item.foil ?? (luminance(color) < 0.5 ? "#f2ead8" : "#3030ff");
    if (random() < 0.14) cursor += 0.2;
    const x = cursor + width / 2;
    cursor += width + bookHeight * 0.48;
    return {
      ...item,
      x,
      width,
      bookHeight,
      depth: bookHeight * 0.67,
      motif: Math.floor(random() * 8),
      color,
      foil,
    };
  });
}

function addTexture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
) {
  const image = context.getImageData(0, 0, width, height);
  const random = seeded(seed);
  for (let offset = 0; offset < image.data.length; offset += 4) {
    const noise = (random() - 0.5) * 5;
    image.data[offset] = Math.max(0, Math.min(255, image.data[offset]! + noise));
    image.data[offset + 1] = Math.max(0, Math.min(255, image.data[offset + 1]! + noise));
    image.data[offset + 2] = Math.max(0, Math.min(255, image.data[offset + 2]! + noise));
  }
  context.putImageData(image, 0, 0);
}

function paperTexture(book: BookLayout) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const random = seeded(hash(`${book.id}-paper`));

  context.fillStyle = mixColor("#eee9dc", "#e2d0ad", (book.wear ?? 0) * 0.8);
  context.fillRect(0, 0, canvas.width, canvas.height);
  addTexture(context, canvas.width, canvas.height, hash(`${book.id}-paper-noise`));

  for (let y = 0.5; y < canvas.height; y += 2) {
    const warm = Math.floor(116 + random() * 35);
    context.strokeStyle = `rgba(${warm}, ${warm - 6}, ${warm - 17}, ${0.09 + random() * 0.1})`;
    context.lineWidth = random() > 0.94 ? 1 : 0.42;
    context.beginPath();
    context.moveTo((random() - 0.5) * 4, y);
    context.bezierCurveTo(
      canvas.width * 0.33,
      y + (random() - 0.5) * 0.8,
      canvas.width * 0.66,
      y + (random() - 0.5) * 0.8,
      canvas.width + (random() - 0.5) * 4,
      y,
    );
    context.stroke();
  }

  for (let x = 0.5; x < canvas.width; x += 4) {
    context.strokeStyle = `rgba(124, 103, 72, ${0.025 + random() * 0.04})`;
    context.lineWidth = 0.35;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + (random() - 0.5) * 1.5, canvas.height);
    context.stroke();
  }

  for (let index = 0; index < 170; index += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    context.fillStyle = `rgba(112, 91, 59, ${0.025 + random() * 0.055})`;
    context.fillRect(x, y, 0.5 + random() * 1.2, 0.5 + random() * 2.5);
  }

  const edgeShade = context.createLinearGradient(0, 0, canvas.width, 0);
  edgeShade.addColorStop(0, "rgba(96,72,42,.2)");
  edgeShade.addColorStop(0.08, "rgba(138,112,72,.035)");
  edgeShade.addColorStop(0.5, "rgba(255,255,255,.16)");
  edgeShade.addColorStop(0.92, "rgba(138,112,72,.035)");
  edgeShade.addColorStop(1, "rgba(96,72,42,.18)");
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function coverTexture(atlas: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  canvas.getContext("2d")!.drawImage(atlas, 580, 350, 425, 665, 0, 0, 512, 768);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function endpaperTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const shade = context.createLinearGradient(0, 0, 512, 0);
  shade.addColorStop(0, "#eee7d9");
  shade.addColorStop(0.12, "#f4efe4");
  shade.addColorStop(0.92, "#f4efe4");
  shade.addColorStop(1, "#d9cebb");
  context.fillStyle = shade;
  context.fillRect(0, 0, 512, 512);
  const random = seeded(37);
  for (let index = 0; index < 9000; index += 1) {
    context.fillStyle = `rgba(99, 78, 48, ${random() * 0.035})`;
    context.fillRect(random() * 512, random() * 512, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paperGeometry(width: number, height: number) {
  const geometry = new THREE.PlaneGeometry(width, height, 32, 2);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const u = (position.getX(index) + width / 2) / width;
    position.setZ(index, Math.sin(u * Math.PI) * width * 0.014);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Atlas regions of hardcover.glb, in canvas pixels (the canvas is v-flipped against the glTF
// UVs). Each cover runs head (top) to tail; fore-edges sit at the outer x of each board.
const ATLAS = {
  back: { x0: 22, x1: 450 },
  spine: { x0: 452, x1: 568 },
  front: { x0: 572, x1: 988 },
  head: 352,
  tail: 1006,
  pages: { x0: 25, x1: 1000, y0: 24, y1: 319 },
};

function mixColor(from: string, to: string, amount: number) {
  return `#${new THREE.Color(from).lerp(new THREE.Color(to), THREE.MathUtils.clamp(amount, 0, 1)).getHexString()}`;
}

/**
 * Paints wear at `book.wear` (0..1) into either the colour atlas or its roughness map. Both
 * passes make the same random draws in the same order, so every rub, bump and stain lands on
 * the same texel in both maps; only the paint differs.
 */
function paintWear(context: CanvasRenderingContext2D, book: BookLayout, pass: "color" | "rough") {
  const wear = THREE.MathUtils.clamp(book.wear ?? 0, 0, 1);
  if (wear <= 0) return;
  const random = seeded(hash(`${book.id}-wear`));
  const paint = (color: string, rough: string) => (pass === "color" ? color : rough);
  const dab = (x: number, y: number, rx: number, ry: number, angle: number, alpha: number, color: string, rough: string) => {
    context.globalAlpha = THREE.MathUtils.clamp(alpha, 0, 1);
    context.fillStyle = paint(color, rough);
    context.beginPath();
    context.ellipse(x, y, Math.max(rx, 0.3), Math.max(ry, 0.3), angle, 0, Math.PI * 2);
    context.fill();
  };
  // A soft radial blob: overlapping many at low alpha builds wear that reads as worn cloth,
  // not as painted flecks.
  const glow = (x: number, y: number, radius: number, alpha: number, color: string, rough: string) => {
    const tone = paint(color, rough);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${tone}, ${THREE.MathUtils.clamp(alpha, 0, 1)})`);
    gradient.addColorStop(1, `rgba(${tone}, 0)`);
    context.globalAlpha = 1;
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };
  const PALE = "228, 214, 188";
  const GLOSS = "108, 108, 108";
  const { back, spine, front, head, tail } = ATLAS;
  const covers = [front, back];
  const foreOf = (cover: typeof front) => (cover === front ? cover.x1 : cover.x0);
  const inwardOf = (cover: typeof front) => (cover === front ? -1 : 1);
  context.save();

  // 1. Edge abrasion: cloth rubbed pale along each board's head, tail and fore-edge, spilling
  //    over onto the board-thickness strips just outside the cover.
  const edges = [
    ...covers.flatMap((cover) => [
      { x0: cover.x0, y0: head, x1: cover.x1, y1: head, nx: 0, ny: 1, weight: 1 },
      { x0: cover.x0, y0: tail, x1: cover.x1, y1: tail, nx: 0, ny: -1, weight: 1 },
      { x0: foreOf(cover), y0: head, x1: foreOf(cover), y1: tail, nx: inwardOf(cover), ny: 0, weight: 1.15 },
    ]),
    { x0: spine.x0, y0: head, x1: spine.x1, y1: head, nx: 0, ny: 1, weight: 1.4 },
    { x0: spine.x0, y0: tail, x1: spine.x1, y1: tail, nx: 0, ny: -1, weight: 1.4 },
    { x0: spine.x0, y0: head, x1: spine.x0, y1: tail, nx: 1, ny: 0, weight: 0.5 },
    { x0: spine.x1, y0: head, x1: spine.x1, y1: tail, nx: -1, ny: 0, weight: 0.5 },
  ];
  const reach = 6 + 34 * wear;
  for (const edge of edges) {
    const length = Math.hypot(edge.x1 - edge.x0, edge.y1 - edge.y0);
    // A continuous band: soft blobs every few pixels, mostly inside the cover, some spilling
    // onto the board-thickness strip outside it.
    const steps = Math.round(length / 5);
    for (let index = 0; index < steps; index += 1) {
      const t = (index + random()) / steps;
      const depth = (random() - 0.2) * reach * 0.5;
      const radius = 3 + random() * (6 + 16 * wear);
      glow(edge.x0 + (edge.x1 - edge.x0) * t + edge.nx * depth, edge.y0 + (edge.y1 - edge.y0) * t + edge.ny * depth,
        radius, (0.06 + random() * 0.14) * wear * edge.weight, PALE, GLOSS);
    }
    // Sparse fibres right at the edge, where the weave is broken.
    for (let index = 0; index < Math.round(110 * wear * edge.weight * (length / 654)); index += 1) {
      const t = random();
      const depth = (random() ** 3) * 10;
      const size = 0.6 + random() * 0.9;
      context.globalAlpha = (0.12 + random() * 0.25) * wear;
      context.fillStyle = paint(`rgb(${PALE})`, `rgb(${GLOSS})`);
      context.fillRect(edge.x0 + (edge.x1 - edge.x0) * t + edge.nx * depth, edge.y0 + (edge.y1 - edge.y0) * t + edge.ny * depth, size, size);
    }
  }

  // 2. Bumped corners: the board shows through at the fore-edge corners, with frayed cloth round it.
  const corners = covers.flatMap((cover) => [
    { x: foreOf(cover), y: head, sx: -inwardOf(cover), sy: 1 },
    { x: foreOf(cover), y: tail, sx: -inwardOf(cover), sy: -1 },
  ]);
  for (const corner of corners) {
    const size = (4 + 24 * wear) * (0.55 + random() * 0.9);
    const ox = corner.x + corner.sx * 2;
    const oy = corner.y - corner.sy * 2;
    if (wear > 0.25) {
      context.globalAlpha = 0.55 + 0.35 * wear;
      context.fillStyle = paint("#5f4b37", "#c8c8c8");
      context.beginPath();
      context.moveTo(ox, oy);
      for (let index = 0; index <= 10; index += 1) {
        const a = (index / 10) * Math.PI * 0.5;
        const r = size * (0.55 + random() * 0.6);
        context.lineTo(ox - corner.sx * Math.cos(a) * r, oy + corner.sy * Math.sin(a) * r);
      }
      context.closePath();
      context.fill();
    }
    for (let index = 0; index < Math.round(14 * wear); index += 1) {
      const a = random() * Math.PI * 0.5;
      const r = size * (0.6 + random() * 0.9);
      glow(ox - corner.sx * Math.cos(a) * r, oy + corner.sy * Math.sin(a) * r, 4 + random() * 9, (0.12 + random() * 0.16) * wear, PALE, GLOSS);
    }
  }

  // 3. Spine caps fray at head and tail, where a book is pulled from the shelf.
  for (const capY of [head, tail]) {
    const into = capY === head ? 1 : -1;
    const capReach = 8 + 44 * wear;
    for (let index = 0; index < Math.round(40 * wear); index += 1) {
      const x = spine.x0 + random() * (spine.x1 - spine.x0);
      const depth = (random() ** 1.6) * capReach;
      glow(x, capY + into * depth, 4 + random() * 10, (0.08 + random() * 0.14) * wear * (1 - depth / capReach), PALE, GLOSS);
    }
    if (wear > 0.5) {
      const x = spine.x0 + 20 + random() * (spine.x1 - spine.x0 - 40);
      dab(x, capY + into * 3, 6 + 10 * wear, 3 + 4 * wear, 0, 0.6, "#5a4634", "#c4c4c4");
    }
  }

  // 4. A sun-faded spine (the face a shelf exposes), with reading creases across it.
  if (pass === "color") {
    const fade = context.createLinearGradient(0, head, 0, tail);
    fade.addColorStop(0, `rgba(230, 216, 188, ${0.1 + 0.3 * wear})`);
    fade.addColorStop(1, `rgba(230, 216, 188, ${0.04 + 0.12 * wear})`);
    context.globalAlpha = 1;
    context.fillStyle = fade;
    context.fillRect(spine.x0, head, spine.x1 - spine.x0, tail - head);
  }
  for (let index = 0; index < Math.floor(wear * 8); index += 1) {
    const y = head + 50 + random() * (tail - head - 100);
    const wobble = [random(), random(), random()];
    context.globalAlpha = 0.18 + 0.3 * wear;
    context.strokeStyle = paint("#e9ddc4", "#787878");
    context.lineWidth = 0.8 + random() * 1.4;
    context.beginPath();
    context.moveTo(spine.x0 + 4, y);
    context.bezierCurveTo(spine.x0 + 40, y + (wobble[0]! - 0.5) * 6, spine.x1 - 40, y + (wobble[1]! - 0.5) * 6, spine.x1 - 4, y + (wobble[2]! - 0.5) * 4);
    context.stroke();
  }

  // 5. One faint cup ring on well-used books: partial, wobbly, darker where the liquid pooled,
  //    so it reads as a stain rather than a drawn circle.
  if (wear > 0.55) {
    const cover = covers[Math.floor(random() * covers.length)]!;
    const radius = 34 + random() * 26;
    const cx = cover.x0 + radius + 30 + random() * (cover.x1 - cover.x0 - 2 * radius - 60);
    const cy = head + radius + 60 + random() * (tail - head - 2 * radius - 120);
    const start = random() * Math.PI * 2;
    const sweep = Math.PI * (1.25 + random() * 0.6);
    const pooled = random() * Math.PI * 2;
    const segments = 48;
    for (let index = 0; index < segments; index += 1) {
      const a0 = start + (sweep * index) / segments;
      const a1 = start + (sweep * (index + 1)) / segments;
      const r = radius * (0.97 + random() * 0.06);
      const heavy = 0.5 + 0.5 * Math.cos(a0 - pooled);
      context.globalAlpha = (0.05 + 0.13 * heavy) * wear * (0.6 + random() * 0.4);
      context.strokeStyle = paint("#3b2816", "#9a9a9a");
      context.lineWidth = 1 + heavy * 3 * random();
      context.beginPath();
      context.arc(cx, cy, r, a0, a1);
      context.stroke();
    }
    if (pass === "color") {
      const tint = context.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.05);
      tint.addColorStop(0, "rgba(60, 40, 22, 0)");
      tint.addColorStop(0.85, `rgba(60, 40, 22, ${0.06 * wear})`);
      tint.addColorStop(1, "rgba(60, 40, 22, 0)");
      context.globalAlpha = 1;
      context.fillStyle = tint;
      context.fillRect(cx - radius * 1.1, cy - radius * 1.1, radius * 2.2, radius * 2.2);
    }
  }

  // 6. Scuffs: short, faint and grouped where a book gets handled, never long straight lines.
  for (let cluster = 0; cluster < Math.round(2 + 4 * wear); cluster += 1) {
    const cover = covers[Math.floor(random() * covers.length)]!;
    const cx = cover.x0 + 40 + random() * (cover.x1 - cover.x0 - 80);
    const cy = head + 60 + random() * (tail - head - 120);
    for (let index = 0; index < 1 + Math.round(7 * wear); index += 1) {
      const x = cx + (random() - 0.5) * 70;
      const y = cy + (random() - 0.5) * 70;
      const length = 3 + random() * 16;
      const angle = random() * Math.PI;
      const bend = (random() - 0.5) * 4;
      context.globalAlpha = (0.03 + random() * 0.06) * (0.6 + wear);
      context.strokeStyle = paint(`rgb(${PALE})`, `rgb(${GLOSS})`);
      context.lineWidth = 0.5 + random() * 0.6;
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + Math.cos(angle) * length / 2 - Math.sin(angle) * bend, y + Math.sin(angle) * length / 2 + Math.cos(angle) * bend,
        x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
  }

  // 7. Handling grime: perimeter darkening, heaviest where a hand holds the fore-edge.
  for (const cover of covers) {
    const fore = foreOf(cover);
    if (pass === "color") {
      const band = 54;
      const shade = `rgba(32, 24, 15, ${0.28 * wear})`;
      const gradients = [
        context.createLinearGradient(fore, 0, fore + inwardOf(cover) * band, 0),
        context.createLinearGradient(0, head, 0, head + band),
        context.createLinearGradient(0, tail, 0, tail - band),
      ];
      for (const gradient of gradients) {
        gradient.addColorStop(0, shade);
        gradient.addColorStop(1, "rgba(32, 24, 15, 0)");
        context.globalAlpha = 1;
        context.fillStyle = gradient;
        context.fillRect(cover.x0, head, cover.x1 - cover.x0, tail - head);
      }
    }
    for (let index = 0; index < (wear > 0.4 ? 2 : 0); index += 1) {
      const x = fore + inwardOf(cover) * (26 + random() * 30);
      const y = (head + tail) / 2 + (random() - 0.5) * 300;
      dab(x, y, 22 + random() * 14, 12 + random() * 8, Math.PI / 2 + (random() - 0.5) * 0.6, 0.06 * wear + 0.03, "#2a1f14", "#8c8c8c");
    }
  }

  // 8. Page edges tan and fox with age.
  const pages = ATLAS.pages;
  if (pass === "color") {
    context.globalCompositeOperation = "multiply";
    context.globalAlpha = 1;
    context.fillStyle = `rgba(214, 188, 140, ${0.18 + 0.5 * wear})`;
    context.fillRect(pages.x0, pages.y0, pages.x1 - pages.x0, pages.y1 - pages.y0);
    for (const [from, to] of [[pages.y0, pages.y0 + 40], [pages.y1, pages.y1 - 40]] as const) {
      const edge = context.createLinearGradient(0, from, 0, to);
      edge.addColorStop(0, `rgba(170, 128, 70, ${0.45 * wear})`);
      edge.addColorStop(1, "rgba(170, 128, 70, 0)");
      context.fillStyle = edge;
      context.fillRect(pages.x0, Math.min(from, to), pages.x1 - pages.x0, 40);
    }
    context.globalCompositeOperation = "source-over";
  }
  for (let index = 0; index < Math.round(140 * wear); index += 1) {
    dab(pages.x0 + random() * (pages.x1 - pages.x0), pages.y0 + random() * (pages.y1 - pages.y0),
      0.6 + random() * 2.2, 0.6 + random() * 2.2, 0, (0.1 + random() * 0.25) * wear, "#8a5a2c", "#b8b8b8");
  }
  context.restore();
}

/** Foil lettering and rules on their own layer, so `wear` can rub them away before compositing. */
function foilLayer(book: BookLayout) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  context.fillStyle = book.foil;
  context.strokeStyle = book.foil;
  context.textBaseline = "top";
  context.lineWidth = 1;
  context.globalAlpha = 0.65;
  context.strokeRect(610, 410, 332, 500);
  context.globalAlpha = 1;
  context.font = '400 42px "Departure Mono", "Fira Code", monospace';
  const words = book.title.split(" ");
  words.forEach((word, index) => context.fillText(word, 642, 486 + index * 52));
  context.font = '500 19px "Fira Code", ui-monospace, monospace';
  context.fillText("Dev Vyas", 642, 846);
  context.fillRect(476, 411, 72, 1);
  context.fillRect(476, 934, 72, 1);
  context.save();
  context.translate(526, 452);
  context.rotate(Math.PI / 2);
  context.font = '400 31px "Departure Mono", "Fira Code", monospace';
  context.fillText(book.title, 0, 0);
  context.restore();
  const intact = document.createElement("canvas");
  intact.width = intact.height = 1024;
  intact.getContext("2d")!.drawImage(canvas, 0, 0);
  const wear = THREE.MathUtils.clamp(book.wear ?? 0, 0, 1);
  if (wear > 0) {
    // Foil flakes off in specks and wears through in patches where hands rest.
    const random = seeded(hash(`${book.id}-foil`));
    context.globalCompositeOperation = "destination-out";
    for (let index = 0; index < Math.round(14000 * wear); index += 1) {
      context.globalAlpha = 0.35 + random() * 0.65;
      const size = 0.8 + random() * 2.4;
      context.fillRect(470 + random() * 520, 400 + random() * 560, size, size);
    }
    for (let index = 0; index < Math.round(10 * wear); index += 1) {
      const onSpine = index % 3 === 0;
      const x = onSpine ? 476 + random() * 72 : 470 + random() * 520;
      const y = 400 + random() * 560;
      const r = 8 + random() * 30 * wear;
      const patch = context.createRadialGradient(x, y, 0, x, y, r);
      patch.addColorStop(0, `rgba(0, 0, 0, ${0.4 + 0.5 * wear})`);
      patch.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.globalAlpha = 1;
      context.fillStyle = patch;
      context.fillRect(x - r, y - r, r * 2, r * 2);
    }
    context.globalCompositeOperation = "source-over";
  }
  return { intact, worn: canvas };
}

function hardcoverTexture(book: BookLayout, image: CanvasImageSource) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0, 1024, 1024);
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = 0.65;
  context.fillStyle = book.color;
  context.fillRect(0, 332, 1024, 692);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  paintWear(context, book, "color");
  const foil = foilLayer(book);
  // Where the foil has flaked, the stamped impression still shows faintly.
  context.globalAlpha = 0.2;
  context.drawImage(foil.intact, 0, 0);
  context.globalAlpha = 1;
  context.drawImage(foil.worn, 0, 0);

  // Roughness (read from green): cloth stays matte; rubbed cloth, foil and grease go glossier.
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = roughCanvas.height = 1024;
  const rough = roughCanvas.getContext("2d")!;
  rough.fillStyle = "#b8b8b8";
  rough.fillRect(0, 0, 1024, 1024);
  paintWear(rough, book, "rough");
  const foilRough = document.createElement("canvas");
  foilRough.width = foilRough.height = 1024;
  const foilRoughContext = foilRough.getContext("2d")!;
  foilRoughContext.drawImage(foil.worn, 0, 0);
  foilRoughContext.globalCompositeOperation = "source-in";
  foilRoughContext.fillStyle = "#585858";
  foilRoughContext.fillRect(0, 0, 1024, 1024);
  rough.drawImage(foilRough, 0, 0);

  const color = new THREE.CanvasTexture(canvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.anisotropy = 8;
  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.anisotropy = 8;
  return { canvas, color, roughness };
}

function damp(current: number, target: number, speed: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta));
}

const BOOK_ENTER_DURATION = 520;
const BOOK_CLOSE_DURATION = 620;
const BOOK_EXIT_DURATION = 1180;
const PAGE_CANVAS = { width: 1024, height: 1480 };

type PageLinkHit = {
  href: string;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
};

type PagePaint = {
  texture: THREE.CanvasTexture;
  links: PageLinkHit[];
};

type PageBlock =
  | { kind: "status"; text: string }
  | { kind: "title"; text: string; href?: string }
  | { kind: "working"; text: string }
  | { kind: "body"; text: string }
  | { kind: "pair"; name: string; detail: string }
  | { kind: "step"; text: string }
  | { kind: "quiet"; text: string }
  | { kind: "link"; label: string; href: string };

function pageBlocks(page: NewsletterBookPage): PageBlock[] {
  const blocks: PageBlock[] = [];
  if (page.status) blocks.push({ kind: "status", text: page.status });
  blocks.push({ kind: "title", text: page.title, href: page.href });
  if (page.workingTitle) blocks.push({ kind: "working", text: page.workingTitle });
  page.paragraphs?.forEach((text) => blocks.push({ kind: "body", text }));
  page.roles?.forEach(([name, detail]) => blocks.push({ kind: "pair", name, detail }));
  page.layers?.forEach(([name, detail]) => blocks.push({ kind: "pair", name, detail }));
  page.decisions?.forEach(([name, detail]) => blocks.push({ kind: "pair", name, detail }));
  page.tiles?.forEach(([name, detail]) => blocks.push({ kind: "pair", name, detail }));
  page.steps?.forEach((text) => blocks.push({ kind: "step", text }));
  page.more?.forEach((text) => blocks.push({ kind: "body", text }));
  if (page.quiet) blocks.push({ kind: "quiet", text: page.quiet });
  page.links?.forEach((link) => blocks.push({ kind: "link", label: link.label, href: link.href }));
  if (page.aside) blocks.push({ kind: "quiet", text: page.aside });
  return blocks;
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function paintPage(page: NewsletterBookPage, pageNumber: number, total: number, wear = 0): PagePaint {
  const { width, height } = PAGE_CANVAS;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    const empty = document.createElement("canvas");
    return { texture: new THREE.CanvasTexture(empty), links: [] };
  }

  const blocks = pageBlocks(page);
  const padX = 86;
  const padTop = 96;
  const padBottom = 118;
  const maxWidth = width - padX * 2;
  let scale = 1;
  let chosen: { y: number; draw: (ctx: CanvasRenderingContext2D) => PageLinkHit[] } | null = null;

  // Fine steps: monospace wraps ~25% more lines, so coarse steps overshoot the true fit.
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const titleSize = Math.round(84 * scale);
    const bodySize = Math.round(46 * scale);
    const smallSize = Math.round(28 * scale);
    const lineGap = Math.round(14 * scale);
    let y = padTop;
    const plan: { run: (ctx: CanvasRenderingContext2D, cursor: number) => { y: number; links: PageLinkHit[] } }[] = [];

    const pushText = (
      text: string,
      font: string,
      size: number,
      color: string,
      gap: number,
      href?: string,
      indent = 0,
    ) => {
      context.font = font;
      const lines = wrapText(context, text, maxWidth - indent);
      const blockTop = y;
      y += lines.length * Math.round(size * 1.28) + gap;
      const blockBottom = y;
      plan.push({
        run: (ctx, cursor) => {
          ctx.font = font;
          ctx.fillStyle = color;
          ctx.textBaseline = "top";
          ctx.textAlign = "left";
          const links: PageLinkHit[] = [];
          let lineY = cursor;
          lines.forEach((line) => {
            ctx.fillText(line, padX + indent, lineY);
            if (href) {
              const measured = ctx.measureText(line).width;
              const top = lineY - 8;
              const bottom = lineY + size + 16;
              links.push({
                href,
                u0: (padX + indent) / width,
                u1: (padX + indent + measured) / width,
                v1: 1 - top / height,
                v0: 1 - bottom / height,
              });
              ctx.strokeStyle = color;
              ctx.lineWidth = Math.max(2, size * 0.045);
              ctx.beginPath();
              ctx.moveTo(padX + indent, lineY + size + 4);
              ctx.lineTo(padX + indent + measured, lineY + size + 4);
              ctx.stroke();
            }
            lineY += Math.round(size * 1.28);
          });
          return { y: blockBottom, links };
        },
      });
      void blockTop;
    };

    for (const block of blocks) {
      if (block.kind === "status") {
        pushText(block.text.toUpperCase(), `500 ${smallSize}px "Fira Code", ui-monospace, monospace`, smallSize, "#6d645b", lineGap);
      } else if (block.kind === "title") {
        pushText(block.text, `400 ${titleSize}px "Departure Mono", "Fira Code", monospace`, titleSize, "#1b1916", Math.round(22 * scale), block.href);
      } else if (block.kind === "working") {
        pushText(block.text, `500 ${Math.round(bodySize * 0.92)}px "Fira Code", ui-monospace, monospace`, Math.round(bodySize * 0.92), "#3d3832", lineGap);
      } else if (block.kind === "body") {
        pushText(block.text, `400 ${bodySize}px "Fira Code", ui-monospace, monospace`, bodySize, "#241f1b", Math.round(18 * scale));
      } else if (block.kind === "pair") {
        pushText(block.name, `600 ${bodySize}px "Fira Code", ui-monospace, monospace`, bodySize, "#1b1916", Math.round(4 * scale));
        pushText(block.detail, `400 ${Math.round(bodySize * 0.86)}px "Fira Code", ui-monospace, monospace`, Math.round(bodySize * 0.86), "#3a342e", Math.round(12 * scale));
      } else if (block.kind === "step") {
        pushText(block.text, `500 ${bodySize}px "Fira Code", ui-monospace, monospace`, bodySize, "#241f1b", Math.round(8 * scale));
      } else if (block.kind === "quiet") {
        pushText(block.text, `400 ${Math.round(bodySize * 0.86)}px "Fira Code", ui-monospace, monospace`, Math.round(bodySize * 0.86), "#5e564c", Math.round(16 * scale));
      } else if (block.kind === "link") {
        y += Math.round(8 * scale);
        pushText(block.label, `600 ${Math.round(bodySize * 0.95)}px "Fira Code", ui-monospace, monospace`, Math.round(bodySize * 0.95), "#1b1916", Math.round(12 * scale), block.href);
      }
    }

    if (y <= height - padBottom || scale < 0.64) {
      chosen = {
        y,
        draw: (ctx) => {
          const links: PageLinkHit[] = [];
          let cursor = padTop;
          for (const item of plan) {
            const next = item.run(ctx, cursor);
            cursor = next.y;
            links.push(...next.links);
          }
          return links;
        },
      };
      if (y <= height - padBottom) break;
    }
    scale *= 0.95;
    y = padTop;
  }

  context.fillStyle = mixColor("#f4efe4", "#ecdcbc", wear * 0.7);
  context.fillRect(0, 0, width, height);
  const grain = context.createLinearGradient(0, 0, width, 0);
  grain.addColorStop(0, "rgba(92, 68, 40, 0.18)");
  grain.addColorStop(0.045, "rgba(92, 68, 40, 0.04)");
  grain.addColorStop(0.5, "rgba(255, 255, 255, 0.18)");
  grain.addColorStop(1, "rgba(92, 68, 40, 0.06)");
  context.fillStyle = grain;
  context.fillRect(0, 0, width, height);

  context.beginPath();
  context.moveTo(width - 92, height);
  context.lineTo(width, height - 92);
  context.lineTo(width, height);
  context.closePath();
  context.fillStyle = "#e5d9c4";
  context.fill();
  context.strokeStyle = "rgba(92, 68, 40, 0.45)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width - 92, height);
  context.lineTo(width, height - 92);
  context.stroke();

  const links = chosen?.draw(context) ?? [];

  context.fillStyle = "#8b8174";
  context.font = '500 28px "Fira Code", ui-monospace, monospace';
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillText(String(pageNumber + 1), width - 78, height - 58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { texture, links };
}

function openExternal(href: string) {
  try {
    const destination = new URL(href, window.location.href);
    if (destination.protocol !== "http:" && destination.protocol !== "https:") return;
    window.open(destination.href, "_blank", "noopener,noreferrer");
  } catch {
    // Ignore malformed destinations.
  }
}

function hitLink(links: PageLinkHit[], uv: THREE.Vector2) {
  return links.find(
    (link) =>
      uv.x >= Math.min(link.u0, link.u1) &&
      uv.x <= Math.max(link.u0, link.u1) &&
      uv.y >= Math.min(link.v0, link.v1) &&
      uv.y <= Math.max(link.v0, link.v1),
  );
}

function bezierCoordinate(t: number, point1: number, point2: number) {
  const inverse = 1 - t;
  return (
    3 * inverse * inverse * t * point1 +
    3 * inverse * t * t * point2 +
    t * t * t
  );
}

function easeSmoothOut(progress: number) {
  let t = progress;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const x = bezierCoordinate(t, 0.22, 0.36);
    const inverse = 1 - t;
    const slope =
      3 * inverse * inverse * 0.22 +
      6 * inverse * t * (0.36 - 0.22) +
      3 * t * t * (1 - 0.36);
    if (Math.abs(slope) < 0.0001) break;
    t = THREE.MathUtils.clamp(t - (x - progress) / slope, 0, 1);
  }
  return bezierCoordinate(t, 1, 1);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - ((-2 * progress + 2) ** 3) / 2;
}

function Book({
  book,
  index,
  hovered,
  selected,
  hidden,
  reducedMotion,
  cameraX,
  orbit,
  studioMix,
  pageIndex,
  fontsReady,
  onHover,
  onSelect,
  onTurnPage,
  onRest,
  onTurnComplete,
}: {
  book: BookLayout;
  index: number;
  hovered: boolean;
  selected: boolean;
  hidden: boolean;
  reducedMotion: boolean;
  cameraX: React.MutableRefObject<number>;
  orbit: React.MutableRefObject<{ yaw: number; pitch: number }>;
  studioMix: React.MutableRefObject<number>;
  pageIndex: number;
  fontsReady: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onTurnPage: (index: number, delta: number) => void;
  onRest: () => void;
  onTurnComplete: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const contact = useRef<THREE.Mesh>(null);
  const contactMaterial = useMemo(() => contactShadowMaterial(contactShadowTexture()), []);
  const hardcover = useLoader(GLTFLoader, import.meta.env.BASE_URL + "assets/models/hardcover.glb");
  const [diffuse, normal] = useLoader(THREE.TextureLoader, [
    import.meta.env.BASE_URL + "assets/models/book-hardcover-diffuse.jpg",
    import.meta.env.BASE_URL + "assets/models/book-hardcover-normal.jpg",
  ]);
  const group = useRef<THREE.Group>(null);
  const closedRef = useRef<THREE.Mesh>(null);
  const openRig = useRef<THREE.Group>(null);
  const coverHinge = useRef<THREE.Group>(null);
  const flipHinge = useRef<THREE.Group>(null);
  const openT = useRef(0);
  const flipT = useRef(0);
  const flipDone = useRef(false);
  const [shown, setShown] = useState(0);
  const [flip, setFlip] = useState<{ from: number; to: number; dir: 1 | -1 } | null>(null);
  const hasPages = (book.pages?.length ?? 0) > 0;
  const pageW = book.depth * 0.96;
  const pageH = book.bookHeight * 0.96;
  const pageGeometry = useMemo(() => paperGeometry(pageW, pageH), [pageW, pageH]);
  const turnGeometry = useMemo(() => paperGeometry(pageW, pageH), [pageW, pageH]);
  const focusFlight = useRef<{
    startedAt: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: number;
  } | null>(null);
  const exitFlight = useRef<{
    startedAt: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: number;
    openness: number;
  } | null>(null);
  const selectedAt = useRef(0);
  const wasSelected = useRef(false);
  const textures = useMemo(() => {
    void fontsReady;
    const hardcover = hardcoverTexture(book, diffuse.image);
    return {
      atlas: hardcover.color,
      roughness: hardcover.roughness,
      cover: coverTexture(hardcover.canvas),
      paper: paperTexture(book),
      endpaper: endpaperTexture(),
    };
  }, [book, diffuse, fontsReady]);

  const geometry = useMemo(() => {
    const mesh = hardcover.scene.getObjectByName("hardcover") as THREE.Mesh;
    const geometry = mesh.geometry.clone();
    // Wear in the unit box (x: covers at +-0.5, y: height, z: spine +0.5, fore-edge -0.5): boards
    // cup outward toward the fore-edge, and the fore-edge corners soften where they were knocked.
    // Original normals stay, so the shading isn't faceted.
    const wear = THREE.MathUtils.clamp(book.wear ?? 0, 0, 1);
    if (wear > 0) {
      const random = seeded(hash(`${book.id}-shape`));
      const dents = [-0.5, 0.5].map((y) => ({ y, depth: wear > 0.3 ? (0.4 + random() * 0.6) * wear : 0 }));
      const position = geometry.attributes.position;
      for (let index = 0; index < position.count; index += 1) {
        let x = position.getX(index);
        let y = position.getY(index);
        let z = position.getZ(index);
        if (Math.abs(x) > 0.4) x += Math.sign(x) * 0.06 * wear * (0.5 - z) * Math.sin(Math.PI * (y + 0.5));
        for (const dent of dents) {
          const falloff = Math.max(0, 1 - Math.hypot((y - dent.y) / 0.08, (z + 0.5) / 0.06));
          z += falloff * falloff * 0.05 * dent.depth;
          y -= Math.sign(dent.y) * falloff * falloff * 0.03 * dent.depth;
        }
        position.setXYZ(index, x, y, z);
      }
      position.needsUpdate = true;
    }
    geometry.scale(book.width, book.bookHeight, book.depth);
    geometry.computeBoundingSphere();
    return geometry;
  }, [hardcover, book.bookHeight, book.depth, book.id, book.wear, book.width]);

  const paints = useMemo(() => {
    if (!hasPages || typeof document === "undefined") return [];
    void fontsReady;
    return (book.pages ?? []).map((page, pageNumber, all) =>
      paintPage(page, pageNumber, all.length, book.wear ?? 0),
    );
  }, [book.pages, book.wear, fontsReady, hasPages]);

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((texture) => texture?.dispose());
      geometry.dispose();
      pageGeometry.dispose();
      turnGeometry.dispose();
    };
  }, [geometry, textures, pageGeometry, turnGeometry]);

  useEffect(() => () => {
    contactMaterial.alphaMap?.dispose();
    contactMaterial.dispose();
  }, [contactMaterial]);

  useEffect(() => {
    if (openRig.current) openRig.current.visible = false;
    return () => {
      paints.forEach((paint) => paint.texture.dispose());
    };
  }, [paints]);

  useEffect(() => {
    if (!selected) {
      setFlip(null);
      flipDone.current = false;
      return;
    }
    if (flip || pageIndex === shown) return;
    flipDone.current = false;
    flipT.current = 0;
    setFlip({
      from: shown,
      to: pageIndex,
      dir: pageIndex > shown ? 1 : -1,
    });
  }, [flip, pageIndex, selected, shown]);

  useEffect(() => {
    const node = group.current;
    if (selected && node) {
      setShown(pageIndex);
      setFlip(null);
      selectedAt.current = performance.now();
      focusFlight.current = {
        startedAt: selectedAt.current,
        position: node.position.clone(),
        rotation: node.rotation.clone(),
        scale: node.scale.x,
      };
      exitFlight.current = null;
    } else if (wasSelected.current && node) {
      exitFlight.current = {
        startedAt: performance.now(),
        position: node.position.clone(),
        rotation: node.rotation.clone(),
        scale: node.scale.x,
        openness: openT.current,
      };
      focusFlight.current = null;
    } else {
      focusFlight.current = null;
    }
    wasSelected.current = selected;
  }, [selected]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const motion = reducedMotion ? 1000 : selected ? 7 : 11;
    const perspective = camera as THREE.PerspectiveCamera;
    const portrait = perspective.aspect < 0.9;
    const openShift = 0;
    const targetX = selected ? cameraX.current + openShift : book.x;
    const targetZ = selected ? (portrait ? 2.7 : 3.45) : hovered ? 0.22 : 0;
    const targetY = selected ? 1.88 + targetZ * 0.17 : book.bookHeight / 2 + (hovered ? 0.25 : 0);
    const distance = Math.max(0.8, perspective.position.z - targetZ);
    const visibleHeight =
      2 * Math.tan((((perspective.fov || 35) * Math.PI) / 180) / 2) * distance;
    const visibleWidth = visibleHeight * Math.max(perspective.aspect, 0.2);
    const footprint = portrait ? book.depth * 1.05 : book.depth * 2.05;
    const fit = Math.min(
      (visibleHeight * 0.76) / book.bookHeight,
      (visibleWidth * 0.86) / footprint,
    );
    const targetScale = selected ? Math.max(0.2, fit) : 1;
    const targetRotationY = selected ? -Math.PI / 2 + 0.05 + orbit.current.yaw : -1.05;
    const targetRotationX = selected ? -0.12 + orbit.current.pitch : 0;

    const flight = selected ? focusFlight.current : null;
    if (flight) {
      const progress = reducedMotion
        ? 1
        : Math.min(
            1,
            (performance.now() - flight.startedAt) / BOOK_ENTER_DURATION,
          );
      const depthProgress = easeSmoothOut(progress);
      const travelProgress = easeSmoothOut(
        THREE.MathUtils.clamp((progress - 0.06) / 0.94, 0, 1),
      );
      const turnProgress = easeInOutCubic(progress);
      const depthArc = Math.sin(Math.PI * progress) * 0.12;
      node.position.set(
        THREE.MathUtils.lerp(flight.position.x, targetX, travelProgress),
        THREE.MathUtils.lerp(flight.position.y, targetY, travelProgress),
        THREE.MathUtils.lerp(flight.position.z, targetZ, depthProgress) +
          depthArc,
      );
      node.rotation.x = THREE.MathUtils.lerp(
        flight.rotation.x,
        targetRotationX,
        turnProgress,
      );
      node.rotation.y = THREE.MathUtils.lerp(
        flight.rotation.y,
        targetRotationY,
        turnProgress,
      );
      node.rotation.z = THREE.MathUtils.lerp(
        flight.rotation.z,
        0,
        turnProgress,
      );
      const scale = THREE.MathUtils.lerp(
        flight.scale,
        targetScale,
        turnProgress,
      );
      node.scale.setScalar(scale);
      if (progress >= 1) focusFlight.current = null;
    } else if (!selected && exitFlight.current) {
      const exit = exitFlight.current;
      const progress = reducedMotion
        ? 1
        : Math.min(
            1,
            (performance.now() - exit.startedAt) / BOOK_EXIT_DURATION,
          );
      const travel = THREE.MathUtils.clamp(
        (progress * BOOK_EXIT_DURATION - BOOK_CLOSE_DURATION) / (BOOK_EXIT_DURATION - BOOK_CLOSE_DURATION), 0, 1,
      );
      const alignProgress = easeInOutCubic(travel);
      const slotProgress = alignProgress;
      node.position.set(
        THREE.MathUtils.lerp(exit.position.x, book.x, alignProgress),
        THREE.MathUtils.lerp(
          exit.position.y,
          book.bookHeight / 2,
          alignProgress,
        ),
        THREE.MathUtils.lerp(exit.position.z, 0, slotProgress),
      );
      node.rotation.x = THREE.MathUtils.lerp(
        exit.rotation.x,
        0,
        alignProgress,
      );
      node.rotation.y = THREE.MathUtils.lerp(
        exit.rotation.y,
        -1.05,
        alignProgress,
      );
      node.rotation.z = THREE.MathUtils.lerp(
        exit.rotation.z,
        0,
        alignProgress,
      );
      const scale = THREE.MathUtils.lerp(exit.scale, 1, alignProgress);
      node.scale.setScalar(scale);
      const closing = THREE.MathUtils.clamp(progress * BOOK_EXIT_DURATION / BOOK_CLOSE_DURATION, 0, 1);
      openT.current = exit.openness * (1 - easeInOutCubic(closing));
      if (progress >= 1) {
        exitFlight.current = null;
        onRest();
      }
    } else {
      node.position.x = damp(node.position.x, targetX, motion, delta);
      node.position.y = damp(node.position.y, targetY, motion, delta);
      node.position.z = damp(node.position.z, targetZ, motion, delta);
      node.rotation.y = damp(node.rotation.y, targetRotationY, motion, delta);
      node.rotation.x = damp(node.rotation.x, targetRotationX, motion, delta);
      const nextScale = damp(node.scale.x, targetScale, motion, delta);
      node.scale.setScalar(nextScale);
    }
    if (contact.current) {
      // Occlusion softens on hover lift and clears when the book is picked up.
      const lift = THREE.MathUtils.clamp(Math.max((node.position.y - book.bookHeight / 2) / 0.6, node.position.z / 1.2), 0, 1);
      const spread = 1 + lift * 0.5;
      contactMaterial.opacity = blendStudio(studioMix.current).contact * (1 - lift);
      contact.current.visible = contactMaterial.opacity > 0.002;
      contact.current.rotation.y = node.rotation.y;
      contact.current.scale.set(book.width * 2 * spread, book.depth * 2 * spread, 1);
    }

    const openTarget = selected && hasPages ? 1 : 0;
    if (!exitFlight.current) openT.current = damp(openT.current, openTarget, reducedMotion ? 1000 : 5, delta);
    const opened = THREE.MathUtils.clamp(openT.current, 0, 1);
    if (coverHinge.current) {
      coverHinge.current.rotation.y = Math.PI * (1 - opened);
      coverHinge.current.position.x = book.width / 2 - 0.035 - opened * 0.067;
      coverHinge.current.visible = !portrait || opened < 0.98;
    }
    if (closedRef.current) {
      const showClosed = !hasPages || opened < 0.002;
      closedRef.current.visible = showClosed;
      closedRef.current.raycast = showClosed ? THREE.Mesh.prototype.raycast : () => {};
    }
    if (openRig.current) {
      openRig.current.visible = hasPages && opened >= 0.002;
      openRig.current.position.z = book.depth * 0.5 * (portrait ? 1 : 1 - opened);
    }
    if (flip && flipHinge.current) {
      flipT.current = Math.min(1, flipT.current + (reducedMotion ? 1 : Math.min(delta, 0.05) / 0.85));
      const eased = easeInOutCubic(flipT.current);
      const turn = flip.dir === 1 ? eased : 1 - eased;
      flipHinge.current.rotation.y = -Math.PI * turn;
      const position = turnGeometry.attributes.position;
      const bend = Math.cos(turn * Math.PI) * 0.014 + Math.sin(turn * Math.PI) * 0.14;
      for (let vertex = 0; vertex < position.count; vertex += 1) {
        const u = (position.getX(vertex) + pageW / 2) / pageW;
        position.setZ(vertex, Math.sin(u * Math.PI) * pageW * bend);
      }
      position.needsUpdate = true;
      turnGeometry.computeVertexNormals();
      if (flipT.current >= 1 && !flipDone.current) {
        flipDone.current = true;
        const destination = flip.to;
        setShown(destination);
        setFlip(null);
        onTurnComplete();
      }
    }
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(index);
  };

  const baseIndex = !flip ? shown : flip.dir === 1 ? flip.to : flip.from;
  const flipIndex = flip ? (flip.dir === 1 ? flip.from : flip.to) : shown;
  const basePaint = paints[Math.min(baseIndex, Math.max(paints.length - 1, 0))];
  const flipPaint = paints[Math.min(flipIndex, Math.max(paints.length - 1, 0))];

  const onPageClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!selected || flip || openT.current < 0.72) return;
    const local = event.object.worldToLocal(event.point.clone());
    const u = THREE.MathUtils.clamp((local.x + pageW / 2) / pageW, 0, 1);
    const v = THREE.MathUtils.clamp((local.y + pageH / 2) / pageH, 0, 1);
    const paint = paints[shown];
    if (paint) {
      const link = hitLink(paint.links, new THREE.Vector2(u, v));
      if (link) {
        openExternal(link.href);
        return;
      }
    }
    onTurnPage(index, u < 0.14 ? -1 : 1);
  };

  if (hidden) return null;

  const raycastOpen: THREE.Mesh["raycast"] = function (raycaster, intersections) {
    if (openRig.current?.visible && this.parent?.visible) {
      THREE.Mesh.prototype.raycast.call(this, raycaster, intersections);
    }
  };

  return (
    <>
    <mesh ref={contact} position={[book.x, 0.003, 0]} rotation={[-Math.PI / 2, -1.05, 0, "YXZ"]} material={contactMaterial} visible={false} raycast={() => {}}>
      <planeGeometry args={[1, 1]} />
    </mesh>
    <group
      ref={group}
      position={[book.x, book.bookHeight / 2, 0]}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover(index);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={select}
    >
      <mesh ref={closedRef} name="closed-book" geometry={geometry} castShadow receiveShadow renderOrder={selected ? 20 : 0}>
        <meshPhysicalMaterial
          map={textures.atlas}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.7, 0.7)}
          roughnessMap={textures.roughness}
          roughness={1}
          sheen={0.18}
          sheenRoughness={0.85}
          metalness={0.02}
          depthTest={!selected}
          depthWrite={!selected}
        />
      </mesh>
      {hasPages ? (
        <group ref={openRig}>
          <mesh position={[-book.width / 2 + 0.035, 0, -book.depth / 2]} raycast={() => {}}>
            <boxGeometry args={[0.07, book.bookHeight, pageW * 1.035]} />
            <meshStandardMaterial color={book.color} roughness={0.8} />
          </mesh>
          <mesh name="page-block" raycast={() => {}} position={[0, 0, -pageW / 2]}>
            <boxGeometry args={[book.width - 0.14, pageH, pageW]} />
            <meshStandardMaterial map={textures.paper ?? undefined} color="#f3ecdf" roughness={0.96} />
          </mesh>
          {basePaint ? (
            <mesh position={[book.width / 2 - 0.065, 0, -pageW / 2]} rotation={[0, Math.PI / 2, 0]}
              name="page-face" geometry={pageGeometry} renderOrder={30} raycast={raycastOpen} onClick={onPageClick}>
              <meshBasicMaterial map={basePaint.texture} toneMapped={false} />
            </mesh>
          ) : null}
          {flip && flipPaint ? (
            <group ref={flipHinge} position={[book.width / 2 - 0.045, 0, 0]}
              rotation={[0, flip.dir === -1 ? -Math.PI : 0, 0]}>
              <mesh position={[0.01, 0, -pageW / 2]} rotation={[0, Math.PI / 2, 0]} geometry={turnGeometry} renderOrder={36}>
                <meshBasicMaterial map={flipPaint.texture} toneMapped={false} />
              </mesh>
              <mesh position={[0.01, 0, -pageW / 2]} rotation={[0, Math.PI / 2, 0]} geometry={turnGeometry} renderOrder={36}>
                <meshBasicMaterial map={textures.endpaper} side={THREE.BackSide} toneMapped={false} />
              </mesh>
            </group>
          ) : null}
          <group ref={coverHinge} position={[book.width / 2 - 0.035, 0, 0]}>
            <mesh position={[0, 0, book.depth / 2]} renderOrder={34} raycast={raycastOpen}
              onClick={(event) => {
                event.stopPropagation();
                if (openT.current > 0.72 && !flip) onTurnPage(index, -1);
              }}>
              <boxGeometry args={[0.07, book.bookHeight, book.depth]} />
              <meshBasicMaterial attach="material-0" color="#e5dbc8" toneMapped={false} />
              <meshStandardMaterial attach="material-1" map={textures.cover ?? undefined} roughness={0.8} />
              <meshStandardMaterial attach="material-2" color={book.color} roughness={0.8} />
              <meshStandardMaterial attach="material-3" color={book.color} roughness={0.8} />
              <meshStandardMaterial attach="material-4" color={book.color} roughness={0.8} />
              <meshStandardMaterial attach="material-5" color={book.color} roughness={0.8} />
            </mesh>
            <mesh position={[0.037, 0, pageW / 2]} rotation={[0, Math.PI / 2, 0]} geometry={pageGeometry} renderOrder={35} raycast={raycastOpen}
              onClick={(event) => {
                event.stopPropagation();
                if (selected && openT.current > 0.72 && !flip) onTurnPage(index, -1);
              }}>
              <meshBasicMaterial map={textures.endpaper} toneMapped={false} />
            </mesh>
          </group>
        </group>
      ) : null}
    </group>
    </>
  );
}

// Camera distance that fits the whole shelf span; shared with the pan bounds.
function shelfDistance(span: number, aspect: number) {
  return Math.max(10, span / (2 * Math.tan(35 * Math.PI / 360) * aspect * 0.84));
}

function CameraRig({ target, span }: { target: React.MutableRefObject<number>; span: number }) {
  const { camera } = useThree();
  const rest = useMemo(() => ({ position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 35 }), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const perspective = camera as THREE.PerspectiveCamera;
    const z = shelfDistance(span, perspective.aspect);
    // Where this camera settles over the shelf. Engine's glide ends exactly here, so the
    // hand-over below has nothing to correct.
    rest.position.set(target.current, 1.88 + z * 0.17, z);
    rest.target.set(target.current, 1.88, 0);
    stage.rest = rest;
    const fov = stage.owner === "director" && stage.driven ? stage.fov : rest.fov;
    if (perspective.fov !== fov) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
    if (stage.owner === "director" && stage.driven) {
      // Mid-glide: the shared camera, mapped from the laptop's world into this one.
      toShelf(stage.position, camera.position);
      camera.lookAt(toShelf(stage.target, look));
      return;
    }
    camera.position.z = z;
    camera.position.y = 1.88 + z * 0.17;
    camera.position.x = damp(camera.position.x, target.current, 8, delta);
    camera.lookAt(camera.position.x, 1.88, 0);
  });
  return null;
}

function Scene({
  books,
  hoveredIndex,
  selectedIndex,
  closingIndex,
  reducedMotion,
  cameraX,
  orbit,
  pageIndex,
  fontsReady,
  onHover,
  onSelect,
  onTurnPage,
  onRest,
  onTurnComplete,
}: {
  books: BookLayout[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  closingIndex: number | null;
  reducedMotion: boolean;
  cameraX: React.MutableRefObject<number>;
  orbit: React.MutableRefObject<{ yaw: number; pitch: number }>;
  pageIndex: number;
  fontsReady: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onTurnPage: (index: number, delta: number) => void;
  onRest: () => void;
  onTurnComplete: () => void;
}) {
  const ground = useRef<THREE.Mesh>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const darkTarget = useRef(isDarkTheme() ? 1 : 0);
  const studioMix = useRef(darkTarget.current);
  const { gl, scene } = useThree();
  useEffect(() => {
    const environment = createStudioEnvironment(gl);
    scene.environment = environment.texture;
    const stopTheme = watchTheme((dark) => {
      darkTarget.current = dark ? 1 : 0;
    });
    return () => {
      stopTheme();
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);
  useFrame((_, delta) => {
    studioMix.current = reducedMotion ? darkTarget.current : damp(studioMix.current, darkTarget.current, 8, delta);
    const studio = blendStudio(studioMix.current);
    if (ambient.current) ambient.current.intensity = 0.6 * studio.ambient;
    if (hemisphere.current) hemisphere.current.intensity = 1.3 * studio.ambient;
    if (fill.current) fill.current.intensity = 1.4 * studio.fill;
    if (key.current) key.current.intensity = 3 * studio.key;
    if (rim.current) rim.current.intensity = studio.rim;
    scene.environmentIntensity = 0.35 * studio.environment;
    gl.toneMappingExposure = studio.exposure;
    if (ground.current) {
      const material = ground.current.material as THREE.ShadowMaterial;
      material.color.copy(studio.shadowColor);
      material.opacity = 0.16 * studio.shadow;
    }
  });
  return (
    <>
      <CameraRig target={cameraX} span={(books.at(-1)?.x ?? 0) + 1.6} />
      <ambientLight ref={ambient} intensity={0.6} />
      <hemisphereLight ref={hemisphere} args={["#fff5e5", "#84715c", 1.3]} />
      <directionalLight ref={fill} position={[5, 3, 5]} color="#fff8ed" intensity={1.4} />
      {/* Back rim separates the boards from the dark backdrop. */}
      <directionalLight ref={rim} position={[-5, 5, -6]} color="#fff6ec" intensity={0} />
      <directionalLight ref={key} position={[-3, 7, 5]} color="#fff2df" intensity={3} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={0.025} shadow-radius={5} />
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial color="#211a14" opacity={0.16} />
      </mesh>

      {books.map((book, index) => (
        <Book
          key={book.id}
          book={book}
          index={index}
          hovered={hoveredIndex === index && selectedIndex === null}
          selected={selectedIndex === index}
          hidden={(selectedIndex ?? closingIndex) !== null && (selectedIndex ?? closingIndex) !== index}
          reducedMotion={reducedMotion}
          cameraX={cameraX}
          orbit={orbit}
          studioMix={studioMix}
          pageIndex={selectedIndex === index || closingIndex === index ? pageIndex : 0}
          fontsReady={fontsReady}
          onHover={onHover}
          onSelect={onSelect}
          onTurnPage={onTurnPage}
          onRest={onRest}
          onTurnComplete={onTurnComplete}
        />
      ))}
    </>
  );
}

function nearestBook(books: BookLayout[], x: number) {
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  books.forEach((book, index) => {
    const next = Math.abs(book.x - x);
    if (next < distance) {
      nearest = index;
      distance = next;
    }
  });
  return nearest;
}

export function NewsletterBookshelf({
  items = defaultNewsletterBooks,
  className,
  height = 620,
  onSelect,
  onClose,
}: NewsletterBookshelfProps) {
  const books = useMemo(
    () => deriveLayout(items.length ? items : defaultNewsletterBooks),
    [items],
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [closingIndex, setClosingIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 620 });
  // Engine's loop renders this canvas in the same tick as the laptop; without it, run our own.
  const driven = useSyncExternalStore(subscribeDriven, () => stage.driven);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraX = useRef(0);
  const orbit = useRef({ yaw: 0, pitch: 0 });
  const gesture = useRef<{
    mode: "pending" | "drag" | "orbit";
    x: number;
    y: number;
    startX: number;
    startedAt: number;
  } | null>(null);
  const switchTimer = useRef<number | null>(null);
  const pendingSelection = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const pageTurning = useRef(false);
  const closeAfterTurn = useRef(false);

  const getBounds = useCallback(() => {
    const last = books.at(-1)?.x ?? 0;
    const aspect = stageSize.width / Math.max(1, stageSize.height);
    const visibleSpan = 2 * shelfDistance(last + 1.6, aspect) * Math.tan((35 * Math.PI) / 360) * aspect;
    const inset = visibleSpan * 0.31;
    const min = Math.min(last / 2, (books[0]?.x ?? 0) + inset);
    const max = Math.max(last / 2, last - inset);
    return max <= min ? { min: last / 2, max: last / 2, visibleSpan } : { min, max, visibleSpan };
  }, [books, stageSize]);

  const moveCamera = useCallback(
    (next: number) => {
      const bounds = getBounds();
      cameraX.current = THREE.MathUtils.clamp(next, bounds.min, bounds.max);
      setCurrentIndex(nearestBook(books, cameraX.current));
    },
    [books, getBounds],
  );

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(motion.matches);
    update();
    motion.addEventListener?.("change", update);
    let fontsLive = true;
    // fonts.ready alone can resolve before a face the canvases use has even been requested.
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('400 42px "Departure Mono"'),
          document.fonts.load('400 46px "Fira Code"'),
          document.fonts.load('500 46px "Fira Code"'),
          document.fonts.load('600 46px "Fira Code"'),
        ]).then(() => document.fonts.ready)
      : null;
    if (!fonts) setFontsReady(true);
    else fonts.then(() => {
      if (fontsLive) setFontsReady(true);
    });
    const stage = stageRef.current;
    if (!stage) return () => motion.removeEventListener?.("change", update);
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resize.observe(stage);
    return () => {
      fontsLive = false;
      resize.disconnect();
      motion.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    const bounds = getBounds();
    cameraX.current = bounds.min;
    setCurrentIndex(nearestBook(books, bounds.min));
  }, [books, getBounds]);

  useEffect(
    () => () => {
      if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
      document.body.style.cursor = "";
    },
    [],
  );

  const presentBook = useCallback(
    (index: number) => {
      setClosingIndex(null);
      moveCamera(books[index]!.x);
      orbit.current = { yaw: 0, pitch: 0 };
      setHoveredIndex(null);
      setSelectedIndex(index);
      setPageIndex(0);
      onSelect?.(books[index]!, index);
    },
    [books, moveCamera, onSelect],
  );

  const openBook = useCallback(
    (index: number) => {
      const href = books[index]?.href;
      if (!href || typeof window === "undefined") return;
      try {
        const destination = new URL(href, window.location.href);
        if (destination.protocol !== "http:" && destination.protocol !== "https:") return;
        window.location.assign(destination.href);
      } catch {
        // Ignore malformed or unsupported destinations supplied by consumers.
      }
    },
    [books],
  );

  const selectBook = useCallback(
    (index: number) => {
      if (suppressClick.current || closingIndex !== null) return;
      if (selectedIndex === index) {
        if (!(books[index]?.pages?.length)) openBook(index);
        return;
      }

      if (selectedIndex !== null) {
        pendingSelection.current = index;
        moveCamera(books[index]!.x);
        setHoveredIndex(null);
        setClosingIndex(selectedIndex);
        setSelectedIndex(null);
        orbit.current = { yaw: 0, pitch: 0 };
        if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
        switchTimer.current = window.setTimeout(() => {
          const next = pendingSelection.current;
          pendingSelection.current = null;
          switchTimer.current = null;
          if (next !== null) presentBook(next);
        }, reducedMotion ? 0 : BOOK_EXIT_DURATION);
        return;
      }

      if (switchTimer.current !== null) {
        pendingSelection.current = index;
        return;
      }

      presentBook(index);
    },
    [books, closingIndex, moveCamera, openBook, presentBook, reducedMotion, selectedIndex],
  );

  const close = useCallback(() => {
    if (pageTurning.current) {
      closeAfterTurn.current = true;
      return;
    }
    setClosingIndex(selectedIndex);
    setSelectedIndex(null);
    setHoveredIndex(null);
    orbit.current = { yaw: 0, pitch: 0 };
    onClose?.();
    stageRef.current?.focus({ preventScroll: true });
  }, [onClose, selectedIndex]);

  const finishClosing = useCallback(() => setClosingIndex(null), []);

  // Scrolling back toward the laptop closes an open book, so it doesn't float over the glide.
  useEffect(() => {
    const leave = () => {
      if (selectedIndex !== null) close();
    };
    window.addEventListener("portfolio:leave-shelf", leave);
    return () => window.removeEventListener("portfolio:leave-shelf", leave);
  }, [close, selectedIndex]);

  const finishTurn = useCallback(() => {
    pageTurning.current = false;
    if (closeAfterTurn.current) {
      closeAfterTurn.current = false;
      close();
    }
  }, [close]);

  const turnPage = useCallback(
    (bookIndex: number, delta: number) => {
      if (bookIndex !== selectedIndex || pageTurning.current) return;
      const total = books[bookIndex]?.pages?.length ?? 0;
      if (total > 0 && delta > 0 && pageIndex === total - 1) {
        close();
        return;
      }
      if (total < 2) return;
      const next = THREE.MathUtils.clamp(pageIndex + delta, 0, total - 1);
      if (next === pageIndex) return;
      pageTurning.current = true;
      setPageIndex(next);
    },
    [books, close, pageIndex, selectedIndex],
  );

  const switchFocused = useCallback(
    (direction: number) => {
      if (selectedIndex === null) return;
      const next = THREE.MathUtils.clamp(selectedIndex + direction, 0, books.length - 1);
      if (next !== selectedIndex) {
        selectBook(next);
      }
    },
    [books.length, selectBook, selectedIndex],
  );

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    stageRef.current?.focus({ preventScroll: true });
    gesture.current = {
      mode: "pending",
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startedAt: performance.now(),
    };
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (active.mode === "pending" && Math.hypot(event.clientX - active.startX, dy) > 7) {
      active.mode = selectedIndex === null ? "drag" : "orbit";
      suppressClick.current = true;
      stageRef.current?.setPointerCapture(event.pointerId);
      setHoveredIndex(null);
    }
    if (active.mode === "drag") {
      moveCamera(cameraX.current - dx * 0.0085);
    } else if (active.mode === "orbit") {
      orbit.current.yaw = THREE.MathUtils.clamp(orbit.current.yaw + dx * 0.006, -0.62, 0.62);
      orbit.current.pitch = THREE.MathUtils.clamp(orbit.current.pitch + dy * 0.004, -0.28, 0.28);
    }
    active.x = event.clientX;
    active.y = event.clientY;
  };

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stageRef.current?.hasPointerCapture(event.pointerId)) {
      stageRef.current.releasePointerCapture(event.pointerId);
    }
    gesture.current = null;
    window.requestAnimationFrame(() => {
      suppressClick.current = false;
    });
  };

  const selectedBook = selectedIndex === null ? null : books[selectedIndex];
  const openPage = selectedBook?.pages?.[pageIndex];
  return (
    <section
      className={cn(
        "relative isolate w-full overflow-hidden text-[#302b26] [--shelf-accent:#9b6544]",
        className,
      )}
      style={{ height } as CSSProperties}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="region"
        data-open-page={openPage?.title ?? ""}
        aria-label={
          openPage && selectedBook
            ? `${selectedBook.title}. ${openPage.title}`
            : selectedBook
              ? `${selectedBook.title} focused.`
              : `Interactive archive with ${books.length} editions`
        }
        className="relative h-full w-full touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--shelf-accent)]"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onPointerLeave={() => {
          gesture.current = null;
          setHoveredIndex(null);
        }}
        onWheel={(event) => {
          if (selectedIndex !== null) return;
          const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
          if (horizontal || event.shiftKey) {
            event.preventDefault();
            moveCamera(cameraX.current + (horizontal ? event.deltaX : event.deltaY) * 0.012);
          }
        }}
        onKeyDown={(event) => {
          if (closingIndex !== null) return;
          if (event.key === "Escape" && selectedIndex !== null) {
            event.preventDefault();
            close();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (selectedIndex !== null && (books[selectedIndex]?.pages?.length ?? 0) > 0) {
              turnPage(selectedIndex, 1);
            } else if (selectedIndex !== null) switchFocused(1);
            else {
              const next = Math.min(currentIndex + 1, books.length - 1);
              moveCamera(books[next]!.x);
              setCurrentIndex(next);
              setHoveredIndex(next);
            }
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (selectedIndex !== null && (books[selectedIndex]?.pages?.length ?? 0) > 1) {
              turnPage(selectedIndex, -1);
            } else if (selectedIndex !== null) switchFocused(-1);
            else {
              const next = Math.max(currentIndex - 1, 0);
              moveCamera(books[next]!.x);
              setCurrentIndex(next);
              setHoveredIndex(next);
            }
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectedIndex === null) selectBook(currentIndex);
            else if ((books[selectedIndex]?.pages?.length ?? 0) > 0) turnPage(selectedIndex, 1);
            else openBook(selectedIndex);
          }
        }}
      >
        <Canvas
          frameloop={driven ? "never" : "always"}
          shadows="variance"
          camera={{ fov: 35, near: 0.1, far: 60, position: [cameraX.current, 2.65, 10] }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onPointerMissed={() => {
            if (selectedIndex !== null) close();
          }}
        >
          <Scene
            books={books}
            hoveredIndex={hoveredIndex}
            selectedIndex={selectedIndex}
            closingIndex={closingIndex}
            reducedMotion={reducedMotion}
            cameraX={cameraX}
            orbit={orbit}
            pageIndex={pageIndex}
            fontsReady={fontsReady}
            onHover={setHoveredIndex}
            onSelect={selectBook}
            onTurnPage={turnPage}
            onRest={finishClosing}
            onTurnComplete={finishTurn}
          />
        </Canvas>
      </div>

    </section>
  );
}
