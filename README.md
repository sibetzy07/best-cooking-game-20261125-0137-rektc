# Sizzle & Serve

A tiny original cooking game: one chef, one kitchen, one lunch rush. Grab
ingredients, chop, grill, build dishes on a plate, and serve them at the
window before the customers lose patience. Runs offline in a desktop
browser — plain HTML + canvas + WebAudio, no libraries, no network.

## How to play

Serve the tickets on the order board before their patience bars run out.
Fast service earns tips (up to +8 coins). Orders arrive faster and wait
less patiently as the shift goes on, and a Rush Hour hits mid-shift.
A shift lasts 3 minutes; your coins, served and missed counts are scored
at the end.

- **Crates** (top left): take tomato, lettuce, patty, bun, cheese.
- **Chopping board**: put lettuce or tomato on it, hold E to chop.
- **Grill**: patties cook in ~6s — grab them when READY, or they burn.
- **Assembly counter**: add food to the plate, pick the plate up with E.
- **Serving window**: serve a finished plate that matches an order.
- **Trash**: toss anything you don't want (burnt patties included).

## Menu

| Dish | Ingredients | Coins |
| --- | --- | --- |
| Burger | bun + grilled patty + chopped lettuce | 12 |
| Cheese Burger | bun + grilled patty + cheese + chopped tomato | 16 |
| Garden Salad | chopped lettuce + chopped tomato | 10 |
| Veggie Stack | bun + lettuce + tomato + cheese | 14 |

## Controls

- **WASD / arrow keys** — move the chef
- **E** — interact (hold E to chop)
- **Click a station** — walk there and use it
- **R** — restart the shift
- **M** — mute sound

## Run it

Serve `game/` with any static server and open `game/index.html`, e.g.
`python3 -m http.server` inside `game/`, then open http://localhost:8000.

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with
`buildDossier` from `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` are real renders of the game: cover (busy
mid-game), title screen, rush hour, and the end-of-shift summary.
