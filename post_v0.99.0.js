// Post-processing: the scene renders into an HDR buffer, then bright parts glow (bloom),
// colours get a gentle grade, and the frame is tone-mapped to the screen.
// cheap: the glow is worked out at half the usual size (Retina Macs), it is a soft blur anyway so it looks the same
// Ray tracing (Settings > Graphics, on by default on Super Ultra) adds a lighting pass between the world and the gun:
// rays traced through the depth buffer for contact shadows in corners (ambient occlusion), light bouncing colour off
// nearby walls, reflections on every surface (stronger at grazing angles) and sun rays streaming through gaps,
// smoothed over several frames. It is screen-space, so it can only use what's on screen. Motion blur reuses the same
// camera history.
export function makePost(THREE, renderer, cheap = false) {
  const HF = { type: THREE.HalfFloatType };
  let main = null, fxRT = null, mainHq = false;
  const rt = () => new THREE.WebGLRenderTarget(1, 1, { ...HF, depthBuffer: false });
  const bright = rt(), a4 = rt(), b4 = rt(), a8 = rt(), b8 = rt(), a16 = rt(), b16 = rt();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; qs.add(quad);
  const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const mat = (uniforms, frag, toneMapped = false) => new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false, toneMapped });
  // keep only what's brighter than the threshold (soft knee so it fades in)
  const brightM = mat({ tDiffuse: { value: null }, threshold: { value: 1.25 }, knee: { value: .5 } }, `
    uniform sampler2D tDiffuse; uniform float threshold, knee; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float br = max(c.r, max(c.g, c.b));
      float rq = clamp(br - threshold + knee, 0.0, 2.0 * knee);
      rq = (0.25 / knee) * rq * rq;
      float w = max(rq, br - threshold) / max(br, 1e-4);
      gl_FragColor = vec4(min(c * w, vec3(30.0)), 1.0);
    }`);
  // 9-tap gaussian done in 5 bilinear samples
  const blurM = mat({ tDiffuse: { value: null }, dir: { value: new THREE.Vector2() } }, `
    uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * 0.2270270270;
      c += texture2D(tDiffuse, vUv + dir * 1.3846153846).rgb * 0.3162162162;
      c += texture2D(tDiffuse, vUv - dir * 1.3846153846).rgb * 0.3162162162;
      c += texture2D(tDiffuse, vUv + dir * 3.2307692308).rgb * 0.0702702703;
      c += texture2D(tDiffuse, vUv - dir * 3.2307692308).rgb * 0.0702702703;
      gl_FragColor = vec4(c, 1.0);
    }`);
  // ---------- ray-traced lighting ----------
  // Worked out from the colour and depth of the world (before the gun is drawn), at a share of the screen's resolution:
  // rays into the hemisphere above each surface give ambient occlusion (contact shadows in every corner) and one bounce
  // of coloured light off nearby walls; the mirrored view ray is marched through the depth buffer for reflections
  // (stronger at grazing angles); and sun rays stream through gaps toward the sun. Every frame uses fresh random rays,
  // and the results are blended into a history that follows the camera (reprojection), clipped to what's around each
  // pixel now so moving things don't smear. Noise averages out into smooth light within a few frames.
  const COMMON = `
    uniform sampler2D tDepth; uniform mat4 projInv;
    vec3 viewPos(vec2 uv){ float d = min(texture2D(tDepth, uv).x, 0.99999); vec4 p = projInv * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
    bool off(vec2 uv){ return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0; }
    float ign(vec2 px, float f){ return fract(52.9829189 * fract(dot(px + f * vec2(47.0, 17.0), vec2(0.06711056, 0.00583715)))); }`;
  const rtM = mat({
    tColor: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() },
    fres: { value: new THREE.Vector2(1, 1) }, rres: { value: new THREE.Vector2(1, 1) }, sunUV: { value: new THREE.Vector2(.5, .8) }, sunOn: { value: 0 }, frame: { value: 0 },
    giStr: { value: .65 }, ssrStr: { value: .4 }, raysStr: { value: .38 }, reflOn: { value: 1 },
  }, COMMON + `
    uniform sampler2D tColor; uniform mat4 proj; uniform vec2 fres, rres, sunUV; uniform float sunOn, frame, giStr, ssrStr, raysStr, reflOn; varying vec2 vUv;
    vec2 toUV(vec3 p){ vec4 c = proj * vec4(p, 1.0); return c.xy / c.w * 0.5 + 0.5; }
    void main(){
      vec2 px = 1.0 / fres; float n1 = ign(gl_FragCoord.xy, frame), n2 = ign(gl_FragCoord.yx + 13.0, frame * 1.7);
      float d0 = texture2D(tDepth, vUv).x; vec3 ind = vec3(0.0); float ao = 1.0;
      if (d0 < 0.99999) {
        vec3 col = texture2D(tColor, vUv).rgb, P = viewPos(vUv);
        vec3 Px = viewPos(vUv + vec2(px.x, 0.0)), Pmx = viewPos(vUv - vec2(px.x, 0.0)), Py = viewPos(vUv + vec2(0.0, px.y)), Pmy = viewPos(vUv - vec2(0.0, px.y));
        vec3 dx = abs(Px.z - P.z) < abs(Pmx.z - P.z) ? Px - P : P - Pmx, dy = abs(Py.z - P.z) < abs(Pmy.z - P.z) ? Py - P : P - Pmy;
        vec3 N = normalize(cross(dx, dy)); if (dot(N, P) > 0.0) N = -N;
        vec3 Tg = normalize(abs(N.y) < 0.99 ? cross(N, vec3(0.0, 1.0, 0.0)) : cross(N, vec3(1.0, 0.0, 0.0))), Bt = cross(N, Tg);
        // ambient occlusion + bounce light: cosine-weighted rays, each marched a few steps
        float occ = 0.0; vec3 bounce = vec3(0.0); const float R = 1.2;
        for (int i = 0; i < RAYS; i++) {
          float fi = float(i), a = (fi + n1) * 2.39996323, r = sqrt((fi + n2) / float(RAYS));
          vec3 dir = normalize(Tg * cos(a) * r + Bt * sin(a) * r + N * sqrt(max(0.0, 1.0 - r * r)));
          for (int k = 1; k <= 3; k++) {
            float t = R * (float(k) - 1.0 + fract(n2 + fi * 0.618)) / 3.0;
            vec3 S = P + N * 0.02 + dir * t; vec2 suv = toUV(S); if (off(suv)) break;
            float dz = viewPos(suv).z - S.z;
            if (dz > 0.02 && dz < 0.9) { float w = 1.0 - t / R; occ += w; bounce += texture2D(tColor, suv).rgb * w; break; }
          }
        }
        ao = 1.0 - occ / float(RAYS);
        ind += bounce / float(RAYS) * giStr;
        // reflections
        // glossy, not mirror: each frame's reflection ray is nudged a little at random, and the history blends them
        vec3 V = normalize(P), Rf = normalize(reflect(V, N) + (Tg * (n1 - 0.5) + Bt * (n2 - 0.5)) * GLOSS);
        float fres0 = pow(1.0 - max(dot(-V, N), 0.0), 5.0), refl = (0.03 + 0.7 * fres0) * ssrStr * reflOn;
        if (refl > 0.01) {
          float st = 0.2 + 0.012 * -P.z; vec3 S = P + N * 0.03 + Rf * st * n1;
          vec3 hitc = vec3(0.0); float hit = 0.0;
          for (int i = 0; i < STEPS; i++) {
            S += Rf * st; st *= 1.06;
            vec2 suv = toUV(S); if (off(suv) || S.z > -0.05) break;
            if (texture2D(tDepth, suv).x >= 0.99999) continue;
            float diff = viewPos(suv).z - S.z;
            if (diff > 0.0 && diff < st * 2.5 + 0.15) {
              vec3 a = S - Rf * st, b = S;
              for (int j = 0; j < 6; j++) { vec3 m = (a + b) * 0.5; if (viewPos(toUV(m)).z > m.z) b = m; else a = m; }
              vec2 huv = toUV(b), e = smoothstep(0.0, 0.08, huv) * smoothstep(1.0, 0.92, huv);
              hitc = texture2D(tColor, huv).rgb; hit = e.x * e.y * (1.0 - float(i) / float(STEPS)); break;
            }
          }
          ind += (hitc - col * ao) * refl * hit;
        }
      }
      // sun rays: march toward the sun; only light that comes from open sky gets through
      if (sunOn > 0.001) {
        vec2 dl = (vUv - sunUV) / float(RSAMP), uv = vUv - dl * n1;
        float light = 0.0, decay = 1.0;
        for (int i = 0; i < RSAMP; i++) { uv -= dl; light += (texture2D(tDepth, clamp(uv, 0.0, 1.0)).x >= 0.99999 ? 1.0 : 0.0) * decay; decay *= 0.968; }
        ind += vec3(1.0, 0.92, 0.8) * light / float(RSAMP) * raysStr * sunOn * (64.0 / float(RSAMP)) * 0.5;
      }
      gl_FragColor = vec4(ind, ao);
    }`);
  // history: reproject last frame's result to where those surfaces are now, clip it to this frame's neighbourhood, blend
  const accM = mat({ tCur: { value: null }, tHist: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, viewInv: { value: new THREE.Matrix4() }, prevVP: { value: new THREE.Matrix4() },
    rres: { value: new THREE.Vector2(1, 1) }, alpha: { value: .1 }, reset: { value: 1 } }, COMMON + `
    uniform sampler2D tCur, tHist; uniform mat4 viewInv, prevVP; uniform vec2 rres; uniform float alpha, reset; varying vec2 vUv;
    void main(){
      vec4 cur = texture2D(tCur, vUv), m1 = vec4(0.0), m2 = vec4(0.0);
      for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) { vec4 s = texture2D(tCur, vUv + vec2(float(x), float(y)) / rres); m1 += s; m2 += s * s; }
      m1 /= 9.0; m2 /= 9.0; vec4 sig = sqrt(max(m2 - m1 * m1, 0.0));
      vec4 c = prevVP * (viewInv * vec4(viewPos(vUv), 1.0)); vec2 puv = c.xy / c.w * 0.5 + 0.5;
      vec4 h = clamp(texture2D(tHist, puv), m1 - 1.4 * sig, m1 + 1.4 * sig);
      float keep = (reset > 0.5 || off(puv)) ? 0.0 : 1.0 - alpha;
      gl_FragColor = mix(cur, h, keep);
    }`);
  // put it together at full size: the soft lighting is brought up from its smaller size following the depth edges
  const litM = mat({ tColor: { value: null }, tDepth: { value: null }, tRT: { value: null }, projInv: { value: new THREE.Matrix4() }, rres: { value: new THREE.Vector2(1, 1) }, aoStr: { value: 1 } }, COMMON + `
    uniform sampler2D tColor, tRT; uniform vec2 rres; uniform float aoStr; varying vec2 vUv;
    void main(){
      vec3 col = texture2D(tColor, vUv).rgb; float z0 = -viewPos(vUv).z;
      vec2 p = vUv * rres - 0.5, f = fract(p), b = (floor(p) + 0.5) / rres; vec4 acc = vec4(0.0); float ws = 0.0;
      for (int i = 0; i < 4; i++) {
        vec2 o = vec2(float(i - (i / 2) * 2), float(i / 2)), uv = b + o / rres;
        float w = (o.x > 0.5 ? f.x : 1.0 - f.x) * (o.y > 0.5 ? f.y : 1.0 - f.y), z = -viewPos(uv).z;
        w *= exp(-abs(z - z0) / (0.03 * z0 + 0.05)) + 1e-4; acc += texture2D(tRT, uv) * w; ws += w;
      }
      vec4 ind = acc / ws;
      gl_FragColor = vec4(col * mix(1.0, ind.a * ind.a, aoStr) + ind.rgb, 1.0);
    }`);
  // motion blur: each pixel is smeared along the way the camera moved it since last frame (the gun stays sharp)
  const mbM = mat({ tColor: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, viewInv: { value: new THREE.Matrix4() }, prevVP: { value: new THREE.Matrix4() },
    fres: { value: new THREE.Vector2(1, 1) }, amount: { value: .5 } }, COMMON + `
    uniform sampler2D tColor; uniform mat4 viewInv, prevVP; uniform vec2 fres; uniform float amount; varying vec2 vUv;
    void main(){
      vec4 c = prevVP * (viewInv * vec4(viewPos(vUv), 1.0)); vec2 v = (vUv - (c.xy / c.w * 0.5 + 0.5)) * amount;
      float L = length(v * fres); if (L > 48.0) v *= 48.0 / L;
      vec3 s = vec3(0.0); float n = ign(gl_FragCoord.xy, 0.0) - 0.5;
      for (int i = 0; i < 10; i++) s += texture2D(tColor, vUv + v * ((float(i) + n) / 9.0 - 0.5)).rgb;
      gl_FragColor = vec4(s / 10.0, 1.0);
    }`);
  // how much work each ray tracing level does: rays per pixel, reflection steps, sun ray samples, and resolution
  const RT_LEVELS = [null, { RAYS: 6, STEPS: 24, RSAMP: 24, scale: .5 }, { RAYS: 12, STEPS: 40, RSAMP: 40, scale: .5 }, { RAYS: 16, STEPS: 64, RSAMP: 56, scale: 1 }];
  const setLevel = lv => { const L = RT_LEVELS[lv]; if (!L) return; rtM.defines = { RAYS: L.RAYS, STEPS: L.STEPS, RSAMP: L.RSAMP, GLOSS: (P?.gloss ?? .3).toFixed(3) }; rtM.needsUpdate = true; };
  const rtT = () => new THREE.WebGLRenderTarget(1, 1, { ...HF, depthBuffer: false });
  let rtCur = null, histA = null, histB = null, litRT = null, rtLevelBuilt = 0, rtFrame = 0;
  const prevVP = new THREE.Matrix4(), _vp = new THREE.Matrix4(); let havePrev = false;
  const compM = mat({
    tScene: { value: null }, tB1: { value: null }, tB2: { value: null }, tB3: { value: null },
    bloom: { value: .9 }, vig: { value: .28 }, sat: { value: 1.08 }, contrast: { value: 1.06 }, warm: { value: .03 },
    hurt: { value: 0 }, grain: { value: .018 }, time: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, useBloom: { value: 1 }, sharp: { value: .35 },
  }, `
    uniform sampler2D tScene, tB1, tB2, tB3; uniform float bloom, vig, sat, contrast, warm, hurt, grain, time, useBloom, sharp; uniform vec2 res; varying vec2 vUv;
    void main(){
      vec2 uv = vUv, d = (uv - 0.5) * hurt * 0.014;
      vec3 c = hurt > 0.001 ? vec3(texture2D(tScene, uv + d).r, texture2D(tScene, uv).g, texture2D(tScene, uv - d).b) : texture2D(tScene, uv).rgb;
      // sharpen: push each pixel away from the average of its 4 neighbours, kept inside their min/max so edges don't get halos.
      // This wins back the crispness lost when the frame is drawn below the screen's resolution and stretched up.
      if (sharp > 0.001) {
        vec2 px = 1.0 / res;
        vec3 n = texture2D(tScene, uv + vec2(0.0, px.y)).rgb, s = texture2D(tScene, uv - vec2(0.0, px.y)).rgb;
        vec3 e = texture2D(tScene, uv + vec2(px.x, 0.0)).rgb, w = texture2D(tScene, uv - vec2(px.x, 0.0)).rgb;
        vec3 lo = min(c, min(min(n, s), min(e, w))), hi = max(c, max(max(n, s), max(e, w)));
        c = clamp(c + (c - (n + s + e + w) * 0.25) * sharp * 2.0, lo, hi);
      }
      if (useBloom > 0.5) c += (texture2D(tB1, uv).rgb * 0.5 + texture2D(tB2, uv).rgb * 0.7 + texture2D(tB3, uv).rgb * 0.9) * bloom;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, sat);
      c = max((c - 0.18) * contrast + 0.18, 0.0);
      c *= vec3(1.0 + warm, 1.0, 1.0 - warm);                          // slight warm tint, fits the pastel paper look
      float r = length((uv - 0.5) * vec2(res.x / res.y, 1.0));
      c *= 1.0 - vig * smoothstep(0.35, 0.95, r);
      c = mix(c, c * vec3(1.0, 0.55, 0.55), hurt * 0.35 * smoothstep(0.2, 0.8, r)); // red edges when hurt
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      float n = fract(sin(dot(uv * res + time * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
      gl_FragColor.rgb += (n - 0.5) * grain;
    }`, true);
  const pass = (m, rtOut) => { quad.material = m; renderer.setRenderTarget(rtOut); renderer.render(qs, cam); };
  const blur = (src, A, B) => {
    blurM.uniforms.tDiffuse.value = src.texture; blurM.uniforms.dir.value.set(1 / A.width, 0); pass(blurM, A);
    blurM.uniforms.tDiffuse.value = A.texture; blurM.uniforms.dir.value.set(0, 1 / B.height); pass(blurM, B);
  };
  const size = new THREE.Vector2(), _sun = new THREE.Vector3();
  let P = null;
  P = {
    enabled: true, bloomOn: true, gloss: .3, samples: 4, rt: 0, refl: true, rays: true, mblur: 0, sunDir: null, sunOn: 0, uniforms: compM.uniforms, rtUniforms: rtM.uniforms, litUniforms: litM.uniforms,
    get hq() { return this.rt > 0; }, set hq(v) { this.rt = v ? 3 : 0; },
    get depth() { return this.rt > 0 || this.mblur > 0; },
    setGloss(g) { if (g === this.gloss) return; this.gloss = g; if (rtLevelBuilt) setLevel(rtLevelBuilt); },
    setSamples(n) { this.samples = n; if (main) { main.dispose(); main = null; } if (fxRT) { fxRT.dispose(); fxRT = null; } },
    resize() {
      renderer.getDrawingBufferSize(size); const w = Math.max(1, size.x), h = Math.max(1, size.y), dep = this.depth;
      if (main && mainHq !== dep) { main.dispose(); main = null; }
      if (!main) {
        // ray tracing and motion blur need the depth of the world as a texture
        main = new THREE.WebGLRenderTarget(w, h, { ...HF, samples: this.samples, ...(dep ? { depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType) } : {}) });
        mainHq = dep;
      }
      main.setSize(w, h);
      if (dep) { if (!fxRT) fxRT = new THREE.WebGLRenderTarget(w, h, { ...HF, samples: this.samples }); fxRT.setSize(w, h); if (!litRT) litRT = rtT(); litRT.setSize(w, h); }
      else { if (fxRT) { fxRT.dispose(); fxRT = null; } if (litRT) { litRT.dispose(); litRT = null; } }
      if (this.rt > 0) {
        const L = RT_LEVELS[this.rt], rw = Math.max(1, Math.round(w * L.scale)), rh = Math.max(1, Math.round(h * L.scale));
        if (!rtCur) { rtCur = rtT(); histA = rtT(); histB = rtT(); } [rtCur, histA, histB].forEach(t => t.setSize(rw, rh));
        if (rtLevelBuilt !== this.rt) { setLevel(this.rt); rtLevelBuilt = this.rt; }
        rtM.uniforms.fres.value.set(w, h); rtM.uniforms.rres.value.set(rw, rh); accM.uniforms.rres.value.set(rw, rh); litM.uniforms.rres.value.set(rw, rh); havePrev = false;
      } else if (rtCur) { [rtCur, histA, histB].forEach(t => t.dispose()); rtCur = histA = histB = null; rtLevelBuilt = 0; }
      mbM.uniforms.fres.value.set(w, h);
      const s = (t, k) => t.setSize(Math.max(1, w >> k), Math.max(1, h >> k));
      const c = cheap ? 1 : 0; s(bright, 1 + c); s(a4, 2 + c); s(b4, 2 + c); s(a8, 3 + c); s(b8, 3 + c); s(a16, 4 + c); s(b16, 4 + c);
      compM.uniforms.res.value.set(w, h);
      this._key = this.rt + '|' + this.mblur;
    },
    // draw: renders the world into whatever target is bound; gun (optional): draws the gun on top.
    // converge: extra ray tracing passes for a still frame (pause screens), so it's smooth straight away.
    render(draw, t, gun, camera, converge = 0) {
      if (!this.enabled) { renderer.setRenderTarget(null); renderer.clear(); draw(); gun?.(); return; }
      renderer.getDrawingBufferSize(size);
      const dep = this.depth;
      if (!main || main.width !== size.x || main.height !== size.y || mainHq !== dep || (dep && !fxRT) || this._key !== this.rt + '|' + this.mblur || (this.rt > 0 && !rtCur)) this.resize();
      renderer.setRenderTarget(main); renderer.clear(); draw();
      let scene = main;
      if (dep && camera) {
        _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        const pv = havePrev ? prevVP : _vp;
        let src = main;
        if (this.rt > 0) {
          const H = rtM.uniforms; H.tColor.value = main.texture; H.tDepth.value = main.depthTexture;
          H.proj.value.copy(camera.projectionMatrix); H.projInv.value.copy(camera.projectionMatrixInverse); H.reflOn.value = this.refl ? 1 : 0;
          // where the sun is on screen (rays fade out as it leaves the screen or goes behind you)
          let on = 0;
          if (this.rays && this.sunDir && this.sunOn) {
            _sun.copy(camera.position).addScaledVector(this.sunDir, 500).project(camera);
            const behind = _sun.z > 1, dist = Math.hypot(_sun.x, _sun.y);
            on = behind ? 0 : this.sunOn * Math.max(0, 1 - Math.max(0, dist - 1) / 1.2);
            H.sunUV.value.set(_sun.x * .5 + .5, _sun.y * .5 + .5);
          }
          H.sunOn.value = on;
          const A = accM.uniforms; A.tDepth.value = main.depthTexture; A.projInv.value.copy(camera.projectionMatrixInverse); A.viewInv.value.copy(camera.matrixWorld);
          for (let k = 0; k <= converge; k++) {
            H.frame.value = (rtFrame++ % 64);
            pass(rtM, rtCur);
            A.tCur.value = rtCur.texture; A.tHist.value = histA.texture; A.prevVP.value.copy(k ? _vp : pv); A.reset.value = havePrev || k ? 0 : 1; A.alpha.value = k ? .25 : .1;
            pass(accM, histB); [histA, histB] = [histB, histA];
          }
          const Lu = litM.uniforms; Lu.tColor.value = main.texture; Lu.tDepth.value = main.depthTexture; Lu.tRT.value = histA.texture; Lu.projInv.value.copy(camera.projectionMatrixInverse);
          pass(litM, this.mblur ? litRT : fxRT); src = this.mblur ? litRT : null;
        }
        if (this.mblur) {
          const M = mbM.uniforms; M.tColor.value = src ? src.texture : main.texture; M.tDepth.value = main.depthTexture; M.projInv.value.copy(camera.projectionMatrixInverse);
          M.viewInv.value.copy(camera.matrixWorld); M.prevVP.value.copy(pv); M.amount.value = this.mblur === 2 ? .9 : .45;
          pass(mbM, fxRT);
        }
        prevVP.copy(_vp); havePrev = true;
        scene = fxRT;
        if (gun) { renderer.setRenderTarget(fxRT); gun(); }
      } else { havePrev = false; gun?.(); }
      const u = compM.uniforms; u.tScene.value = scene.texture; u.time.value = t % 100; u.useBloom.value = this.bloomOn ? 1 : 0;
      if (this.bloomOn) {
        brightM.uniforms.tDiffuse.value = scene.texture; pass(brightM, bright);
        blur(bright, a4, b4); blur(b4, a8, b8); blur(b8, a16, b16);
        u.tB1.value = b4.texture; u.tB2.value = b8.texture; u.tB3.value = b16.texture;
      }
      pass(compM, null);
    },
  };
  return P;
}
