// Painted textures made on a canvas at load time. They are near-white so the pastel colour of each
// material still shows through; the texture only adds soft detail (grain, tiles, bricks, planks).
const cache = {};
function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function canvas(N) { const c = document.createElement('canvas'); c.width = c.height = N; return [c, c.getContext('2d')]; }
// soft value noise layered at a few scales; brightens and darkens what's already drawn by up to ±amp/2
function noise(x, N, r, _unused, amp, scales = [4, 8, 16, 48]) {
  const img = x.getImageData(0, 0, N, N), d = img.data;
  const grids = scales.map(s => { const g = []; for (let i = 0; i < s * s; i++) g.push(r()); return g; });
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let v = 0, wsum = 0;
    scales.forEach((s, k) => {
      const fx = i / N * s, fy = j / N * s, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, g = grids[k];
      const at = (a, b) => g[((b % s) * s + (a % s))];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const n = (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
      const w = 1 / (k + 1); v += n * w; wsum += w;
    });
    v = v / wsum - .5; const o = (j * N + i) * 4, m = 1 + v * amp;
    d[o] = Math.min(255, d[o] * m); d[o + 1] = Math.min(255, d[o + 1] * m); d[o + 2] = Math.min(255, d[o + 2] * m);
  }
  x.putImageData(img, 0, 0);
}
function speckle(x, N, r, n, col, size = 1.5) { x.fillStyle = col; for (let i = 0; i < n; i++) { const s = r() * size + .5; x.fillRect(r() * N, r() * N, s, s); } }
function tex(THREE, key, N, draw, srgb = true) {
  if (cache[key]) return cache[key];
  const [c, x] = canvas(N); draw(x, N, seeded(key.length * 7919 + key.charCodeAt(0) * 31));
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return (cache[key] = t);
}

// ---------- surfaces for boxes (1 texture tile = 2m) ----------
export function surfaces(THREE) {
  return {
    plaster: tex(THREE, 'plaster', 256, (x, N, r) => { x.fillStyle = '#f4f1ec'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .16); speckle(x, N, r, 500, 'rgba(120,100,80,.12)'); speckle(x, N, r, 260, 'rgba(255,255,255,.35)'); }),
    brick: tex(THREE, 'brick', 256, (x, N, r) => {
      x.fillStyle = '#d9d2c6'; x.fillRect(0, 0, N, N);
      const rows = 8, bh = N / rows, bw = N / 4;
      for (let j = 0; j < rows; j++) for (let i = -1; i < 5; i++) {
        const ox = (j % 2) * bw / 2, v = 232 + Math.floor(r() * 22);
        x.fillStyle = `rgb(${v},${v - 4},${v - 9})`; x.beginPath(); x.roundRect(i * bw + ox + 2, j * bh + 2, bw - 4, bh - 4, 3); x.fill();
      }
      noise(x, N, r, 0, .12, [8, 16, 64]); speckle(x, N, r, 300, 'rgba(90,70,60,.14)');
    }),
    planks: tex(THREE, 'planks', 256, (x, N, r) => {
      const n = 5, pw = N / n;
      for (let i = 0; i < n; i++) {
        const v = 230 + Math.floor(r() * 22); x.fillStyle = `rgb(${v},${v - 6},${v - 14})`; x.fillRect(i * pw, 0, pw, N);
        x.strokeStyle = 'rgba(120,80,50,.16)'; for (let k = 0; k < 9; k++) { x.lineWidth = .6 + r() * 1.2; x.beginPath(); const xx = i * pw + r() * pw; x.moveTo(xx, 0); x.bezierCurveTo(xx + r() * 6 - 3, N * .3, xx + r() * 6 - 3, N * .7, xx, N); x.stroke(); }
        x.fillStyle = 'rgba(70,45,30,.28)'; x.fillRect(i * pw, 0, 1.5, N);
        x.fillStyle = 'rgba(70,45,30,.22)'; [.12, .88].forEach(f => { x.beginPath(); x.arc(i * pw + pw / 2, N * f + (r() - .5) * 10, 1.6, 0, 7); x.fill(); });
      }
      noise(x, N, r, 0, .08, [8, 32]);
    }),
    metal: tex(THREE, 'metal', 256, (x, N, r) => {
      x.fillStyle = '#eef0f2'; x.fillRect(0, 0, N, N);
      for (let i = 0; i < N; i += 16) { x.fillStyle = 'rgba(40,45,60,.10)'; x.fillRect(i, 0, 3, N); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(i + 3, 0, 2, N); } // corrugation
      noise(x, N, r, 0, .1, [4, 16]); speckle(x, N, r, 140, 'rgba(150,90,60,.16)', 3);
    }),
    // soft gradient for the top of tall walls and roofs
    concrete: tex(THREE, 'concrete', 256, (x, N, r) => { x.fillStyle = '#ecebe8'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .2, [6, 12, 24, 80]); speckle(x, N, r, 900, 'rgba(70,70,70,.12)'); speckle(x, N, r, 300, 'rgba(255,255,255,.4)'); }),
  };
}

// ---------- ground per map theme (1 tile = 8m) ----------
export function ground(THREE, theme) {
  return tex(THREE, 'ground-' + theme, 512, (x, N, r) => {
    if (theme === 'city') { // paving slabs with a road stripe feel
      x.fillStyle = '#d8d6d2'; x.fillRect(0, 0, N, N);
      const s = N / 4;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 222 + Math.floor(r() * 26); x.fillStyle = `rgb(${v},${v},${v - 3})`; x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
      noise(x, N, r, 0, .14); speckle(x, N, r, 1800, 'rgba(60,60,70,.13)');
      for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(80,80,90,.12)'; x.lineWidth = 1; x.beginPath(); let px = r() * N, py = r() * N; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - .5) * 40; py += (r() - .5) * 40; x.lineTo(px, py); } x.stroke(); } // cracks
    } else if (theme === 'garden') { // grass with clover patches and blades
      x.fillStyle = '#f0f6e8'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .26, [4, 8, 24]);
      for (let i = 0; i < 2600; i++) { const v = r(); x.strokeStyle = v < .5 ? 'rgba(80,120,60,.18)' : 'rgba(255,255,255,.3)'; x.lineWidth = 1; const px = r() * N, py = r() * N; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - .5) * 3, py - 3 - r() * 4); x.stroke(); }
      for (let i = 0; i < 40; i++) { x.fillStyle = ['rgba(255,255,255,.7)', 'rgba(255,210,220,.8)', 'rgba(255,230,140,.8)'][i % 3]; const px = r() * N, py = r() * N; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(px + Math.cos(k * 1.57) * 2, py + Math.sin(k * 1.57) * 2, 1.4, 0, 7); x.fill(); } }
    } else if (theme === 'desert') { // sand ripples
      x.fillStyle = '#f6efe2'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .2, [3, 6, 20]);
      for (let j = 0; j < N; j += 9) { x.strokeStyle = 'rgba(160,110,60,.10)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i <= N; i += 8) { const y = j + Math.sin(i / 37 + j * .3) * 4 + Math.sin(i / 11) * 1.2; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
      speckle(x, N, r, 1200, 'rgba(140,100,60,.16)'); speckle(x, N, r, 40, 'rgba(120,100,90,.35)', 4);
    } else if (theme === 'frost') { // snow with soft drifts and sparkle
      x.fillStyle = '#fbfdff'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .12, [3, 6, 12]);
      for (let i = 0; i < 30; i++) { const px = r() * N, py = r() * N, g = x.createRadialGradient(px, py, 0, px, py, 30 + r() * 40); g.addColorStop(0, 'rgba(170,200,225,.16)'); g.addColorStop(1, 'rgba(170,200,225,0)'); x.fillStyle = g; x.fillRect(px - 70, py - 70, 140, 140); }
      speckle(x, N, r, 500, 'rgba(255,255,255,.9)', 1.2); speckle(x, N, r, 300, 'rgba(140,170,200,.18)');
    } else if (theme === 'fort') { // packed dirt with flagstones
      x.fillStyle = '#f2e9da'; x.fillRect(0, 0, N, N); noise(x, N, r, 0, .22);
      for (let i = 0; i < 26; i++) { const px = r() * N, py = r() * N, w = 30 + r() * 40, h = 24 + r() * 30, v = 226 + Math.floor(r() * 24); x.fillStyle = `rgba(${v},${v - 6},${v - 14},.9)`; x.beginPath(); x.roundRect(px, py, w, h, 8); x.fill(); x.strokeStyle = 'rgba(110,85,60,.18)'; x.lineWidth = 2; x.stroke(); }
      speckle(x, N, r, 1400, 'rgba(110,80,50,.16)'); speckle(x, N, r, 60, 'rgba(100,90,80,.3)', 4);
    } else if (theme === 'yard') { // big concrete slabs with oil stains and bolts
      x.fillStyle = '#d4d2cd'; x.fillRect(0, 0, N, N);
      const s = N / 2;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const v = 228 + Math.floor(r() * 20); x.fillStyle = `rgb(${v},${v - 1},${v - 4})`; x.fillRect(i * s + 3, j * s + 3, s - 6, s - 6); }
      noise(x, N, r, 0, .18); speckle(x, N, r, 1500, 'rgba(60,60,60,.12)');
      for (let i = 0; i < 5; i++) { const px = r() * N, py = r() * N, g = x.createRadialGradient(px, py, 0, px, py, 14 + r() * 26); g.addColorStop(0, 'rgba(50,50,60,.18)'); g.addColorStop(1, 'rgba(50,50,60,0)'); x.fillStyle = g; x.fillRect(px - 50, py - 50, 100, 100); }
      x.fillStyle = 'rgba(240,190,80,.5)'; for (let i = 0; i < N; i += 64) x.fillRect(i, N / 2 - 3, 32, 6); // painted lane marks
    } else { // toybox: soft foam play tiles that slot together
      const s = N / 4;
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 236 + Math.floor(r() * 18); x.fillStyle = `rgb(${v},${v - 3},${v - 8})`; x.fillRect(i * s, j * s, s, s); }
      x.strokeStyle = 'rgba(120,100,80,.18)'; x.lineWidth = 2;
      for (let k = 1; k < 4; k++) { // jigsaw seams
        x.beginPath(); for (let t = 0; t <= N; t += 4) { const y = k * s + (Math.floor(t / 16) % 2 ? 3 : -3); t ? x.lineTo(t, y) : x.moveTo(t, y); } x.stroke();
        x.beginPath(); for (let t = 0; t <= N; t += 4) { const xx = k * s + (Math.floor(t / 16) % 2 ? 3 : -3); t ? x.lineTo(xx, t) : x.moveTo(xx, t); } x.stroke();
      }
      noise(x, N, r, 0, .08, [8, 32]); speckle(x, N, r, 700, 'rgba(255,255,255,.4)');
    }
  });
}

// ---------- surface relief ----------
// A normal map worked out from a painted texture's brightness (darker reads as lower), so mortar lines, plank gaps,
// corrugation, paving seams and sand ripples catch the sun and throw tiny shadows. Made once per texture and shared.
export function normalFrom(THREE, src, strength = 2) {
  const key = 'n' + strength; src.userData.nm ||= {};
  if (src.userData.nm[key]) return src.userData.nm[key];
  const c = src.image, N = c.width, M = c.height, d = c.getContext('2d').getImageData(0, 0, N, M).data, h = new Float32Array(N * M);
  for (let i = 0; i < N * M; i++) h[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
  // one soft blur pass so the bumps are rounded rather than pixel-sharp
  const b = new Float32Array(N * M), at = (x, y) => h[((y + M) % M) * N + ((x + N) % N)];
  for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) b[y * N + x] = (at(x, y) * 4 + at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1)) / 8;
  const bt = (x, y) => b[((y + M) % M) * N + ((x + N) % N)];
  const [oc, ox] = canvas(N), img = ox.createImageData(N, M), o = img.data;
  for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) {
    const gx = (bt(x + 1, y) - bt(x - 1, y)) * strength, gy = (bt(x, y + 1) - bt(x, y - 1)) * strength, l = Math.hypot(gx, gy, 1), i = (y * N + x) * 4;
    o[i] = (-gx / l * .5 + .5) * 255; o[i + 1] = (gy / l * .5 + .5) * 255; o[i + 2] = (1 / l * .5 + .5) * 255; o[i + 3] = 255;
  }
  ox.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(oc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace;
  return (src.userData.nm[key] = t);
}
// how bumpy each surface is
export const RELIEF = { plaster: 1.4, brick: 5, planks: 3.2, metal: 5.5, concrete: 1.8, ground: { city: 3.5, garden: 2.2, desert: 3, frost: 1.2, fort: 3.2, yard: 3, toybox: 3 } };
