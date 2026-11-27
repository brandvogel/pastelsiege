// Post-processing: the scene renders into an HDR buffer, then bright parts glow (bloom),
// colours get a gentle grade, and the frame is tone-mapped to the screen.
// cheap: the glow is worked out at half the usual size (Retina Macs), it is a soft blur anyway so it looks the same
// Super Ultra (hq) adds a heavy "ray-marched" lighting pass between the world and the gun: it walks rays through the
// depth buffer for contact shadows in corners (ambient occlusion), light bouncing colour off nearby walls, reflections
// on every surface (stronger at grazing angles), and sun rays streaming through gaps. It is screen-space, so it can only
// use what's on screen, but it costs a lot and looks it.
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
  // Super Ultra lighting: everything is worked out from the colour and depth of the world (before the gun is drawn)
  const hqM = mat({
    tColor: { value: null }, tDepth: { value: null }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() },
    res: { value: new THREE.Vector2(1, 1) }, sunUV: { value: new THREE.Vector2(.5, .8) }, sunOn: { value: 0 }, time: { value: 0 },
    aoStr: { value: .85 }, giStr: { value: .55 }, ssrStr: { value: .55 }, raysStr: { value: .55 },
  }, `
    uniform sampler2D tColor, tDepth; uniform mat4 projInv, proj; uniform vec2 res, sunUV; uniform float sunOn, time, aoStr, giStr, ssrStr, raysStr; varying vec2 vUv;
    vec3 viewPos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 p = projInv * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
    vec2 toUV(vec3 p){ vec4 c = proj * vec4(p, 1.0); return c.xy / c.w * 0.5 + 0.5; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    bool off(vec2 uv){ return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0; }
    void main(){
      vec3 col = texture2D(tColor, vUv).rgb, outc = col;
      float d0 = texture2D(tDepth, vUv).x;
      if (d0 < 0.99999) {
        vec3 P = viewPos(vUv); vec2 px = 1.0 / res;
        // surface direction from the neighbouring depths (the closer side, so edges stay clean)
        vec3 Px = viewPos(vUv + vec2(px.x, 0.0)), Pmx = viewPos(vUv - vec2(px.x, 0.0)), Py = viewPos(vUv + vec2(0.0, px.y)), Pmy = viewPos(vUv - vec2(0.0, px.y));
        vec3 dx = abs(Px.z - P.z) < abs(Pmx.z - P.z) ? Px - P : P - Pmx, dy = abs(Py.z - P.z) < abs(Pmy.z - P.z) ? Py - P : P - Pmy;
        vec3 N = normalize(cross(dx, dy)); if (dot(N, P) > 0.0) N = -N;
        // ambient occlusion + one bounce of coloured light: 24 rays into the hemisphere above the surface
        float rnd = hash(vUv * res + time) * 6.2831853;
        vec3 Tg = normalize(abs(N.y) < 0.99 ? cross(N, vec3(0.0, 1.0, 0.0)) : cross(N, vec3(1.0, 0.0, 0.0))), Bt = cross(N, Tg);
        float occ = 0.0; vec3 bounce = vec3(0.0); const float R = 1.1;
        for (int i = 0; i < 24; i++) {
          float fi = float(i), a = rnd + fi * 2.39996, r = sqrt((fi + 0.5) / 24.0), h = fract(fi * 0.618034 + rnd * 0.159);
          vec3 dir = normalize(Tg * cos(a) * r + Bt * sin(a) * r + N * (0.2 + h));
          vec3 S = P + dir * R * (0.12 + 0.88 * h * h);
          vec2 suv = toUV(S); if (off(suv)) continue;
          vec3 Q = viewPos(suv);
          float o = (Q.z >= S.z + 0.025 ? 1.0 : 0.0) * smoothstep(0.0, 1.0, R / max(abs(P.z - Q.z), 1e-3));
          occ += o; bounce += texture2D(tColor, suv).rgb * o * max(dot(N, dir), 0.0);
        }
        float ao = 1.0 - occ / 24.0;
        outc *= mix(1.0, ao * ao, aoStr);
        outc += bounce / 24.0 * giStr;
        // reflections: march the mirrored view ray through the depth buffer, then refine the hit
        vec3 V = normalize(P), Rf = reflect(V, N);
        float fres = pow(1.0 - max(dot(-V, N), 0.0), 5.0), refl = (0.04 + 0.85 * fres) * ssrStr;
        if (refl > 0.01) {
          float st = 0.25 + 0.015 * -P.z; vec3 S = P + N * 0.02 + Rf * st * hash(vUv * res + time * 3.1);
          vec3 hitc = vec3(0.0); float hit = 0.0;
          for (int i = 0; i < 48; i++) {
            S += Rf * st; st *= 1.05;
            vec2 suv = toUV(S); if (off(suv) || S.z > -0.05) break;
            if (texture2D(tDepth, suv).x >= 0.99999) continue;
            float diff = viewPos(suv).z - S.z;
            if (diff > 0.0 && diff < st * 2.5 + 0.15) {
              vec3 a = S - Rf * st, b = S;
              for (int j = 0; j < 6; j++) { vec3 m = (a + b) * 0.5; if (viewPos(toUV(m)).z > m.z) b = m; else a = m; }
              vec2 huv = toUV(b), e = smoothstep(0.0, 0.08, huv) * smoothstep(1.0, 0.92, huv);
              hitc = texture2D(tColor, huv).rgb; hit = e.x * e.y * (1.0 - float(i) / 48.0); break;
            }
          }
          outc = mix(outc, hitc, refl * hit);
        }
      }
      // sun rays: blur toward the sun, but only light that comes from open sky gets through
      if (sunOn > 0.001) {
        vec2 dl = (vUv - sunUV) / 64.0, uv = vUv - dl * hash(vUv * res + time * 7.0);
        float light = 0.0, decay = 1.0;
        for (int i = 0; i < 64; i++) { uv -= dl; light += (texture2D(tDepth, clamp(uv, 0.0, 1.0)).x >= 0.99999 ? 1.0 : 0.0) * decay; decay *= 0.968; }
        outc += vec3(1.0, 0.92, 0.8) * light / 64.0 * raysStr * sunOn;
      }
      gl_FragColor = vec4(outc, 1.0);
    }`);
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
  const P = {
    enabled: true, bloomOn: true, samples: 4, hq: false, sunDir: null, sunOn: 0, uniforms: compM.uniforms, hqUniforms: hqM.uniforms,
    setSamples(n) { this.samples = n; if (main) { main.dispose(); main = null; } if (fxRT) { fxRT.dispose(); fxRT = null; } },
    resize() {
      renderer.getDrawingBufferSize(size); const w = Math.max(1, size.x), h = Math.max(1, size.y);
      if (main && mainHq !== this.hq) { main.dispose(); main = null; }
      if (!main) {
        // Super Ultra needs the depth of the world as a texture
        main = new THREE.WebGLRenderTarget(w, h, { ...HF, samples: this.samples, ...(this.hq ? { depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType) } : {}) });
        mainHq = this.hq;
      }
      main.setSize(w, h);
      if (this.hq) { if (!fxRT) fxRT = new THREE.WebGLRenderTarget(w, h, { ...HF, samples: this.samples }); fxRT.setSize(w, h); }
      else if (fxRT) { fxRT.dispose(); fxRT = null; }
      const s = (t, k) => t.setSize(Math.max(1, w >> k), Math.max(1, h >> k));
      const c = cheap ? 1 : 0; s(bright, 1 + c); s(a4, 2 + c); s(b4, 2 + c); s(a8, 3 + c); s(b8, 3 + c); s(a16, 4 + c); s(b16, 4 + c);
      compM.uniforms.res.value.set(w, h); hqM.uniforms.res.value.set(w, h);
    },
    // draw: renders the world into whatever target is bound; gun (optional): draws the gun on top
    render(draw, t, gun, camera) {
      if (!this.enabled) { renderer.setRenderTarget(null); renderer.clear(); draw(); gun?.(); return; }
      renderer.getDrawingBufferSize(size);
      if (!main || main.width !== size.x || main.height !== size.y || mainHq !== this.hq || (this.hq && !fxRT)) this.resize();
      renderer.setRenderTarget(main); renderer.clear(); draw();
      let scene = main;
      if (this.hq && camera) {
        const H = hqM.uniforms; H.tColor.value = main.texture; H.tDepth.value = main.depthTexture; H.time.value = t % 100;
        H.proj.value.copy(camera.projectionMatrix); H.projInv.value.copy(camera.projectionMatrixInverse);
        // where the sun is on screen (rays fade out as it leaves the screen or goes behind you)
        let on = 0;
        if (this.sunDir && this.sunOn) {
          _sun.copy(camera.position).addScaledVector(this.sunDir, 500).project(camera);
          const behind = _sun.z > 1, dist = Math.hypot(_sun.x, _sun.y);
          on = behind ? 0 : this.sunOn * Math.max(0, 1 - Math.max(0, dist - 1) / 1.2);
          H.sunUV.value.set(_sun.x * .5 + .5, _sun.y * .5 + .5);
        }
        H.sunOn.value = on;
        pass(hqM, fxRT); scene = fxRT;
        if (gun) { renderer.setRenderTarget(fxRT); gun(); }
      } else gun?.();
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
