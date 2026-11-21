# NEXUS.3D — Interactive 3D Developer Portfolio

An interactive 3D developer portfolio built with vanilla **HTML5**, **CSS3**, **Three.js (r128)**, and **JavaScript (ES6+)**. Designed to work seamlessly both over a local HTTP server and when opened directly via `file://`.

## Features

- **Real-Time Three.js WebGL Scene (`js/scene3d.js`)**:
  - Central hero construct with inner metallic core, outer wireframe cage, glowing energy nucleus, and 3 counter-rotating gyroscope rings.
  - **8 Interactive 3D Skill Satellites** orbiting the core with raycasting hover tooltips and click-to-pulse physics.
  - **Animated Wave Grid Floor** and **2,200-particle Deep Space Field** rendered with procedural canvas textures.
  - **Scroll-Driven Camera & Object Choreography** across all 6 portfolio sections plus pointer drag orbit & mouse parallax.
- **Live 3D Scene Controller**: Switch core geometry (`Icosahedron`, `Torus Knot`, `Octahedron`, `Quantum Sphere`), toggle wireframe topology, adjust orbital speed, trigger energy pulses, or enter **3D Focus Mode** for full-screen exploration.
- **Project 3D Presets**: Each project card includes an **Activate 3D Scene** button that morphs the live WebGL backdrop to match the project's theme and topology.
- **Dynamic Color Themes**: Switch smoothly between **Cyber Neon**, **Solar Gold**, and **Emerald Matrix** across both Three.js lights/materials and CSS variables.
- **Bilingual Support (TH / EN)**: Instant switching between Thai and English.
- **Live HUD Telemetry Bar**: Displays real-time WebGL FPS, active geometry, active theme, and inspected 3D node.

## Project Structure

```text
Portfolio/
├── index.html          # Main semantic HTML5 layout and 6 portfolio sections
├── css/
│   └── style.css       # Obsidian glassmorphism, theme variables, responsive layout
├── js/
│   ├── data.js         # Profile, bilingual TH/EN dictionary, skills, projects, timeline
│   ├── scene3d.js      # Three.js WebGL engine, raycasting, wave grid & scroll choreography
│   └── main.js         # UI bindings, filters, typewriter, 3D Lab & theme controller
└── README.md           # Documentation
```

## How to Run

### Option 1: Local HTTP Server (Recommended)
Run Python's built-in HTTP server from `d:\Portfolio`:

```bash
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Direct File Open
Double-click `index.html` to open directly via `file://` (uses classic `<script>` tags to avoid ES module CORS restrictions).

## Customization

Edit `js/data.js` to personalize:
- `profile`: Name, handle, email, location, and social links.
- `themes`: Color palettes (`primary`, `secondary`, `accent`, `bgHex`).
- `skills`: Add/update skills and mark up to 8 skills with `orbitNode: true` to display them as orbiting 3D satellites.
- `projects`: Update project descriptions, metrics, tech stacks, and `scenePreset` configurations.
- `timeline`: Customize career and education history.
