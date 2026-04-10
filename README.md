# DEX.TROY - Secure Access System

DEX.TROY is an experimental, interactive Login/Register system where the standard CAPTCHA verification is replaced by a Touhou-inspired Bullet Hell mini-game. Users must survive a 29-second onslaught of procedurally generated attack patterns to prove they are human and gain access.

Built entirely with Vanilla JavaScript (ES6 Modules) and HTML5 Canvas, focusing on performance with Zero external dependencies.

## Features

- **Glassmorphism UI**: A sleek, cyberpunk-inspired dark mode interface with glitch-transition effects.
- **Bullet Hell Engine**: Custom 2D engine handling thousands of bullets efficiently at 60fps.
- **Optimized Rendering**: Utilizes Object Pooling and Off-screen rendering (Canvas caching) to prevent GPU/RAM bottlenecks.
- **Responsive & Mobile Ready**: Supports both Mouse/Keyboard (WASD + Shift) and relative Touch controls for seamless mobile gameplay.
- **Dynamic Phases**: Three distinct boss phases including a dynamic Labyrinth generator and aimed projectiles.
- **Pre-loading System**: Silent asset preloading ensures zero lag spikes when the gameplay initiates.

## How to Run

Since this project utilizes modern ES6 Modules (`type="module"` in HTML), opening the `index.html` file directly via the filesystem (`file:///...`) will cause strict CORS (Cross-Origin) security errors in modern browsers, preventing the game engine from loading.

**You must run it through a local HTTP server.**

### Option 1: Using VS Code (Recommended)

1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) from the extensions panel.
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The project will open automatically in your browser (usually at `http://127.0.0.1:5500`).

### Option 2: Using CMD / Terminal (Python)

If you have Python installed on your system, you can easily spin up a built-in static server:

1. Open CMD or PowerShell and navigate to the project directory.
2. Run the following command:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to: `http://localhost:8080`

### Option 3: Using Node.js (npx)

If you have Node.js installed, you can use the `serve` package:

1. Open CMD / Terminal in the project directory.
2. Run:
   ```bash
   npx serve .
   ```

## Configuration & Tips

You can easily tweak the difficulty and parameters of the game without diving into complex logic. All major variables are globally isolated in `js/config.js`.

- `SURVIVAL_TIME`: Change the total seconds required to beat the captcha (Default: 29.0s).
- `PLAYER_SPEED` & `FOCUS_SPEED`: Adjust the ship's movement speed (focus speed applies when holding Shift).
- `BULLET_Pool_SIZE`: If you experience memory issues on older devices, you can lower this limit to force aggressive garbage collection (Default: 3000).

## Known Limitations / Bugs

- **CORS Local File Policy**: As mentioned in the setup, the logic will completely fail to load if not run inside a proper HTTP server environment.
- **Audio Autoplay Policies**: Modern browsers require an explicit user interaction (click/touch) before permitting audio playback. This is intelligently handled by the "VERIFY" button, which quietly unlocks the AudioContext. Skipping or altering this UI flow may result in muted gameplay.
- **Resolution Scaling**: The canvas scales visually via CSS `aspect-ratio` to prevent black borders. However, the physical engine logic runs strictly at a 400x500 space. On extremely narrow mobile screens (under 320px width), the dodgeable gaps may feel slightly diminished due to the optical downscaling.

---

_Created by [RoyBruna](https://github.com/RoyBruna)._
