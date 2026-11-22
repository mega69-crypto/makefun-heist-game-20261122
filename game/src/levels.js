// levels.js — the three heist levels for Midnight Vault: The Heist.
//
// Tile legend (one character per tile, 24 columns x 15 rows):
//   #  wall (blocks movement and sight)
//   .  floor
//   C  cover: crate / pillar / plant (blocks movement and sight)
//   ~  shadow floor (alarm fills at half rate while standing here)
//   *  spotlight pool (alarm fills faster while standing here)
//   L  loot (floor tile holding one loot item)
//   E  exit / getaway van (locked until all loot is collected)
//   P  player start
//   G  guard spawn (waypoints listed separately, in tile coords)
//   K  camera spawn (sweep defined separately)
//   X  camera control panel (stand next to it and hold E to disable cameras)

export const LEVELS = [
  {
    name: 'The Lobby',
    par: 75,
    map: [
      '########################',
      '#P...~......C....L.....#',
      '#...C....C......C......#',
      '#......~....C......~...#',
      '#..G......C......C.....#',
      '#....C.......~....G....#',
      '#.......~......C.......#',
      '#..C.....C....C....L...#',
      '#....~......~.....~....#',
      '#......C......C........#',
      '#..C.....K.......C.....#',
      '#....~......C......~...#',
      '#..X....C......L...E...#',
      '#......................#',
      '########################',
    ],
    guards: [
      { spawn: [3, 4], waypoints: [[3, 4], [9, 4], [9, 6], [4, 6]], speed: 52 },
      { spawn: [17, 5], waypoints: [[17, 5], [21, 5], [21, 9], [17, 9]], speed: 52 },
    ],
    cameras: [
      { tile: [9, 10], facing: -Math.PI / 2, sweep: 0.9, speed: 0.55 },
    ],
    panels: [[3, 12]],
  },
  {
    name: 'The Gallery',
    par: 95,
    map: [
      '########################',
      '#P....~...C.....L......#',
      '#..C.......C..~....C...#',
      '#....~..C......K.......#',
      '#..G....~....C....G....#',
      '#...C......C......~....#',
      '#......C.......C.......#',
      '#..~......C..~....L....#',
      '#....C.......C.....C...#',
      '#..G.....~......C......#',
      '#....C..K....C....~....#',
      '#..~......C......C.....#',
      '#....C.......~....L.E..#',
      '#..X......C......~.....#',
      '########################',
    ],
    guards: [
      { spawn: [3, 4], waypoints: [[3, 4], [8, 4], [8, 8], [3, 8]], speed: 62 },
      { spawn: [16, 4], waypoints: [[16, 4], [21, 4], [21, 7], [16, 7]], speed: 62 },
      { spawn: [3, 9], waypoints: [[3, 9], [9, 9], [9, 12], [3, 12]], speed: 62 },
    ],
    cameras: [
      { tile: [8, 10], facing: 0, sweep: 1.1, speed: 0.7 },
      { tile: [15, 3], facing: Math.PI / 2, sweep: 1.0, speed: 0.65 },
    ],
    panels: [[3, 13]],
  },
  {
    name: 'The Vault',
    par: 120,
    map: [
      '########################',
      '#P...*....C.....L......#',
      '#..C....*...C......C...#',
      '#....C......~....C.....#',
      '#..G...C.......C...G...#',
      '#....~....C...K...*....#',
      '#..C......~...C........#',
      '#......C.......~...L...#',
      '#..~.....C...C.....K...#',
      '#....C.......*....C....#',
      '#..G....K......C...G...#',
      '#....~....C.......~....#',
      '#..C....*....C..L..E...#',
      '#..X......C......~.....#',
      '########################',
    ],
    guards: [
      { spawn: [3, 4], waypoints: [[3, 4], [9, 4], [9, 7], [3, 7]], speed: 74 },
      { spawn: [17, 4], waypoints: [[17, 4], [21, 4], [21, 8], [17, 8]], speed: 74 },
      { spawn: [3, 10], waypoints: [[3, 10], [8, 10], [8, 13], [3, 13]], speed: 74 },
      { spawn: [18, 10], waypoints: [[18, 10], [21, 10], [21, 12], [18, 12]], speed: 74 },
    ],
    cameras: [
      { tile: [9, 10], facing: -Math.PI / 2, sweep: 1.2, speed: 0.85 },
      { tile: [14, 5], facing: Math.PI, sweep: 1.0, speed: 0.8 },
      { tile: [18, 8], facing: Math.PI / 2, sweep: 1.1, speed: 0.9 },
    ],
    panels: [[3, 13]],
  },
];
