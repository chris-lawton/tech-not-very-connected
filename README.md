# Tech Not Very Connected

A small word-grouping puzzle for front-end and back-end engineers, in the style of NYT Connections.

Sixteen technical words. Four hidden groups of four. Three walls: **Easy → Medium → Hard**.
The difficulty comes from words that plausibly belong in more than one group, not from obscure trivia.

## How it plays

- Pick up to 4 tiles, then press **Submit**. Nothing submits automatically.
- A correct group leaves the board and appears underneath with its category name.
- A wrong group increments **Incorrect guesses** and keeps your four tiles selected, so you can swap one.
- There are no lives and no points. Incorrect guesses are the score. Time is only a tiebreaker.
- **Shuffle** reorders the remaining tiles without touching your selection, solved groups or score.
- **Reveal answers** asks for confirmation, then finishes the wall and marks the run as non-competitive.
- The next wall unlocks once the current one is solved or revealed.

## Running it locally

There is no build step and there are no dependencies. You just need any static file server, because the
game uses ES modules (opening `index.html` from the file system will be blocked by the browser).

```bash
# Python (already on macOS and most Linux machines)
python3 -m http.server 8000

# or Node, without installing anything permanently
npx --yes serve .
```

Then open <http://localhost:8000>.

## Project structure

```
index.html          Page shell and all semantic markup
netlify.toml        Netlify config (publish the root, no build)
src/
  main.js           Rendering, events, focus management, announcements
  game.js           Game state and rules (selection, guesses, walls, timing)
  storage.js        localStorage read/write/clear
  styles.css        All styling, light and dark, responsive from 320px
  data/walls.js     The game content
```

## Editing the game content

Everything a puzzle setter needs is in [`src/data/walls.js`](src/data/walls.js). Each wall needs exactly
four categories with exactly four items each, and each category needs a unique `id` and a `colour` from
1 to 4:

```js
{
  id: 'easy-git',
  name: 'Git commands',
  colour: 1,
  items: ['commit', 'rebase', 'stash', 'clone']
}
```

Saved progress is tied to the wall contents. If you change the items, any in-progress save is discarded
automatically and the player starts a fresh run.

### The current walls

- **Easy** teaches the game: Git commands, HTTP methods, CSS `display` values, browsers.
- **Medium** starts the arguments: words that follow "web", Django concepts, Wagtail concepts,
  accessibility terms. `hook`, `migration`, `signal` and `workflow` all have more than one home.
- **Hard** is built around a decoy. `branch`, `root`, `ref` and `push` look exactly like a Git group,
  and that group is not one of the answers. `fill`, `signal`, `body`, `headers`, `state` and `context`
  each pull in two directions as well.

## Deploying to Netlify

No environment variables, no build command, no external services.

### Option 1: connect a Git repository

1. Push this project to GitHub, GitLab or Bitbucket.
2. In Netlify, choose **Add new site → Import an existing project** and pick the repository.
3. Leave the build command empty and set the publish directory to `.`. `netlify.toml` already does this,
   so you can accept the detected settings.
4. Deploy. Every push to the default branch redeploys.

### Option 2: drag and drop

Open <https://app.netlify.com/drop> and drag the project folder onto the page.

### Option 3: Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod --dir .
```

## Accessibility

- Semantic HTML throughout. Tiles are real `<button>` elements using `aria-pressed` for selection.
- Selection, success, errors and completed groups are all shown with shape, weight, ticks or text as
  well as colour.
- Visible focus styles everywhere, a skip link, and headings in a logical order.
- Guess feedback is announced through a `role="status"` live region.
- Touch targets are at least 48px, and nothing depends on hover.
- Confirmation panels can be dismissed with `Escape`, and focus is moved sensibly after every action.
- All animation is disabled under `prefers-reduced-motion: reduce`.

The whole game is playable with a keyboard alone: `Tab` to a tile, `Space` or `Enter` to select.

## Data and privacy

Entirely front-end. No backend, no accounts, no database, no analytics, no leaderboard.

`localStorage` holds one key, `tnvc-progress-v1`, purely so an accidental refresh does not lose a run.
It stores the current wall, solved groups, current selection, incorrect guesses, start times and whether
answers were revealed. No personal information. **Reset game** clears it.
