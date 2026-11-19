"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = 800;
const H = 600;

const GRAVITY = 0.3;
const JUMP = 8;
const SPEED = 2;
const CLIMB = 2.5;
const MAX_FALL = 14;

const LEVEL_NAMES = ["Broken Steps", "Gear Hall", "Skyreach Summit"];
const LEVEL_HINTS = [
  "A coloured plate opens the door of the same colour.",
  "Bridges exist only while a plate is held. Climb ladders with W/S or Up/Down.",
  "Stand on your partner's head to reach high coins!"
];

let level = 1;
let state = "PLAYING";
let tick = 0;
let coins = 0;
let possible = 0;
let world;
let players;

const rect = (x, y, w, h) => ({ x, y, w, h });

function makePlayer(x, y, color, accessory, label) {
  return {
    x,
    y,
    w: 24,
    h: 32,
    vy: 0,
    left: false,
    right: false,
    up: false,
    down: false,
    onGround: false,
    climbing: false,
    atExit: false,
    facing: 1,
    color,
    accessory,
    label
  };
}

function loadLevel(number) {
  level = number;
  state = "PLAYING";

  world = {
    platforms: [],
    spikes: [],
    ladders: [],
    coinList: [],
    plates: [],
    gates: [],
    movers: [],
    plateDown: [false, false, false, false],
    exit: rect(0, 0, 0, 0)
  };

  function addPlatform(x, y, w, h) {
    world.platforms.push(rect(x, y, w, h));
  }

  function addSpike(x, y, w, h) {
    world.spikes.push(rect(x, y, w, h));
  }

  function addLadder(x, y, w, h) {
    world.ladders.push(rect(x, y, w, h));
  }

  function addCoin(x, y) {
    world.coinList.push({
      r: rect(x, y, 16, 16),
      taken: false
    });
  }

  function addPlate(x, y, w, id) {
    world.plates.push({
      r: rect(x, y, w, 6),
      id
    });
  }

  function addGate(x, y, w, h, id, bridge) {
    world.gates.push({
      r: rect(x, y, w, h),
      id,
      bridge
    });
  }

  function addMover(x, y, w, h, horizontal, minV, maxV, speed) {
    world.movers.push({
      r: rect(x, y, w, h),
      horizontal,
      minV,
      maxV,
      speed,
      dir: 1,
      wait: 0
    });
  }

  if (number === 1) {
    addPlatform(0, 60, 260, 30);
    addPlatform(340, 60, 140, 30);
    addPlatform(400, 130, 80, 16);
    addPlatform(520, 130, 280, 20);

    addSpike(260, 30, 80, 20);

    addPlate(545, 150, 40, 1);
    addGate(700, 150, 20, 110, 1, false);
    addPlate(725, 150, 34, 1);

    world.exit = rect(762, 150, 38, 70);

    [
      [96, 100], [292, 135], [432, 156],
      [562, 165], [640, 160], [672, 205]
    ].forEach(([x, y]) => addCoin(x, y));

    players = [
      makePlayer(60, 91, "#e94d43", "#ffd95e", "P1"),
      makePlayer(110, 91, "#3979db", "#ffffff", "P2")
    ];
  } else if (number === 2) {
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

    world.exit = rect(405, 390, 40, 70);

    [
      [80, 90], [300, 92], [455, 90], [535, 150],
      [360, 250], [420, 250], [60, 250], [200, 410],
      [285, 430], [350, 410]
    ].forEach(([x, y]) => addCoin(x, y));

    players = [
      makePlayer(30, 71, "#e94d43", "#ffd95e", "P1"),
      makePlayer(80, 71, "#3979db", "#ffffff", "P2")
    ];
  } else {
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

    world.exit = rect(50, 480, 50, 70);

    [
      [205, 125], [345, 195], [375, 195], [480, 95],
      [570, 190], [665, 365], [480, 345], [550, 345],
      [270, 350], [193, 400], [125, 520]
    ].forEach(([x, y]) => addCoin(x, y));

    players = [
      makePlayer(20, 71, "#e94d43", "#ffd95e", "P1"),
      makePlayer(70, 71, "#3979db", "#ffffff", "P2")
    ];
  }

  possible = world.coinList.length;
  updateLevelLabel();
}

function updateLevelLabel() {
  const label = document.getElementById("level-label");
  if (label) {
    label.textContent =
      `LEVEL ${level} · ${LEVEL_NAMES[level - 1].toUpperCase()}`;
  }
}

function restartLevel() {
  loadLevel(level);
}

function restartGame() {
  coins = 0;
  loadLevel(1);
}

function nextLevel() {
  if (level < 3) {
    loadLevel(level + 1);
  }
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.w - 0.01 &&
    a.x + a.w > b.x + 0.01 &&
    a.y < b.y + b.h - 0.01 &&
    a.y + a.h > b.y + 0.01
  );
}

function getSolids() {
  const solids = [...world.platforms];

  for (const mover of world.movers) {
    solids.push(mover.r);
  }

  for (const gate of world.gates) {
    if (gate.bridge === world.plateDown[gate.id]) {
      solids.push(gate.r);
    }
  }

  return solids;
}

function ladderAt(player) {
  const cx = player.x + player.w / 2;

  for (const ladder of world.ladders) {
    if (
      cx >= ladder.x &&
      cx <= ladder.x + ladder.w &&
      player.y < ladder.y + ladder.h &&
      player.y + player.h > ladder.y
    ) {
      return ladder;
    }
  }

  return null;
}

function updatePlates() {
  world.plateDown = [false, false, false, false];

  for (const plate of world.plates) {
    if (
      overlaps(players[0], plate.r) ||
      overlaps(players[1], plate.r)
    ) {
      world.plateDown[plate.id] = true;
    }
  }
}

function updateMovers() {
  for (const mover of world.movers) {
    const old = { ...mover.r };

    const riders = players.map(player =>
      Math.abs(player.y - (old.y + old.h)) < 2.5 &&
      player.x + player.w > old.x &&
      player.x < old.x + old.w &&
      !player.climbing
    );

    if (mover.wait > 0) {
      mover.wait--;
    } else {
      const axis = mover.horizontal ? "x" : "y";
      mover.r[axis] += mover.dir * mover.speed;

      if (mover.r[axis] >= mover.maxV) {
        mover.r[axis] = mover.maxV;
        mover.dir = -1;
        mover.wait = 45;
      } else if (mover.r[axis] <= mover.minV) {
        mover.r[axis] = mover.minV;
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

function updatePlayer(player, partner) {
  const ladder = ladderAt(player);

  if (!ladder) {
    player.climbing = false;
  } else if (player.up || player.down) {
    player.climbing = true;
  } else if (player.climbing && (player.left || player.right)) {
    player.climbing = false;
  }

  let dx =
    (player.right ? SPEED : 0) -
    (player.left ? SPEED : 0);

  if (player.climbing) {
    dx *= 0.5;
  }

  if (dx > 0) player.facing = 1;
  if (dx < 0) player.facing = -1;

  player.x += dx;

  for (const solid of getSolids()) {
    if (overlaps(player, solid)) {
      if (dx > 0) {
        player.x = solid.x - player.w;
      } else if (dx < 0) {
        player.x = solid.x + solid.w;
      }
    }
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > W) {
    player.x = W - player.w;
  }

  let dy;

  if (player.climbing) {
    player.vy = 0;
    dy =
      (player.up ? CLIMB : 0) -
      (player.down ? CLIMB : 0);

    if (dy > 0 && ladder) {
      const maxY = ladder.y + ladder.h - 2;
      if (player.y + dy > maxY) {
        dy = maxY > player.y ? maxY - player.y : 0;
      }
    }
  } else {
    player.vy -= GRAVITY;
    if (player.vy < -MAX_FALL) {
      player.vy = -MAX_FALL;
    }
    dy = player.vy;
  }

  const previousY = player.y;
  player.y += dy;
  player.onGround = false;

  for (const solid of getSolids()) {
    if (overlaps(player, solid)) {
      if (dy < 0) {
        player.y = solid.y + solid.h;
        player.onGround = true;
        player.vy = 0;
      } else if (dy > 0) {
        player.y = solid.y - player.h;
        player.vy = 0;
      }
    }
  }

  if (overlaps(player, partner)) {
    if (
      dy < 0 &&
      previousY >= partner.y + partner.h - 1
    ) {
      player.y = partner.y + partner.h;
      player.onGround = true;
      player.vy = 0;
    } else if (
      dy > 0 &&
      previousY + player.h <= partner.y + 1
    ) {
      partner.y = player.y + player.h;
      partner.vy = 0;
    }
  }
}

function checkSpikes() {
  for (const spike of world.spikes) {
    const hit = players.some(player =>
      overlaps(
        {
          x: player.x + 4,
          y: player.y,
          w: player.w - 8,
          h: player.h - 12
        },
        spike
      )
    );

    if (hit) {
      state = "GAME_OVER";
    }
  }
}

function checkCoins() {
  for (const coin of world.coinList) {
    if (coin.taken) continue;

    if (
      overlaps(players[0], coin.r) ||
      overlaps(players[1], coin.r)
    ) {
      coin.taken = true;
      coins++;
    }
  }
}

function checkExit() {
  players[0].atExit = overlaps(players[0], world.exit);
  players[1].atExit = overlaps(players[1], world.exit);

  if (players[0].atExit && players[1].atExit) {
    state =
      level >= 3
        ? "GAME_WON"
        : "LEVEL_WON";
  }
}

function update() {
  tick++;

  if (state === "PLAYING") {
    updatePlates();
    updateMovers();
    updatePlayer(players[0], players[1]);
    updatePlayer(players[1], players[0]);
    updatePlates();

    checkSpikes();
    checkCoins();
    checkExit();

    if (players[0].y < -40 || players[1].y < -40) {
      state = "GAME_OVER";
    }
  }
}

function fillRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(cx, cy, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawText(text, x, y, size = 14, color = "#ffffff", centered = false) {
  ctx.save();
  ctx.translate(0, H);
  ctx.scale(1, -1);

  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = centered ? "center" : "left";
  ctx.fillText(text, x, H - y);

  ctx.restore();
}

function idColor(id) {
  return id === 1
    ? "#ff8c35"
    : "#d94de5";
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);

  gradient.addColorStop(0, "#54729b");
  gradient.addColorStop(1, "#0f1d3d");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function drawPlatform(platform) {
  fillRect(
    platform.x,
    platform.y,
    platform.w,
    platform.h,
    "#6b5148"
  );

  fillRect(
    platform.x,
    platform.y + platform.h - 5,
    platform.w,
    5,
    "#639454"
  );

  fillRect(
    platform.x,
    platform.y,
    platform.w,
    4,
    "#44332f"
  );
}

function drawLadders() {
  for (const ladder of world.ladders) {
    fillRect(ladder.x + 2, ladder.y, 4, ladder.h, "#a5753c");
    fillRect(
      ladder.x + ladder.w - 6,
      ladder.y,
      4,
      ladder.h,
      "#a5753c"
    );

    for (let y = ladder.y + 8; y < ladder.y + ladder.h; y += 14) {
      fillRect(ladder.x + 2, y, ladder.w - 4, 3, "#d0a45f");
    }
  }
}

function drawSpikes() {
  for (const spike of world.spikes) {
    const count = Math.max(1, Math.floor(spike.w / 12));
    const width = spike.w / count;

    ctx.fillStyle = "#d9dce6";

    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(spike.x + i * width, spike.y);
      ctx.lineTo(spike.x + (i + 1) * width, spike.y);
      ctx.lineTo(
        spike.x + (i + 0.5) * width,
        spike.y + spike.h
      );
      ctx.fill();
    }
  }
}

function drawGates() {
  for (const gate of world.gates) {
    const solid =
      gate.bridge === world.plateDown[gate.id];

    const color = idColor(gate.id);

    if (!solid) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(
        gate.r.x,
        gate.r.y,
        gate.r.w,
        gate.r.h
      );
      ctx.restore();
      continue;
    }

    if (gate.bridge) {
      fillRect(
        gate.r.x,
        gate.r.y,
        gate.r.w,
        gate.r.h,
        "#936333"
      );

      fillRect(
        gate.r.x,
        gate.r.y + gate.r.h - 4,
        gate.r.w,
        4,
        color
      );
    } else {
      fillRect(
        gate.r.x,
        gate.r.y,
        gate.r.w,
        gate.r.h,
        color
      );

      for (
        let y = gate.r.y + 8;
        y < gate.r.y + gate.r.h;
        y += 16
      ) {
        fillRect(
          gate.r.x,
          y,
          gate.r.w,
          3,
          "#ffd28b"
        );
      }
    }
  }
}

function drawPlates() {
  for (const plate of world.plates) {
    fillRect(
      plate.r.x - 3,
      plate.r.y,
      plate.r.w + 6,
      2,
      "#45404c"
    );

    fillRect(
      plate.r.x,
      plate.r.y + 2,
      plate.r.w,
      world.plateDown[plate.id] ? 2 : 5,
      world.plateDown[plate.id]
        ? "#ffffff"
        : idColor(plate.id)
    );
  }
}

function drawMovers() {
  for (const mover of world.movers) {
    fillRect(
      mover.r.x,
      mover.r.y,
      mover.r.w,
      mover.r.h,
      "#b88d3d"
    );

    fillRect(
      mover.r.x,
      mover.r.y + mover.r.h - 3,
      mover.r.w,
      3,
      "#f5d27a"
    );

    for (
      let x = mover.r.x + 8;
      x < mover.r.x + mover.r.w - 4;
      x += 16
    ) {
      drawCircle(
        x,
        mover.r.y + mover.r.h / 2,
        2,
        "#483513"
      );
    }
  }
}

function drawCoins() {
  for (let i = 0; i < world.coinList.length; i++) {
    const coin = world.coinList[i];
    if (coin.taken) continue;

    const cx = coin.r.x + 8;
    const cy =
      coin.r.y + 8 +
      Math.sin(tick * 0.1 + i) * 2;

    drawCircle(cx, cy, 8, "#da9a14");
    drawCircle(cx, cy, 5, "#ffdf42");
  }
}

function drawExit() {
  const exit = world.exit;

  fillRect(
    exit.x - 5,
    exit.y,
    exit.w + 10,
    exit.h + 6,
    "#795d29"
  );

  fillRect(exit.x, exit.y, exit.w, exit.h, "#ffd56d");

  const inside =
    (players[0].atExit ? 1 : 0) +
    (players[1].atExit ? 1 : 0);

  drawText(
    `EXIT ${inside}/2`,
    exit.x + exit.w / 2,
    exit.y + exit.h + 20,
    12,
    "#ffffff",
    true
  );
}

function drawPlayer(player) {
  fillRect(
    player.x + 4,
    player.y,
    7,
    9,
    player.color
  );

  fillRect(
    player.x + player.w - 11,
    player.y,
    7,
    9,
    player.color
  );

  fillRect(
    player.x + 2,
    player.y + 8,
    player.w - 4,
    14,
    player.color
  );

  if (player.label === "P1") {
    fillRect(
      player.x + 5,
      player.y + 27,
      player.w - 10,
      3,
      player.accessory
    );
  } else {
    fillRect(
      player.x + 2,
      player.y + 19,
      player.w - 4,
      3,
      player.accessory
    );
  }

  drawCircle(
    player.x + player.w / 2,
    player.y + 26,
    6.5,
    "#ffdbbd"
  );

  drawCircle(
    player.x + player.w / 2 +
      (player.facing > 0 ? 2 : -2),
    player.y + 26,
    1.4,
    "#191525"
  );

  drawText(
    player.label,
    player.x + player.w / 2,
    player.y + 38,
    10,
    "#ffffff",
    true
  );
}

function drawHUD() {
  fillRect(0, 0, W, 22, "#0c1020");

  drawText(
    LEVEL_HINTS[level - 1],
    W / 2,
    15,
    11,
    "#e3e5ef",
    true
  );

  drawText(
    `COINS ${coins} / ${possible}`,
    14,
    29,
    16,
    "#ffdf6e"
  );

  drawText(
    `LEVEL ${level} · ${LEVEL_NAMES[level - 1]}`,
    W / 2,
    29,
    14,
    "#ffffff",
    true
  );
}

function drawScreen() {
  ctx.fillStyle = "#080c1b";
  ctx.fillRect(0, 0, W, H);

  let title;
  let subtitle;
  let action;

  if (state === "GAME_OVER") {
    title = "GAME OVER";
    subtitle = "A teammate fell or hit a spike.";
    action = "Press R to retry";
  } else if (state === "LEVEL_WON") {
    title = "LEVEL COMPLETE!";
    subtitle =
      `${LEVEL_NAMES[level - 1]} · Coins ${coins} / ${possible}`;
    action = "Press ENTER for the next level";
  } else {
    title = "YOU ESCAPED SKYREACH RUINS!";
    subtitle =
      `Teamwork made it possible. Coins ${coins} / ${possible}`;
    action = "Press R to play again";
  }

  drawText(
    title,
    W / 2,
    250,
    32,
    state === "GAME_OVER" ? "#ff7777" : "#ffdc70",
    true
  );

  drawText(
    subtitle,
    W / 2,
    290,
    16,
    "#ffffff",
    true
  );

  drawText(
    action,
    W / 2,
    345,
    14,
    "#c6cce0",
    true
  );
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  if (
    state === "GAME_OVER" ||
    state === "LEVEL_WON" ||
    state === "GAME_WON"
  ) {
    drawScreen();
    return;
  }

  drawBackground();

  for (const platform of world.platforms) {
    drawPlatform(platform);
  }

  drawLadders();
  drawSpikes();
  drawGates();
  drawPlates();
  drawMovers();
  drawCoins();
  drawExit();

  drawPlayer(players[0]);
  drawPlayer(players[1]);

  drawHUD();
}

function keyboardDown(event) {
  if (
    event.code === "ArrowUp" ||
    event.code === "ArrowDown" ||
    event.code === "ArrowLeft" ||
    event.code === "ArrowRight"
  ) {
    event.preventDefault();
  }

  if (event.code === "KeyR") {
    if (state === "GAME_WON") {
      restartGame();
    } else {
      restartLevel();
    }
    return;
  }

  if (
    event.code === "Enter" &&
    state === "LEVEL_WON"
  ) {
    nextLevel();
    return;
  }

  if (state !== "PLAYING") return;

  if (event.code === "KeyA") players[0].left = true;
  if (event.code === "KeyD") players[0].right = true;
  if (event.code === "KeyS") players[0].down = true;

  if (event.code === "KeyW") {
    players[0].up = true;
    if (
      players[0].onGround &&
      ladderAt(players[0]) === null
    ) {
      players[0].vy = JUMP;
    }
  }

  if (event.code === "ArrowLeft") players[1].left = true;
  if (event.code === "ArrowRight") players[1].right = true;
  if (event.code === "ArrowDown") players[1].down = true;

  if (event.code === "ArrowUp") {
    players[1].up = true;
    if (
      players[1].onGround &&
      ladderAt(players[1]) === null
    ) {
      players[1].vy = JUMP;
    }
  }
}

function keyboardUp(event) {
  if (event.code === "KeyA") players[0].left = false;
  if (event.code === "KeyD") players[0].right = false;
  if (event.code === "KeyS") players[0].down = false;
  if (event.code === "KeyW") players[0].up = false;

  if (event.code === "ArrowLeft") players[1].left = false;
  if (event.code === "ArrowRight") players[1].right = false;
  if (event.code === "ArrowDown") players[1].down = false;
  if (event.code === "ArrowUp") players[1].up = false;
}

function frame() {
  update();
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", keyboardDown);
window.addEventListener("keyup", keyboardUp);

loadLevel(1);
requestAnimationFrame(frame);
