import { WALLS, WALL_IDS, getWall, getCategory, allItems } from './data/walls.js';
import * as storage from './storage.js';

const VERSION = 1;
export const MAX_SELECTED = 4;

const listeners = new Set();
export let state = createState();

function createState() {
  const walls = {};
  for (const wall of WALLS) {
    walls[wall.id] = {
      order: shuffled(allItems(wall.id)),
      solvedIds: [],
      selected: [],
      incorrect: 0,
      revealed: false,
      revealedIds: [],
      startedAt: null,
      completedAt: null
    };
  }
  return {
    version: VERSION,
    screen: 'intro',
    currentWall: WALL_IDS[0],
    startedAt: null,
    finishedAt: null,
    walls
  };
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ---------- reading state ---------- */

export function wallState(wallId = state.currentWall) {
  return state.walls[wallId];
}

export function solvedItems(wallId) {
  return wallState(wallId).solvedIds.flatMap((id) => getCategory(wallId, id).items);
}

export function remainingItems(wallId = state.currentWall) {
  const solved = new Set(solvedItems(wallId));
  return wallState(wallId).order.filter((item) => !solved.has(item));
}

export function isWallDone(wallId) {
  const wall = wallState(wallId);
  return wall.revealed || wall.solvedIds.length === 4;
}

export function wallStatus(wallId) {
  if (isWallDone(wallId)) return 'complete';
  if (wallId === state.currentWall) return 'current';
  const index = WALL_IDS.indexOf(wallId);
  const previous = WALL_IDS[index - 1];
  return previous && isWallDone(previous) ? 'available' : 'locked';
}

export function allWallsDone() {
  return WALL_IDS.every(isWallDone);
}

export function nextWallId() {
  const index = WALL_IDS.indexOf(state.currentWall);
  return WALL_IDS[index + 1] ?? null;
}

export function totalIncorrect() {
  return WALL_IDS.reduce((sum, id) => sum + state.walls[id].incorrect, 0);
}

export function anyRevealed() {
  return WALL_IDS.some((id) => state.walls[id].revealed);
}

export function elapsedMs() {
  if (!state.startedAt) return 0;
  return (state.finishedAt ?? Date.now()) - state.startedAt;
}

export function wallElapsedMs(wallId) {
  const wall = state.walls[wallId];
  if (!wall.startedAt) return 0;
  return (wall.completedAt ?? Date.now()) - wall.startedAt;
}

/* ---------- changing state ---------- */

export function subscribe(fn) {
  listeners.add(fn);
}

function commit(event = {}) {
  storage.save(state);
  for (const fn of listeners) fn(event);
}

// The clock only starts here, so loading the page costs no time.
export function startGame() {
  state.screen = 'game';
  const now = Date.now();
  if (!state.startedAt) state.startedAt = now;
  const wall = wallState();
  if (!wall.startedAt) wall.startedAt = now;
  commit({ type: 'screen' });
}

export function toggleItem(item) {
  const wall = wallState();
  const index = wall.selected.indexOf(item);
  if (index > -1) {
    wall.selected.splice(index, 1);
  } else if (wall.selected.length < MAX_SELECTED) {
    wall.selected.push(item);
  } else {
    commit({ type: 'limit' });
    return;
  }
  commit({ type: 'select' });
}

export function clearSelection() {
  wallState().selected = [];
  commit({ type: 'select' });
}

export function shuffleBoard() {
  const wall = wallState();
  const solved = new Set(solvedItems(state.currentWall));
  const remaining = shuffled(wall.order.filter((item) => !solved.has(item)));
  wall.order = [...wall.order.filter((item) => solved.has(item)), ...remaining];
  commit({ type: 'shuffle' });
}

export function submitGuess() {
  const wall = wallState();
  if (wall.selected.length !== MAX_SELECTED) return { result: 'ignored' };

  const guess = [...wall.selected].sort().join('|');
  const match = getWall(state.currentWall).categories.find(
    (category) => [...category.items].sort().join('|') === guess
  );

  if (!match) {
    wall.incorrect += 1;
    commit({ type: 'incorrect' });
    return { result: 'incorrect', near: nearMiss(wall.selected) };
  }

  wall.solvedIds.push(match.id);
  wall.selected = [];
  const done = wall.solvedIds.length === 4;
  if (done) finishWall();
  commit({ type: 'correct', category: match, wallComplete: done });
  return { result: 'correct', category: match, wallComplete: done };
}

// How many of the four belong to the same category. Used only for feedback wording.
function nearMiss(selection) {
  const counts = new Map();
  for (const category of getWall(state.currentWall).categories) {
    const hits = selection.filter((item) => category.items.includes(item)).length;
    counts.set(category.id, hits);
  }
  return Math.max(...counts.values());
}

function finishWall() {
  const wall = wallState();
  if (!wall.completedAt) wall.completedAt = Date.now();
  if (allWallsDone() && !state.finishedAt) state.finishedAt = Date.now();
}

export function revealAnswers() {
  const wall = wallState();
  wall.revealed = true;
  wall.selected = [];
  for (const category of getWall(state.currentWall).categories) {
    if (!wall.solvedIds.includes(category.id)) {
      wall.solvedIds.push(category.id);
      wall.revealedIds.push(category.id);
    }
  }
  finishWall();
  commit({ type: 'revealed' });
}

export function goToNextWall() {
  const next = nextWallId();
  if (!next) {
    state.screen = 'end';
    commit({ type: 'screen' });
    return;
  }
  state.currentWall = next;
  const wall = wallState();
  if (!wall.startedAt) wall.startedAt = Date.now();
  commit({ type: 'wall-change' });
}

export function setScreen(screen) {
  state.screen = screen;
  commit({ type: 'screen' });
}

export function resetGame() {
  storage.clear();
  state = createState();
  commit({ type: 'reset' });
}

export function restore() {
  const saved = storage.load();
  if (saved && saved.version === VERSION && saved.walls) {
    // Guard against edited wall data making old saves nonsense.
    const valid = WALL_IDS.every((id) => {
      const wall = saved.walls[id];
      if (!wall || !Array.isArray(wall.order)) return false;
      wall.revealedIds = wall.revealedIds ?? [];
      const expected = allItems(id);
      return wall.order.length === expected.length && expected.every((item) => wall.order.includes(item));
    });
    if (valid) state = saved;
  }
  return state;
}
