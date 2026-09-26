"use client";

/* eslint-disable react/no-unknown-property */

import { cn } from "@/lib/utils";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
  pages?: NewsletterBookPage[];
}

export interface NewsletterBookshelfProps {
  items?: NewsletterBookshelfItem[];
  className?: string;
  height?: number | string;
  brand?: string;
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
    cursor += width + 0.065;
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

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawMotif(
  context: CanvasRenderingContext2D,
  motif: number,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(2, size * 0.035);

  if (motif === 0) {
    for (let index = -2; index <= 2; index += 1) {
      context.beginPath();
      context.arc(0, 0, size * (0.12 + index * 0.035), 0, Math.PI * 2);
      context.stroke();
    }
  } else if (motif === 1) {
    context.rotate(Math.PI / 4);
    for (let index = -1; index <= 1; index += 1) {
      context.strokeRect(
        -size * (0.24 + index * 0.055),
        -size * (0.24 + index * 0.055),
        size * (0.48 + index * 0.11),
        size * (0.48 + index * 0.11),
      );
    }
  } else if (motif === 2) {
    for (let index = 0; index < 6; index += 1) {
      context.rotate(Math.PI / 3);
      roundedRect(context, -size * 0.045, -size * 0.36, size * 0.09, size * 0.28, size * 0.04);
      context.fill();
    }
    context.beginPath();
    context.arc(0, 0, size * 0.11, 0, Math.PI * 2);
    context.fill();
  } else if (motif === 3) {
    context.beginPath();
    for (let index = 0; index < 12; index += 1) {
      const radius = index % 2 ? size * 0.17 : size * 0.35;
      const angle = -Math.PI / 2 + (index * Math.PI) / 6;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.stroke();
  } else if (motif === 4) {
    for (let row = -2; row <= 2; row += 1) {
      for (let column = -2; column <= 2; column += 1) {
        if ((row + column) % 2 === 0) {
          context.beginPath();
          context.arc(column * size * 0.13, row * size * 0.13, size * 0.035, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
  } else if (motif === 5) {
    for (let index = -2; index <= 2; index += 1) {
      context.beginPath();
      context.moveTo(-size * 0.34, index * size * 0.12);
      context.bezierCurveTo(
        -size * 0.12,
        index * size * 0.12 - size * 0.11,
        size * 0.12,
        index * size * 0.12 + size * 0.11,
        size * 0.34,
        index * size * 0.12,
      );
      context.stroke();
    }
  } else if (motif === 6) {
    context.beginPath();
    context.moveTo(0, -size * 0.37);
    context.lineTo(size * 0.34, size * 0.28);
    context.lineTo(-size * 0.34, size * 0.28);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(0, size * 0.02, size * 0.11, 0, Math.PI * 2);
    context.fill();
  } else {
    context.rotate(Math.PI / 4);
    context.fillRect(-size * 0.035, -size * 0.36, size * 0.07, size * 0.72);
    context.fillRect(-size * 0.36, -size * 0.035, size * 0.72, size * 0.07);
    context.beginPath();
    context.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
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

function drawClothWeave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
) {
  const random = seeded(seed);
  context.save();
  context.lineCap = "round";

  context.globalCompositeOperation = "multiply";
  for (let x = 0.5; x < width; x += 3) {
    context.strokeStyle = `rgba(18, 16, 14, ${0.03 + random() * 0.035})`;
    context.lineWidth = 0.35 + random() * 0.3;
    context.beginPath();
    context.moveTo(x + (random() - 0.5) * 0.5, 0);
    context.lineTo(x + (random() - 0.5) * 0.5, height);
    context.stroke();
  }

  context.globalCompositeOperation = "screen";
  for (let y = 0.5; y < height; y += 3) {
    context.strokeStyle = `rgba(255, 248, 232, ${0.035 + random() * 0.03})`;
    context.lineWidth = 0.3 + random() * 0.25;
    context.beginPath();
    context.moveTo(0, y + (random() - 0.5) * 0.5);
    context.lineTo(width, y + (random() - 0.5) * 0.5);
    context.stroke();
  }

  context.globalCompositeOperation = "overlay";
  for (let index = 0; index < Math.floor((width * height) / 850); index += 1) {
    const x = random() * width;
    const y = random() * height;
    const length = 3 + random() * 13;
    context.strokeStyle = `rgba(255, 255, 255, ${0.035 + random() * 0.055})`;
    context.lineWidth = 0.35 + random() * 0.4;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (random() - 0.5) * 2, y + length);
    context.stroke();
  }

  context.globalCompositeOperation = "source-over";
  const edgeShade = context.createLinearGradient(0, 0, width, 0);
  edgeShade.addColorStop(0, "rgba(0,0,0,.16)");
  edgeShade.addColorStop(0.045, "rgba(0,0,0,.025)");
  edgeShade.addColorStop(0.5, "rgba(255,255,255,.025)");
  edgeShade.addColorStop(0.955, "rgba(0,0,0,.025)");
  edgeShade.addColorStop(1, "rgba(0,0,0,.18)");
  context.fillStyle = edgeShade;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function paperTexture(book: BookLayout) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const random = seeded(hash(`${book.id}-paper`));

  context.fillStyle = "#eee9dc";
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

function coverTexture(book: BookLayout, brand: string, face: "cover" | "spine") {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = face === "cover" ? 512 : 112;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = book.color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  addTexture(
    context,
    canvas.width,
    canvas.height,
    hash(`${book.id}-${face}-noise`),
  );
  drawClothWeave(
    context,
    canvas.width,
    canvas.height,
    hash(`${book.id}-${face}-weave`),
  );
  context.fillStyle = book.foil;
  context.strokeStyle = book.foil;
  context.textBaseline = "top";
  context.shadowColor = "rgba(0, 0, 0, .3)";
  context.shadowBlur = 1.4;
  context.shadowOffsetX = 0.8;
  context.shadowOffsetY = 1.1;

  if (face === "cover") {
    const margin = 58;
    context.font = "500 21px ui-monospace, SFMono-Regular, monospace";
    context.fillText(book.date, margin, 58);
    context.font = "700 54px Georgia, serif";
    const words = book.title.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width < canvas.width - margin * 2 || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, 5).forEach((text, index) => context.fillText(text, margin, 180 + index * 61));
    context.fillRect(margin, 180 + Math.min(lines.length, 5) * 61 + 24, 92, 5);
    drawMotif(context, book.motif, 316, 510, 130, book.foil);
    context.font = "700 19px ui-monospace, SFMono-Regular, monospace";
    context.fillText(brand.toUpperCase(), margin, 690);
  } else {
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(0,0,0,.28)");
    gradient.addColorStop(0.18, "rgba(0,0,0,0)");
    gradient.addColorStop(0.82, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,.28)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = book.foil;
    context.fillRect(22, 26, canvas.width - 44, 3);
    context.fillRect(22, 704, canvas.width - 44, 3);
    context.save();
    context.translate(canvas.width / 2, 58);
    context.rotate(Math.PI / 2);
    context.font = "700 37px Georgia, serif";
    const title = book.title.length > 36 ? `${book.title.slice(0, 34)}…` : book.title;
    context.fillText(title, 0, 13);
    context.restore();
    drawMotif(context, book.motif, 29, 625, 54, book.foil);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function damp(current: number, target: number, speed: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta));
}

const BOOK_ENTER_DURATION = 520;
const BOOK_EXIT_DURATION = 400;
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

function paintPage(page: NewsletterBookPage, pageNumber: number, total: number): PagePaint {
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

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const titleSize = Math.round(118 * scale);
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
        pushText(block.text.toUpperCase(), `500 ${smallSize}px "IBM Plex Mono", ui-monospace, monospace`, smallSize, "#6d645b", lineGap);
      } else if (block.kind === "title") {
        pushText(block.text, `600 ${titleSize}px Barlow, "Avenir Next", sans-serif`, titleSize, "#1b1916", Math.round(22 * scale), block.href);
      } else if (block.kind === "working") {
        pushText(block.text, `500 ${Math.round(bodySize * 0.92)}px Barlow, "Avenir Next", sans-serif`, Math.round(bodySize * 0.92), "#3d3832", lineGap);
      } else if (block.kind === "body") {
        pushText(block.text, `400 ${bodySize}px Barlow, "Avenir Next", sans-serif`, bodySize, "#241f1b", Math.round(18 * scale));
      } else if (block.kind === "pair") {
        pushText(block.name, `600 ${bodySize}px Barlow, "Avenir Next", sans-serif`, bodySize, "#1b1916", Math.round(4 * scale));
        pushText(block.detail, `400 ${Math.round(bodySize * 0.86)}px Barlow, "Avenir Next", sans-serif`, Math.round(bodySize * 0.86), "#3a342e", Math.round(12 * scale));
      } else if (block.kind === "step") {
        pushText(block.text, `500 ${bodySize}px Barlow, "Avenir Next", sans-serif`, bodySize, "#241f1b", Math.round(8 * scale));
      } else if (block.kind === "quiet") {
        pushText(block.text, `400 ${Math.round(bodySize * 0.86)}px Barlow, "Avenir Next", sans-serif`, Math.round(bodySize * 0.86), "#5e564c", Math.round(16 * scale));
      } else if (block.kind === "link") {
        y += Math.round(8 * scale);
        pushText(block.label, `600 ${Math.round(bodySize * 0.95)}px Barlow, "Avenir Next", sans-serif`, Math.round(bodySize * 0.95), "#1b1916", Math.round(12 * scale), block.href);
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
    scale *= 0.88;
    y = padTop;
  }

  context.fillStyle = "#f4efe4";
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
  context.font = '500 28px "IBM Plex Mono", ui-monospace, monospace';
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
  reducedMotion,
  cameraX,
  orbit,
  brand,
  pageIndex,
  fontsReady,
  onHover,
  onSelect,
  onTurnPage,
}: {
  book: BookLayout;
  index: number;
  hovered: boolean;
  selected: boolean;
  reducedMotion: boolean;
  cameraX: React.MutableRefObject<number>;
  orbit: React.MutableRefObject<{ yaw: number; pitch: number }>;
  brand: string;
  pageIndex: number;
  fontsReady: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onTurnPage: (index: number, delta: number) => void;
}) {
  const camera = useThree((state) => state.camera);
  const group = useRef<THREE.Group>(null);
  const closedRef = useRef<THREE.Mesh>(null);
  const openRig = useRef<THREE.Group>(null);
  const coverHinge = useRef<THREE.Group>(null);
  const coverOutside = useRef<THREE.Mesh>(null);
  const flipHinge = useRef<THREE.Group>(null);
  const openT = useRef(0);
  const flipT = useRef(0);
  const flipDone = useRef(false);
  const [shown, setShown] = useState(0);
  const [flip, setFlip] = useState<{ from: number; to: number; dir: 1 | -1 } | null>(null);
  const hasPages = (book.pages?.length ?? 0) > 0;
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
  } | null>(null);
  const selectedAt = useRef(0);
  const wasSelected = useRef(false);
  const textures = useMemo(
    () => ({
      cover: coverTexture(book, brand, "cover"),
      spine: coverTexture(book, brand, "spine"),
      paper: paperTexture(book),
    }),
    [book, brand],
  );

  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        book.width,
        book.bookHeight,
        book.depth,
        2,
        Math.min(book.width, 0.09),
      ),
    [book.bookHeight, book.depth, book.width],
  );

  const paints = useMemo(() => {
    if (!hasPages || typeof document === "undefined") return [];
    void fontsReady;
    return (book.pages ?? []).map((page, pageNumber, all) =>
      paintPage(page, pageNumber, all.length),
    );
  }, [book.pages, fontsReady, hasPages]);

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((texture) => texture?.dispose());
      geometry.dispose();
    };
  }, [geometry, textures]);

  useEffect(() => {
    if (openRig.current) openRig.current.visible = false;
    return () => {
      paints.forEach((paint) => paint.texture.dispose());
    };
  }, [paints]);

  useEffect(() => {
    if (!selected) {
      setShown(0);
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
    const openShift = hasPages ? book.depth * (portrait ? 0 : 0.05) : 0;
    const targetX = selected ? cameraX.current + openShift : book.x;
    const targetY = selected ? 1.86 : book.bookHeight / 2 + (hovered ? 0.25 : 0);
    const targetZ = selected ? (portrait ? 2.7 : 3.45) : hovered ? 0.22 : 0;
    const distance = Math.max(0.8, perspective.position.z - targetZ);
    const visibleHeight =
      2 * Math.tan((((perspective.fov || 35) * Math.PI) / 180) / 2) * distance;
    const visibleWidth = visibleHeight * Math.max(perspective.aspect, 0.2);
    const footprint = portrait ? book.depth * 1.35 : book.depth * 2.45;
    const fit = Math.min(
      (visibleHeight * 0.62) / book.bookHeight,
      (visibleWidth * 0.7) / footprint,
    );
    const targetScale = selected ? THREE.MathUtils.clamp(fit, 0.35, 1.15) : 1;
    const targetRotationY = selected ? -Math.PI / 2 + 0.22 + orbit.current.yaw : 0;
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
      const alignProgress = easeSmoothOut(progress);
      const slotProgress = easeSmoothOut(
        THREE.MathUtils.clamp((progress - 0.3) / 0.7, 0, 1),
      );
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
        0,
        alignProgress,
      );
      node.rotation.z = THREE.MathUtils.lerp(
        exit.rotation.z,
        0,
        alignProgress,
      );
      const scale = THREE.MathUtils.lerp(exit.scale, 1, alignProgress);
      node.scale.setScalar(scale);
      if (progress >= 1) exitFlight.current = null;
    } else {
      node.position.x = damp(node.position.x, targetX, motion, delta);
      node.position.y = damp(node.position.y, targetY, motion, delta);
      node.position.z = damp(node.position.z, targetZ, motion, delta);
      node.rotation.y = damp(node.rotation.y, targetRotationY, motion, delta);
      node.rotation.x = damp(node.rotation.x, targetRotationX, motion, delta);
      const nextScale = damp(node.scale.x, targetScale, motion, delta);
      node.scale.setScalar(nextScale);
    }

    const openTarget = selected && hasPages ? 1 : 0;
    openT.current = damp(openT.current, openTarget, reducedMotion ? 1000 : 3.4, delta);
    const opened = easeInOutCubic(THREE.MathUtils.clamp((openT.current - 0.16) / 0.84, 0, 1));
    if (coverHinge.current) coverHinge.current.rotation.y = -0.42 * opened;
    if (coverOutside.current) coverOutside.current.visible = true;
    if (closedRef.current) {
      const showClosed = !hasPages || openT.current < 0.3;
      closedRef.current.visible = showClosed;
      closedRef.current.raycast = showClosed ? THREE.Mesh.prototype.raycast : () => {};
    }
    if (openRig.current) openRig.current.visible = hasPages && openT.current >= 0.24;
    if (flip && flipHinge.current) {
      flipT.current = Math.min(1, flipT.current + (reducedMotion ? 1 : delta * 1.65));
      const eased = easeInOutCubic(flipT.current);
      flipHinge.current.rotation.y = flip.dir === 1 ? -Math.PI * eased : -Math.PI * (1 - eased);
      if (flipT.current >= 1 && !flipDone.current) {
        flipDone.current = true;
        const destination = flip.to;
        setShown(destination);
        setFlip(null);
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
  const pageW = book.depth * 0.9;
  const pageH = book.bookHeight * 0.9;

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

  return (
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
      <mesh ref={closedRef} name="closed-book" geometry={geometry} renderOrder={selected ? 20 : 0}>
        <meshStandardMaterial
          attach="material-0"
          map={textures.cover ?? undefined}
          color={textures.cover ? "#ffffff" : book.color}
          roughness={0.8}
          metalness={0.015}
          bumpMap={textures.cover ?? undefined}
          bumpScale={0.007}
          depthTest={!selected}
          depthWrite={!selected}
        />
        <meshStandardMaterial
          attach="material-1"
          color={book.color}
          roughness={0.84}
          bumpMap={textures.cover ?? undefined}
          bumpScale={0.006}
          depthTest={!selected}
          depthWrite={!selected}
        />
        <meshStandardMaterial
          attach="material-2"
          map={textures.paper ?? undefined}
          color={textures.paper ? "#f1eadc" : "#e9e4d8"}
          roughness={0.93}
          bumpMap={textures.paper ?? undefined}
          bumpScale={0.008}
          depthTest={!selected}
          depthWrite={!selected}
        />
        <meshStandardMaterial
          attach="material-3"
          map={textures.paper ?? undefined}
          color={textures.paper ? "#ece3d3" : "#ddd7ca"}
          roughness={0.96}
          bumpMap={textures.paper ?? undefined}
          bumpScale={0.006}
          depthTest={!selected}
          depthWrite={!selected}
        />
        <meshStandardMaterial
          attach="material-4"
          map={textures.spine ?? undefined}
          color={textures.spine ? "#ffffff" : book.color}
          roughness={0.8}
          metalness={0.015}
          bumpMap={textures.spine ?? undefined}
          bumpScale={0.007}
          depthTest={!selected}
          depthWrite={!selected}
        />
        <meshStandardMaterial
          attach="material-5"
          map={textures.paper ?? undefined}
          color={textures.paper ? "#f3eadc" : "#e6e0d4"}
          roughness={0.94}
          bumpMap={textures.paper ?? undefined}
          bumpScale={0.007}
          depthTest={!selected}
          depthWrite={!selected}
        />
      </mesh>
      {hasPages ? (
        <group ref={openRig}>
          <mesh name="page-block" raycast={() => {}} position={[book.width * 0.02, 0, -pageW * 0.72]}>
            <boxGeometry
              args={[
                Math.max(0.08, book.width * 0.55),
                pageH * 0.98,
                pageW * 0.98,
              ]}
            />
            <meshStandardMaterial
              map={textures.paper ?? undefined}
              color="#f3ecdf"
              roughness={0.96}
            />
          </mesh>
          {basePaint ? (
            <mesh
              position={[book.width / 2 - 0.02, 0, -pageW * 0.72]}
              rotation={[0, Math.PI / 2, 0]}
              name="page-face"
              renderOrder={30}
              onClick={onPageClick}
            >
              <planeGeometry args={[pageW, pageH]} />
              <meshBasicMaterial map={basePaint.texture} toneMapped={false} />
            </mesh>
          ) : null}
          {flip && flipPaint ? (
            <group
              ref={flipHinge}
              position={[book.width / 2 - 0.01, 0, -pageW * 0.72 + pageW / 2]}
              rotation={[0, flip.dir === -1 ? -Math.PI : 0, 0]}
            >
              <mesh position={[0.01, 0, -pageW / 2]} rotation={[0, Math.PI / 2, 0]} renderOrder={32}>
                <planeGeometry args={[pageW, pageH]} />
                <meshBasicMaterial map={flipPaint.texture} toneMapped={false} />
              </mesh>
              <mesh position={[-0.01, 0, -pageW / 2]} rotation={[0, -Math.PI / 2, 0]} renderOrder={32}>
                <planeGeometry args={[pageW, pageH]} />
                <meshBasicMaterial color="#f3eadc" toneMapped={false} />
              </mesh>
            </group>
          ) : null}
          <mesh position={[book.width / 2 - 0.07, 0, pageW / 2 + 0.02]} raycast={() => {}}>
            <boxGeometry args={[0.1, pageH * 1.02, 0.07]} />
            <meshStandardMaterial color={book.color} roughness={0.8} />
          </mesh>
          <mesh position={[book.width / 2 - 0.09, 0, -pageW / 2 - 0.015]} raycast={() => {}}>
            <boxGeometry args={[0.16, pageH * 0.98, 0.05]} />
            <meshStandardMaterial color="#efe6d4" roughness={0.95} />
          </mesh>
          <group ref={coverHinge} position={[book.width / 2 - 0.02, 0, 0.04]}>
            <mesh
              ref={coverOutside}
              position={[-0.02, 0, pageW * 0.62]}
              renderOrder={34}
              onClick={(event) => {
                event.stopPropagation();
                if (openT.current > 0.72 && !flip) onTurnPage(index, -1);
              }}
            >
              <boxGeometry args={[0.09, book.bookHeight, pageW]} />
              <meshStandardMaterial
                attach="material-0"
                map={textures.cover ?? undefined}
                color={textures.cover ? "#ffffff" : book.color}
                roughness={0.78}
              />
              <meshStandardMaterial attach="material-1" color="#f4efe4" roughness={0.95} />
              <meshStandardMaterial attach="material-2" color={book.color} roughness={0.84} />
              <meshStandardMaterial attach="material-3" color={book.color} roughness={0.84} />
              <meshStandardMaterial attach="material-4" color={book.color} roughness={0.84} />
              <meshStandardMaterial attach="material-5" color={book.color} roughness={0.84} />
            </mesh>
          </group>
        </group>
      ) : null}
    </group>
  );
}

function CameraRig({ target }: { target: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    camera.position.x = damp(camera.position.x, target.current, 8, delta);
    camera.lookAt(camera.position.x, 1.88, 0);
  });
  return null;
}

function Scene({
  books,
  hoveredIndex,
  selectedIndex,
  reducedMotion,
  cameraX,
  orbit,
  brand,
  pageIndex,
  fontsReady,
  onHover,
  onSelect,
  onTurnPage,
}: {
  books: BookLayout[];
  hoveredIndex: number | null;
  selectedIndex: number | null;
  reducedMotion: boolean;
  cameraX: React.MutableRefObject<number>;
  orbit: React.MutableRefObject<{ yaw: number; pitch: number }>;
  brand: string;
  pageIndex: number;
  fontsReady: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onTurnPage: (index: number, delta: number) => void;
}) {
  return (
    <>
      <CameraRig target={cameraX} />
      <ambientLight intensity={1.5} />
      <hemisphereLight args={["#ffffff", "#d7dce8", 1.2]} />
      <directionalLight position={[5, 8, 7]} intensity={2.2} />

      {books.map((book, index) => (
        <Book
          key={book.id}
          book={book}
          index={index}
          hovered={hoveredIndex === index && selectedIndex === null}
          selected={selectedIndex === index}
          reducedMotion={reducedMotion}
          cameraX={cameraX}
          orbit={orbit}
          brand={brand}
          pageIndex={selectedIndex === index ? pageIndex : 0}
          fontsReady={fontsReady}
          onHover={onHover}
          onSelect={onSelect}
          onTurnPage={onTurnPage}
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
  brand = "The Brief",
  onSelect,
  onClose,
}: NewsletterBookshelfProps) {
  const books = useMemo(
    () => deriveLayout(items.length ? items : defaultNewsletterBooks),
    [items],
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [stageWidth, setStageWidth] = useState(1000);
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

  const getBounds = useCallback(() => {
    const last = books.at(-1)?.x ?? 0;
    const aspect = stageWidth / Math.max(420, typeof height === "number" ? height : 620);
    const visibleSpan = 2 * 10 * Math.tan((35 * Math.PI) / 360) * aspect;
    const inset = visibleSpan * 0.31;
    const min = Math.min(last / 2, (books[0]?.x ?? 0) + inset);
    const max = Math.max(last / 2, last - inset);
    return max <= min ? { min: last / 2, max: last / 2, visibleSpan } : { min, max, visibleSpan };
  }, [books, height, stageWidth]);

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
    const fonts = document.fonts?.ready;
    if (!fonts) setFontsReady(true);
    else fonts.then(() => {
      if (fontsLive) setFontsReady(true);
    });
    const stage = stageRef.current;
    if (!stage) return () => motion.removeEventListener?.("change", update);
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setStageWidth(entry.contentRect.width);
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
      if (suppressClick.current) return;
      if (selectedIndex === index) {
        if (!(books[index]?.pages?.length)) openBook(index);
        return;
      }

      if (selectedIndex !== null) {
        pendingSelection.current = index;
        moveCamera(books[index]!.x);
        setHoveredIndex(null);
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
    [books, moveCamera, openBook, presentBook, reducedMotion, selectedIndex],
  );

  const close = useCallback(() => {
    setSelectedIndex(null);
    setPageIndex(0);
    orbit.current = { yaw: 0, pitch: 0 };
    onClose?.();
    stageRef.current?.focus({ preventScroll: true });
  }, [onClose]);

  const turnPage = useCallback(
    (bookIndex: number, delta: number) => {
      if (bookIndex !== selectedIndex) return;
      const total = books[bookIndex]?.pages?.length ?? 0;
      if (total < 2) return;
      setPageIndex((current) => THREE.MathUtils.clamp(current + delta, 0, total - 1));
    },
    [books, selectedIndex],
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
  const bounds = getBounds();
  return (
    <section
      className={cn(
        "relative isolate w-full overflow-hidden bg-[#fbfbfa] text-[#171717] [--shelf-accent:#4040ff] dark:bg-[#111112] dark:text-[#f5f5f3]",
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
          if (event.key === "Escape" && selectedIndex !== null) {
            event.preventDefault();
            close();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            if (selectedIndex !== null && (books[selectedIndex]?.pages?.length ?? 0) > 1) {
              turnPage(selectedIndex, 1);
            } else if (selectedIndex !== null) switchFocused(1);
            else moveCamera(cameraX.current + bounds.visibleSpan * 0.23);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (selectedIndex !== null && (books[selectedIndex]?.pages?.length ?? 0) > 1) {
              turnPage(selectedIndex, -1);
            } else if (selectedIndex !== null) switchFocused(-1);
            else moveCamera(cameraX.current - bounds.visibleSpan * 0.23);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (selectedIndex === null) selectBook(currentIndex);
            else if ((books[selectedIndex]?.pages?.length ?? 0) > 1) turnPage(selectedIndex, 1);
            else openBook(selectedIndex);
          }
        }}
      >
        <Canvas
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
            reducedMotion={reducedMotion}
            cameraX={cameraX}
            orbit={orbit}
            brand={brand}
            pageIndex={pageIndex}
            fontsReady={fontsReady}
            onHover={setHoveredIndex}
            onSelect={selectBook}
            onTurnPage={turnPage}
          />
        </Canvas>
      </div>
    </section>
  );
}
