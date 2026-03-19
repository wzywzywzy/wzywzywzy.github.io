const body = document.body;
const heroLayout = document.querySelector(".hero-layout");
const portraitFrame = document.querySelector(".portrait-frame");
const screens = Array.from(document.querySelectorAll(".screen"));
const jumpButtons = Array.from(document.querySelectorAll("[data-screen-jump]"));
const networkCanvas = document.getElementById("networkCanvas");
const networkCtx = networkCanvas.getContext("2d");
const avatarCanvas = document.getElementById("avatarCanvas");
const avatarCtx = avatarCanvas.getContext("2d");
const profileMapCanvas = document.getElementById("profileMapCanvas");
const profileMapCtx = profileMapCanvas ? profileMapCanvas.getContext("2d") : null;
const image = document.getElementById("sourcePortrait");

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  normX: 0,
  normY: 0,
};

let activeScreen = 0;
let isAnimating = false;
let networkNodes = [];
let mapParticles = [];
let mapRouteParticles = [];

const PROFILE_MAP_WIDTH = 1200;
const PROFILE_MAP_HEIGHT = 300;

const mapOutlines = [
  [[90, 118], [138, 96], [184, 92], [226, 108], [262, 134], [252, 162], [214, 174], [166, 168], [118, 156], [96, 138]],
  [[220, 180], [242, 206], [248, 232], [242, 260], [226, 282]],
  [[480, 78], [514, 58], [556, 62], [582, 84], [574, 106], [532, 110], [496, 100]],
  [[528, 110], [544, 132], [538, 156], [552, 182], [576, 210], [592, 244]],
  [[574, 104], [620, 90], [676, 92], [742, 100], [804, 96], [866, 106], [926, 126], [968, 154], [962, 178], [924, 192], [884, 178], [842, 184], [808, 204], [766, 214], [720, 202], [690, 180], [664, 156], [626, 138], [598, 122]],
  [[752, 218], [772, 242], [782, 266], [772, 288], [748, 296], [728, 280], [722, 252]],
  [[986, 214], [1018, 204], [1060, 210], [1102, 228], [1120, 250], [1112, 274], [1074, 280], [1028, 270], [998, 248]],
];

const highlightedCountries = [
  {
    name: "China",
    color: "rgba(99, 212, 255, 0.94)",
    glow: "rgba(99, 212, 255, 0.42)",
    polygon: [[632, 126], [684, 118], [742, 124], [790, 136], [832, 150], [858, 164], [850, 182], [808, 188], [770, 200], [726, 194], [696, 176], [672, 154], [646, 142]],
  },
  {
    name: "Sweden",
    color: "rgba(173, 241, 255, 0.95)",
    glow: "rgba(173, 241, 255, 0.46)",
    polygon: [[606, 86], [614, 78], [620, 90], [616, 104], [608, 114], [600, 108], [600, 94]],
  },
  {
    name: "Netherlands",
    color: "rgba(120, 223, 255, 0.94)",
    glow: "rgba(120, 223, 255, 0.42)",
    polygon: [[590, 104], [598, 100], [602, 110], [594, 116], [586, 112]],
  },
  {
    name: "Germany",
    color: "rgba(126, 228, 255, 0.94)",
    glow: "rgba(126, 228, 255, 0.42)",
    polygon: [[602, 104], [612, 102], [618, 114], [614, 128], [602, 134], [594, 124], [596, 110]],
  },
];

const mapRoutes = [
  {
    from: [734, 154],
    to: [594, 108],
    colorStart: "rgba(96, 220, 255, 0.62)",
    colorEnd: "rgba(179, 246, 255, 0.12)",
    arcLift: 0.13,
  },
  {
    from: [734, 154],
    to: [610, 94],
    colorStart: "rgba(94, 216, 255, 0.54)",
    colorEnd: "rgba(170, 240, 255, 0.08)",
    arcLift: 0.12,
  },
  {
    from: [734, 154],
    to: [1038, 232],
    colorStart: "rgba(95, 214, 255, 0.52)",
    colorEnd: "rgba(158, 234, 255, 0.1)",
    arcLift: 0.11,
  },
];

function setPointer(event) {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.normX = event.clientX / window.innerWidth - 0.5;
  pointer.normY = event.clientY / window.innerHeight - 0.5;
  body.style.setProperty("--mouse-x", `${event.clientX}px`);
  body.style.setProperty("--mouse-y", `${event.clientY}px`);

  if (heroLayout) {
    heroLayout.style.transform = `translate3d(${pointer.normX * 10}px, ${pointer.normY * 10}px, 0)`;
  }

  if (portraitFrame) {
    portraitFrame.style.transform = `translate3d(${pointer.normX * 12}px, ${pointer.normY * 8}px, 0)`;
  }
}

document.addEventListener("pointermove", setPointer);

function updateScreenStyles() {
  screens.forEach((screen, idx) => {
    const distance = idx - activeScreen;
    const translateY = distance * 104;
    const scale = idx === activeScreen ? 1 : 0.965;
    const opacity = idx === activeScreen ? 1 : 0.16;

    screen.style.transform = `translate3d(0, ${translateY}%, 0) scale(${scale})`;
    screen.style.opacity = String(opacity);
    screen.style.filter = idx === activeScreen ? "blur(0px)" : "blur(8px)";
    screen.style.pointerEvents = idx === activeScreen ? "auto" : "none";
  });

}

function goToScreen(index) {
  if (window.innerWidth <= 960 || isAnimating) {
    return;
  }

  const next = Math.max(0, Math.min(index, screens.length - 1));
  if (next === activeScreen) {
    return;
  }

  isAnimating = true;
  activeScreen = next;
  updateScreenStyles();

  window.setTimeout(() => {
    isAnimating = false;
  }, 860);
}

window.addEventListener(
  "wheel",
  (event) => {
    if (window.innerWidth <= 960) {
      return;
    }

    event.preventDefault();
    if (Math.abs(event.deltaY) < 14) {
      return;
    }

    goToScreen(activeScreen + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false }
);

window.addEventListener("keydown", (event) => {
  if (window.innerWidth <= 960) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "PageDown") {
    goToScreen(activeScreen + 1);
  }

  if (event.key === "ArrowUp" || event.key === "PageUp") {
    goToScreen(activeScreen - 1);
  }
});

jumpButtons.forEach((button) => {
  button.addEventListener("click", () => {
    goToScreen(Number(button.dataset.screenJump));
  });
});

function resizeNetwork() {
  networkCanvas.width = window.innerWidth * window.devicePixelRatio;
  networkCanvas.height = window.innerHeight * window.devicePixelRatio;
  networkCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  const nodeCount = Math.max(42, Math.floor(window.innerWidth / 28));
  networkNodes = Array.from({ length: nodeCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    size: 1.2 + Math.random() * 1.8,
  }));
}

function resizeProfileMap() {
  if (!profileMapCanvas || !profileMapCtx) {
    return;
  }

  profileMapCanvas.width = PROFILE_MAP_WIDTH * window.devicePixelRatio;
  profileMapCanvas.height = PROFILE_MAP_HEIGHT * window.devicePixelRatio;
  profileMapCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  mapParticles = highlightedCountries.flatMap((country) =>
    createParticlesForPolygon(country.polygon, 70, {
      color: country.color,
      glow: country.glow,
    })
  );

  mapRouteParticles = mapRoutes.flatMap((route) =>
    Array.from({ length: 8 }, () => ({
      route,
      t: Math.random(),
      speed: 0.0018 + Math.random() * 0.0024,
      size: 1.2 + Math.random() * 1.6,
    }))
  );
}

function drawNetwork() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  networkCtx.clearRect(0, 0, width, height);

  for (const node of networkNodes) {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;
  }

  for (let i = 0; i < networkNodes.length; i += 1) {
    const a = networkNodes[i];
    for (let j = i + 1; j < networkNodes.length; j += 1) {
      const b = networkNodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      const pointerDistance = Math.hypot(a.x - pointer.x, a.y - pointer.y);

      if (distance < 150) {
        const alpha = 1 - distance / 150;
        const highlight = Math.max(0, 1 - pointerDistance / 220);

        networkCtx.strokeStyle = `rgba(174, 227, 255, ${0.05 + alpha * 0.12 + highlight * 0.12})`;
        networkCtx.lineWidth = 1;
        networkCtx.beginPath();
        networkCtx.moveTo(a.x, a.y);
        networkCtx.lineTo(b.x, b.y);
        networkCtx.stroke();
      }
    }
  }

  for (const node of networkNodes) {
    const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
    const glow = Math.max(0, 1 - pointerDistance / 180);

    networkCtx.fillStyle = glow > 0.2 ? "rgba(216, 186, 119, 0.95)" : "rgba(174, 227, 255, 0.72)";
    networkCtx.beginPath();
    networkCtx.arc(node.x, node.y, node.size + glow * 1.8, 0, Math.PI * 2);
    networkCtx.fill();
  }

  requestAnimationFrame(drawNetwork);
}

function drawPath(points, options = {}) {
  const { stroke = "rgba(255,255,255,0.1)", width = 1.2, fill = null } = options;
  profileMapCtx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) {
      profileMapCtx.moveTo(x, y);
    } else {
      profileMapCtx.lineTo(x, y);
    }
  });
  if (fill) {
    profileMapCtx.fillStyle = fill;
    profileMapCtx.fill();
  }
  profileMapCtx.strokeStyle = stroke;
  profileMapCtx.lineWidth = width;
  profileMapCtx.stroke();
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function createParticlesForPolygon(polygon, count, style) {
  const xs = polygon.map((point) => point[0]);
  const ys = polygon.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const particles = [];
  let attempts = 0;
  const maxAttempts = count * 40;

  while (particles.length < count && attempts < maxAttempts) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    attempts += 1;

    if (!pointInPolygon(x, y, polygon)) {
      continue;
    }

    particles.push({
      x,
      y,
      color: style.color,
      glow: style.glow,
      alpha: 0.16 + Math.random() * 0.38,
      size: 0.45 + Math.random() * 1.2,
      drift: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.7,
    });
  }

  return particles;
}

function arcControlPoint(fromX, fromY, toX, toY, lift = 0.12) {
  return {
    x: (fromX + toX) / 2,
    y: Math.min(fromY, toY) - Math.abs(toX - fromX) * lift,
  };
}

function drawNeonArc(route) {
  const [fromX, fromY] = route.from;
  const [toX, toY] = route.to;
  const control = arcControlPoint(fromX, fromY, toX, toY, route.arcLift);
  const gradient = profileMapCtx.createLinearGradient(fromX, fromY, toX, toY);
  gradient.addColorStop(0, route.colorStart);
  gradient.addColorStop(1, route.colorEnd);

  profileMapCtx.beginPath();
  profileMapCtx.moveTo(fromX, fromY);
  profileMapCtx.quadraticCurveTo(control.x, control.y, toX, toY);
  profileMapCtx.strokeStyle = gradient;
  profileMapCtx.lineWidth = 1.15;
  profileMapCtx.setLineDash([4, 7]);
  profileMapCtx.stroke();
  profileMapCtx.setLineDash([]);
}

function routePoint(route, t) {
  const [fromX, fromY] = route.from;
  const [toX, toY] = route.to;
  const control = arcControlPoint(fromX, fromY, toX, toY, route.arcLift);
  const oneMinusT = 1 - t;
  const x = oneMinusT * oneMinusT * fromX + 2 * oneMinusT * t * control.x + t * t * toX;
  const y = oneMinusT * oneMinusT * fromY + 2 * oneMinusT * t * control.y + t * t * toY;
  return [x, y];
}

function glowDot(x, y, color, radius = 4.5, blur = 15) {
  profileMapCtx.beginPath();
  profileMapCtx.fillStyle = color;
  profileMapCtx.shadowColor = color;
  profileMapCtx.shadowBlur = blur;
  profileMapCtx.arc(x, y, radius, 0, Math.PI * 2);
  profileMapCtx.fill();
  profileMapCtx.shadowBlur = 0;
}

function drawProfileMap() {
  if (!profileMapCtx) {
    return;
  }

  const width = PROFILE_MAP_WIDTH;
  const height = PROFILE_MAP_HEIGHT;
  const time = performance.now() * 0.001;

  profileMapCtx.clearRect(0, 0, width, height);
  const backgroundGradient = profileMapCtx.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, "rgba(6, 9, 14, 0.98)");
  backgroundGradient.addColorStop(1, "rgba(4, 8, 12, 0.98)");
  profileMapCtx.fillStyle = backgroundGradient;
  profileMapCtx.fillRect(0, 0, width, height);

  profileMapCtx.fillStyle = "rgba(174, 227, 255, 0.032)";
  profileMapCtx.beginPath();
  profileMapCtx.arc(370 + pointer.normX * 12, 110 + pointer.normY * 8, 118, 0, Math.PI * 2);
  profileMapCtx.fill();

  profileMapCtx.fillStyle = "rgba(99, 212, 255, 0.028)";
  profileMapCtx.beginPath();
  profileMapCtx.arc(822 - pointer.normX * 10, 164 - pointer.normY * 7, 94, 0, Math.PI * 2);
  profileMapCtx.fill();

  for (let row = 0; row < 7; row += 1) {
    const y = 36 + row * 38;
    profileMapCtx.strokeStyle = "rgba(174, 227, 255, 0.055)";
    profileMapCtx.lineWidth = 0.4;
    profileMapCtx.beginPath();
    profileMapCtx.moveTo(22, y);
    profileMapCtx.lineTo(width - 22, y);
    profileMapCtx.stroke();
  }

  mapOutlines.forEach((outline) => {
    drawPath(outline, {
      stroke: "rgba(124, 152, 168, 0.28)",
      width: 0.9,
    });
  });

  highlightedCountries.forEach((country) => {
    drawPath(country.polygon, {
      stroke: country.color,
      width: 1.28,
      fill: "rgba(96, 200, 240, 0.03)",
    });

    profileMapCtx.save();
    profileMapCtx.strokeStyle = country.glow;
    profileMapCtx.lineWidth = 2.8;
    profileMapCtx.shadowBlur = 20;
    profileMapCtx.shadowColor = country.glow;
    profileMapCtx.beginPath();
    country.polygon.forEach(([x, y], index) => {
      if (index === 0) {
        profileMapCtx.moveTo(x, y);
      } else {
        profileMapCtx.lineTo(x, y);
      }
    });
    profileMapCtx.closePath();
    profileMapCtx.stroke();
    profileMapCtx.restore();
  });

  for (const particle of mapParticles) {
    const wave = Math.sin(time * particle.speed + particle.drift) * 0.2 + 0.8;
    profileMapCtx.beginPath();
    profileMapCtx.fillStyle = particle.color.replace(/[\d.]+\)$/u, `${(particle.alpha * wave).toFixed(3)})`);
    profileMapCtx.shadowBlur = 10;
    profileMapCtx.shadowColor = particle.glow;
    profileMapCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    profileMapCtx.fill();
    profileMapCtx.shadowBlur = 0;
  }

  mapRoutes.forEach((route) => {
    drawNeonArc(route);
  });

  for (const particle of mapRouteParticles) {
    particle.t = (particle.t + particle.speed) % 1;
    const [x, y] = routePoint(particle.route, particle.t);
    glowDot(x, y, "rgba(190, 246, 255, 0.88)", particle.size, 12);
  }

  glowDot(734, 154, "rgba(99, 212, 255, 0.96)", 4.4, 18);
  glowDot(594, 108, "rgba(179, 246, 255, 0.94)", 4, 15);
  glowDot(610, 94, "rgba(179, 246, 255, 0.94)", 4, 15);
  glowDot(1038, 232, "rgba(166, 241, 255, 0.94)", 4.3, 16);

  requestAnimationFrame(drawProfileMap);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function drawPortrait() {
  if (!image.complete) {
    requestAnimationFrame(drawPortrait);
    return;
  }

  const width = avatarCanvas.width;
  const height = avatarCanvas.height;
  const shadow = hexToRgb("#050607");
  const cool = hexToRgb("#b8e7ff");
  const warm = hexToRgb("#d8ba77");
  const time = performance.now() * 0.001;

  avatarCtx.clearRect(0, 0, width, height);
  avatarCtx.fillStyle = "#060708";
  avatarCtx.fillRect(0, 0, width, height);

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    offsetX = (width - drawWidth) / 2;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    offsetY = (height - drawHeight) / 2;
  }

  avatarCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  const frame = avatarCtx.getImageData(0, 0, width, height);
  const data = frame.data;
  avatarCtx.clearRect(0, 0, width, height);

  for (let y = 0; y < height; y += 6) {
    for (let x = 0; x < width; x += 6) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = data[index + 3] / 255;

      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const pulse = Math.sin(x * 0.018 + y * 0.012 + time * 1.8) * 0.04;
      const energy = Math.max(0, Math.min(1, luminance * 0.92 + pulse));
      const tint = energy > 0.62 ? warm : cool;
      const mixedR = shadow.r + (tint.r - shadow.r) * energy;
      const mixedG = shadow.g + (tint.g - shadow.g) * energy;
      const mixedB = shadow.b + (tint.b - shadow.b) * energy;
      const jitterX = pointer.normX * 7 * (0.2 + energy);
      const jitterY = pointer.normY * 7 * (0.2 + energy);

      if (energy > 0.15) {
        avatarCtx.fillStyle = `rgba(${mixedR.toFixed(0)}, ${mixedG.toFixed(0)}, ${mixedB.toFixed(0)}, ${Math.max(alpha, 0.22).toFixed(2)})`;
        avatarCtx.fillRect(x + jitterX, y + jitterY, 1.4 + energy * 2.2, 1.4 + energy * 2.2);
      }
    }
  }

  avatarCtx.strokeStyle = "rgba(174, 227, 255, 0.12)";
  avatarCtx.lineWidth = 1;
  for (let line = 0; line < 12; line += 1) {
    const y = ((line / 12) * height + time * 18) % height;
    avatarCtx.beginPath();
    avatarCtx.moveTo(0, y);
    avatarCtx.lineTo(width, y);
    avatarCtx.stroke();
  }

  avatarCtx.strokeStyle = "rgba(216, 186, 119, 0.18)";
  avatarCtx.strokeRect(18, 18, width - 36, height - 36);

  requestAnimationFrame(drawPortrait);
}

window.addEventListener("resize", () => {
  resizeNetwork();
  resizeProfileMap();
  if (window.innerWidth <= 960) {
    screens.forEach((screen) => {
      screen.style.transform = "none";
      screen.style.opacity = "1";
      screen.style.filter = "none";
      screen.style.pointerEvents = "auto";
    });
  } else {
    updateScreenStyles();
  }
});

resizeNetwork();
resizeProfileMap();
drawNetwork();
if (profileMapCtx) {
  drawProfileMap();
}

if (image.complete) {
  drawPortrait();
} else {
  image.addEventListener("load", drawPortrait);
}

updateScreenStyles();
