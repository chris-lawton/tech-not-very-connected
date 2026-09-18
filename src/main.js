import { WALLS, WALL_IDS, getWall, getCategory } from './data/walls.js';
import * as game from './game.js';

const $ = (id) => document.getElementById(id);

const el = {
  progress: $('progress'),
  wallsNav: $('walls-nav'),
  screens: {
    intro: $('screen-intro'),
    game: $('screen-game'),
    end: $('screen-end'),
    review: $('screen-review')
  },
  wallHeading: $('wall-heading'),
  incorrect: $('incorrect-count'),
  found: $('found-count'),
  timer: $('timer'),
  board: $('board'),
  hint: $('selection-hint'),
  status: $('status'),
  wallDone: $('wall-done'),
  wallDoneMessage: $('wall-done-message'),
  solvedList: $('solved-list'),
  solvedArea: $('solved-area'),
  results: $('results'),
  totals: $('totals'),
  revealedNote: $('revealed-note'),
  reviewBody: $('review-body'),
  confirmReveal: $('confirm-reveal'),
  confirmReset: $('confirm-reset'),
  btn: {
    start: $('btn-start'),
    submit: $('btn-submit'),
    shuffle: $('btn-shuffle'),
    deselect: $('btn-deselect'),
    next: $('btn-next'),
    reveal: $('btn-reveal'),
    revealConfirm: $('btn-reveal-confirm'),
    revealCancel: $('btn-reveal-cancel'),
    reset: $('btn-reset'),
    resetConfirm: $('btn-reset-confirm'),
    resetCancel: $('btn-reset-cancel'),
    review: $('btn-review'),
    playAgain: $('btn-play-again'),
    reviewBack: $('btn-review-back')
  }
};

/* ---------- helpers ---------- */

function formatTime(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// aria-live regions ignore an identical repeated string, so clear first.
let announceTimer;
function announce(text, tone = 'neutral') {
  clearTimeout(announceTimer);
  el.status.classList.add('has-spoken');
  el.status.textContent = '';
  el.status.dataset.tone = tone;
  announceTimer = setTimeout(() => {
    el.status.textContent = text;
  }, 60);
}

function tileFor(item) {
  return el.board.querySelector(`[data-item="${CSS.escape(item)}"]`);
}

/* ---------- rendering ---------- */

function renderProgress() {
  el.progress.innerHTML = '';
  for (const wall of WALLS) {
    const status = game.wallStatus(wall.id);
    const li = document.createElement('li');
    li.className = `wall-tab is-${status}`;
    // Only the active and finished walls carry a status word. The rest are just names.
    const note =
      status === 'current'
        ? 'Current'
        : status === 'complete'
          ? game.state.walls[wall.id].revealed ? 'Revealed' : 'Completed'
          : status === 'locked'
            ? 'Locked'
            : '';
    li.innerHTML = `<span class="tab-name">${wall.name}</span>${note ? `<span class="tab-note">${note}</span>` : ''}`;
    if (status === 'current') li.setAttribute('aria-current', 'step');
    el.progress.append(li);
  }
}

function renderBoard() {
  const wall = game.wallState();
  const items = game.remainingItems();
  el.board.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.dataset.item = item;
    const selected = wall.selected.includes(item);
    button.setAttribute('aria-pressed', String(selected));
    if (selected) button.classList.add('is-selected');
    const mark = document.createElement('span');
    mark.className = 'tile-mark';
    mark.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'tile-text';
    text.textContent = item;
    button.append(mark, text);
    el.board.append(button);
  }
  el.board.hidden = items.length === 0;
}

function renderSolved() {
  const wallId = game.state.currentWall;
  const wall = game.wallState(wallId);
  el.solvedList.innerHTML = '';
  for (const id of wall.solvedIds) {
    const category = getCategory(wallId, id);
    el.solvedList.append(solvedCard(category, wall.revealedIds.includes(id)));
  }
  el.solvedArea.hidden = wall.solvedIds.length === 0;
}

function solvedCard(category, wasRevealed) {
  const li = document.createElement('li');
  li.className = `solved-card colour-${category.colour}`;
  li.innerHTML = `
    <h4 class="solved-name">
      ${category.name}
      ${wasRevealed ? '<span class="badge">Revealed</span>' : ''}
    </h4>
    <p class="solved-items">${category.items.join(' · ')}</p>`;
  return li;
}

function renderControls() {
  const wall = game.wallState();
  const done = game.isWallDone(game.state.currentWall);
  const count = wall.selected.length;

  el.btn.submit.disabled = count !== game.MAX_SELECTED;
  el.btn.submit.hidden = done;
  el.btn.shuffle.hidden = done;
  el.btn.deselect.hidden = done || count === 0;
  el.btn.reveal.hidden = done;

  // A finished wall says everything once, in the summary below the board.
  el.status.classList.toggle('visually-hidden', done);

  // The hint only appears while the selection is incomplete.
  const showHint = !done && count !== game.MAX_SELECTED;
  el.hint.hidden = !showHint;
  el.hint.textContent = count === 0 ? 'Select four items' : `${count} of 4 selected`;

  el.wallDone.hidden = !done;
  if (done) {
    const next = game.nextWallId();
    const time = formatTime(game.wallElapsedMs(game.state.currentWall));
    const summary = wall.revealed
      ? `Answers revealed · ${time}`
      : `Wall complete · ${plural(wall.incorrect, 'incorrect guess')} · ${time}`;
    el.wallDoneMessage.textContent = summary;
    el.btn.next.textContent = next ? `Next wall: ${getWall(next).name}` : 'See your results';
  }
}

function renderScoreboard() {
  const wall = game.wallState();
  el.incorrect.textContent = `${wall.incorrect} incorrect`;
  el.found.textContent = `${wall.solvedIds.length}/4 groups`;
  el.timer.textContent = formatTime(game.elapsedMs());
}

function renderGameScreen() {
  const wall = getWall(game.state.currentWall);
  el.wallHeading.textContent = `${wall.name} wall`;
  renderScoreboard();
  renderBoard();
  renderSolved();
  renderControls();
}

function renderEndScreen() {
  el.results.innerHTML = '';
  for (const id of WALL_IDS) {
    const wall = game.state.walls[id];
    const li = document.createElement('li');
    li.innerHTML = `<strong>${getWall(id).name}</strong> — ${plural(wall.incorrect, 'incorrect guess')}
      <span class="muted">· ${formatTime(game.wallElapsedMs(id))}</span>
      ${wall.revealed ? '<span class="badge">Answers revealed</span>' : ''}`;
    el.results.append(li);
  }
  el.totals.innerHTML = `
    <div><dt>Total incorrect guesses</dt><dd>${game.totalIncorrect()}</dd></div>
    <div><dt>Time</dt><dd>${formatTime(game.elapsedMs())}</dd></div>`;
  el.revealedNote.hidden = !game.anyRevealed();
}

function renderReviewScreen() {
  el.reviewBody.innerHTML = '';
  for (const wall of WALLS) {
    const saved = game.state.walls[wall.id];
    const section = document.createElement('section');
    section.className = 'review-wall';
    const heading = document.createElement('h3');
    heading.innerHTML = `${wall.name}${saved.revealed ? ' <span class="badge">Answers revealed</span>' : ''}`;
    const list = document.createElement('ul');
    list.className = 'solved-list';
    for (const category of wall.categories) {
      list.append(solvedCard(category, saved.revealedIds.includes(category.id)));
    }
    section.append(heading, list);
    el.reviewBody.append(section);
  }
}

function render() {
  const screen = game.state.screen;
  for (const [name, node] of Object.entries(el.screens)) {
    node.hidden = name !== screen;
  }
  el.wallsNav.hidden = screen === 'intro';
  renderProgress();
  if (screen === 'game') renderGameScreen();
  if (screen === 'end') renderEndScreen();
  if (screen === 'review') renderReviewScreen();
}

/* ---------- animation helpers ---------- */

function flashTiles(items, className) {
  for (const item of items) {
    const tile = tileFor(item);
    if (!tile) continue;
    tile.classList.add(className);
    tile.addEventListener('animationend', () => tile.classList.remove(className), { once: true });
  }
}

function focusFirstTile() {
  const first = el.board.querySelector('.tile');
  if (first) first.focus();
}

/* ---------- events ---------- */

el.board.addEventListener('click', (event) => {
  const tile = event.target.closest('.tile');
  if (!tile) return;
  game.toggleItem(tile.dataset.item);
});

el.btn.start.addEventListener('click', () => {
  game.startGame();
  focusFirstTile();
});

el.btn.submit.addEventListener('click', () => {
  const selection = [...game.wallState().selected];
  const outcome = game.submitGuess();
  if (outcome.result === 'incorrect') {
    flashTiles(selection, 'is-wrong');
    const near = outcome.near === 3 ? ' One of the four belongs somewhere else.' : '';
    announce(`Not a group.${near} Incorrect guesses: ${game.wallState().incorrect}.`, 'error');
  }
  if (outcome.result === 'correct') {
    announce(
      outcome.wallComplete
        ? `Correct: ${outcome.category.name}. Wall complete.`
        : `Correct: ${outcome.category.name}. ${4 - game.wallState().solvedIds.length} groups to go.`,
      'success'
    );
    const card = el.solvedList.lastElementChild;
    if (card) card.classList.add('just-solved');
    if (outcome.wallComplete) el.btn.next.focus();
    else focusFirstTile();
  }
});

el.btn.shuffle.addEventListener('click', () => {
  game.shuffleBoard();
  announce('Tiles shuffled. Your selection is unchanged.');
  focusFirstTile();
});

el.btn.deselect.addEventListener('click', () => {
  game.clearSelection();
  announce('Selection cleared.');
  focusFirstTile();
});

el.btn.next.addEventListener('click', () => {
  game.goToNextWall();
  if (game.state.screen === 'game') focusFirstTile();
});

function openConfirm(panel, firstButton) {
  panel.hidden = false;
  firstButton.focus();
}

function closeConfirm(panel, returnTo) {
  panel.hidden = true;
  if (returnTo && !returnTo.hidden) returnTo.focus();
}

el.btn.reveal.addEventListener('click', () => {
  el.confirmReset.hidden = true;
  openConfirm(el.confirmReveal, el.btn.revealCancel);
});
el.btn.revealCancel.addEventListener('click', () => closeConfirm(el.confirmReveal, el.btn.reveal));
el.btn.revealConfirm.addEventListener('click', () => {
  el.confirmReveal.hidden = true;
  game.revealAnswers();
  announce('Answers revealed for this wall. This run will not count as a competitive result.', 'error');
  el.btn.next.focus();
});

el.btn.reset.addEventListener('click', () => {
  el.confirmReveal.hidden = true;
  openConfirm(el.confirmReset, el.btn.resetCancel);
});
el.btn.resetCancel.addEventListener('click', () => closeConfirm(el.confirmReset, el.btn.reset));
el.btn.resetConfirm.addEventListener('click', () => {
  el.confirmReset.hidden = true;
  game.resetGame();
  el.status.classList.remove('has-spoken');
  el.btn.start.focus();
});

el.btn.review.addEventListener('click', () => {
  game.setScreen('review');
  el.btn.reviewBack.focus();
});
el.btn.reviewBack.addEventListener('click', () => {
  game.setScreen('end');
  el.btn.review.focus();
});
el.btn.playAgain.addEventListener('click', () => {
  game.resetGame();
  el.btn.start.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!el.confirmReveal.hidden) closeConfirm(el.confirmReveal, el.btn.reveal);
  else if (!el.confirmReset.hidden) closeConfirm(el.confirmReset, el.btn.reset);
});

/* ---------- start ---------- */

game.subscribe((event) => {
  render();
  if (event.type === 'limit') {
    announce('You can select 4 items at most. Deselect one first.', 'error');
  }
});

game.restore();
if (game.allWallsDone() && game.state.screen === 'game') game.state.screen = 'end';
render();
if (game.state.screen === 'intro') el.btn.start.focus();

setInterval(() => {
  if (game.state.screen === 'game' && !game.state.finishedAt) renderScoreboard();
}, 1000);
