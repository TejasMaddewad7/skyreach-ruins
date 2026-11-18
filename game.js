"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 800;
const H = 600;
const GRAVITY = 0.6;
const JUMP = 11;
const SPEED = 4;
const CLIMB = 2.5;
const MAX_FALL = 14;

const names = ["Broken Steps", "Gear Hall", "Skyreach Summit"];
const hints = [
  "A coloured plate opens its matching door. Hold it while the other player passes!",
  "Bridges exist only while a plate is held. Climb ladders with W/S or Up/Down.",
  "Stand on your partner's head to reach the high coins!"
];

let level = 1;
let state = "playing";
let coins = 0;
let possibleAtStart = 0;
let tick = 0;
let world;
let players;

const rect = (x, y, w, h) => ({ x, y, w, h });

function makePlayer(x, y, color, accessory, label) {
  return {
    x, y, w: 24, h: 32, vy: 0,
    left: false, right: false, up: false, down: false,
    onGround: false, climbing: false, atExit: false,
    facing: 1, color, accessory, label
  };
}

function buildLevel(n) {
  level = n;
  state = "playing";

  const d = {
    platforms: [],
    spikes: [],
    ladders: [],
    plates: [],
    gates: [],
    movers: [],
    coins: [],
    plateDown: [false, false, false, false],
    exit: rect(0, 0, 0, 0)
  };

  const addPlatform = (x, y, w, h) =>
    d.platforms.push(rect(x, y, w, h));
  const addSpike = (x, y, w, h) =>
    d.spikes.push(rect(x, y, w, h));
  const addLadder = (x, y, w, h) =>
    d.ladders.push(rect(x, y, w, h));
  const addCoin = (x, y) =>
    d.coins.push({ r: rect(x, y, 16, 16), taken: false });
  const addPlate = (x, y, w, id) =>
    d.plates.push({ r: rect(x, y, w, 6), id });
  const addGate = (x, y, w, h, id, bridge) =>
    d.gates.push({ r: rect(x, y, w, h), id, bridge });
  const addMover = (x, y, w, h, horiz, min, max, speed) =>
    d.movers.push({
      r: rect(x, y, w, h),
      horiz, min, max, speed,
      dir: 1,
      wait: 0
    });

  if (n === 1) {
    addPlatform(0, 60, 260, 30);
    addPlatform(340, 60, 140, 30);
    addPlatform(400, 130, 80, 16);
    addPlatform(520, 130, 280, 20);
    addSpike(260, 30, 80, 20);

    addPlate(545, 150, 40, 1);
    addGate(700, 150, 20, 110, 1, false);
    addPlate(725, 150, 34, 1);

    d.exit = rect(762, 150, 38, 70);

    [[96,100],[292,135],[432,156],[562,165],[640,160],[672,205]]
      .forEach(([x,y]) => addCoin(x, y));

    players = [
      makePlayer(60, 91, "#e94d43", "#ffd95e", "P1"),
      makePlayer(110, 91, "#3979db", "#ffffff", "P2")
    ];
  }

  else if (n === 2) {
    addPlatform(0, 40, 180, 30);
    addPlatform(420, 40, 160, 30);
    addPlatform(330, 200, 190, 30);
    addPlatform(0, 200, 160, 30);
    addPlatform(156, 360, 300, 30);

    addSpike(180, 22, 240, 20);
    addSpike(260, 390, 60, 16);
    addMover(186, 40, 80, 30, true, 186, 334, 1.5);

    addLadder(532, 70, 26, 170);
    addLadder(118, 230, 26, 170);

    addPlate(460, 230, 40, 2);
    addGate(160, 200, 170, 30, 2, true);
    addPlate(100, 230, 40, 2);

    d.exit = rect(405, 390, 40, 70);

    [[80,90],[300,92],[455,90],[535,150],[360,250],[420,250],
     [60,250],[200,410],[285,430],[350,410]]
      .forEach(([x,y]) => addCoin(x, y));

    players = [
      makePlayer(30, 71, "#e94d43", "#ffd95e", "P1"),
      makePlayer(80, 71, "#3979db", "#ffffff", "P2")
    ];
  }

  else {
    addPlatform(0, 40, 150, 30);
    addPlatform(260, 40, 260, 30);
    addPlatform(330, 171, 70, 14);
    addPlatform(620, 300, 180, 30);
    addPlatform(200, 300, 200, 30);
    addPlatform(40, 450, 136, 30);

    addSpike(150, 22, 110, 20);
    addSpike(650, 330, 40, 16);
    addSpike(115, 480, 40, 16);

    addMover(545, 44, 70, 16, false, 44, 314, 1.5);

    addPlate(270, 70, 40, 1);
    addGate(420, 70, 20, 130, 1, false);
    addPlate(470, 70, 40, 1);

    addPlate(740, 330, 40, 2);
    addGate(400, 300, 220, 30, 2, true);
    addPlate(330, 330, 40, 2);

    addLadder(188, 330, 26, 160);

    d.exit = rect(50, 480, 50, 70);

    [[205,125],[345,195],[375,195],[480,95],[570,190],[665,365],
     [480,345],[550,345],[270,350],[193,400],[125,520]]
      .forEach(([x,y]) => addCoin(x, y));

    players = [
      makePlayer(20, 71, "#e94d43", "#ffd95e", "P1"),
      makePlayer(70, 71, "#3979db", "#ffffff", "P2")
    ];
  }

  world = d;
  document.getElementById("level-label").textContent =
    `LEVEL ${n} · ${names[n - 1].toUpperCase()}`;
}

function restart() {
  if (state === "won") {
    coins = 0;
    possibleAtStart = 0;
    buildLevel(1);
  } else {
    buildLevel(level);
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w - 0.01 &&
         a.x + a.w > b.x + 0.01 &&
         a.y < b.y + b.h - 0.01 &&
         a.y + a.h > b.y + 0.01;
}

function getSolids() {
  return [
    ...world.platforms,
    ...world.movers.map(m => m.r),
    ...world.gates
      .filter(g => g.bridge === world.plateDown[g.id])
      .map(g => g.r)
  ];
}

function ladderAt(p) {
  const cx = p.x + p.w / 2;
  return world.ladders.find(l =>
    cx >= l.x &&
    cx <= l.x + l.w &&
    p.y < l.y + l.h &&
    p.y + p.h > l.y
  ) || null;
}

function updatePlates() {
  world.plateDown = [false, false, false, false];

  for (const plate of world.plates) {
    if (players.some(p => overlaps(p, plate.r))) {
      world.plateDown[plate.id] = true;
    }
  }
}

function updateMovers() {
  for (const mover of world.movers) {
    const old = { ...mover.r };

    const riders = players.map(p =>
      Math.abs(p.y - (old.y + old.h)) < 2.5 &&
      p.x + p.w > old.x &&
      p.x < old.x + old.w &&
      !p.climbing
    );

    if (mover.wait > 0) {
      mover.wait--;
    } else {
      const axis = mover.horiz ? "x" : "y";
      mover.r[axis] += mover.dir * mover.speed;

      if (mover.r[axis] >= mover.max) {
        mover.r[axis] = mover.max;
        mover.dir = -1;
        mover.wait = 45;
      } else if (mover.r[axis] <= mover.min) {
        mover.r[axis] = mover.min;
        mover.dir = 1;
        mover.wait = 45;
      }
    }

    for (let i = 0; i < 2; i++) {
      if (riders[i]) {
        players[i].x += mover.r.x - old.x;
        players[i].y += mover.r.y - old.y;
      }
    }
  }
}

function movePlayer(p, partner) {
  const ladder = ladderAt(p);

  if (!ladder) p.climbing = false;
  else if (p.up || p.down) p.climbing = true;
  else if (p.climbing && (p.left || p.right)) p.climbing = false;

  let dx = (p.right ? SPEED : 0) - (p.left ? SPEED : 0);
  if (p.climbing) dx *= 0.5;
  if (dx > 0) p.facing = 1;
  else if (dx < 0) p.facing = -1;

  p.x += dx;

  for (const solid of getSolids()) {
    if (overlaps(p, solid)) {
      if (dx > 0) p.x = solid.x - p.w;
      else if (dx < 0) p.x = solid.x + solid.w;
    }
  }

  p.x = Math.max(0, Math.min(W - p.w, p.x));

  let dy;

  if (p.climbing) {
    p.vy = 0;
    dy = (p.up ? CLIMB : 0) - (p.down ? CLIMB : 0);

    if (dy > 0 && ladder) {
      const maxY = ladder.y + ladder.h - 2;
      if (p.y + dy > maxY) {
        dy = Math.max(0, maxY - p.y);
      }
    }
  } else {
    p.vy -= GRAVITY;
    p.vy = Math.max(-MAX_FALL, p.vy);
    dy = p.vy;
  }

  const previousY = p.y;
  p.y += dy;
  p.onGround = false;

  for (const solid of getSolids()) {
    if (overlaps(p, solid)) {
      if (dy < 0) {
        p.y = solid.y + solid.h;
        p.onGround = true;
        p.vy = 0;
      } else if (dy > 0) {
        p.y = solid.y - p.h;
        p.vy = 0;
      }
    }
  }

  if (overlaps(p, partner)) {
    if (dy < 0 && previousY >= partner.y + partner.h - 1) {
      p.y = partner.y + partner.h;
      p.onGround = true;
      p.vy = 0;
    } else if (dy > 0 &&
               previousY + p.h <= partner.y + 1) {
      partner.y = p.y + p.h;
      partner.vy = 0;
    }
  }
}

function playCoinSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.12
    );

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
  } catch (_) {}
}

function update() {
  if (state !== "playing") return;

  tick++;

  updatePlates();
  updateMovers();

  movePlayer(players[0], players[1]);
  movePlayer(players[1], players[0]);

  updatePlates();

  for (const spike of world.spikes) {
    if (players.some(p =>
      overlaps(
        { x: p.x + 4, y: p.y, w: p.w - 8, h: p.h - 12 },
        spike
      )
    )) {
      state = "over";
    }
  }

  for (const coin of world.coins) {
    if (!coin.taken && players.some(p => overlaps(p, coin.r))) {
      coin.taken = true;
      coins++;
      playCoinSound();
    }
  }

  for (const p of players) {
    p.atExit = overlaps(p, world.exit);
  }

  if (players.every(p => p.atExit)) {
    state = level >=
