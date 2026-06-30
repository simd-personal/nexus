/**
 * Generates centered Sunny splash + app icons for the mobile app.
 * Run from repo root: npx tsx scripts/generate-mobile-assets.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const BG = '#0B1220';
const OUT_DIR = join(process.cwd(), 'apps/mobile/assets');

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function drawSunnyMark(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
  const scale = size / 64;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-32, -32);

  for (const deg of RAY_ANGLES) {
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(-3.5, -14.5);
    ctx.lineTo(3.5, -14.5);
    ctx.closePath();
    ctx.fillStyle = '#FBBF24';
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(32, 32, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#F59E0B';
  ctx.fill();

  ctx.fillStyle = '#1A2433';
  roundRect(ctx, 19, 27, 10, 8, 2.5);
  ctx.fill();
  roundRect(ctx, 35, 27, 10, 8, 2.5);
  ctx.fill();
  roundRect(ctx, 29, 30, 6, 2, 1);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(24, 40);
  ctx.quadraticCurveTo(32, 46, 40, 40);
  ctx.strokeStyle = '#1A2433';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
  gradient.addColorStop(0.55, 'rgba(37, 99, 235, 0.12)');
  gradient.addColorStop(1, 'rgba(11, 18, 32, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function fillBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0B1220');
  gradient.addColorStop(0.55, '#101B2E');
  gradient.addColorStop(1, '#0B1220');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function renderSplash(width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  fillBackground(ctx, width, height);
  return canvas.toBuffer('image/png');
}

function renderIcon(size: number) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);
  drawGlow(ctx, size / 2, size / 2, size * 0.42);
  drawSunnyMark(ctx, size / 2, size / 2, size * 0.52);
  return canvas.toBuffer('image/png');
}

mkdirSync(OUT_DIR, { recursive: true });

const splash = renderSplash(1284, 2778);
const icon = renderIcon(1024);

writeFileSync(join(OUT_DIR, 'splash-blank.png'), splash);
writeFileSync(join(OUT_DIR, 'splash.png'), splash);
writeFileSync(join(OUT_DIR, 'icon.png'), icon);
writeFileSync(join(OUT_DIR, 'adaptive-icon.png'), icon);
writeFileSync(join(OUT_DIR, 'splash-icon.png'), icon);

console.log('Wrote mobile assets to', OUT_DIR);
