import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  Sliders,
} from 'lucide-react';
import './boolean4-glass.css';

/**
 * Chromatic Aberration Screen Shader Pass
 * Recreates Spline's "chromatic_aberration: 37" spectral edge dispersion
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    distortion: { value: 0.0185 }, // Default maps to Spline 37 units
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float distortion;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - vec2(0.5);
      float dist = length(dir);
      vec2 offset = normalize(dir) * dist * distortion;
      
      // Spectral split: Red outward, Blue inward, Green centered
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;
      
      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};

/**
 * Creates a 2D rounded rectangle shape
 */
function createRoundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/**
 * Generates procedural HDR Studio Environment map so glass has rich highlights
 */
function createStudioEnvironment(renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#030708');

  // Studio softbox light panels
  const panelGeom = new THREE.PlaneGeometry(12, 12);

  // Key softbox
  const keyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const keyMesh = new THREE.Mesh(panelGeom, keyMat);
  keyMesh.position.set(8, 12, 10);
  keyMesh.lookAt(0, 0, 0);
  envScene.add(keyMesh);

  // Fill softbox with subtle emerald cyan tint
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const fillMesh = new THREE.Mesh(panelGeom, fillMat);
  fillMesh.position.set(-10, -4, -6);
  fillMesh.lookAt(0, 0, 0);
  envScene.add(fillMesh);

  // Top rim light
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 });
  const rimMesh = new THREE.Mesh(panelGeom, rimMat);
  rimMesh.position.set(0, 16, -10);
  rimMesh.lookAt(0, 0, 0);
  envScene.add(rimMesh);

  const envTexture = pmremGenerator.fromScene(envScene).texture;
  pmremGenerator.dispose();
  return envTexture;
}

export const Boolean4GlassCanvas = ({
  className = '',
  height = '100%',
  standalone = false,
  interactive = true,
  defaultGeometry = 'castle', // 'castle' | 'health'
}) => {
  const mountRef = useRef(null);
  const [modelType, setModelType] = useState(defaultGeometry);
  const [chromaticAberration, setChromaticAberration] = useState(37); // Spline exact value
  const [ior, setIor] = useState(1.32); // Spline exact value
  const [springActive, setSpringActive] = useState(true);
  const [tintPreset, setTintPreset] = useState('glass'); // 'glass' | 'emerald' | 'azure'
  const [showControls, setShowControls] = useState(false);
  const [fps, setFps] = useState(60);

  // References for live animation loop
  const sceneRef = useRef(null);
  const modelGroupRef = useRef(null);
  const materialRef = useRef(null);
  const shaderPassRef = useRef(null);
  const controlsRef = useRef(null);

  // Spline Boolean 4 parameters
  // Base scale: original is ~685 x 602 px; scale to ~4.8 world units
  const SCALE = 0.007;
  const BASE_DEPTH = 75.5 * SCALE;
  const TARGET_DEPTH = 500 * SCALE;
  const MAX_DEPTH_SCALE = TARGET_DEPTH / BASE_DEPTH; // ~6.62x

  // Construct Geometries
  const castleGeometry = useMemo(() => {
    // 8 rounded rectangles with exact Spline centers and sizes
    const rects = [
      { center: [-276.817, 2.739], size: [131.817, 297.407] },
      { center: [-207.612, -73.426], size: [270.227, 145.077] },
      { center: [138.409, 155.070], size: [131.817, 297.407] },
      { center: [-138.409, -149.591], size: [131.817, 297.407] },
      { center: [69.204, -225.756], size: [270.225, 145.077] },
      { center: [-0.0001, 231.235], size: [408.633, 145.077] },
      { center: [276.817, 78.905], size: [131.817, 145.077] },
      { center: [276.817, 2.496], size: [131.817, 297.894] },
    ];

    const cornerRadius = 40.8 * SCALE;
    const bevelSize = 5.7 * SCALE;
    const extrudeSettings = {
      depth: BASE_DEPTH,
      bevelEnabled: true,
      bevelSegments: 10,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
    };

    const geoms = rects.map((r) => {
      const w = r.size[0] * SCALE;
      const h = r.size[1] * SCALE;
      const shape = createRoundedRectShape(w, h, cornerRadius);
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.translate(r.center[0] * SCALE, r.center[1] * SCALE, -BASE_DEPTH / 2);
      return geom;
    });

    const merged = mergeGeometries(geoms, false);
    geoms.forEach((g) => g.dispose());
    merged.computeVertexNormals();
    return merged;
  }, [SCALE, BASE_DEPTH]);

  const healthGeometry = useMemo(() => {
    // Health & Nutrition Vitality Cross with matching Boolean bevel rules
    const cornerRadius = 40.8 * SCALE;
    const bevelSize = 5.7 * SCALE;
    const extrudeSettings = {
      depth: BASE_DEPTH,
      bevelEnabled: true,
      bevelSegments: 10,
      bevelThickness: bevelSize,
      bevelSize: bevelSize,
    };

    const blocks = [
      // Central vertical pillar
      { center: [0, 0], size: [145.0, 480.0] },
      // Central horizontal arm
      { center: [0, 0], size: [480.0, 145.0] },
      // Stepped quadrant accents
      { center: [-170, 170], size: [120, 120] },
      { center: [170, 170], size: [120, 120] },
      { center: [-170, -170], size: [120, 120] },
      { center: [170, -170], size: [120, 120] },
    ];

    const geoms = blocks.map((b) => {
      const w = b.size[0] * SCALE;
      const h = b.size[1] * SCALE;
      const shape = createRoundedRectShape(w, h, cornerRadius);
      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.translate(b.center[0] * SCALE, b.center[1] * SCALE, -BASE_DEPTH / 2);
      return geom;
    });

    const merged = mergeGeometries(geoms, false);
    geoms.forEach((g) => g.dispose());
    merged.computeVertexNormals();
    return merged;
  }, [SCALE, BASE_DEPTH]);

  // Update Material Tint Preset
  useEffect(() => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    if (tintPreset === 'glass') {
      mat.color.set('#ffffff');
      mat.attenuationColor.set('#e2e8f0');
    } else if (tintPreset === 'emerald') {
      mat.color.set('#d1fae5');
      mat.attenuationColor.set('#10b981');
    } else if (tintPreset === 'azure') {
      mat.color.set('#e0f2fe');
      mat.attenuationColor.set('#0284c7');
    }
    mat.needsUpdate = true;
  }, [tintPreset]);

  // Update IOR
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.ior = ior;
      materialRef.current.needsUpdate = true;
    }
  }, [ior]);

  // Update Chromatic Aberration distortion uniform
  useEffect(() => {
    if (shaderPassRef.current) {
      shaderPassRef.current.uniforms.distortion.value = (chromaticAberration / 2000.0);
    }
  }, [chromaticAberration]);

  // Update Geometry Model
  useEffect(() => {
    if (!modelGroupRef.current) return;
    const mesh = modelGroupRef.current.children[0];
    if (mesh) {
      mesh.geometry = modelType === 'castle' ? castleGeometry : healthGeometry;
    }
  }, [modelType, castleGeometry, healthGeometry]);

  // Setup Three.js WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    // 2. WebGL Renderer with High Precision
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Procedural Studio Environment
    const envTexture = createStudioEnvironment(renderer);
    scene.environment = envTexture;

    // 4. Lights (matching Spline: intensity 9.2, direction 280°, ambient 0.75)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    // Directional light from 280 deg azimuth
    const dirLight = new THREE.DirectionalLight(0xffffff, 3.2);
    const rad280 = (280 * Math.PI) / 180;
    dirLight.position.set(Math.cos(rad280) * 8, 5, Math.sin(rad280) * 8);
    scene.add(dirLight);

    // Accent fill light from opposite quadrant
    const fillLight = new THREE.PointLight(0x10b981, 4.0, 25);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 5.0, 25);
    rimLight.position.set(0, 8, -6);
    scene.add(rimLight);

    // 5. Liquid Glass Physical Material with Fresnel Rim Glow
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      roughness: 0.11, // Spline exact
      metalness: 0.0,
      transmission: 1.0, // Spline exact 100% dielectric
      ior: 1.32, // Spline exact
      thickness: 2.4, // Spline exact
      specularIntensity: 1.99, // Spline exact
      specularColor: new THREE.Color(0xffffff),
      dispersion: 0.14, // Native Three.js dispersion
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 1.0,
      attenuationColor: new THREE.Color(0xffffff),
      attenuationDistance: 6.0,
    });

    // Spline Fresnel Rim Injection: { bias: -0.34, scale: 1.61, intensity: 2 }
    glassMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uFresnelBias = { value: -0.34 };
      shader.uniforms.uFresnelScale = { value: 1.61 };
      shader.uniforms.uFresnelIntensity = { value: 2.0 };
      shader.uniforms.uFresnelColor = { value: new THREE.Color(0xffffff) };

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        vec3 vDir = normalize(vViewPosition);
        vec3 nNorm = normalize(vNormal);
        float fDot = clamp(1.0 - abs(dot(vDir, nNorm)), 0.0, 1.0);
        float fresnel = clamp(-0.34 + 1.61 * pow(fDot, 2.5), 0.0, 1.0);
        gl_FragColor.rgb += vec3(1.0) * fresnel * 1.5;
        #include <dithering_fragment>
        `
      );
    };
    materialRef.current = glassMaterial;

    // 6. Mesh & Hierarchy
    const modelGroup = new THREE.Group();
    const mesh = new THREE.Mesh(
      modelType === 'castle' ? castleGeometry : healthGeometry,
      glassMaterial
    );
    modelGroup.add(mesh);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Base Spline Orientation: [-38.3577°, 30.0995°, 2.1886°]
    const baseRotX = (-38.3577 * Math.PI) / 180;
    const baseRotY = (30.0995 * Math.PI) / 180;
    const baseRotZ = (2.1886 * Math.PI) / 180;
    modelGroup.rotation.set(baseRotX, baseRotY, baseRotZ);

    // 7. Post-processing Composer with Chromatic Aberration
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    chromaticPass.uniforms.distortion.value = chromaticAberration / 2000.0;
    composer.addPass(chromaticPass);
    shaderPassRef.current = chromaticPass;

    // 8. Orbit Controls vs Passive Parallax
    let controls = null;
    let handleMouseMove = null;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    if (interactive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.enableZoom = false; // NEVER intercept wheel scroll! Page scroll works naturally!
      controls.minDistance = 6;
      controls.maxDistance = 20;
      controlsRef.current = controls;
    } else {
      // Gentle mouse parallax in backdrop mode without capturing click or scroll events
      handleMouseMove = (e) => {
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetTiltX = normY * 0.12;
        targetTiltY = normX * 0.2;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // 9. Harmonic Spring Physics State
    // Spline Transition: Start -> State (duration 1250ms, spring: mass 1, stiffness 80, damping 10)
    let springProgress = 0; // 0 = Base, 1 = State
    let springVelocity = 0;
    let springTarget = 1; // ping-ponging target
    const STIFFNESS = 80;
    const DAMPING = 10;
    const MASS = 1;

    let frameCount = 0;
    let lastFpsTime = performance.now();
    let prevTime = performance.now();
    let pingPongTimer = 0;
    let reqId;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      // FPS Monitor
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        frameCount = 0;
        lastFpsTime = now;
      }

      // Spring Physics Integration
      if (springActive) {
        pingPongTimer += dt;
        if (pingPongTimer > 2.4) {
          springTarget = springTarget === 1 ? 0 : 1;
          pingPongTimer = 0;
        }

        // F = -k*(x - target) - c*v
        const force = -STIFFNESS * (springProgress - springTarget) - DAMPING * springVelocity;
        const accel = force / MASS;
        springVelocity += accel * dt;
        springProgress += springVelocity * dt;

        // Apply dynamic extrude depth breathing (1.0x to 6.62x)
        const currentDepthScale = 1.0 + (MAX_DEPTH_SCALE - 1.0) * THREE.MathUtils.clamp(springProgress, 0, 1.2);
        mesh.scale.set(1.0, 1.0, currentDepthScale);

        // Apply Spline Rotation Ping-pong (30.1° to 394.1°)
        const targetRotY = baseRotY + (2 * Math.PI) * springProgress;
        modelGroup.rotation.y = targetRotY;
      } else {
        // Subtle ambient idle float when paused
        modelGroup.rotation.y += 0.003;
      }

      if (controls) {
        controls.update();
      } else {
        currentTiltX += (targetTiltX - currentTiltX) * 0.04;
        currentTiltY += (targetTiltY - currentTiltY) * 0.04;
        camera.position.x = currentTiltY * 2;
        camera.position.y = currentTiltX * 2;
        camera.lookAt(0, 0, 0);
      }

      composer.render();
    };

    animate();

    // 10. Responsive Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      if (controls) controls.dispose();
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
      envTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    castleGeometry,
    healthGeometry,
    modelType,
    springActive,
    SCALE,
    BASE_DEPTH,
    MAX_DEPTH_SCALE,
    chromaticAberration,
    interactive,
  ]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div
      className={`boolean4-glass-wrapper ${className}`}
      style={{
        height: height,
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        pointerEvents: interactive ? 'auto' : 'none',
      }}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'grab' : 'default',
        }}
      />

      {/* Atmospheric Vignette & Gradients */}
      <div
        className="glass-vignette-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 50%, transparent 40%, rgba(9, 10, 11, 0.45) 75%, rgba(9, 10, 11, 0.95) 100%)',
        }}
      />

      {/* Top Floating Glass Badge - only in standalone mode */}
      {standalone && (
        <div className="boolean4-header-pill">
          <div className="glass-indicator-dot" />
          <span className="glass-badge-label">
            {modelType === 'castle' ? 'Spline Boolean 4 (Castle Icon)' : 'Health Vitality Prism'}
          </span>
          <span className="glass-fps-tag">{fps} FPS</span>
        </div>
      )}

      {/* Interactive HUD Overlay & Controls Dock - only in standalone & interactive mode */}
      {standalone && interactive && (
        <div className="boolean4-dock-cluster">
          {/* Controls Toggle Button */}
          <button
            type="button"
            className="dock-round-btn"
            onClick={() => setShowControls((prev) => !prev)}
            title="Toggle 3D Glass Inspector"
            aria-label="Toggle 3D Glass Inspector"
          >
            <Sliders size={15} />
          </button>

          {/* Spring Animation Play/Pause */}
          <button
            type="button"
            className={`dock-round-btn ${springActive ? 'active-pulse' : ''}`}
            onClick={() => setSpringActive((prev) => !prev)}
            title={springActive ? 'Pause Spring Physics' : 'Resume Spring Physics'}
            aria-label={springActive ? 'Pause Spring Physics' : 'Resume Spring Physics'}
          >
            {springActive ? <Pause size={15} /> : <Play size={15} />}
          </button>

          {/* Reset Camera View */}
          <button
            type="button"
            className="dock-round-btn"
            onClick={handleResetCamera}
            title="Reset 3D Perspective"
            aria-label="Reset 3D Perspective"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      )}

      {/* Slide-out Glass Inspector Drawer */}
      {standalone && interactive && showControls && (
        <div className="boolean4-inspector-drawer">
          <div className="drawer-header-row">
            <div className="drawer-title-flex">
              <Sparkles size={14} className="emerald-icon" />
              <span>Spline Boolean 4 Shader Lab</span>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              onClick={() => setShowControls(false)}
            >
              ×
            </button>
          </div>

          {/* Model Switcher */}
          <div className="inspector-field-group">
            <label className="inspector-label">Geometry Emblem</label>
            <div className="inspector-btn-pair">
              <button
                type="button"
                className={`inspector-toggle-btn ${modelType === 'castle' ? 'is-selected' : ''}`}
                onClick={() => setModelType('castle')}
              >
                The Castle (Spline)
              </button>
              <button
                type="button"
                className={`inspector-toggle-btn ${modelType === 'health' ? 'is-selected' : ''}`}
                onClick={() => setModelType('health')}
              >
                Vitality Cross
              </button>
            </div>
          </div>

          {/* Chromatic Aberration Slider */}
          <div className="inspector-field-group">
            <div className="inspector-label-row">
              <label className="inspector-label">Chromatic Aberration</label>
              <span className="inspector-val-pill">{chromaticAberration} Spline</span>
            </div>
            <input
              type="range"
              min="0"
              max="65"
              step="1"
              value={chromaticAberration}
              onChange={(e) => setChromaticAberration(Number(e.target.value))}
              className="inspector-slider"
            />
            <span className="inspector-hint">Prismatic rainbow splitting along bevels</span>
          </div>

          {/* IOR Refraction Slider */}
          <div className="inspector-field-group">
            <div className="inspector-label-row">
              <label className="inspector-label">Index of Refraction (IOR)</label>
              <span className="inspector-val-pill">{ior.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.8"
              step="0.01"
              value={ior}
              onChange={(e) => setIor(Number(e.target.value))}
              className="inspector-slider"
            />
            <span className="inspector-hint">1.32 = Water/Liquid Glass • 1.50 = Crown Glass</span>
          </div>

          {/* Material Presets */}
          <div className="inspector-field-group">
            <label className="inspector-label">Liquid Glass Tint</label>
            <div className="inspector-preset-row">
              <button
                type="button"
                className={`preset-pill ${tintPreset === 'glass' ? 'active' : ''}`}
                onClick={() => setTintPreset('glass')}
              >
                Pure Liquid
              </button>
              <button
                type="button"
                className={`preset-pill ${tintPreset === 'emerald' ? 'active' : ''}`}
                onClick={() => setTintPreset('emerald')}
              >
                Emerald Vitality
              </button>
              <button
                type="button"
                className={`preset-pill ${tintPreset === 'azure' ? 'active' : ''}`}
                onClick={() => setTintPreset('azure')}
              >
                Cyan Prism
              </button>
            </div>
          </div>

          {/* Spline Mathematical Specs Telemetry */}
          <div className="telemetry-compact-spec">
            <div className="spec-row">
              <span>Bevel Extrusion</span>
              <span className="spec-val">FlatRounded (5.7px)</span>
            </div>
            <div className="spec-row">
              <span>Spring Dynamics</span>
              <span className="spec-val">k: 80 • c: 10 • m: 1</span>
            </div>
            <div className="spec-row">
              <span>Fresnel Intensity</span>
              <span className="spec-val">Bias -0.34 • Scale 1.61</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Boolean4GlassCanvas;
