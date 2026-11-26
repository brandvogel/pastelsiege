// Grid A* pathfinding for bots. Cells are blocked if any collider (expanded by the bot radius) covers them.
export class Nav {
  constructor(size, colliders, cell = 1, margin = .45) {
    this.size = size; this.cell = cell; this.n = Math.ceil(size * 2 / cell);
    const n = this.n, N = n * n;
    this.blocked = new Uint8Array(N);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = -size + (i + .5) * cell, z = -size + (j + .5) * cell;
      if (Math.abs(x) > size - 1 || Math.abs(z) > size - 1) this.blocked[j * n + i] = 1;
    }
    // rasterise each collider onto the cells whose centres it covers (fast on big floors)
    for (const c of colliders) {
      const i0 = Math.max(0, Math.ceil((c.minX - margin + size) / cell - .5)), i1 = Math.min(n - 1, Math.floor((c.maxX + margin + size) / cell - .5));
      const j0 = Math.max(0, Math.ceil((c.minZ - margin + size) / cell - .5)), j1 = Math.min(n - 1, Math.floor((c.maxZ + margin + size) / cell - .5));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.blocked[j * n + i] = 1;
    }
    this.g = new Float32Array(N); this.came = new Int32Array(N); this.closed = new Uint8Array(N); this.seen = new Uint8Array(N);
    this.heap = new Int32Array(N * 8); this.hf = new Float32Array(N * 8);
  }
  cellOf(x, z) { const n = this.n; return [Math.max(0, Math.min(n - 1, Math.floor((x + this.size) / this.cell))), Math.max(0, Math.min(n - 1, Math.floor((z + this.size) / this.cell)))]; }
  centre(k) { const n = this.n; return { x: -this.size + (k % n + .5) * this.cell, z: -this.size + (Math.floor(k / n) + .5) * this.cell }; }
  free(x, z) { const [i, j] = this.cellOf(x, z); return !this.blocked[j * this.n + i]; }
  nearestFree(i, j) {
    const n = this.n;
    if (!this.blocked[j * n + i]) return j * n + i;
    for (let r = 1; r < 14; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < n && b < n && !this.blocked[b * n + a]) return b * n + a;
    }
    return -1;
  }
  clearLine(a, b) {
    const d = Math.hypot(b.x - a.x, b.z - a.z), steps = Math.ceil(d / (this.cell * .4));
    for (let s = 1; s < steps; s++) { const t = s / steps; if (!this.free(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; }
    return true;
  }
  findPath(from, to) {
    const n = this.n, [si, sj] = this.cellOf(from.x, from.z), [ti, tj] = this.cellOf(to.x, to.z);
    const start = this.nearestFree(si, sj), goal = this.nearestFree(ti, tj);
    if (start < 0 || goal < 0) return null;
    if (start === goal) return [this.centre(goal)];
    const { g, came, closed, seen, heap, hf } = this;
    closed.fill(0); seen.fill(0);
    let size = 0;
    const gi = goal % n, gj = Math.floor(goal / n);
    const h = k => { const dx = Math.abs(k % n - gi), dz = Math.abs(Math.floor(k / n) - gj); return dx + dz + (1.414 - 2) * Math.min(dx, dz); };
    const push = (k, f) => { let i = size++; heap[i] = k; hf[i] = f; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= hf[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; [hf[p], hf[i]] = [hf[i], hf[p]]; i = p; } };
    const pop = () => {
      const top = heap[0]; size--; heap[0] = heap[size]; hf[0] = hf[size]; let i = 0;
      for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < size && hf[l] < hf[m]) m = l; if (r < size && hf[r] < hf[m]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; [hf[m], hf[i]] = [hf[i], hf[m]]; i = m; }
      return top;
    };
    g[start] = 0; seen[start] = 1; came[start] = -1; push(start, h(start));
    // long trips on huge maps may run out of search budget: then walk to the explored cell closest to the goal
    let found = false, iter = 0, bestK = start, bestH = h(start);
    while (size > 0 && iter++ < 24000) {
      const k = pop(); if (closed[k]) continue; closed[k] = 1;
      { const hk = h(k); if (hk < bestH) { bestH = hk; bestK = k; } }
      if (k === goal) { found = true; break; }
      const ki = k % n, kj = Math.floor(k / n);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a = ki + di, b = kj + dj; if (a < 0 || b < 0 || a >= n || b >= n) continue;
        const nk = b * n + a; if (this.blocked[nk] || closed[nk]) continue;
        if (di && dj && (this.blocked[kj * n + a] || this.blocked[b * n + ki])) continue; // no corner cutting
        const ng = g[k] + (di && dj ? 1.414 : 1);
        if (!seen[nk] || ng < g[nk]) { seen[nk] = 1; g[nk] = ng; came[nk] = k; push(nk, ng + h(nk)); }
      }
    }
    if (!found && bestK === start) return null;
    const raw = []; for (let k = found ? goal : bestK; k !== -1; k = came[k]) raw.push(this.centre(k));
    raw.reverse();
    // string-pull: skip ahead while the next waypoint is still directly reachable
    const out = []; let cur = { x: from.x, z: from.z }, i = 0;
    while (i < raw.length) {
      let j = i;
      while (j + 1 < raw.length && j - i < 12 && this.clearLine(cur, raw[j + 1])) j++;
      out.push(raw[j]); cur = raw[j]; i = j + 1;
    }
    return out;
  }
}
