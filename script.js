import * as THREE from "https://esm.sh/three@0.136.0";
import { OrbitControls } from "https://esm.sh/three@0.136.0/examples/jsm/controls/OrbitControls.js";

const plates = [
  {
    name: "Our First Kiss",
    message: "The day our lips met, the entire universe held its breath. Since then, every kiss of yours is my favorite galaxy.",
    src: "Tra1.jpg",
    hue: 340,
  },
  {
    name: "Under the Stars",
    message: "That night we looked at the sky together and I understood that no star shines as bright as your eyes when you look at me.",
    src: "Tra1.jpg",
    hue: 280,
  },
  {
    name: "Your Smile",
    message: "Your smile is the light that cuts through any darkness. It is my favorite sunrise, my reason to wake up every day.",
    src: "Tra4.png",
    hue: 350,
  },
  {
    name: "Forever",
    message: "I don't care how many lives I have to live, in each one of them I will choose you. Forever and one day more.",
    src: "Tra4.png",
    hue: 320,
  },
];

const galleryItems = Array.from({ length: 12 }, (_, index) => ({
  ...plates[index % plates.length],
  index,
}));

const canvas = document.querySelector("#bg-canvas");
const startOverlay = document.querySelector("#start-overlay");
const startButton = document.querySelector("#start-button");
const musicControl = document.querySelector("#music-control");
const music = document.querySelector("#background-music");
const musicBtn = document.querySelector("#music-btn");
const playIcon = document.querySelector("#play-icon");
const pauseIcon = document.querySelector("#pause-icon");
const volumeSlider = document.querySelector("#volume-slider");
const fullscreenBtn = document.querySelector("#fullscreen-btn");
const fullscreenEnter = document.querySelector("#fullscreen-enter");
const fullscreenExit = document.querySelector("#fullscreen-exit");

let started = false;
let startMs = 0;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.018);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(40, 25, 50);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.minDistance = 1.5;
controls.maxDistance = 60;

function makeGlowTexture() {
  const cvs = document.createElement("canvas");
  cvs.width = 64;
  cvs.height = 64;
  const ctx = cvs.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.42, "rgba(255,255,255,0.74)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cvs);
}

const glowTexture = makeGlowTexture();

function generateGalaxy() {
  const count = 80000;
  const radiusMax = 8;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const inside = new THREE.Color("#ff4a18");
  const outside = new THREE.Color("#2448c9");

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let radius = Math.random() * radiusMax;
    if (radius < 1.2) radius += 1.2;

    const branchAngle = (i % 4) / 4 * Math.PI * 2;
    const spinAngle = radius;
    const random = Math.pow(Math.random(), 3) * 0.3 * radius;
    const sign = () => Math.random() < 0.5 ? 1 : -1;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + random * sign();
    positions[i3 + 1] = Math.pow(Math.random(), 3) * 0.25 * sign();
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + random * sign();

    const mixed = inside.clone().lerp(outside, radius / radiusMax);
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.017,
    sizeAttenuation: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.visible = false;
  scene.add(points);
  return points;
}

function generateBlackHole() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.88, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffb300,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
    }),
  );
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.56, 96),
    new THREE.MeshBasicMaterial({
      color: 0xff4b8b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.44,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  halo.rotation.y = Math.PI / 3;
  group.add(core, ring, halo);
  group.visible = false;
  scene.add(group);
  return { group, ring, halo };
}

function heartPoint(t) {
  return {
    x: 16 * Math.sin(t) ** 3 * 0.13,
    y: (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.13,
  };
}

function generateHeartParticles() {
  const count = 6000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocity = [];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const p = heartPoint(Math.random() * Math.PI * 2);
    const spread = (Math.random() - 0.5) * 0.42;
    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;
    colors[i3] = 1;
    colors[i3 + 1] = 0.1 + Math.random() * 0.22;
    colors[i3 + 2] = 0.58 + Math.random() * 0.22;
    velocity.push({
      x: p.x + spread,
      y: p.y + 3.2 + spread * 0.4,
      z: (Math.random() - 0.5) * 0.5,
      delay: Math.random() * 0.9,
      duration: 0.7 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      amp: 0.04 + Math.random() * 0.08,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.056,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.visible = false;
  scene.add(points);
  return { points, velocity };
}

function generateStars() {
  const count = 4000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = 30 + Math.random() * 120;
    const theta = Math.PI * 2 * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  })));
}

function generateHyperspace() {
  const group = new THREE.Group();
  camera.add(group);
  const geometry = new THREE.TorusGeometry(10, 2.5, 3, 6);
  const colors = [0xff1493, 0x00ddff, 0xffc400];
  const rings = [];

  for (let i = 0; i < 174; i++) {
    const material = new THREE.PointsMaterial({
      size: 0.38 + Math.random() * 0.38,
      map: glowTexture,
      alphaTest: 0.04,
      transparent: true,
      opacity: 0,
      color: colors[i % colors.length],
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Points(geometry, material);
    ring.position.z = -10 - Math.floor(i / 3) * 5;
    ring.rotation.z = Math.random() * Math.PI * 2;
    ring.scale.setScalar(0.78 + Math.random() * 0.34);
    ring.frustumCulled = false;
    rings.push(ring);
    group.add(ring);
  }
  return { group, rings, speed: 0.18 };
}

function makePlateFallback(item, size = 512) {
  const cvs = document.createElement("canvas");
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size * 0.7);
  gradient.addColorStop(0, `hsl(${item.hue}, 95%, 74%)`);
  gradient.addColorStop(1, `hsl(${item.hue + 70}, 85%, 18%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 44px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LOVE", size / 2, size / 2);
  return cvs;
}

function createPlateTexture(item) {
  const cvs = document.createElement("canvas");
  const size = 1024;
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext("2d");
  ctx.drawImage(makePlateFallback(item, size), 0, 0);
  const texture = new THREE.CanvasTexture(cvs);
  texture.anisotropy = 8;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    const scale = Math.max(size / image.width, size / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    texture.needsUpdate = true;
  };
  image.src = item.src;
  return texture;
}

function generatePlates() {
  const group = new THREE.Group();
  const meshes = [];
  scene.add(group);

  galleryItems.forEach((item, i) => {
    const geometry = new THREE.CircleGeometry(0.55, 96);
    const material = new THREE.MeshBasicMaterial({
      map: createPlateTexture(item),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    mesh.scale.setScalar(0.001);
    mesh.userData.item = item;

    const ring = i % 2;
    const idx = Math.floor(i / 2);
    const perRing = Math.ceil(galleryItems.length / 2);
    meshes.push({
      mesh,
      baseAngle: idx / perRing * Math.PI * 2,
      radius: ring === 0 ? 4.2 : 6.8,
      speed: ring === 0 ? 0.06 : -0.04,
      tilt: ring === 0 ? 0.15 : -0.2,
      yOffset: (ring === 0 ? 0.8 : -0.5) + Math.sin(i) * 0.25,
      phase: i * 0.7,
    });
    group.add(mesh);
  });
  return meshes;
}

function generateText() {
  const phrases = ["KEEP GOING ✦", "YOU CAN DO IT", "STAY STRONG", "BELIEVE IN YOURSELF"];
  const group = new THREE.Group();
  const meshes = [];
  scene.add(group);

  Array.from({ length: 14 }, (_, i) => phrases[i % phrases.length]).forEach((phrase, i) => {
    const cvs = document.createElement("canvas");
    cvs.width = 1024;
    cvs.height = 128;
    const ctx = cvs.getContext("2d");
    ctx.shadowColor = "rgba(255,80,150,1)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(255,240,245,1)";
    ctx.font = "bold 58px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(phrase, 512, 64);

    const texture = new THREE.CanvasTexture(cvs);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 0.56),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 1,
      }),
    );
    mesh.visible = false;
    mesh.scale.setScalar(0.001);
    meshes.push({
      mesh,
      baseAngle: i / 14 * Math.PI * 2 + i * 0.37,
      radius: 4 + (i % 5) * 1.3,
      yLevel: Math.sin(i * 1.7) * 0.15,
      speed: 0.03 + (i % 3) * 0.008,
      phase: i * 0.5,
    });
    group.add(mesh);
  });
  return meshes;
}

const blackHole = generateBlackHole();
const galaxy = generateGalaxy();
const heart = generateHeartParticles();
const hyperspace = generateHyperspace();
generateStars();
const plateMeshes = generatePlates();
const textMeshes = generateText();

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(x) {
  return 1 - (1 - x) ** 3;
}

function easeOutBack(x) {
  const c = 1.70158;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
}

function elapsed() {
  return started ? (performance.now() - startMs) / 1000 : 0;
}

function startExperience() {
  if (started) return;
  started = true;
  startMs = performance.now();
  startOverlay.classList.add("hidden");
  musicControl.classList.add("visible");
  music.volume = Number(volumeSlider.value);
  music.play().then(setPauseIcon).catch(setPlayIcon);
}

startButton.addEventListener("click", startExperience);
startOverlay.addEventListener("click", startExperience);

function tick() {
  const t = elapsed();

  if (t < 9) {
    const p = easeOutCubic(Math.min(1, t / 9));
    camera.position.lerpVectors(new THREE.Vector3(40, 25, 50), new THREE.Vector3(3.5, 2.5, 6), p);
    controls.enabled = false;
  } else {
    controls.enabled = true;
  }

  const hyperStrength = smoothstep(0.1, 1.4, t) * (1 - smoothstep(3.4, 5, t));
  hyperspace.group.visible = hyperStrength > 0.005 || !started;
  hyperspace.group.rotation.z = t * 0.55;
  hyperspace.speed += ((hyperStrength > 0.55 ? 1.65 : 0.2) - hyperspace.speed) * 0.025;
  hyperspace.rings.forEach((ring, i) => {
    ring.position.z += hyperspace.speed;
    ring.rotation.z += 0.012 + (i % 3) * 0.004;
    ring.material.opacity = hyperStrength ** 2 * (0.5 + (i % 3) * 0.18);
    if (ring.position.z > -8) ring.position.z = -150;
  });

  if (t > 0.8) {
    blackHole.group.visible = true;
    blackHole.group.scale.setScalar(easeOutBack(Math.min(1, (t - 0.8) / 2.2)));
    blackHole.ring.rotation.z = t * 1.5;
    blackHole.halo.rotation.z = -t * 0.5;
  }

  if (t > 2.5) {
    galaxy.visible = true;
    const p = Math.min(1, (t - 2.5) / 4.5);
    galaxy.rotation.y = t * (0.05 + (1 - p) * 1.5);
    galaxy.scale.setScalar(easeOutCubic(p));
  }

  if (t > 4.4) {
    heart.points.visible = true;
    const positions = heart.points.geometry.attributes.position.array;
    const ht = t - 4.4;
    heart.velocity.forEach((v, i) => {
      const i3 = i * 3;
      const local = ht - v.delay;
      if (local <= 0) return;
      const p = Math.min(1, local / v.duration);
      const eased = easeOutCubic(p);
      const beat = 1 + Math.sin(t * 2.2) * 0.04;
      const wobble = Math.sin(t * 0.7 + v.phase) * v.amp;
      positions[i3] = (v.x * beat + wobble) * eased;
      positions[i3 + 1] = v.y * eased + Math.sin(eased * Math.PI) * 0.6 * (1 - eased);
      positions[i3 + 2] = v.z + Math.sin(t + v.phase) * 0.15;
    });
    heart.points.geometry.attributes.position.needsUpdate = true;
  }

  plateMeshes.forEach((item, i) => {
    if (t <= 5.8 + i * 0.12) return;
    const progress = Math.min(1, (t - 5.8 - i * 0.12) / 1.8);
    const eased = easeOutCubic(progress);
    const angle = item.baseAngle + t * item.speed;
    const x = Math.cos(angle) * item.radius * eased;
    const z = Math.sin(angle) * item.radius * eased;
    const y = (item.yOffset + Math.sin(t * 0.4 + item.phase) * 0.3 + Math.sin(angle) * item.tilt) * eased;
    item.mesh.visible = true;
    item.mesh.position.set(x, y, z);
    item.mesh.scale.setScalar(eased);
    item.mesh.lookAt(camera.position);
  });

  textMeshes.forEach((item, i) => {
    if (t <= 7 + i * 0.08) return;
    const progress = Math.min(1, (t - 7 - i * 0.08) / 1.8);
    const eased = easeOutCubic(progress);
    const angle = item.baseAngle + t * item.speed;
    item.mesh.visible = true;
    item.mesh.position.set(
      Math.cos(angle) * item.radius * eased,
      (item.yLevel + Math.sin(t * 0.3 + item.phase) * 0.05) * eased,
      Math.sin(angle) * item.radius * eased,
    );
    item.mesh.scale.setScalar(eased);
    item.mesh.material.opacity = (0.9 + Math.sin(t * 0.6 + item.phase) * 0.1) * eased;
    item.mesh.lookAt(camera.position);
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

canvas.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerDown || elapsed() < 9) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 5) return;

  pointer.x = event.clientX / window.innerWidth * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(plateMeshes.map((item) => item.mesh).filter((mesh) => mesh.visible), false);
  if (hits.length) showMessage(hits[0].object.userData.item);
});

canvas.addEventListener("pointermove", (event) => {
  if (elapsed() < 9) return;
  pointer.x = event.clientX / window.innerWidth * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(plateMeshes.map((item) => item.mesh).filter((mesh) => mesh.visible), false);
  canvas.style.cursor = hits.length ? "pointer" : "grab";
});

const messageOverlay = document.querySelector("#message-overlay");
const messageTitle = document.querySelector("#message-title");
const messageText = document.querySelector("#message-text");
const messageImage = document.querySelector("#message-image");
const messageImageBg = document.querySelector("#message-image-bg");
const messageClose = document.querySelector("#message-close");

function showMessage(item) {
  messageTitle.textContent = item.name;
  messageText.textContent = item.message;
  messageImage.src = item.src;
  messageImageBg.src = item.src;
  messageOverlay.classList.add("show");
  messageOverlay.setAttribute("aria-hidden", "false");
}

function hideMessage() {
  messageOverlay.classList.remove("show");
  messageOverlay.setAttribute("aria-hidden", "true");
}

messageClose.addEventListener("click", hideMessage);
messageOverlay.addEventListener("click", (event) => {
  if (event.target === messageOverlay) hideMessage();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideMessage();
});

function setPlayIcon() {
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
}

function setPauseIcon() {
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";
}

musicBtn.addEventListener("click", () => {
  if (music.paused) {
    music.play().then(setPauseIcon).catch(setPlayIcon);
  } else {
    music.pause();
    setPlayIcon();
  }
});

volumeSlider.addEventListener("input", () => {
  music.volume = Number(volumeSlider.value);
});

fullscreenBtn.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => {});
  } else {
    await document.exitFullscreen().catch(() => {});
  }
});

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenEnter.style.display = isFullscreen ? "none" : "block";
  fullscreenExit.style.display = isFullscreen ? "block" : "none";
});
