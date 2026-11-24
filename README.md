# A Traveler in a Shell

An independent, editable reconstruction of the illustrated hermit-crab platform game.

## What's included

- Four connected prototype chapters, three painted modules per chapter (12 modules total)
- Golden, Spring, Granite, and Floating shells
- Walking, directional jumping, double jumping, hiding, breakable wall, tidal-water crossing
- Collisions, health, checkpoint/respawn, saved progress, collectibles
- Shell encyclopedia, chapter completion, and homecoming screen
- Touch controls designed for two-thumb play and desktop keyboard controls
- Integrated watercolor reef HUD and original illustration assets supplied in the conversation

## Play

Open `index.html` in a desktop browser. If the browser blocks local file assets, run a simple local server:

```bash
cd traveler_in_a_shell
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

For an iPhone, host this folder on any static hosting provider, or serve it from a computer on the same local network. All files are static, no backend or build system needed.

Alternatively, the companion `A_Traveler_in_a_Shell_Offline.html` is a single self-contained HTML file that can be opened directly in a modern browser.

## Controls

Desktop: `A`/`D` or arrow keys for movement, `Space` / `W` / up arrow for jump, `H` or Shift to hide.

Mobile: hold the left or right arrow while tapping Jump with the other thumb. Choose a shell with the bottom shell icons. Use the top-right menu to pause.

## File layout

- `index.html` UI structure, menus, canvas, HUD
- `style.css` responsive mobile and desktop interface
- `game.js` movement physics, collisions, shells, progress, scenes and encyclopedia
- `assets/` watercolor paintings, sprites and HUD textures

## Status and limitations

This is a new recreation, not the exact original source code. Level geometry is reconstructed approximately from the paintings. The 12 modules are a prototype segment of a larger planned game (up to 12 modules *per chapter*). Art boundaries are not pixel-perfect seamless, and advanced animation, enemies, environmental soundscape and a complete scientific encyclopedia require additional development. The granite and floating shell sprites are provisional recolors of the original crab assets. The game currently stores progress in the browser's local storage.

## Art provenance

Source illustrations were created or supplied during this conversation. Keep appropriate attribution and permissions when distributing the game.

## Mobile launch correction
Dedicated approved portrait/desktop home paintings; artwork-relative button positions; resize canvas when entering gameplay. Tested via Chromium with mobile viewport, touch start, two-finger forward jump, release and desktop input. The iOS file viewer may disable JavaScript; serve the source directory using a static web server for normal browser execution.
