/**
 * Stardew Valley-Style Pixel Art Ocean & Beach 3D Diorama (Three.js r128)
 * Crisp nearest-neighbor pixelated rendering, 8 FPS pixel water tiles,
 * dithered sky bands, wooden pier & fisherman's cabin, bobbing rowboat,
 * swaying palm trees, beach forageables, animated seagulls, and moonlight jellies.
 */
(function (global) {
    'use strict';

    class PortfolioScene3D {
        constructor(options) {
            this.options = options || {};
            this.canvas = document.getElementById(this.options.canvasId || 'webgl-canvas');
            this.themes = this.options.themes || {};
            this.themeOrder = ['day', 'sunset', 'night'];
            this.themeAliases = {
                cyber: 'day',
                solar: 'sunset',
                emerald: 'night'
            };

            this.enabled = false;
            this.pixelScale = 2.25;
            this.currentThemeKey = this._resolveThemeKey(this.options.initialTheme || 'day');
            this.speedMultiplier = 1.0;

            // Interactive camera state (clamped scenic bounds)
            this.clock = null;
            this.mouse = { x: 0, y: 0, active: false };
            this.isDragging = false;
            this.dragDistance = 0;
            this.lastPointer = { x: 0, y: 0 };
            this.azimuth = 0;
            this.targetAzimuth = 0;
            this.elevation = 4.6;
            this.targetElevation = 4.6;
            this.camDistance = 13.5;
            this.targetCamDistance = 13.5;

            // Animation timers
            this.waterAccum = 0;
            this.waterFrame = 0;
            this.seagullAccum = 0;
            this.seagullFrame = 0;
            this.pulseFactor = 0;

            // Dynamic scene collections
            this.clouds = [];
            this.seagulls = [];
            this.jellies = [];
            this.palmTrees = [];
            this.grassTufts = [];
            this.smokePuffs = [];
            this.pilingRings = [];
            this.lanternLights = [];
            this.lanternMaterials = [];
            this.windowMaterials = [];

            // Bound listeners
            this._onResize = this._handleResize.bind(this);
            this._onPointerMove = this._handlePointerMove.bind(this);
            this._onPointerDown = this._handlePointerDown.bind(this);
            this._onPointerUp = this._handlePointerUp.bind(this);
            this._onClick = this._handleClick.bind(this);
            this._onDblClick = this._handleDblClick.bind(this);
            this._onWheel = this._handleWheel.bind(this);
            this._animate = this._animateLoop.bind(this);

            this.init();
        }

        _resolveThemeKey(key) {
            if (this.themes[key]) return key;
            const mapped = this.themeAliases[key];
            if (mapped && this.themes[mapped]) return mapped;
            return 'day';
        }

        _getTheme(key) {
            const resolved = this._resolveThemeKey(key || this.currentThemeKey);
            return this.themes[resolved] || {
                key: 'day',
                name: 'Sunny Pelican Beach',
                bgHex: 0x9ad8f8,
                fogHex: 0x9ad8f8,
                skyBands: ['#2d7dd2', '#4ea5e8', '#7cc6f8', '#b5e3ff', '#fff3c4'],
                oceanDeep: '#18639e',
                oceanMid: '#2282c2',
                oceanShallow: '#38b2d6',
                oceanFoam: '#eefaff',
                sandLight: '#f3d08a',
                sandMid: '#dfb367',
                sandWet: '#b78b4b',
                ambientColor: 0xfff5e4,
                ambientIntensity: 0.92,
                sunColor: 0xfff0b3,
                sunIntensity: 1.05,
                lanternIntensity: 0.45,
                jellyOpacity: 0.25,
                starsOpacity: 0.0,
                cloudTint: 0xffffff,
                windowGlow: '#ffd875'
            };
        }

        init() {
            if (!this.canvas || typeof global.THREE === 'undefined') {
                console.warn('[PortfolioScene3D] Canvas or THREE unavailable; 3D disabled.');
                return;
            }

            const THREE = global.THREE;

            try {
                this.renderer = new THREE.WebGLRenderer({
                    canvas: this.canvas,
                    antialias: false,
                    alpha: false,
                    powerPreference: 'high-performance'
                });
                this._applyRendererSize();
                this.renderer.outputEncoding = THREE.sRGBEncoding;
            } catch (err) {
                console.warn('[PortfolioScene3D] WebGL initialization failed.', err);
                return;
            }

            this.enabled = true;
            this.clock = new THREE.Clock();

            const theme = this._getTheme(this.currentThemeKey);

            // Scene & coastal atmospheric fog
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(theme.bgHex);
            this.scene.fog = new THREE.FogExp2(theme.fogHex, 0.0085);

            // Camera framing the beach foreground, pier, rowboat, ocean & distant horizon
            this.camera = new THREE.PerspectiveCamera(
                48,
                global.innerWidth / Math.max(global.innerHeight, 1),
                0.1,
                220
            );
            this.camera.position.set(0, 4.6, 13.5);
            this.lookAtTarget = new THREE.Vector3(0, 1.8, -4);
            this.camera.lookAt(this.lookAtTarget);

            // Build all Stardew Valley pixel layers
            this._setupLights(theme);
            this._setupSkyAndHorizon(theme);
            this._setupClouds(theme);
            this._setupOceanAndFoam(theme);
            this._setupBeachAndForageables(theme);
            this._setupPierAndCabin(theme);
            this._setupRowboat();
            this._setupSeagullsAndJellies(theme);

            // Attach pointer & resize events
            global.addEventListener('resize', this._onResize, { passive: true });
            global.addEventListener('pointermove', this._onPointerMove, { passive: true });
            global.addEventListener('pointerdown', this._onPointerDown);
            global.addEventListener('pointerup', this._onPointerUp, { passive: true });
            global.addEventListener('click', this._onClick);
            global.addEventListener('dblclick', this._onDblClick);
            global.addEventListener('wheel', this._onWheel, { passive: true });

            this._animateLoop();
        }

        _applyRendererSize() {
            if (!this.renderer) return;
            const w = Math.max(global.innerWidth, 1);
            const h = Math.max(global.innerHeight, 1);
            const pw = Math.max(1, Math.floor(w / this.pixelScale));
            const ph = Math.max(1, Math.floor(h / this.pixelScale));
            this.renderer.setPixelRatio(1);
            this.renderer.setSize(pw, ph, false);
        }

        // ------------------------------------------------------------------
        // Crisp Nearest-Neighbor Pixel Texture Helpers
        // ------------------------------------------------------------------

        _createCanvas(w, h) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
        }

        _makePixelTex(canvas, repeatX, repeatY) {
            const THREE = global.THREE;
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.generateMipmaps = false;
            if (repeatX || repeatY) {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(repeatX || 1, repeatY || 1);
            }
            tex.needsUpdate = true;
            return tex;
        }

        _drawMatrix(ctx, rows, palette, offsetX, offsetY) {
            const ox = offsetX || 0;
            const oy = offsetY || 0;
            for (let y = 0; y < rows.length; y++) {
                const row = rows[y];
                for (let x = 0; x < row.length; x++) {
                    const ch = row[x];
                    if (ch === '.' || !palette[ch]) continue;
                    ctx.fillStyle = palette[ch];
                    ctx.fillRect(ox + x, oy + y, 1, 1);
                }
            }
        }

        // ------------------------------------------------------------------
        // Lighting
        // ------------------------------------------------------------------

        _setupLights(theme) {
            const THREE = global.THREE;
            this.ambientLight = new THREE.AmbientLight(theme.ambientColor, theme.ambientIntensity);
            this.scene.add(this.ambientLight);

            this.sunLight = new THREE.DirectionalLight(theme.sunColor, theme.sunIntensity);
            this.sunLight.position.set(16, 22, 10);
            this.scene.add(this.sunLight);

            this.fillLight = new THREE.HemisphereLight(0x9be2ff, 0x7c5d3a, 0.35);
            this.scene.add(this.fillLight);
        }

        // ------------------------------------------------------------------
        // 1. Pixel-Dithered Sky, Stars, Sun/Moon & Horizon Lighthouse Island
        // ------------------------------------------------------------------

        _paintSkyCanvas(theme) {
            const w = 128;
            const h = 96;
            const ctx = this.skyCanvas.getContext('2d');
            const bands = theme.skyBands || ['#2d7dd2', '#4ea5e8', '#7cc6f8', '#b5e3ff', '#fff3c4'];
            const bandH = h / bands.length;

            for (let y = 0; y < h; y++) {
                const rawIdx = y / bandH;
                const idx = Math.min(bands.length - 1, Math.floor(rawIdx));
                const nextIdx = Math.min(bands.length - 1, idx + 1);
                const frac = rawIdx - idx;

                for (let x = 0; x < w; x++) {
                    let colorIdx = idx;
                    // Classic 2x2 Bayer checkerboard dithering at band transitions
                    if (frac > 0.72 && nextIdx !== idx) {
                        const bayer = ((x & 1) ^ (y & 1)) === 0;
                        if (frac > 0.88) {
                            if (((x & 1) === 0 || (y & 1) === 0)) colorIdx = nextIdx;
                        } else if (bayer) {
                            colorIdx = nextIdx;
                        }
                    }
                    ctx.fillStyle = bands[colorIdx];
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            if (this.skyTexture) this.skyTexture.needsUpdate = true;
        }

        _paintCelestialCanvas(isNight, isSunset) {
            const ctx = this.celestialCanvas.getContext('2d');
            ctx.clearRect(0, 0, 24, 24);

            if (isNight) {
                // Full luminous pixel moon with craters
                for (let y = 0; y < 24; y++) {
                    for (let x = 0; x < 24; x++) {
                        const dx = x - 11.5;
                        const dy = y - 11.5;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        if (r <= 8.2) {
                            if (r > 7.1) ctx.fillStyle = '#a8c6f0';
                            else if ((dx + 3) * (dx + 3) + (dy + 2) * (dy + 2) < 4.5) ctx.fillStyle = '#c2d7f5';
                            else if ((dx - 3.5) * (dx - 3.5) + (dy - 2.5) * (dy - 2.5) < 3.2) ctx.fillStyle = '#b9cef0';
                            else ctx.fillStyle = '#f5f9ff';
                            ctx.fillRect(x, y, 1, 1);
                        } else if (r <= 10.5 && ((x + y) % 2 === 0)) {
                            ctx.fillStyle = 'rgba(216, 232, 255, 0.35)';
                            ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            } else {
                // Warm pixel sun
                const outer = isSunset ? '#ff7b54' : '#ffe066';
                const mid = isSunset ? '#ffb26b' : '#fff3a1';
                const core = '#fffbe0';
                for (let y = 0; y < 24; y++) {
                    for (let x = 0; x < 24; x++) {
                        const dx = x - 11.5;
                        const dy = y - 11.5;
                        const r = Math.sqrt(dx * dx + dy * dy);
                        if (r <= 5.5) {
                            ctx.fillStyle = core;
                            ctx.fillRect(x, y, 1, 1);
                        } else if (r <= 8.2) {
                            ctx.fillStyle = mid;
                            ctx.fillRect(x, y, 1, 1);
                        } else if (r <= 10.5 && ((x + y) % 2 === 0)) {
                            ctx.fillStyle = outer;
                            ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            }
            if (this.celestialTexture) this.celestialTexture.needsUpdate = true;
        }

        _paintHorizonIslandCanvas(themeKey) {
            const w = 256;
            const h = 32;
            const ctx = this.horizonCanvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            const isNight = themeKey === 'night';
            const isSunset = themeKey === 'sunset';

            const hillFar = isNight ? '#1b3554' : (isSunset ? '#684569' : '#4a9e6b');
            const hillNear = isNight ? '#132640' : (isSunset ? '#49304f' : '#2e7d50');
            const treeCol = isNight ? '#0c1b2e' : (isSunset ? '#34223c' : '#1f5e3b');
            const rockCol = isNight ? '#26344d' : (isSunset ? '#543c4c' : '#6c757d');

            // Left distant island hills
            for (let x = 14; x < 98; x++) {
                const hillH = Math.round(
                    Math.sin((x - 14) / 84 * Math.PI) * 10 +
                    Math.sin((x - 14) * 0.25) * 2
                );
                if (hillH > 0) {
                    ctx.fillStyle = hillFar;
                    ctx.fillRect(x, h - hillH, 1, hillH);
                    ctx.fillStyle = hillNear;
                    ctx.fillRect(x, h - Math.max(1, Math.floor(hillH * 0.6)), 1, Math.floor(hillH * 0.6));
                }
                if (x > 24 && x < 86 && x % 7 === 0) {
                    ctx.fillStyle = treeCol;
                    const topY = h - hillH - 3;
                    ctx.fillRect(x, topY, 1, 3);
                    ctx.fillRect(x - 1, topY + 1, 3, 2);
                }
            }

            // Right lighthouse island & cliff
            for (let x = 166; x < 238; x++) {
                const hillH = Math.round(
                    Math.sin((x - 166) / 72 * Math.PI) * 8 + 2
                );
                ctx.fillStyle = hillNear;
                ctx.fillRect(x, h - hillH, 1, hillH);
                if (x > 170 && x < 194 && x % 6 === 0) {
                    ctx.fillStyle = treeCol;
                    const topY = h - hillH - 3;
                    ctx.fillRect(x, topY, 1, 3);
                    ctx.fillRect(x - 1, topY + 1, 3, 2);
                }
            }
            // Cliff base under lighthouse
            ctx.fillStyle = rockCol;
            ctx.fillRect(204, h - 8, 16, 8);

            // Red-and-white striped Pixel Lighthouse
            const lx = 209;
            const ly = h - 22;
            const stripes = ['#f8f9fa', '#d94848', '#f8f9fa', '#d94848', '#f8f9fa', '#d94848', '#f8f9fa'];
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = isNight ? (i % 2 === 0 ? '#9ab0cc' : '#8a3444') : stripes[i];
                ctx.fillRect(lx, ly + i * 2, 6, 2);
            }
            // Lantern gallery & warm beacon
            ctx.fillStyle = '#2b2d42';
            ctx.fillRect(lx - 1, ly - 1, 8, 1);
            ctx.fillStyle = '#ffe169';
            ctx.fillRect(lx + 1, ly - 4, 4, 3);
            if (isNight || isSunset) {
                ctx.fillStyle = 'rgba(255, 225, 105, 0.45)';
                ctx.fillRect(lx - 5, ly - 4, 6, 3);
                ctx.fillRect(lx + 5, ly - 4, 6, 3);
            }
            // Lighthouse cap
            ctx.fillStyle = '#c93b3b';
            ctx.fillRect(lx, ly - 5, 6, 1);
            ctx.fillRect(lx + 1, ly - 6, 4, 1);
            ctx.fillRect(lx + 2, ly - 7, 2, 1);

            if (this.horizonTexture) this.horizonTexture.needsUpdate = true;
        }

        _setupSkyAndHorizon(theme) {
            const THREE = global.THREE;
            this.skyGroup = new THREE.Group();
            this.scene.add(this.skyGroup);

            // Dithered Sky Plane
            this.skyCanvas = this._createCanvas(128, 96);
            this._paintSkyCanvas(theme);
            this.skyTexture = this._makePixelTex(this.skyCanvas);

            const skyGeo = new THREE.PlaneGeometry(180, 75);
            this.skyMaterial = new THREE.MeshBasicMaterial({
                map: this.skyTexture,
                fog: false,
                depthWrite: false
            });
            this.skyMesh = new THREE.Mesh(skyGeo, this.skyMaterial);
            this.skyMesh.position.set(0, 18, -42);
            this.skyGroup.add(this.skyMesh);

            // Twinkling Pixel Stars (visible in night / dusk)
            const starCount = 160;
            const starPos = new Float32Array(starCount * 3);
            for (let i = 0; i < starCount; i++) {
                starPos[i * 3] = (Math.random() - 0.5) * 140;
                starPos[i * 3 + 1] = 8 + Math.random() * 28;
                starPos[i * 3 + 2] = -40.5;
            }
            const starGeo = new THREE.BufferGeometry();
            starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
            const starCanvas = this._createCanvas(4, 4);
            const sctx = starCanvas.getContext('2d');
            sctx.fillStyle = '#ffffff';
            sctx.fillRect(1, 1, 2, 2);
            const starTex = this._makePixelTex(starCanvas);
            this.starMaterial = new THREE.PointsMaterial({
                size: 0.55,
                map: starTex,
                transparent: true,
                opacity: theme.starsOpacity,
                fog: false,
                depthWrite: false
            });
            this.starField = new THREE.Points(starGeo, this.starMaterial);
            this.skyGroup.add(this.starField);

            // Pixel Sun / Moon
            this.celestialCanvas = this._createCanvas(24, 24);
            this._paintCelestialCanvas(theme.key === 'night', theme.key === 'sunset');
            this.celestialTexture = this._makePixelTex(this.celestialCanvas);
            this.celestialMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(8.5, 8.5),
                new THREE.MeshBasicMaterial({
                    map: this.celestialTexture,
                    transparent: true,
                    fog: false,
                    depthWrite: false
                })
            );
            this.celestialMesh.position.set(22, theme.key === 'sunset' ? 11.5 : 21, -39.5);
            this.skyGroup.add(this.celestialMesh);

            // Horizon Islands & Lighthouse Strip
            this.horizonCanvas = this._createCanvas(256, 32);
            this._paintHorizonIslandCanvas(theme.key);
            this.horizonTexture = this._makePixelTex(this.horizonCanvas);
            this.horizonMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(144, 18),
                new THREE.MeshBasicMaterial({
                    map: this.horizonTexture,
                    transparent: true,
                    alphaTest: 0.1,
                    fog: false
                })
            );
            this.horizonMesh.position.set(0, 5.2, -37.5);
            this.skyGroup.add(this.horizonMesh);
        }

        _createCloudTexture() {
            const c = this._createCanvas(48, 24);
            const ctx = c.getContext('2d');
            const blobs = [
                { x: 14, y: 14, r: 7 },
                { x: 23, y: 11, r: 9 },
                { x: 32, y: 13, r: 7 },
                { x: 8, y: 16, r: 4.5 },
                { x: 39, y: 16, r: 4.5 }
            ];
            for (let y = 0; y < 24; y++) {
                for (let x = 0; x < 48; x++) {
                    if (y > 19) continue;
                    let inside = false;
                    for (let i = 0; i < blobs.length; i++) {
                        const b = blobs[i];
                        const dx = x - b.x;
                        const dy = (y - b.y) * 1.15;
                        if (dx * dx + dy * dy <= b.r * b.r) {
                            inside = true;
                            break;
                        }
                    }
                    if (!inside) continue;
                    if (y >= 17) ctx.fillStyle = '#c8dff2';
                    else if (y <= 7) ctx.fillStyle = '#ffffff';
                    else ctx.fillStyle = '#f2f8ff';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
            return this._makePixelTex(c);
        }

        _setupClouds(theme) {
            const THREE = global.THREE;
            this.cloudTex = this._createCloudTexture();
            const specs = [
                { x: -34, y: 18, z: -34, s: 1.3, spd: 0.48 },
                { x: -16, y: 13.5, z: -26, s: 0.95, spd: 0.62 },
                { x: -4, y: 20, z: -35, s: 1.45, spd: 0.42 },
                { x: 10, y: 15, z: -23, s: 1.05, spd: 0.58 },
                { x: 25, y: 18.5, z: -32, s: 1.25, spd: 0.50 },
                { x: 38, y: 12.5, z: -28, s: 0.9, spd: 0.68 },
                { x: -25, y: 11.5, z: -21, s: 0.85, spd: 0.72 },
                { x: 17, y: 21, z: -36, s: 1.35, spd: 0.40 }
            ];

            this.cloudMaterial = new THREE.MeshBasicMaterial({
                map: this.cloudTex,
                color: new THREE.Color(theme.cloudTint || 0xffffff),
                transparent: true,
                alphaTest: 0.1,
                fog: false
            });

            this.clouds = specs.map((sp) => {
                const mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(11 * sp.s, 5.5 * sp.s),
                    this.cloudMaterial
                );
                mesh.position.set(sp.x, sp.y, sp.z);
                mesh.userData = { speed: sp.spd, baseY: sp.y };
                this.skyGroup.add(mesh);
                return mesh;
            });
        }

        // ------------------------------------------------------------------
        // 2. Animated Pixel Ocean & Stepped Shoreline Foam (8 FPS)
        // ------------------------------------------------------------------

        _paintWaterTile(theme, frame) {
            const size = 64;
            const ctx = this.waterCanvas.getContext('2d');
            ctx.fillStyle = theme.oceanMid;
            ctx.fillRect(0, 0, size, size);

            // Subtle stepped deep water bands
            ctx.fillStyle = theme.oceanDeep;
            for (let y = 0; y < size; y += 8) {
                for (let x = 0; x < size; x += 2) {
                    const wave = Math.sin((x + frame * 4) * 0.2 + y * 0.35);
                    if (wave > 0.35) {
                        ctx.fillRect(x, y, 2, 2);
                    }
                }
            }

            // Shallow turquoise wave crests (Stardew 16-bit style crescent arcs)
            const crests = [
                { x: 6, y: 10 }, { x: 38, y: 18 },
                { x: 20, y: 34 }, { x: 50, y: 44 },
                { x: 10, y: 54 }, { x: 42, y: 4 }
            ];
            for (let i = 0; i < crests.length; i++) {
                const cx = (crests[i].x + frame * 2) % size;
                const cy = (crests[i].y + (i % 2 === 0 ? frame : -frame) + size) % size;
                ctx.fillStyle = theme.oceanShallow;
                ctx.fillRect(cx, cy, 8, 2);
                ctx.fillRect((cx + 2) % size, (cy + 2) % size, 4, 1);

                // Pixel sparkle highlight on alternating frames
                if ((frame + i) % 3 === 0) {
                    ctx.fillStyle = theme.oceanFoam;
                    ctx.fillRect((cx + 3) % size, cy, 2, 1);
                }
            }

            if (this.waterTexture) this.waterTexture.needsUpdate = true;
        }

        _paintFoamTile(theme, frame) {
            const w = 64;
            const h = 16;
            const ctx = this.foamCanvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);

            for (let x = 0; x < w; x++) {
                const crestY = 4 + Math.round(Math.sin((x + frame * 3) * 0.28) * 2 + Math.cos((x - frame * 2) * 0.18));
                // Translucent turquoise wash
                ctx.fillStyle = theme.oceanShallow;
                ctx.fillRect(x, 0, 1, Math.max(2, crestY + 3));
                // Crisp white pixel seafoam lip
                ctx.fillStyle = theme.oceanFoam;
                ctx.fillRect(x, crestY, 1, 2);
                if ((x + frame) % 5 === 0) {
                    ctx.fillRect(x, Math.min(h - 2, crestY + 3), 2, 1);
                }
            }

            if (this.foamTexture) this.foamTexture.needsUpdate = true;
        }

        _setupOceanAndFoam(theme) {
            const THREE = global.THREE;
            this.waterCanvas = this._createCanvas(64, 64);
            this._paintWaterTile(theme, 0);
            this.waterTexture = this._makePixelTex(this.waterCanvas, 22, 12);

            const oceanGeo = new THREE.PlaneGeometry(140, 74, 70, 37);
            this.oceanMaterial = new THREE.MeshLambertMaterial({
                map: this.waterTexture
            });
            this.oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMaterial);
            this.oceanMesh.rotation.x = -Math.PI / 2;
            this.oceanMesh.position.set(0, 0, -31.5);
            this.scene.add(this.oceanMesh);

            // Animated shoreline foam strip washing onto the sloped sand
            this.foamCanvas = this._createCanvas(64, 16);
            this._paintFoamTile(theme, 0);
            this.foamTexture = this._makePixelTex(this.foamCanvas, 18, 1);

            const foamGeo = new THREE.PlaneGeometry(140, 2.4);
            this.foamMesh = new THREE.Mesh(
                foamGeo,
                new THREE.MeshBasicMaterial({
                    map: this.foamTexture,
                    transparent: true
                })
            );
            this.foamMesh.rotation.x = -Math.PI / 2 + 0.14;
            this.foamMesh.position.set(0, 0.15, 4.35);
            this.scene.add(this.foamMesh);
        }

        // ------------------------------------------------------------------
        // 3. Sandy Pelican Beach, Coastal Rocks, Forageables & Palm Trees
        // ------------------------------------------------------------------

        _paintSandCanvas(theme) {
            const size = 32;
            const ctx = this.sandCanvas.getContext('2d');
            ctx.fillStyle = theme.sandLight;
            ctx.fillRect(0, 0, size, size);

            // Pixel sand grain speckles
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const hash = (x * 73 + y * 139) % 29;
                    if (hash === 2 || hash === 11) {
                        ctx.fillStyle = theme.sandMid;
                        ctx.fillRect(x, y, 1, 1);
                    } else if (hash === 19) {
                        ctx.fillStyle = theme.sandWet;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            // Tiny embedded shell pixels
            ctx.fillStyle = '#fff3df';
            ctx.fillRect(7, 12, 2, 1);
            ctx.fillRect(22, 25, 1, 2);

            if (this.sandTexture) this.sandTexture.needsUpdate = true;
        }

        _createRockTexture() {
            const c = this._createCanvas(16, 16);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#6d7582';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = '#8b94a3';
            ctx.fillRect(1, 1, 12, 4);
            ctx.fillStyle = '#4e5563';
            ctx.fillRect(0, 11, 16, 5);
            ctx.fillRect(12, 4, 4, 8);
            // Coastal moss pixels
            ctx.fillStyle = '#4f9d69';
            ctx.fillRect(2, 0, 5, 2);
            ctx.fillRect(9, 1, 3, 2);
            return this._makePixelTex(c);
        }

        _createForageableTextures() {
            // Purple Sea Urchin (16x16)
            const urchin = this._createCanvas(16, 16);
            this._drawMatrix(urchin.getContext('2d'), [
                '.......pp.......',
                '....p..pp..p....',
                '..p..ppPPpp..p..',
                '...ppPPPPPPpp...',
                '.ppPPPPLLLLPPpp.',
                '..pPPLLLLLLPPp..',
                'ppPPPLLLLLLPPPpp',
                '..pPPLLLLLLPPp..',
                '.ppPPPPPPPPPPpp.',
                '...ppPPPPPPpp...',
                '..p..pppppp..p..',
                '....p......p....'
            ], { p: '#4a1d6b', P: '#7b2cbf', L: '#c77dff' }, 0, 3);

            // Red Coral (16x16)
            const coral = this._createCanvas(16, 16);
            this._drawMatrix(coral.getContext('2d'), [
                '..rr....rr......',
                '..rRr..rRr..rr..',
                '...rRrrRr..rRr..',
                '....rRRr..rRr...',
                '.....rRRrrRr....',
                '..rr..rRRRr.....',
                '..rRrrRRRRr..rr.',
                '...rRRRRRRrrRr..',
                '....rRRRRRRRr...',
                '.....dRRRRRd....',
                '.....dRRRRRd....',
                '....ddRRRRRdd...'
            ], { r: '#c92a42', R: '#ff4d6d', d: '#9e1932' }, 0, 3);

            // Rainbow Shell (16x16)
            const shell = this._createCanvas(16, 16);
            this._drawMatrix(shell.getContext('2d'), [
                '.....cccccc.....',
                '...ccYYYYYYcc...',
                '..cYYPPPPPPYYc..',
                '.cYPPBBBBBBPPYc.',
                '.cYPBGGGGGGGBYc.',
                '.cYPBGGWWGGBPYc.',
                '..ccPPGGGGPPcc..',
                '....cccccccc....'
            ], { c: '#74568c', Y: '#ffd166', P: '#ff8fab', B: '#72efdd', G: '#80ed99', W: '#ffffff' }, 0, 7);

            // Orange Starfish (16x16)
            const star = this._createCanvas(16, 16);
            this._drawMatrix(star.getContext('2d'), [
                '.......oo.......',
                '......oOOo......',
                '......oOOo......',
                '.ooooOLLLLoooo..',
                '..ooOOLLLLOOoo..',
                '....oOLLLLOOo...',
                '...oOOo..oOOo...',
                '..oOOo....oOOo..',
                '..ooo......ooo..'
            ], { o: '#c8551f', O: '#f77f00', L: '#fcbf49' }, 0, 6);

            // Beach Grass Tuft (16x16)
            const grass = this._createCanvas(16, 16);
            this._drawMatrix(grass.getContext('2d'), [
                '..g..........g..',
                '...g...g....g...',
                '...G..gG...gG...',
                '....G.G...G.....',
                '.g..G.G..G...g..',
                '..g.G.G.G...g...',
                '..G.GGG.G..G....',
                '...GGGGGGG......',
                '...dGGGGGd......',
                '..ddDDDDDdd.....'
            ], { g: '#9ef01a', G: '#70e000', d: '#38b000', D: '#2b8a3e' }, 0, 5);

            return {
                urchin: this._makePixelTex(urchin),
                coral: this._makePixelTex(coral),
                shell: this._makePixelTex(shell),
                star: this._makePixelTex(star),
                grass: this._makePixelTex(grass)
            };
        }

        _createPalmTextures() {
            const bark = this._createCanvas(16, 16);
            const bctx = bark.getContext('2d');
            bctx.fillStyle = '#7f5539';
            bctx.fillRect(0, 0, 16, 16);
            bctx.fillStyle = '#9c6644';
            bctx.fillRect(2, 1, 10, 4);
            bctx.fillRect(3, 9, 9, 4);
            bctx.fillStyle = '#582f0e';
            bctx.fillRect(0, 6, 16, 2);
            bctx.fillRect(0, 14, 16, 2);

            const frond = this._createCanvas(32, 16);
            const fctx = frond.getContext('2d');
            for (let x = 0; x < 30; x++) {
                const droop = Math.floor((x * x) / 110);
                const halfH = Math.max(1, Math.round(Math.sin((x / 30) * Math.PI) * 5));
                fctx.fillStyle = '#2d9345';
                fctx.fillRect(x, 4 + droop, 1, halfH);
                fctx.fillStyle = '#52b768';
                fctx.fillRect(x, 3 + droop, 1, 2);
                if (x % 3 === 0) {
                    fctx.fillStyle = '#1b5e2e';
                    fctx.fillRect(x, 4 + droop + halfH, 1, 2);
                }
            }

            return {
                bark: this._makePixelTex(bark),
                frond: this._makePixelTex(frond)
            };
        }

        _beachHeightAt(z) {
            // Meets waterline cleanly at z = 4.2 and rises smoothly into the foreground shore
            return Math.max(-0.45, (z - 4.2) * 0.14);
        }

        _buildPalmTree(x, z, tiltDir, palmTextures) {
            const THREE = global.THREE;
            const baseY = this._beachHeightAt(z);
            const treeGroup = new THREE.Group();
            treeGroup.position.set(x, baseY, z);

            const barkMat = new THREE.MeshLambertMaterial({ map: palmTextures.bark });
            const segments = 7;
            let curX = 0;
            let curY = 0;

            for (let i = 0; i < segments; i++) {
                const segSize = 0.62 - i * 0.035;
                const seg = new THREE.Mesh(
                    new THREE.BoxGeometry(segSize, 0.85, segSize),
                    barkMat
                );
                curX += tiltDir * (0.12 + i * 0.03);
                curY = i * 0.72 + 0.35;
                seg.position.set(curX, curY, 0);
                seg.rotation.z = -tiltDir * (0.08 + i * 0.03);
                treeGroup.add(seg);
            }

            // Crown of swaying pixel fronds
            const crown = new THREE.Group();
            crown.position.set(curX, curY + 0.45, 0);
            const frondMat = new THREE.MeshLambertMaterial({
                map: palmTextures.frond,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.DoubleSide
            });

            const frondCount = 6;
            for (let i = 0; i < frondCount; i++) {
                const angle = (i / frondCount) * Math.PI * 2 + 0.3;
                const frondHolder = new THREE.Group();
                frondHolder.rotation.y = angle;

                const frondMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), frondMat);
                frondMesh.position.set(1.6, -0.1, 0);
                frondMesh.rotation.x = -0.35;
                frondHolder.add(frondMesh);
                crown.add(frondHolder);
            }

            // Small pixel coconuts under crown
            const cocoMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
            for (let c = 0; c < 3; c++) {
                const coco = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), cocoMat);
                const ca = (c / 3) * Math.PI * 2;
                coco.position.set(Math.cos(ca) * 0.32, -0.32, Math.sin(ca) * 0.32);
                crown.add(coco);
            }

            treeGroup.add(crown);
            treeGroup.userData = { crown: crown, phase: x * 0.4 };
            this.beachGroup.add(treeGroup);
            this.palmTrees.push(treeGroup);
        }

        _setupBeachAndForageables(theme) {
            const THREE = global.THREE;
            this.beachGroup = new THREE.Group();
            this.scene.add(this.beachGroup);

            // Sloped sandy shoreline foreground
            this.sandCanvas = this._createCanvas(32, 32);
            this._paintSandCanvas(theme);
            this.sandTexture = this._makePixelTex(this.sandCanvas, 28, 5);

            const beachGeo = new THREE.PlaneGeometry(140, 16, 44, 10);
            const pos = beachGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const lx = pos.getX(i);
                const ly = pos.getY(i); // maps to world z after -90 deg X rotation
                const worldZ = 11.5 - ly;
                const dune = Math.sin(lx * 0.18) * 0.12 + Math.cos(worldZ * 0.45) * 0.05;
                const height = this._beachHeightAt(worldZ) + dune;
                pos.setZ(i, height);
            }
            beachGeo.computeVertexNormals();

            this.beachMesh = new THREE.Mesh(
                beachGeo,
                new THREE.MeshLambertMaterial({ map: this.sandTexture })
            );
            this.beachMesh.rotation.x = -Math.PI / 2;
            this.beachMesh.position.set(0, 0, 11.5);
            this.beachGroup.add(this.beachMesh);

            // Coastal Pixel Rock Clusters
            const rockMat = new THREE.MeshLambertMaterial({ map: this._createRockTexture() });
            const rockSpecs = [
                { x: -11.8, z: 4.5, sx: 2.2, sy: 1.4, sz: 1.8 },
                { x: -10.3, z: 5.2, sx: 1.3, sy: 0.9, sz: 1.2 },
                { x: -12.6, z: 6.1, sx: 1.4, sy: 1.0, sz: 1.3 },
                { x: 11.4, z: 4.3, sx: 2.4, sy: 1.5, sz: 1.9 },
                { x: 10.1, z: 5.1, sx: 1.2, sy: 0.85, sz: 1.1 },
                { x: 12.7, z: 5.8, sx: 1.5, sy: 1.0, sz: 1.4 }
            ];
            rockSpecs.forEach((rk) => {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(rk.sx, rk.sy, rk.sz), rockMat);
                mesh.position.set(rk.x, this._beachHeightAt(rk.z) + rk.sy * 0.35, rk.z);
                mesh.rotation.y = rk.x * 0.25;
                this.beachGroup.add(mesh);
            });

            // Stardew Beach Forageables & Grass Tufts
            const fTex = this._createForageableTextures();
            const propList = [
                { tex: fTex.urchin, x: -7.5, z: 5.6, s: 0.78, grass: false },
                { tex: fTex.coral, x: 5.2, z: 5.5, s: 0.92, grass: false },
                { tex: fTex.shell, x: 2.1, z: 6.8, s: 0.72, grass: false },
                { tex: fTex.star, x: -3.2, z: 6.4, s: 0.70, grass: false },
                { tex: fTex.coral, x: -9.0, z: 7.4, s: 0.85, grass: false },
                { tex: fTex.shell, x: 7.9, z: 6.1, s: 0.74, grass: false },
                { tex: fTex.grass, x: -8.6, z: 8.2, s: 0.95, grass: true },
                { tex: fTex.grass, x: -6.4, z: 8.8, s: 0.88, grass: true },
                { tex: fTex.grass, x: 6.4, z: 7.9, s: 0.95, grass: true },
                { tex: fTex.grass, x: 8.9, z: 8.4, s: 1.0, grass: true },
                { tex: fTex.grass, x: 11.2, z: 7.7, s: 0.9, grass: true }
            ];

            propList.forEach((p, idx) => {
                const mat = new THREE.MeshBasicMaterial({
                    map: p.tex,
                    transparent: true,
                    alphaTest: 0.1,
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.s, p.s), mat);
                mesh.position.set(p.x, this._beachHeightAt(p.z) + p.s * 0.44, p.z);
                mesh.userData = { baseRotZ: 0, phase: idx * 0.9 };
                this.beachGroup.add(mesh);
                if (p.grass) {
                    this.grassTufts.push(mesh);
                }
            });

            // 2 Swaying Pixel Palm Trees
            const palmTex = this._createPalmTextures();
            this._buildPalmTree(-10.2, 6.8, 1, palmTex);
            this._buildPalmTree(10.0, 7.2, -1, palmTex);
        }

        // ------------------------------------------------------------------
        // 4. Wooden Pier, Willy-Style Fisherman's Cabin & Bobbing Rowboat
        // ------------------------------------------------------------------

        _createWoodPlankTex() {
            const c = this._createCanvas(32, 32);
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#9c6b43';
            ctx.fillRect(0, 0, 32, 32);
            for (let y = 0; y < 32; y += 8) {
                ctx.fillStyle = '#b07b4f';
                ctx.fillRect(0, y + 1, 32, 5);
                ctx.fillStyle = '#5c3b22';
                ctx.fillRect(0, y, 32, 1);
                // Plank vertical seam & nail pixels
                const seamX = (y * 3 + 8) % 28;
                ctx.fillRect(seamX, y, 1, 8);
                ctx.fillStyle = '#3d2716';
                ctx.fillRect(seamX - 2, y + 2, 1, 1);
                ctx.fillRect(seamX + 2, y + 5, 1, 1);
            }
            return this._makePixelTex(c, 2, 4);
        }

        _createCabinTextures(theme) {
            // Weathered blue-teal cabin siding
            const wall = this._createCanvas(32, 32);
            const wctx = wall.getContext('2d');
            wctx.fillStyle = '#3d6e80';
            wctx.fillRect(0, 0, 32, 32);
            for (let y = 0; y < 32; y += 4) {
                wctx.fillStyle = '#4c8499';
                wctx.fillRect(0, y, 32, 2);
                wctx.fillStyle = '#2a4d5c';
                wctx.fillRect(0, y + 3, 32, 1);
            }

            // Cedar shingle roof
            const roof = this._createCanvas(32, 32);
            const rctx = roof.getContext('2d');
            rctx.fillStyle = '#7a3e2e';
            rctx.fillRect(0, 0, 32, 32);
            for (let y = 0; y < 32; y += 4) {
                for (let x = 0; x < 32; x += 6) {
                    const ox = (y % 8 === 0) ? 0 : 3;
                    rctx.fillStyle = '#964f3b';
                    rctx.fillRect((x + ox) % 32, y, 5, 3);
                    rctx.fillStyle = '#52261b';
                    rctx.fillRect((x + ox) % 32, y + 3, 6, 1);
                }
            }

            // Glowing 4-pane window
            this.windowCanvas = this._createCanvas(16, 16);
            this._paintWindowCanvas(theme.windowGlow || '#ffd875');

            // Wooden door
            const door = this._createCanvas(16, 24);
            const dctx = door.getContext('2d');
            dctx.fillStyle = '#54331d';
            dctx.fillRect(0, 0, 16, 24);
            dctx.fillStyle = '#7a4b2a';
            dctx.fillRect(2, 2, 12, 21);
            dctx.fillStyle = '#452815';
            dctx.fillRect(5, 2, 1, 21);
            dctx.fillRect(10, 2, 1, 21);
            dctx.fillStyle = '#ffd166';
            dctx.fillRect(11, 12, 2, 2);

            // Life-preserver ring sprite
            const ring = this._createCanvas(16, 16);
            const lctx = ring.getContext('2d');
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const dx = x - 7.5;
                    const dy = y - 7.5;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    if (r >= 3.2 && r <= 6.8) {
                        const red = (Math.abs(dx) < 2 || Math.abs(dy) < 2);
                        lctx.fillStyle = red ? '#e63946' : '#f8f9fa';
                        lctx.fillRect(x, y, 1, 1);
                    }
                }
            }

            return {
                wall: this._makePixelTex(wall, 2, 1),
                roof: this._makePixelTex(roof, 2, 2),
                window: this._makePixelTex(this.windowCanvas),
                door: this._makePixelTex(door),
                ring: this._makePixelTex(ring)
            };
        }

        _paintWindowCanvas(glowColor) {
            if (!this.windowCanvas) return;
            const ctx = this.windowCanvas.getContext('2d');
            ctx.fillStyle = '#4a2c18';
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = glowColor;
            ctx.fillRect(2, 2, 5, 5);
            ctx.fillRect(9, 2, 5, 5);
            ctx.fillRect(2, 9, 5, 5);
            ctx.fillRect(9, 9, 5, 5);
            ctx.fillStyle = '#fff9db';
            ctx.fillRect(3, 3, 2, 2);
            ctx.fillRect(10, 3, 2, 2);
            if (this.windowTexture) this.windowTexture.needsUpdate = true;
        }

        _setupPierAndCabin(theme) {
            const THREE = global.THREE;
            this.pierGroup = new THREE.Group();
            this.scene.add(this.pierGroup);

            const woodTex = this._createWoodPlankTex();
            const deckMat = new THREE.MeshLambertMaterial({ map: woodTex });
            const postMat = new THREE.MeshLambertMaterial({ color: 0x5c3b22 });

            // Main boardwalk pier extending out into the sea
            const mainPier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.24, 13.0), deckMat);
            mainPier.position.set(-0.4, 1.15, 0.5);
            this.pierGroup.add(mainPier);

            // Cabin platform deck extending left
            const cabinDeck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 5.8), deckMat);
            cabinDeck.position.set(-4.4, 1.15, 2.0);
            this.pierGroup.add(cabinDeck);

            // Timber pilings supporting pier & deck
            const pilingPositions = [
                [-2.0, 4.5], [1.2, 4.5],
                [-2.0, 0.5], [1.2, 0.5],
                [-2.0, -3.5], [1.2, -3.5],
                [-2.0, -5.6], [1.2, -5.6],
                [-6.5, 4.6], [-6.5, -0.5]
            ];

            // Water foam ring texture around ocean pilings
            const ringCanv = this._createCanvas(16, 16);
            const rctx = ringCanv.getContext('2d');
            for (let y = 0; y < 16; y++) {
                for (let x = 0; x < 16; x++) {
                    const dx = x - 7.5;
                    const dy = y - 7.5;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    if (r >= 5.2 && r <= 7.2) {
                        rctx.fillStyle = ((x + y) % 2 === 0) ? '#eefaff' : '#80e5ff';
                        rctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            const pilingRingTex = this._makePixelTex(ringCanv);

            pilingPositions.forEach((pos, idx) => {
                const height = pos[1] < -4 ? 3.1 : 2.7;
                const piling = new THREE.Mesh(new THREE.BoxGeometry(0.42, height, 0.42), postMat);
                piling.position.set(pos[0], 1.15 - height * 0.5 + 0.45, pos[1]);
                this.pierGroup.add(piling);

                if (pos[1] < 3.6) {
                    const ringMesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(1.15, 1.15),
                        new THREE.MeshBasicMaterial({
                            map: pilingRingTex,
                            transparent: true,
                            opacity: 0.7
                        })
                    );
                    ringMesh.rotation.x = -Math.PI / 2;
                    ringMesh.position.set(pos[0], 0.08, pos[1]);
                    ringMesh.userData = { phase: idx * 0.8 };
                    this.pierGroup.add(ringMesh);
                    this.pilingRings.push(ringMesh);
                }
            });

            // 3 Warm Pixel Lantern Posts & Rope Fence along pier right edge
            const lanternPositions = [4.5, 0.5, -3.5];
            const ropeMat = new THREE.MeshLambertMaterial({ color: 0xb08968 });
            lanternPositions.forEach((lz, i) => {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.22), postMat);
                post.position.set(1.22, 1.82, lz);
                this.pierGroup.add(post);

                const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), postMat);
                cap.position.set(1.22, 2.52, lz);
                this.pierGroup.add(cap);

                const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
                this.lanternMaterials.push(lanternMat);
                const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), lanternMat);
                bulb.position.set(1.22, 2.34, lz);
                this.pierGroup.add(bulb);

                const pLight = new THREE.PointLight(0xffb703, theme.lanternIntensity, 10);
                pLight.position.set(1.22, 2.35, lz);
                this.pierGroup.add(pLight);
                this.lanternLights.push(pLight);

                if (i < lanternPositions.length - 1) {
                    const nextZ = lanternPositions[i + 1];
                    const midZ = (lz + nextZ) / 2;
                    const rope = new THREE.Mesh(
                        new THREE.BoxGeometry(0.08, 0.08, Math.abs(lz - nextZ)),
                        ropeMat
                    );
                    rope.position.set(1.22, 1.85, midZ);
                    this.pierGroup.add(rope);
                }
            });

            // Willy-Style Cozy Fisherman's Cabin on the platform
            const cabinTex = this._createCabinTextures(theme);
            this.windowTexture = cabinTex.window;

            const cabin = new THREE.Group();
            cabin.position.set(-4.4, 1.27, 1.8);
            this.pierGroup.add(cabin);

            const wallMat = new THREE.MeshLambertMaterial({ map: cabinTex.wall });
            const roofMat = new THREE.MeshLambertMaterial({ map: cabinTex.roof });
            const winMat = new THREE.MeshBasicMaterial({ map: cabinTex.window });
            this.windowMaterials.push(winMat);
            const doorMat = new THREE.MeshBasicMaterial({ map: cabinTex.door });

            // Cabin walls
            const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 3.0), wallMat);
            body.position.set(0, 1.1, 0);
            cabin.add(body);

            // Pitched roof (2 sloped timber roof panels + gable block)
            const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.22, 3.5), roofMat);
            roofLeft.position.set(-0.92, 2.65, 0);
            roofLeft.rotation.z = 0.56;
            cabin.add(roofLeft);

            const roofRight = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.22, 3.5), roofMat);
            roofRight.position.set(0.92, 2.65, 0);
            roofRight.rotation.z = -0.56;
            cabin.add(roofRight);

            const gable = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.85, 2.95), wallMat);
            gable.position.set(0, 2.38, 0);
            cabin.add(gable);

            // Brick Chimney + Pixel Smoke Puffs
            const chimney = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 1.3, 0.55),
                new THREE.MeshLambertMaterial({ color: 0x8d4a3a })
            );
            chimney.position.set(-0.9, 3.05, -0.6);
            cabin.add(chimney);

            for (let s = 0; s < 4; s++) {
                const puffMat = new THREE.MeshBasicMaterial({
                    color: 0xe2eaf2,
                    transparent: true,
                    opacity: 0.65
                });
                const puff = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), puffMat);
                puff.position.set(-0.9, 3.9 + s * 0.65, -0.6);
                puff.userData = { offset: s * 0.25 };
                cabin.add(puff);
                this.smokePuffs.push(puff);
            }

            // Wooden Door & Glowing Windows
            const door = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.45), doorMat);
            door.position.set(-0.65, 0.72, 1.52);
            cabin.add(door);

            const frontWin = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), winMat);
            frontWin.position.set(0.75, 1.25, 1.52);
            cabin.add(frontWin);

            const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), winMat);
            sideWin.rotation.y = Math.PI / 2;
            sideWin.position.set(1.72, 1.25, 0.4);
            cabin.add(sideWin);

            // Warm interior cabin glow light spilling onto the pier
            const cabinGlow = new THREE.PointLight(0xffb703, theme.lanternIntensity, 8);
            cabinGlow.position.set(1.9, 1.4, 1.8);
            cabin.add(cabinGlow);
            this.lanternLights.push(cabinGlow);

            // Red-and-white Life-Preserver Ring hanging on pier-facing wall
            const lifeRing = new THREE.Mesh(
                new THREE.PlaneGeometry(0.72, 0.72),
                new THREE.MeshBasicMaterial({
                    map: cabinTex.ring,
                    transparent: true,
                    alphaTest: 0.1
                })
            );
            lifeRing.rotation.y = Math.PI / 2;
            lifeRing.position.set(1.72, 1.15, -0.75);
            cabin.add(lifeRing);

            // Wooden Crates / Tackle Barrels on the deck
            const crateMat = new THREE.MeshLambertMaterial({ color: 0x8f5d38 });
            const barrelMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
            const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), crateMat);
            crate1.position.set(-1.75, 1.58, 3.3);
            this.pierGroup.add(crate1);

            const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.55), barrelMat);
            crate2.position.set(-2.35, 1.62, 3.6);
            this.pierGroup.add(crate2);
        }

        _setupRowboat() {
            const THREE = global.THREE;
            this.boatGroup = new THREE.Group();
            this.boatGroup.position.set(3.4, 0.16, -1.6);
            this.boatGroup.rotation.y = -0.22;
            this.scene.add(this.boatGroup);

            const hullMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
            const trimMat = new THREE.MeshLambertMaterial({ color: 0xc28a53 });
            const oarMat = new THREE.MeshLambertMaterial({ color: 0xd9a76a });

            // Boat floor & sides
            const floor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.24, 3.0), hullMat);
            this.boatGroup.add(floor);

            const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 2.9), trimMat);
            sideL.position.set(-0.68, 0.28, 0);
            this.boatGroup.add(sideL);

            const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 2.9), trimMat);
            sideR.position.set(0.68, 0.28, 0);
            this.boatGroup.add(sideR);

            const stern = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.48, 0.2), trimMat);
            stern.position.set(0, 0.28, 1.42);
            this.boatGroup.add(stern);

            const bow = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.52, 0.6), hullMat);
            bow.position.set(0, 0.28, -1.55);
            this.boatGroup.add(bow);

            // Rowing benches
            const bench1 = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.12, 0.36), trimMat);
            bench1.position.set(0, 0.34, 0.45);
            this.boatGroup.add(bench1);

            const bench2 = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.12, 0.36), trimMat);
            bench2.position.set(0, 0.34, -0.55);
            this.boatGroup.add(bench2);

            // Wooden oars resting across the boat
            const oar1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 2.2), oarMat);
            oar1.position.set(-0.35, 0.44, 0.1);
            oar1.rotation.y = 0.25;
            this.boatGroup.add(oar1);

            const oar2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 2.2), oarMat);
            oar2.position.set(0.35, 0.44, 0.1);
            oar2.rotation.y = -0.25;
            this.boatGroup.add(oar2);

            // Small warm lantern at the bow
            const bowLanternMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
            this.lanternMaterials.push(bowLanternMat);
            const bowLantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), bowLanternMat);
            bowLantern.position.set(0, 0.65, -1.58);
            this.boatGroup.add(bowLantern);
        }

        // ------------------------------------------------------------------
        // 5. Animated Pixel Seagulls & Glowing Moonlight Jellies
        // ------------------------------------------------------------------

        _createSeagullTextures() {
            const frameUp = this._createCanvas(16, 16);
            this._drawMatrix(frameUp.getContext('2d'), [
                '.gg..........gg.',
                '..gg........gg..',
                '...WW......WW...',
                '....WW....WW....',
                '.....WWWWWW.....',
                '......WYYW......',
                '.......WW.......'
            ], { W: '#ffffff', g: '#b8c4d4', Y: '#ffb703' }, 0, 4);

            const frameDown = this._createCanvas(16, 16);
            this._drawMatrix(frameDown.getContext('2d'), [
                '.....WWWWWW.....',
                '....WW.YY.WW....',
                '...WW..WW..WW...',
                '..gg........gg..',
                '.gg..........gg.'
            ], { W: '#ffffff', g: '#b8c4d4', Y: '#ffb703' }, 0, 6);

            const perched = this._createCanvas(16, 16);
            this._drawMatrix(perched.getContext('2d'), [
                '.....WWW........',
                '....WWKWWYY.....',
                '.....WWWW.......',
                '....WWWWWW......',
                '...WWggggWW.....',
                '....WWWWWW......',
                '.....y..y.......',
                '....yy..yy......'
            ], { W: '#ffffff', g: '#adb5bd', K: '#1d3557', Y: '#ffb703', y: '#fb8500' }, 0, 5);

            return {
                up: this._makePixelTex(frameUp),
                down: this._makePixelTex(frameDown),
                perched: this._makePixelTex(perched)
            };
        }

        _createJellyTextures() {
            const cyan = this._createCanvas(16, 16);
            this._drawMatrix(cyan.getContext('2d'), [
                '....cccccc......',
                '..ccCCCCCCcc....',
                '.cCCWWWWWWCCc...',
                '.cCCCCCCCCCCc...',
                '..ccCCCCCCcc....',
                '...c..cc..c.....',
                '..c...c....c....',
                '.....c......c...'
            ], { c: '#00b4d8', C: '#7ef9ff', W: '#eefaff' }, 1, 3);

            const pink = this._createCanvas(16, 16);
            this._drawMatrix(pink.getContext('2d'), [
                '....pppppp......',
                '..ppPPPPPPpp....',
                '.pPPWWWWWWPPp...',
                '.pPPPPPPPPPPp...',
                '..ppPPPPPPpp....',
                '...p..pp..p.....',
                '..p...p....p....',
                '.....p......p...'
            ], { p: '#c9184a', P: '#ff758f', W: '#fff0f3' }, 1, 3);

            return [this._makePixelTex(cyan), this._makePixelTex(pink)];
        }

        _setupSeagullsAndJellies(theme) {
            const THREE = global.THREE;
            this.lifeGroup = new THREE.Group();
            this.scene.add(this.lifeGroup);

            this.seagullTex = this._createSeagullTextures();

            // 6 Flying Seagulls
            for (let i = 0; i < 6; i++) {
                const mat = new THREE.MeshBasicMaterial({
                    map: this.seagullTex.up,
                    transparent: true,
                    alphaTest: 0.1,
                    side: THREE.DoubleSide,
                    fog: false
                });
                const bird = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), mat);
                bird.userData = {
                    radiusX: 11 + i * 2.8,
                    radiusZ: 5.5 + (i % 3) * 2.2,
                    centerX: (i % 2 === 0 ? -2 : 3),
                    centerZ: -12 - i * 1.6,
                    baseY: 6.8 + (i % 4) * 1.4,
                    angle: (i / 6) * Math.PI * 2,
                    speed: 0.22 + (i % 3) * 0.06,
                    frameOffset: i % 2
                };
                this.lifeGroup.add(bird);
                this.seagulls.push(bird);
            }

            // 1 Perched Seagull on far pier piling
            const perchedBird = new THREE.Mesh(
                new THREE.PlaneGeometry(0.9, 0.9),
                new THREE.MeshBasicMaterial({
                    map: this.seagullTex.perched,
                    transparent: true,
                    alphaTest: 0.1,
                    side: THREE.DoubleSide
                })
            );
            perchedBird.position.set(1.2, 2.75, -5.6);
            this.lifeGroup.add(perchedBird);

            // 14 Glowing Moonlight Jellies around the pier & water
            const jellyTexList = this._createJellyTextures();
            this.jellyMaterials = jellyTexList.map((tex) => new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: theme.jellyOpacity,
                side: THREE.DoubleSide,
                depthWrite: false
            }));

            const jellySpots = [
                [-6.8, -2.5], [-5.2, -4.4], [-3.4, -3.2], [-1.2, -5.0],
                [0.4, -4.2], [2.4, -4.8], [4.8, -3.1], [6.4, -1.6],
                [5.5, 1.2], [2.2, 1.8], [-0.8, 2.6], [-3.6, -5.8],
                [7.8, -4.0], [-7.5, 0.8]
            ];
            jellySpots.forEach((sp, idx) => {
                const mat = this.jellyMaterials[idx % 2];
                const jelly = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.82), mat);
                jelly.position.set(sp[0], 0.16, sp[1]);
                jelly.userData = {
                    baseX: sp[0],
                    baseZ: sp[1],
                    phase: idx * 0.7
                };
                this.lifeGroup.add(jelly);
                this.jellies.push(jelly);
            });
        }

        // ------------------------------------------------------------------
        // Public API (Themes, Pulse, Speed, Compatibility Hooks)
        // ------------------------------------------------------------------

        setTheme(themeKey) {
            const resolved = this._resolveThemeKey(themeKey);
            const theme = this._getTheme(resolved);
            this.currentThemeKey = resolved;

            if (document.documentElement) {
                document.documentElement.setAttribute('data-theme', resolved);
            }

            if (!this.enabled) return;

            this.scene.background.setHex(theme.bgHex);
            this.scene.fog.color.setHex(theme.fogHex);

            this.ambientLight.color.setHex(theme.ambientColor);
            this.ambientLight.intensity = theme.ambientIntensity;
            this.sunLight.color.setHex(theme.sunColor);
            this.sunLight.intensity = theme.sunIntensity;

            this.starMaterial.opacity = theme.starsOpacity;
            this.cloudMaterial.color.setHex(theme.cloudTint || 0xffffff);

            this.lanternLights.forEach((lt) => {
                lt.intensity = theme.lanternIntensity;
            });
            this.jellyMaterials.forEach((jm) => {
                jm.opacity = theme.jellyOpacity;
            });

            this._paintSkyCanvas(theme);
            this._paintCelestialCanvas(resolved === 'night', resolved === 'sunset');
            this._paintHorizonIslandCanvas(resolved);
            this._paintSandCanvas(theme);
            this._paintWaterTile(theme, this.waterFrame);
            this._paintFoamTile(theme, this.waterFrame);
            this._paintWindowCanvas(theme.windowGlow || '#ffd875');

            if (this.celestialMesh) {
                this.celestialMesh.position.y = resolved === 'sunset' ? 11.5 : 21;
            }
        }

        cycleTheme() {
            const idx = this.themeOrder.indexOf(this.currentThemeKey);
            const nextKey = this.themeOrder[(idx + 1) % this.themeOrder.length];
            this.setTheme(nextKey);
            this.triggerPulse();
            return nextKey;
        }

        setSpeed(multiplier) {
            const num = parseFloat(multiplier);
            if (!Number.isNaN(num)) {
                this.speedMultiplier = Math.max(0.1, Math.min(3.0, num));
            }
        }

        triggerPulse() {
            this.pulseFactor = 1.0;
        }

        setGeometry() {}
        setWireframe() {}
        setFocusMode() {}
        onScroll() {}
        highlightSkillNode() {}

        applyPreset(preset) {
            if (!preset) return;
            if (preset.theme) this.setTheme(preset.theme);
            if (typeof preset.speed === 'number') this.setSpeed(preset.speed);
            this.triggerPulse();
        }

        // ------------------------------------------------------------------
        // Input Handlers (Orbit Drag, Mouse Parallax, Wheel Zoom, Click Pulse)
        // ------------------------------------------------------------------

        _handleResize() {
            if (!this.enabled) return;
            this._applyRendererSize();
            this.camera.aspect = global.innerWidth / Math.max(global.innerHeight, 1);
            this.camera.updateProjectionMatrix();
        }

        _isUiTarget(target) {
            if (!target || !target.closest) return false;
            return Boolean(target.closest('a, button, input, textarea, select, label, [data-ui-interactive]'));
        }

        _handlePointerMove(e) {
            const w = Math.max(global.innerWidth, 1);
            const h = Math.max(global.innerHeight, 1);
            this.mouse.x = (e.clientX / w - 0.5) * 2;
            this.mouse.y = (e.clientY / h - 0.5) * 2;
            this.mouse.active = true;

            if (this.isDragging) {
                const dx = e.clientX - this.lastPointer.x;
                const dy = e.clientY - this.lastPointer.y;
                this.dragDistance += Math.hypot(dx, dy);

                this.targetAzimuth = Math.max(-0.85, Math.min(0.85, this.targetAzimuth - dx * 0.0032));
                this.targetElevation = Math.max(1.8, Math.min(8.5, this.targetElevation + dy * 0.015));

                this.lastPointer.x = e.clientX;
                this.lastPointer.y = e.clientY;
            }
        }

        _handlePointerDown(e) {
            if (!this.enabled || this._isUiTarget(e.target)) return;
            this.isDragging = true;
            this.dragDistance = 0;
            this.lastPointer.x = e.clientX;
            this.lastPointer.y = e.clientY;
            document.body.classList.add('grabbing-3d');
        }

        _handlePointerUp() {
            this.isDragging = false;
            document.body.classList.remove('grabbing-3d');
        }

        _handleClick(e) {
            if (!this.enabled || this._isUiTarget(e.target)) return;
            if (this.dragDistance <= 6) {
                this.triggerPulse();
            }
        }

        _handleDblClick(e) {
            if (!this.enabled || this._isUiTarget(e.target)) return;
            this.cycleTheme();
        }

        _handleWheel(e) {
            if (!this.enabled) return;
            this.targetCamDistance = Math.max(7.5, Math.min(19.0, this.targetCamDistance + e.deltaY * 0.006));
        }

        // ------------------------------------------------------------------
        // Render Loop
        // ------------------------------------------------------------------

        _animateLoop() {
            if (!this.enabled) return;
            requestAnimationFrame(this._animate);

            const delta = Math.min(this.clock.getDelta(), 0.05);
            const elapsed = this.clock.getElapsedTime();
            const spd = this.speedMultiplier;
            const theme = this._getTheme(this.currentThemeKey);

            this.pulseFactor *= 0.93;

            // Smoothly interpolate camera orbit & zoom
            this.azimuth += (this.targetAzimuth - this.azimuth) * 0.08;
            this.elevation += (this.targetElevation - this.elevation) * 0.08;
            this.camDistance += (this.targetCamDistance - this.camDistance) * 0.08;

            const parallaxX = this.mouse.active ? this.mouse.x * 0.85 : 0;
            const parallaxY = this.mouse.active ? -this.mouse.y * 0.35 : 0;

            const camX = Math.sin(this.azimuth) * this.camDistance + parallaxX;
            const camZ = Math.cos(this.azimuth) * this.camDistance - 2.0;
            const camY = Math.max(1.8, this.elevation + parallaxY);

            this.camera.position.set(camX, camY, camZ);
            this.camera.lookAt(0, 1.75, -4);

            // 1. 8 FPS Pixel Water & Seafoam Texture Animation
            this.waterAccum += delta * spd;
            if (this.waterAccum >= 0.125) {
                this.waterAccum = 0;
                this.waterFrame = (this.waterFrame + 1) % 32;
                this._paintWaterTile(theme, this.waterFrame);
                this._paintFoamTile(theme, this.waterFrame);
            }

            // 2. Stepped Vertex Wave Motion on Ocean Plane + Foam Wash
            const oceanPos = this.oceanMesh.geometry.attributes.position;
            for (let i = 0; i < oceanPos.count; i++) {
                const vx = oceanPos.getX(i);
                const vy = oceanPos.getY(i);
                const rawWave =
                    Math.sin(vx * 0.18 + elapsed * 1.7 * spd) * 0.24 +
                    Math.cos(vy * 0.24 + elapsed * 1.3 * spd) * 0.18 +
                    this.pulseFactor * Math.sin(vx * 0.35 + elapsed * 6.0) * 0.32;
                const quantized = Math.round(rawWave * 4) / 4;
                oceanPos.setZ(i, quantized);
            }
            oceanPos.needsUpdate = true;

            const tideShift = Math.sin(elapsed * 1.4 * spd) * 0.45;
            this.foamMesh.position.z = 4.4 + tideShift;
            this.foamMesh.position.y = 0.12 + tideShift * 0.14;

            // 3. Bobbing Wooden Rowboat
            const boatWave = Math.sin(elapsed * 1.8 * spd) * 0.12 + this.pulseFactor * 0.18;
            this.boatGroup.position.y = 0.16 + boatWave;
            this.boatGroup.rotation.z = Math.sin(elapsed * 1.3 * spd) * 0.055;
            this.boatGroup.rotation.x = Math.cos(elapsed * 1.6 * spd) * 0.04;

            // 4. Drifting Pixel Clouds
            for (let i = 0; i < this.clouds.length; i++) {
                const cl = this.clouds[i];
                cl.position.x += delta * cl.userData.speed * spd;
                if (cl.position.x > 52) {
                    cl.position.x = -52;
                }
            }

            // 5. Swaying Palm Crowns & Beach Grass
            for (let i = 0; i < this.palmTrees.length; i++) {
                const tree = this.palmTrees[i];
                const crown = tree.userData.crown;
                crown.rotation.z = Math.sin(elapsed * 1.15 + tree.userData.phase) * 0.065;
                crown.rotation.x = Math.cos(elapsed * 0.9 + tree.userData.phase) * 0.04;
            }
            for (let i = 0; i < this.grassTufts.length; i++) {
                const gr = this.grassTufts[i];
                gr.rotation.z = Math.sin(elapsed * 2.1 + gr.userData.phase) * 0.09;
            }

            // 6. Cabin Chimney Pixel Smoke Puffs & Pier Piling Foam Rings
            for (let i = 0; i < this.smokePuffs.length; i++) {
                const puff = this.smokePuffs[i];
                const cycle = (elapsed * 0.35 + puff.userData.offset) % 1;
                puff.position.y = 3.6 + cycle * 2.4;
                puff.position.x = -0.9 + Math.sin(cycle * 5 + elapsed) * 0.22;
                puff.material.opacity = (1 - cycle) * 0.65;
            }
            for (let i = 0; i < this.pilingRings.length; i++) {
                const pr = this.pilingRings[i];
                const s = 1.0 + Math.sin(elapsed * 2.2 + pr.userData.phase) * 0.18;
                pr.scale.setScalar(s);
            }

            // 7. Animated Pixel Seagulls (6 FPS wing flap) & Moonlight Jellies
            this.seagullAccum += delta * spd;
            if (this.seagullAccum >= 0.166) {
                this.seagullAccum = 0;
                this.seagullFrame = 1 - this.seagullFrame;
                for (let i = 0; i < this.seagulls.length; i++) {
                    const bird = this.seagulls[i];
                    const f = (this.seagullFrame + bird.userData.frameOffset) % 2;
                    bird.material.map = f === 0 ? this.seagullTex.up : this.seagullTex.down;
                }
            }
            for (let i = 0; i < this.seagulls.length; i++) {
                const bird = this.seagulls[i];
                const ud = bird.userData;
                ud.angle += delta * ud.speed * spd;
                bird.position.x = ud.centerX + Math.cos(ud.angle) * ud.radiusX;
                bird.position.z = ud.centerZ + Math.sin(ud.angle) * ud.radiusZ;
                bird.position.y = ud.baseY + Math.sin(ud.angle * 2) * 0.55;
                bird.lookAt(this.camera.position.x, bird.position.y, this.camera.position.z);
            }

            for (let i = 0; i < this.jellies.length; i++) {
                const jelly = this.jellies[i];
                const ud = jelly.userData;
                jelly.position.y = 0.16 + Math.sin(elapsed * 1.9 + ud.phase) * 0.18 + this.pulseFactor * 0.25;
                jelly.position.x = ud.baseX + Math.cos(elapsed * 0.7 + ud.phase) * 0.35;
                const sc = 0.85 + Math.sin(elapsed * 2.8 + ud.phase) * 0.14;
                jelly.scale.set(sc, 1.08 - (sc - 0.85), 1);
                jelly.lookAt(this.camera.position.x, jelly.position.y, this.camera.position.z);
            }

            // 8. Warm Lantern Flicker
            const flicker = 0.92 + Math.sin(elapsed * 7.5) * 0.08;
            for (let i = 0; i < this.lanternLights.length; i++) {
                this.lanternLights[i].intensity = theme.lanternIntensity * flicker;
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    global.PortfolioScene3D = PortfolioScene3D;
})(window);
