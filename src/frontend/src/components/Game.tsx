import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vec2 {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Player {
  pos: Vec2;
  vel: Vec2;
  w: number;
  h: number;
  onGround: boolean;
  lives: number;
  invincible: number; // frames remaining of invincibility
  flashTimer: number;
}

interface Platform extends Rect {
  id: number;
}

interface Enemy {
  id: number;
  pos: Vec2;
  vel: Vec2;
  w: number;
  h: number;
  patrolLeft: number;
  patrolRight: number;
  alive: boolean;
  stomped: number; // death animation frames
}

interface Coin {
  id: number;
  x: number;
  y: number;
  r: number;
  collected: boolean;
  animTime: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Flag {
  x: number;
  y: number;
  w: number;
  h: number;
  poleH: number;
}

type GameState = "start" | "playing" | "gameover" | "win";

interface GameData {
  player: Player;
  platforms: Platform[];
  enemies: Enemy[];
  coins: Coin[];
  particles: Particle[];
  flag: Flag;
  camera: Vec2;
  score: number;
  state: GameState;
  nextParticleId: number;
  frameCount: number;
  levelWidth: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAVITY = 1800;
const PLAYER_SPEED = 280;
const JUMP_FORCE = -580;
const LEVEL_W = 6400;
const LEVEL_H = 600;
const GROUND_Y = LEVEL_H - 60;
const GROUND_H = 60;

const COLORS = {
  void: "#0a0a1a",
  ground: "#0d1117",
  groundTop: "#00f5ff",
  platform: "#0d1117",
  platformTop: "#ff00e4",
  player: "#00f5ff",
  playerEye: "#0a0a1a",
  enemy: "#ff00e4",
  enemyEye: "#0a0a1a",
  coin: "#ffdd00",
  flag: "#00ff88",
  flagPole: "#55ffbb",
  star: "#ffffff",
  bgGrid: "rgba(0,245,255,0.04)",
  bgGrid2: "rgba(255,0,228,0.025)",
};

// ─── Level Generation ─────────────────────────────────────────────────────────

let _platformIdCounter = 0;
let _enemyIdCounter = 0;
let _coinIdCounter = 0;

function createLevel(): Pick<
  GameData,
  "platforms" | "enemies" | "coins" | "flag"
> {
  _platformIdCounter = 0;
  _enemyIdCounter = 0;
  _coinIdCounter = 0;

  const platforms: Platform[] = [
    // Ground
    { id: _platformIdCounter++, x: 0, y: GROUND_Y, w: LEVEL_W, h: GROUND_H },
  ];

  const floatingPlatforms: Omit<Platform, "id">[] = [
    // Section 1 - intro
    { x: 300, y: 450, w: 140, h: 16 },
    { x: 520, y: 380, w: 120, h: 16 },
    { x: 700, y: 310, w: 140, h: 16 },

    // Section 2
    { x: 940, y: 430, w: 160, h: 16 },
    { x: 1140, y: 350, w: 120, h: 16 },
    { x: 1320, y: 420, w: 130, h: 16 },
    { x: 1500, y: 330, w: 150, h: 16 },
    { x: 1700, y: 260, w: 100, h: 16 },

    // Section 3 - longer gaps
    { x: 1960, y: 400, w: 180, h: 16 },
    { x: 2200, y: 320, w: 140, h: 16 },
    { x: 2420, y: 250, w: 120, h: 16 },
    { x: 2600, y: 350, w: 160, h: 16 },
    { x: 2820, y: 430, w: 130, h: 16 },

    // Section 4 - towers
    { x: 3100, y: 420, w: 100, h: 16 },
    { x: 3100, y: 300, w: 100, h: 16 },
    { x: 3100, y: 180, w: 100, h: 16 },
    { x: 3280, y: 380, w: 110, h: 16 },
    { x: 3460, y: 310, w: 120, h: 16 },
    { x: 3640, y: 240, w: 130, h: 16 },

    // Section 5 - zigzag
    { x: 3900, y: 420, w: 140, h: 16 },
    { x: 4100, y: 340, w: 120, h: 16 },
    { x: 4280, y: 260, w: 130, h: 16 },
    { x: 4460, y: 340, w: 120, h: 16 },
    { x: 4640, y: 420, w: 140, h: 16 },

    // Section 6 - final stretch
    { x: 4900, y: 400, w: 180, h: 16 },
    { x: 5160, y: 320, w: 160, h: 16 },
    { x: 5400, y: 240, w: 140, h: 16 },
    { x: 5620, y: 340, w: 160, h: 16 },
    { x: 5860, y: 420, w: 140, h: 16 },
    { x: 6060, y: 350, w: 180, h: 16 },
  ];

  for (const p of floatingPlatforms) {
    platforms.push({ id: _platformIdCounter++, ...p });
  }

  const enemies: Enemy[] = [
    // Section 1
    makeEnemy(320, GROUND_Y - 36, 280, 500),
    makeEnemy(520, 380 - 36, 520, 620),
    // Section 2
    makeEnemy(960, GROUND_Y - 36, 880, 1100),
    makeEnemy(1150, 350 - 36, 1140, 1240),
    makeEnemy(1520, 330 - 36, 1500, 1630),
    // Section 3
    makeEnemy(1980, 400 - 36, 1960, 2120),
    makeEnemy(2210, 320 - 36, 2200, 2320),
    makeEnemy(2610, 350 - 36, 2600, 2740),
    makeEnemy(2840, GROUND_Y - 36, 2760, 3000),
    // Section 4
    makeEnemy(3120, 420 - 36, 3100, 3180),
    makeEnemy(3650, 240 - 36, 3640, 3750),
    makeEnemy(3800, GROUND_Y - 36, 3700, 3960),
    // Section 5
    makeEnemy(3920, 420 - 36, 3900, 4020),
    makeEnemy(4290, 260 - 36, 4280, 4390),
    makeEnemy(4650, 420 - 36, 4640, 4760),
    // Section 6
    makeEnemy(4920, 400 - 36, 4900, 5060),
    makeEnemy(5170, 320 - 36, 5160, 5300),
    makeEnemy(5640, 340 - 36, 5620, 5760),
    makeEnemy(6070, 350 - 36, 6060, 6220),
  ];

  const coins: Coin[] = [
    // Section 1 coins
    ...coinRow(380, GROUND_Y - 70, 4),
    makeCoin(530, 340),
    makeCoin(720, 270),
    // Section 2
    ...coinRow(960, GROUND_Y - 70, 3),
    makeCoin(1160, 310),
    makeCoin(1330, 380),
    makeCoin(1520, 290),
    makeCoin(1720, 220),
    // Section 3
    ...coinRow(2000, GROUND_Y - 70, 4),
    makeCoin(2220, 280),
    makeCoin(2440, 210),
    makeCoin(2620, 310),
    // Section 4
    makeCoin(3110, 380),
    makeCoin(3110, 260),
    makeCoin(3110, 140),
    makeCoin(3470, 270),
    makeCoin(3650, 200),
    // Section 5
    ...coinRow(3920, 380, 3),
    makeCoin(4110, 300),
    makeCoin(4470, 300),
    // Section 6
    ...coinRow(4920, 360, 4),
    makeCoin(5170, 280),
    makeCoin(5410, 200),
    makeCoin(5640, 300),
    ...coinRow(6080, 310, 4),
  ];

  const flag: Flag = {
    x: 6250,
    y: GROUND_Y - 200,
    w: 10,
    h: 200,
    poleH: 200,
  };

  return { platforms, enemies, coins, flag };
}

function makeEnemy(
  x: number,
  y: number,
  patrolLeft: number,
  patrolRight: number,
): Enemy {
  return {
    id: _enemyIdCounter++,
    pos: { x, y },
    vel: { x: 80, y: 0 },
    w: 32,
    h: 36,
    patrolLeft,
    patrolRight,
    alive: true,
    stomped: 0,
  };
}

function makeCoin(x: number, y: number): Coin {
  return {
    id: _coinIdCounter++,
    x,
    y,
    r: 10,
    collected: false,
    animTime: Math.random() * Math.PI * 2,
  };
}

function coinRow(startX: number, y: number, count: number): Coin[] {
  return Array.from({ length: count }, (_, i) => makeCoin(startX + i * 32, y));
}

// ─── AABB Collision ───────────────────────────────────────────────────────────

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function rectOf(e: { pos: Vec2; w: number; h: number }): Rect {
  return { x: e.pos.x, y: e.pos.y, w: e.w, h: e.h };
}

// ─── Initial State ────────────────────────────────────────────────────────────

function initGameData(): GameData {
  const level = createLevel();
  return {
    ...level,
    player: {
      pos: { x: 80, y: GROUND_Y - 48 },
      vel: { x: 0, y: 0 },
      w: 32,
      h: 48,
      onGround: false,
      lives: 3,
      invincible: 0,
      flashTimer: 0,
    },
    particles: [],
    camera: { x: 0, y: 0 },
    score: 0,
    state: "start",
    nextParticleId: 0,
    frameCount: 0,
    levelWidth: LEVEL_W,
  };
}

// ─── Particle Burst ───────────────────────────────────────────────────────────

function spawnCoinParticles(gd: GameData, x: number, y: number) {
  const particleColors = ["#ffdd00", "#ffee44", "#fffaa0", "#ff9900"];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
    const speed = 60 + Math.random() * 120;
    gd.particles.push({
      id: gd.nextParticleId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.6 + Math.random() * 0.4,
      maxLife: 0.6 + Math.random() * 0.4,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: 3 + Math.random() * 4,
    });
  }
}

function spawnStompParticles(gd: GameData, x: number, y: number) {
  const particleColors = ["#ff00e4", "#dd00cc", "#ff77ee"];
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI + (Math.PI * i) / 8;
    const speed = 80 + Math.random() * 100;
    gd.particles.push({
      id: gd.nextParticleId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.2,
      maxLife: 0.4 + Math.random() * 0.2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: 4 + Math.random() * 5,
    });
  }
}

// ─── Game Update ─────────────────────────────────────────────────────────────

function updateGame(
  gd: GameData,
  dt: number,
  keys: Set<string>,
  viewW: number,
  _viewH: number,
) {
  if (gd.state !== "playing") return;

  const clampedDt = Math.min(dt, 0.05); // cap delta time to prevent tunneling
  gd.frameCount++;

  const p = gd.player;

  // ── Input ──
  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  const jump =
    keys.has("ArrowUp") || keys.has("w") || keys.has("W") || keys.has(" ");

  if (left) p.vel.x = -PLAYER_SPEED;
  else if (right) p.vel.x = PLAYER_SPEED;
  else p.vel.x *= 0.75;

  if (jump && p.onGround) {
    p.vel.y = JUMP_FORCE;
    p.onGround = false;
  }

  // ── Physics ──
  p.vel.y += GRAVITY * clampedDt;
  p.pos.x += p.vel.x * clampedDt;
  p.pos.y += p.vel.y * clampedDt;

  // Clamp to level bounds
  if (p.pos.x < 0) p.pos.x = 0;
  if (p.pos.x + p.w > LEVEL_W) p.pos.x = LEVEL_W - p.w;

  // ── Platform collision ──
  p.onGround = false;
  for (const platform of gd.platforms) {
    const pr = rectOf(p);
    if (overlaps(pr, platform)) {
      const overlapX =
        Math.min(pr.x + pr.w, platform.x + platform.w) -
        Math.max(pr.x, platform.x);
      const overlapY =
        Math.min(pr.y + pr.h, platform.y + platform.h) -
        Math.max(pr.y, platform.y);

      if (overlapY < overlapX) {
        // Vertical collision
        if (pr.y < platform.y) {
          p.pos.y = platform.y - p.h;
          p.vel.y = 0;
          p.onGround = true;
        } else {
          p.pos.y = platform.y + platform.h;
          p.vel.y = Math.abs(p.vel.y) * 0.3;
        }
      } else {
        // Horizontal collision
        if (pr.x < platform.x) {
          p.pos.x = platform.x - p.w;
        } else {
          p.pos.x = platform.x + platform.w;
        }
        p.vel.x = 0;
      }
    }
  }

  // ── Fall death ──
  if (p.pos.y > LEVEL_H + 100) {
    takeDamage(gd);
    if (gd.state === "playing") {
      p.pos = { x: 80, y: GROUND_Y - 48 };
      p.vel = { x: 0, y: 0 };
    }
  }

  // ── Enemies ──
  for (const e of gd.enemies) {
    if (!e.alive) {
      if (e.stomped > 0) e.stomped--;
      continue;
    }

    e.pos.x += e.vel.x * clampedDt;
    e.vel.y += GRAVITY * clampedDt;
    e.pos.y += e.vel.y * clampedDt;

    // Enemy platform collision
    for (const platform of gd.platforms) {
      const er: Rect = { x: e.pos.x, y: e.pos.y, w: e.w, h: e.h };
      if (overlaps(er, platform)) {
        const overlapY =
          Math.min(er.y + er.h, platform.y + platform.h) -
          Math.max(er.y, platform.y);
        const overlapX =
          Math.min(er.x + er.w, platform.x + platform.w) -
          Math.max(er.x, platform.x);
        if (overlapY < overlapX) {
          if (er.y < platform.y) {
            e.pos.y = platform.y - e.h;
            e.vel.y = 0;
          }
        }
      }
    }

    // Patrol
    if (e.pos.x <= e.patrolLeft) {
      e.pos.x = e.patrolLeft;
      e.vel.x = Math.abs(e.vel.x);
    }
    if (e.pos.x + e.w >= e.patrolRight) {
      e.pos.x = e.patrolRight - e.w;
      e.vel.x = -Math.abs(e.vel.x);
    }

    // Player-enemy collision
    if (p.invincible > 0) continue;

    const pr = rectOf(p);
    const er: Rect = { x: e.pos.x, y: e.pos.y, w: e.w, h: e.h };
    if (!overlaps(pr, er)) continue;

    // Stomp detection: player falling and bottom of player above enemy center
    const playerBottom = p.pos.y + p.h;
    const enemyMid = e.pos.y + e.h / 2;
    if (p.vel.y > 0 && playerBottom < enemyMid + 14) {
      // Stomp!
      e.alive = false;
      e.stomped = 18;
      p.vel.y = JUMP_FORCE * 0.55;
      gd.score += 50;
      spawnStompParticles(gd, e.pos.x + e.w / 2, e.pos.y);
    } else {
      takeDamage(gd);
    }
  }

  // ── Coins ──
  for (const coin of gd.coins) {
    if (coin.collected) continue;
    coin.animTime += clampedDt * 3.5;
    const cr: Rect = {
      x: coin.x - coin.r,
      y: coin.y - coin.r,
      w: coin.r * 2,
      h: coin.r * 2,
    };
    if (overlaps(rectOf(p), cr)) {
      coin.collected = true;
      gd.score += 10;
      spawnCoinParticles(gd, coin.x, coin.y);
    }
  }

  // ── Invincibility timer ──
  if (p.invincible > 0) {
    p.invincible--;
    p.flashTimer++;
  } else {
    p.flashTimer = 0;
  }

  // ── Particles ──
  for (const part of gd.particles) {
    part.x += part.vx * clampedDt;
    part.y += part.vy * clampedDt;
    part.vy += 200 * clampedDt;
    part.life -= clampedDt;
  }
  gd.particles = gd.particles.filter((part) => part.life > 0);

  // ── Camera ──
  const targetCamX = p.pos.x - viewW / 2 + p.w / 2;
  gd.camera.x = Math.max(0, Math.min(targetCamX, LEVEL_W - viewW));

  // ── Win condition ──
  const fr: Rect = {
    x: gd.flag.x,
    y: gd.flag.y,
    w: gd.flag.w + 50,
    h: gd.flag.poleH,
  };
  if (overlaps(rectOf(p), fr)) {
    gd.state = "win";
  }
}

function takeDamage(gd: GameData) {
  const p = gd.player;
  if (p.invincible > 0) return;
  p.lives--;
  if (p.lives <= 0) {
    p.lives = 0;
    gd.state = "gameover";
  } else {
    p.invincible = 90; // 90 frames ≈ 1.5 seconds
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function drawGame(
  ctx: CanvasRenderingContext2D,
  gd: GameData,
  viewW: number,
  viewH: number,
) {
  const cam = gd.camera;

  // ── Background ──
  ctx.fillStyle = COLORS.void;
  ctx.fillRect(0, 0, viewW, viewH);

  // Grid lines for retro feel
  ctx.strokeStyle = COLORS.bgGrid;
  ctx.lineWidth = 1;
  const gridSize = 80;
  const gridOffX = ((-cam.x % gridSize) + gridSize) % gridSize;
  const gridOffY = ((-cam.y % gridSize) + gridSize) % gridSize;
  for (let gx = gridOffX; gx < viewW; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, viewH);
    ctx.stroke();
  }
  for (let gy = gridOffY; gy < viewH; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(viewW, gy);
    ctx.stroke();
  }

  // Stars (parallax layer)
  const starPositions = [
    [200, 80],
    [550, 40],
    [830, 120],
    [1100, 60],
    [1400, 90],
    [1700, 30],
    [2000, 110],
    [2300, 55],
    [2600, 130],
    [2900, 45],
    [3200, 85],
    [3500, 25],
    [3800, 100],
    [4100, 70],
    [4400, 50],
    [4700, 115],
    [5000, 35],
    [5300, 90],
    [5600, 60],
    [5900, 120],
    [430, 150],
    [720, 190],
    [980, 160],
    [1250, 200],
    [1600, 170],
  ];

  for (const [sx, sy] of starPositions) {
    const px = sx - cam.x * 0.15;
    const py = sy;
    const flicker = 0.4 + 0.6 * Math.abs(Math.sin(gd.frameCount * 0.03 + sx));
    ctx.globalAlpha = flicker * 0.7;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px % viewW, py, 2, 2);
  }
  ctx.globalAlpha = 1;

  // ── Ground ──
  const ground = gd.platforms[0];
  const gsx = ground.x - cam.x;
  // Ground body
  const groundGrad = ctx.createLinearGradient(
    0,
    ground.y - cam.y,
    0,
    ground.y + ground.h - cam.y,
  );
  groundGrad.addColorStop(0, "#0d1a2a");
  groundGrad.addColorStop(1, "#060d14");
  ctx.fillStyle = groundGrad;
  ctx.fillRect(gsx, ground.y - cam.y, ground.w, ground.h);
  // Ground top neon line
  ctx.shadowColor = COLORS.groundTop;
  ctx.shadowBlur = 8;
  ctx.fillStyle = COLORS.groundTop;
  ctx.fillRect(gsx, ground.y - cam.y, ground.w, 3);
  ctx.shadowBlur = 0;

  // ── Floating platforms ──
  for (let i = 1; i < gd.platforms.length; i++) {
    const plat = gd.platforms[i];
    const px = plat.x - cam.x;
    const py = plat.y - cam.y;
    if (px + plat.w < 0 || px > viewW) continue;

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(px, py, plat.w, plat.h);
    // Top neon strip
    ctx.shadowColor = COLORS.platformTop;
    ctx.shadowBlur = 6;
    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(px, py, plat.w, 3);
    // Bottom subtle glow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = COLORS.platformTop;
    ctx.fillRect(px, py + plat.h - 1, plat.w, 1);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // ── Flag ──
  {
    const f = gd.flag;
    const fx = f.x - cam.x;
    const fy = f.y - cam.y;
    ctx.shadowColor = COLORS.flag;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = COLORS.flagPole;
    ctx.lineWidth = f.w;
    ctx.beginPath();
    ctx.moveTo(fx + f.w / 2, fy + f.poleH);
    ctx.lineTo(fx + f.w / 2, fy);
    ctx.stroke();
    // Flag banner
    ctx.fillStyle = COLORS.flag;
    ctx.beginPath();
    ctx.moveTo(fx + f.w / 2, fy);
    ctx.lineTo(fx + f.w / 2 + 40, fy + 15);
    ctx.lineTo(fx + f.w / 2, fy + 30);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Coins ──
  for (const coin of gd.coins) {
    if (coin.collected) continue;
    const cx = coin.x - cam.x;
    const cy = coin.y - cam.y;
    if (cx < -30 || cx > viewW + 30) continue;

    const scale = 0.75 + 0.25 * Math.abs(Math.sin(coin.animTime));
    const pulse = 1 + 0.15 * Math.sin(coin.animTime * 1.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, pulse);
    ctx.shadowColor = COLORS.coin;
    ctx.shadowBlur = 12;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
    ctx.fill();
    // Inner star shape
    ctx.fillStyle = "#fff8a0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Enemies ──
  for (const e of gd.enemies) {
    if (!e.alive && e.stomped <= 0) continue;
    const ex = e.pos.x - cam.x;
    const ey = e.pos.y - cam.y;
    if (ex + e.w < 0 || ex > viewW) continue;

    const scaleY = e.alive ? 1 : 0.2 + 0.8 * (e.stomped / 18);

    ctx.save();
    ctx.translate(ex + e.w / 2, ey + e.h);
    ctx.scale(1, scaleY);
    ctx.translate(-(e.w / 2), -e.h);

    ctx.shadowColor = COLORS.enemy;
    ctx.shadowBlur = 8;

    // Body
    ctx.fillStyle = COLORS.enemy;
    ctx.fillRect(0, 0, e.w, e.h);

    // Face
    ctx.fillStyle = "#1a0022";
    ctx.fillRect(4, 6, e.w - 8, e.h - 12);

    // Eyes (2 white dots that show direction)
    const eyeOffX = e.vel.x > 0 ? 4 : 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6 + eyeOffX, 10, 6, 6);
    ctx.fillRect(6 + eyeOffX, 10, 3, 3);

    // Antenna
    ctx.strokeStyle = COLORS.enemy;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.w / 2 - 4, 0);
    ctx.lineTo(e.w / 2 - 4, -8);
    ctx.moveTo(e.w / 2 + 4, 0);
    ctx.lineTo(e.w / 2 + 4, -8);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Particles ──
  for (const part of gd.particles) {
    const alpha = part.life / part.maxLife;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = part.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = part.color;
    ctx.fillRect(
      part.x - cam.x - part.size / 2,
      part.y - cam.y - part.size / 2,
      part.size,
      part.size,
    );
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // ── Player ──
  const p = gd.player;
  const px = p.pos.x - cam.x;
  const py = p.pos.y - cam.y;

  // Flash when invincible
  const visible = p.invincible <= 0 || Math.floor(p.flashTimer / 5) % 2 === 0;

  if (visible) {
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px, py + 12, p.w, p.h - 12);

    // Head (slightly different shade)
    ctx.fillStyle = "#88faff";
    ctx.fillRect(px + 2, py, p.w - 4, 16);

    // Face
    ctx.fillStyle = "#002244";
    ctx.fillRect(px + 5, py + 3, p.w - 10, 9);

    // Eyes
    const eyeDir = p.vel.x < -10 ? -2 : p.vel.x > 10 ? 2 : 0;
    ctx.fillStyle = "#00f5ff";
    ctx.fillRect(px + 6 + eyeDir, py + 5, 5, 4);
    ctx.fillRect(px + 17 + eyeDir, py + 5, 5, 4);

    // Jetpack-like legs
    ctx.fillStyle = "#006688";
    ctx.fillRect(px + 3, py + p.h - 8, 10, 8);
    ctx.fillRect(px + p.w - 13, py + p.h - 8, 10, 8);

    ctx.shadowBlur = 0;
  }
}

// ─── React Component ──────────────────────────────────────────────────────────

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gdRef = useRef<GameData>(initGameData());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const touchRef = useRef({ left: false, right: false, jump: false });

  // React state only for HUD — updated every frame via requestAnimationFrame
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<GameState>("start");

  const resetGame = useCallback(() => {
    gdRef.current = initGameData();
    gdRef.current.state = "playing";
    setScore(0);
    setLives(3);
    setGameState("playing");
  }, []);

  const startGame = useCallback(() => {
    gdRef.current.state = "playing";
    setGameState("playing");
  }, []);

  // Build effective key set combining keyboard + touch
  const getEffectiveKeys = useCallback((): Set<string> => {
    const combined = new Set(keysRef.current);
    const t = touchRef.current;
    if (t.left) combined.add("ArrowLeft");
    if (t.right) combined.add("ArrowRight");
    if (t.jump) combined.add(" ");
    return combined;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      // Prevent scrolling
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      // Start/Restart on Enter
      if (e.key === "Enter") {
        const s = gdRef.current.state;
        if (s === "start") startGame();
        else if (s === "gameover" || s === "win") resetGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const gd = gdRef.current;
      const w = canvas.width;
      const h = canvas.height;

      updateGame(gd, dt, getEffectiveKeys(), w, h);
      drawGame(ctx, gd, w, h);

      // Sync react state
      setScore(gd.score);
      setLives(gd.player.lives);
      if (gd.state !== "playing") {
        setGameState(gd.state);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startGame, resetGame, getEffectiveKeys]);

  // ── Touch handlers ──
  const makeTouchHandlers = (key: "left" | "right" | "jump") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      touchRef.current[key] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      touchRef.current[key] = false;
    },
    onPointerLeave: (e: React.PointerEvent) => {
      e.preventDefault();
      touchRef.current[key] = false;
    },
  });

  const year = new Date().getFullYear();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a1a] select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="block"
        style={{ imageRendering: "pixelated" }}
        tabIndex={0}
      />

      {/* ── HUD ── */}
      {gameState === "playing" && (
        <>
          <div
            data-ocid="game.score_panel"
            className="absolute top-4 left-4 font-mono text-sm md:text-base font-bold"
            style={{
              color: "#ffdd00",
              textShadow: "0 0 8px #ffdd00, 0 0 16px #ffdd00aa",
              letterSpacing: "0.08em",
            }}
          >
            SCORE: {score}
          </div>
          <div
            data-ocid="game.lives_panel"
            className="absolute top-4 right-4 font-mono text-sm md:text-base font-bold flex items-center gap-1"
            style={{
              color: "#00f5ff",
              textShadow: "0 0 8px #00f5ff, 0 0 16px #00f5ffaa",
              letterSpacing: "0.08em",
            }}
          >
            {(["life-1", "life-2", "life-3"] as const).map((key, i) => (
              <span
                key={key}
                style={{
                  opacity: i < lives ? 1 : 0.2,
                  color: i < lives ? "#00f5ff" : "#224455",
                  transition: "all 0.2s",
                }}
              >
                ◈
              </span>
            ))}
            <span className="ml-1">×{lives}</span>
          </div>
        </>
      )}

      {/* ── Start Screen ── */}
      {gameState === "start" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Scanline effect */}
          <div className="absolute inset-0 scanlines pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-8">
            {/* Title */}
            <div className="text-center">
              <h1
                className="font-sans font-black tracking-widest text-5xl md:text-7xl lg:text-8xl"
                style={{
                  color: "#00f5ff",
                  textShadow:
                    "0 0 20px #00f5ff, 0 0 40px #00f5ff88, 0 0 80px #00f5ff44",
                  letterSpacing: "0.15em",
                }}
              >
                NEON
              </h1>
              <h1
                className="font-sans font-black tracking-widest text-5xl md:text-7xl lg:text-8xl -mt-2"
                style={{
                  color: "#ff00e4",
                  textShadow:
                    "0 0 20px #ff00e4, 0 0 40px #ff00e488, 0 0 80px #ff00e444",
                  letterSpacing: "0.15em",
                }}
              >
                RUNNER
              </h1>
            </div>

            {/* Decorative line */}
            <div
              className="w-64 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #00f5ff, #ff00e4, transparent)",
                boxShadow: "0 0 8px #00f5ff",
              }}
            />

            {/* Instructions */}
            <div className="text-center space-y-1.5">
              <p
                className="font-mono text-xs md:text-sm"
                style={{ color: "#88ffee", opacity: 0.8 }}
              >
                MOVE: ← → / A D &nbsp; JUMP: ↑ / W / SPACE
              </p>
              <p
                className="font-mono text-xs md:text-sm"
                style={{ color: "#88ffee", opacity: 0.8 }}
              >
                STOMP ENEMIES · COLLECT STARS · REACH THE FLAG
              </p>
            </div>

            {/* Play button */}
            <button
              type="button"
              data-ocid="game.start_button"
              className="pointer-events-auto font-mono font-bold tracking-widest text-sm md:text-base px-10 py-3 border-2 transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                color: "#0a0a1a",
                background: "#00f5ff",
                borderColor: "#00f5ff",
                boxShadow: "0 0 20px #00f5ff, 0 0 40px #00f5ff55",
                letterSpacing: "0.25em",
              }}
              onClick={startGame}
            >
              PRESS ENTER TO PLAY
            </button>

            <p
              className="font-mono text-xs"
              style={{ color: "#334455", letterSpacing: "0.1em" }}
            >
              OR TAP THE BUTTON ABOVE
            </p>
          </div>
        </div>
      )}

      {/* ── Game Over Screen ── */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-8">
            <h2
              className="font-sans font-black text-4xl md:text-6xl tracking-widest"
              style={{
                color: "#ff00e4",
                textShadow: "0 0 20px #ff00e4, 0 0 40px #ff00e488",
                letterSpacing: "0.1em",
              }}
            >
              GAME OVER
            </h2>
            <div
              className="font-mono text-2xl md:text-3xl font-bold"
              style={{
                color: "#ffdd00",
                textShadow: "0 0 10px #ffdd00",
              }}
            >
              SCORE: {score}
            </div>
            <button
              type="button"
              data-ocid="game.restart_button"
              className="font-mono font-bold tracking-widest text-sm md:text-base px-10 py-3 border-2 transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                color: "#0a0a1a",
                background: "#ff00e4",
                borderColor: "#ff00e4",
                boxShadow: "0 0 20px #ff00e4, 0 0 40px #ff00e455",
                letterSpacing: "0.25em",
              }}
              onClick={resetGame}
            >
              PRESS ENTER TO RESTART
            </button>
          </div>
        </div>
      )}

      {/* ── Win Screen ── */}
      {gameState === "win" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-8">
            <h2
              className="font-sans font-black text-4xl md:text-6xl tracking-widest text-center"
              style={{
                color: "#00ff88",
                textShadow: "0 0 20px #00ff88, 0 0 40px #00ff8888",
                letterSpacing: "0.1em",
              }}
            >
              YOU WIN!
            </h2>
            <div
              className="font-mono text-2xl md:text-3xl font-bold"
              style={{
                color: "#ffdd00",
                textShadow: "0 0 10px #ffdd00",
              }}
            >
              FINAL SCORE: {score}
            </div>
            <button
              type="button"
              data-ocid="game.restart_button"
              className="font-mono font-bold tracking-widest text-sm md:text-base px-10 py-3 border-2 transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                color: "#0a0a1a",
                background: "#00ff88",
                borderColor: "#00ff88",
                boxShadow: "0 0 20px #00ff88, 0 0 40px #00ff8855",
                letterSpacing: "0.25em",
              }}
              onClick={resetGame}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Touch Controls ── */}
      {gameState === "playing" && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 pointer-events-none">
          {/* Left / Right buttons */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              type="button"
              data-ocid="game.left_button"
              className="w-14 h-14 md:w-16 md:h-16 rounded border-2 font-mono font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: "rgba(0,245,255,0.12)",
                borderColor: "#00f5ff",
                color: "#00f5ff",
                boxShadow: "0 0 10px rgba(0,245,255,0.3)",
                touchAction: "none",
              }}
              {...makeTouchHandlers("left")}
            >
              ←
            </button>
            <button
              type="button"
              data-ocid="game.right_button"
              className="w-14 h-14 md:w-16 md:h-16 rounded border-2 font-mono font-bold text-lg flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: "rgba(0,245,255,0.12)",
                borderColor: "#00f5ff",
                color: "#00f5ff",
                boxShadow: "0 0 10px rgba(0,245,255,0.3)",
                touchAction: "none",
              }}
              {...makeTouchHandlers("right")}
            >
              →
            </button>
          </div>

          {/* Jump button */}
          <div className="pointer-events-auto">
            <button
              type="button"
              data-ocid="game.jump_button"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 font-mono font-black text-sm flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: "rgba(255,0,228,0.12)",
                borderColor: "#ff00e4",
                color: "#ff00e4",
                boxShadow: "0 0 12px rgba(255,0,228,0.4)",
                touchAction: "none",
                letterSpacing: "0.1em",
              }}
              {...makeTouchHandlers("jump")}
            >
              JUMP
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 font-mono text-xs whitespace-nowrap"
        style={{ color: "#1a2233", letterSpacing: "0.05em" }}
      >
        © {year} Ayush Srivastava. All rights reserved. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#223344" }}
          className="hover:opacity-70 transition-opacity"
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}
