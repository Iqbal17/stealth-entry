// Hushlight level data: three lamp-lit depot floors, drawn as plain rectangles.
//
// Every level is deterministic data: solid walls, crates, LOS-blocking bushes,
// lamp pools, a player start, a ledger to steal, an exit gate, and the guard
// patrol loops. Coordinates live in the fixed 960x600 playfield.
//
// Rect kinds:
//   walls  - solid, block movement and sight
//   crates - solid, block movement and sight
//   bushes - block sight only; the courier can slip through them and hide
//
// The SHOTS table stages genuine mid-game moments for screenshots: real level
// data, real positions, real detection values, rendered by the normal code.

var HushLevels = [
  {
    name: 'Level 1 · The Night Yard',
    sub: 'Learn the cones. Two guards, wide lanes.',
    range: 165,
    walls: [
      { x: 430, y: 0, w: 24, h: 210 },
      { x: 430, y: 390, w: 24, h: 210 },
      { x: 120, y: 250, w: 180, h: 24 },
    ],
    crates: [
      { x: 200, y: 120, w: 52, h: 52 },
      { x: 252, y: 120, w: 52, h: 52 },
      { x: 700, y: 180, w: 52, h: 52 },
      { x: 700, y: 430, w: 52, h: 52 },
      { x: 560, y: 250, w: 44, h: 44 },
    ],
    bushes: [
      { x: 90, y: 430, w: 70, h: 46 },
      { x: 760, y: 330, w: 76, h: 50 },
      { x: 330, y: 480, w: 70, h: 46 },
    ],
    lamps: [
      { x: 240, y: 90, r: 150 },
      { x: 700, y: 520, r: 150 },
      { x: 480, y: 300, r: 170 },
    ],
    start: { x: 64, y: 524 },
    ledger: { x: 852, y: 84 },
    exit: { x: 892, y: 508, w: 60, h: 80 },
    guards: [
      { path: [[300, 330], [640, 330], [640, 470], [300, 470]], speed: 50, pause: 0.8 },
      { path: [[806, 170], [806, 440]], speed: 46, pause: 0.9 },
    ],
  },
  {
    name: 'Level 2 · The Aisles',
    sub: 'Long shelves, three patrols, one zig-zag route.',
    range: 170,
    walls: [
      { x: 60, y: 150, w: 340, h: 26 },
      { x: 470, y: 150, w: 430, h: 26 },
      { x: 60, y: 300, w: 430, h: 26 },
      { x: 560, y: 300, w: 340, h: 26 },
      { x: 60, y: 450, w: 340, h: 26 },
      { x: 470, y: 450, w: 430, h: 26 },
    ],
    crates: [
      { x: 120, y: 100, w: 44, h: 44 },
      { x: 200, y: 252, w: 48, h: 44 },
      { x: 760, y: 404, w: 44, h: 44 },
      { x: 820, y: 520, w: 48, h: 48 },
    ],
    bushes: [
      { x: 520, y: 200, w: 72, h: 44 },
      { x: 300, y: 360, w: 72, h: 44 },
      { x: 640, y: 60, w: 72, h: 44 },
    ],
    lamps: [
      { x: 200, y: 80, r: 150 },
      { x: 760, y: 230, r: 160 },
      { x: 240, y: 390, r: 160 },
      { x: 720, y: 530, r: 150 },
    ],
    start: { x: 60, y: 540 },
    ledger: { x: 480, y: 368 },
    exit: { x: 892, y: 20, w: 60, h: 64 },
    guards: [
      { path: [[140, 80], [820, 80]], speed: 58, pause: 0.7 },
      { path: [[860, 238], [100, 238]], speed: 54, pause: 0.8 },
      { path: [[120, 388], [840, 388]], speed: 62, pause: 0.7 },
    ],
  },
  {
    name: 'Level 3 · The Vault Floor',
    sub: 'The ledger sleeps in an alcove. Four guards do not.',
    range: 178,
    walls: [
      { x: 380, y: 60, w: 24, h: 150 },
      { x: 556, y: 60, w: 24, h: 150 },
      { x: 380, y: 36, w: 200, h: 24 },
      { x: 120, y: 300, w: 260, h: 24 },
      { x: 580, y: 300, w: 260, h: 24 },
      { x: 468, y: 400, w: 24, h: 100 },
    ],
    crates: [
      { x: 180, y: 120, w: 50, h: 50 },
      { x: 730, y: 120, w: 50, h: 50 },
      { x: 180, y: 460, w: 50, h: 50 },
      { x: 730, y: 460, w: 50, h: 50 },
      { x: 468, y: 266, w: 44, h: 40 },
    ],
    bushes: [
      { x: 60, y: 200, w: 70, h: 44 },
      { x: 830, y: 200, w: 70, h: 44 },
      { x: 60, y: 380, w: 70, h: 44 },
      { x: 830, y: 380, w: 70, h: 44 },
    ],
    lamps: [
      { x: 480, y: 95, r: 140 },
      { x: 160, y: 160, r: 150 },
      { x: 800, y: 160, r: 150 },
      { x: 480, y: 340, r: 160 },
      { x: 160, y: 520, r: 150 },
      { x: 800, y: 520, r: 150 },
    ],
    start: { x: 480, y: 556 },
    ledger: { x: 480, y: 110 },
    exit: { x: 884, y: 16, w: 60, h: 60 },
    guards: [
      { path: [[300, 250], [660, 250]], speed: 56, pause: 0.7 },
      { path: [[90, 120], [90, 480]], speed: 52, pause: 0.8 },
      { path: [[870, 480], [870, 120]], speed: 52, pause: 0.8 },
      { path: [[250, 520], [700, 520]], speed: 60, pause: 0.6 },
    ],
  },
];

// Staged screenshot states, keyed by the ?shot= name. `level` is 1-based.
// Guards are staged by index into the level's guard list; facing is in degrees
// (0 = east, 90 = south, 180 = west, 270 = north, canvas convention).
// `alert` is that guard's genuine detection value, 0..1.
var HushShots = {
  cover: {
    level: 1,
    player: { x: 170, y: 196 },
    hasLedger: false,
    guards: [
      { x: 470, y: 330, facing: 180, alert: 0 },
      { x: 806, y: 300, facing: 90, alert: 0 },
    ],
  },
  play: {
    level: 2,
    player: { x: 430, y: 238 },
    hasLedger: false,
    guards: [
      { x: 300, y: 80, facing: 180, alert: 0 },
      { x: 700, y: 238, facing: 0, alert: 0 },
      { x: 560, y: 388, facing: 0, alert: 0 },
    ],
  },
  alarm: {
    level: 1,
    player: { x: 700, y: 378 },
    hasLedger: false,
    guards: [
      { x: 470, y: 470, facing: 270, alert: 0 },
      { x: 700, y: 296, facing: 90, alert: 0.85 },
    ],
  },
  exit: {
    level: 1,
    player: { x: 862, y: 548 },
    hasLedger: true,
    guards: [
      { x: 330, y: 330, facing: 0, alert: 0 },
      { x: 806, y: 200, facing: 90, alert: 0 },
    ],
  },
};
