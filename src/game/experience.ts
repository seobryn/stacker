import {
  INIT_X_SPEED,
  INIT_Y_SPEED,
  MODES,
  BG_SOUND,
  HIT_SOUND,
  type Box,
  type Debris,
  INIT_BOX_WIDTH,
  BOX_HEIGHT,
  INIT_BOX_Y,
  BOX_OFFSET,
} from "../constants";
import { randomBetween, randomColor } from "./utils";

interface GameState {
  boxes: Box[];
  debris: Debris | null;
  current: number;
  mode: MODES;
  xSpeed: number;
  ySpeed: number;
  scrollCount: number;
  cameraY: number;
  combo: number;
  maxHeight: number;
  slowMoFrames: number;
  comboThreshold: number;
  speedBonus: number;
  sizeBonus: number;
  particles: Particle[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

interface UI {
  $controls: HTMLDivElement;
  $score: HTMLSpanElement;
  $highScore: HTMLSpanElement;
  $canvas: HTMLCanvasElement;
  $ctx: CanvasRenderingContext2D;
  $combo: HTMLDivElement;
  $progress: HTMLDivElement;
}

let ui: UI | null = null;

let eventsInitialized = false;
let controlsShowed = true;
let isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

let INIT_BOX_Y_POS = INIT_BOX_Y;

let state: GameState = {
  boxes: [],
  debris: null,
  current: 1,
  mode: MODES.BOUNCE,
  xSpeed: INIT_X_SPEED,
  ySpeed: INIT_Y_SPEED,
  scrollCount: 0,
  cameraY: 0,
  combo: 0,
  maxHeight: 0,
  slowMoFrames: 0,
  comboThreshold: 3,
  speedBonus: 0,
  sizeBonus: 0,
  particles: [],
};

function handleKeyDown(e: KeyboardEvent) {
  if (!ui) return;

  if (e.key === "ArrowDown" && state.mode === MODES.BOUNCE) {
    if (controlsShowed) {
      ui.$controls.classList.add("hidden");
      controlsShowed = false;
    }
    if (BG_SOUND.paused) {
      BG_SOUND.play();
    }
    state.mode = MODES.FALL;
  } else if (e.key === "r" && state.mode === MODES.GAME_OVER) {
    _restart();
  } else if (e.key === "Enter" && state.mode === MODES.PAUSE) {
    state.mode = MODES.BOUNCE;
  } else if (
    e.key === "Escape" &&
    state.mode === MODES.BOUNCE &&
    !controlsShowed
  ) {
    state.mode = MODES.PAUSE;
  }
}

function handlePointerDown() {
  if (!ui) return;

  if (state.mode === MODES.BOUNCE) {
    if (controlsShowed) {
      ui.$controls.classList.add("hidden");
      controlsShowed = false;
    }
    if (BG_SOUND.paused) {
      BG_SOUND.play();
    }
    state.mode = MODES.FALL;
  } else if (state.mode === MODES.GAME_OVER) {
    _restart();
  } else if (state.mode === MODES.PAUSE) {
    state.mode = MODES.BOUNCE;
  }
}

function initState() {
  if (!ui) return;

  INIT_BOX_Y_POS = ui.$canvas.height - BOX_HEIGHT - BOX_OFFSET / 2;

  state = {
    boxes: [
      {
        x: ui.$canvas.width / 2 - INIT_BOX_WIDTH / 2,
        y: 50,
        width: INIT_BOX_WIDTH,
        color: "white",
      },
    ],
    debris: null,
    current: 1,
    mode: MODES.BOUNCE,
    xSpeed: INIT_X_SPEED,
    ySpeed: INIT_Y_SPEED,
    scrollCount: 0,
    cameraY: 0,
    combo: 0,
    maxHeight: 0,
    slowMoFrames: 0,
    comboThreshold: 3,
    speedBonus: 0,
    sizeBonus: 0,
    particles: [],
  };

  createNewBox();
}

function setupPauseButton() {
  if (!ui) return;
  const pauseBtn = document.querySelector("#pause-btn") as HTMLButtonElement;
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      state.mode = MODES.PAUSE;
    });
  }
}

function resetUI() {
  if (!ui) return;

  const { $score, $highScore, $controls, $canvas, $combo, $progress } = ui;

  const savedScore = +(localStorage.getItem("high-score") || "0");
  $score.textContent = "0";
  $highScore.textContent = savedScore > 0 ? String(savedScore) : "0";
  $combo.style.width = "0%";
  $combo.classList.remove("maxed");
  $progress.style.height = "0%";

  if (!eventsInitialized) {
    if (isMobile) {
      controlsShowed = false;
      $controls.classList.add("hidden");
      $canvas.addEventListener("pointerdown", handlePointerDown);
      setupPauseButton();
    } else {
      document.addEventListener("keydown", handleKeyDown);
    }
    eventsInitialized = true;
  }
}

function setupAudio() {
  BG_SOUND.loop = true;
  BG_SOUND.volume = 0.5;
  BG_SOUND.playbackRate = 1;
  BG_SOUND.currentTime = 0;
}

function _restart() {
  resetUI();
  setupAudio();
  initState();
  draw();
}

export function restart(
  controls: HTMLDivElement,
  score: HTMLSpanElement,
  highScore: HTMLSpanElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  combo: HTMLDivElement,
  progress: HTMLDivElement,
) {
  if (isMobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    canvas.width = 460;
    canvas.height = 800;
  }

  ui = {
    $controls: controls,
    $score: score,
    $highScore: highScore,
    $canvas: canvas,
    $ctx: ctx,
    $combo: combo,
    $progress: progress,
  };

  _restart();
}

function drawGameOver() {
  if (!ui) return;

  const { $ctx, $canvas, $highScore, $score } = ui;
  BG_SOUND.pause();

  const gradient = $ctx.createLinearGradient(0, 0, 0, $canvas.height);
  gradient.addColorStop(0, "#1a0a2e");
  gradient.addColorStop(1, "#0a0a1a");
  $ctx.fillStyle = gradient;
  $ctx.fillRect(0, 0, $canvas.width, $canvas.height);

  $ctx.shadowColor = "#ff6b9d";
  $ctx.shadowBlur = 30;
  $ctx.fillStyle = "#ff6b9d";
  $ctx.font = "20px 'Press Start 2P'";
  $ctx.textAlign = "center";
  $ctx.fillText("GAME OVER", $canvas.width / 2, $canvas.height / 2 - 30);

  $ctx.shadowBlur = 0;
  $ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  $ctx.font = "12px 'Press Start 2P'";
  $ctx.fillText(
    `${isMobile ? "TAP" : "PRESS R"} TO RESTART`,
    $canvas.width / 2,
    $canvas.height / 2 + 40,
  );

  $ctx.textAlign = "left";
  $highScore.textContent = String(
    Math.max(+$score.innerText, +$highScore.innerText),
  );
  localStorage.setItem("high-score", $highScore.innerText);
}

function createNewBox() {
  state.boxes[state.current] = {
    x: 0,
    y: state.boxes[state.current - 1].y + BOX_HEIGHT + BOX_OFFSET,
    width: state.boxes[state.current - 1].width,
    color: randomColor(state.current),
  };

  BG_SOUND.playbackRate += 0.01;
}

function createNewDebris(diff: number) {
  const currentBox = state.boxes[state.current];
  state.debris = {
    x:
      diff > 0
        ? // Plenty space on the right
          currentBox.width + currentBox.x
        : // Plenty space on the left
          currentBox.x,

    y: currentBox.y,
    width: diff,
    color: currentBox.color,
  };
}

function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color,
      alpha: 1,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
      maxLife: 1,
    });
  }
}

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.rotation += p.rotationSpeed;
    p.life -= 0.025;
    p.alpha = p.life;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  if (!ui) return;
  const { $ctx } = ui;

  for (const p of state.particles) {
    $ctx.save();
    $ctx.translate(p.x, p.y);
    $ctx.rotate(p.rotation);
    $ctx.globalAlpha = p.alpha;
    $ctx.shadowColor = p.color;
    $ctx.shadowBlur = 8;
    $ctx.fillStyle = p.color;
    $ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    $ctx.restore();
  }
  $ctx.globalAlpha = 1;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function parseRgbaColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  if (color.startsWith("rgba(")) {
    const parts = color.replace("rgba(", "").replace(")", "").split(",");
    return {
      r: parseInt(parts[0].trim()),
      g: parseInt(parts[1].trim()),
      b: parseInt(parts[2].trim()),
      a: parseFloat(parts[3].trim()),
    };
  }
  if (color.startsWith("rgb(")) {
    const parts = color.replace("rgb(", "").replace(")", "").split(",");
    return {
      r: parseInt(parts[0].trim()),
      g: parseInt(parts[1].trim()),
      b: parseInt(parts[2].trim()),
      a: 1,
    };
  }
  const rgb = hexToRgb(color);
  if (rgb) {
    return { ...rgb, a: 1 };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function drawBackground(score: number) {
  if (!ui) return;
  const { $canvas, $ctx } = ui;

  const gradient = $ctx.createLinearGradient(0, 0, 0, $canvas.height);
  if (score < 10) {
    gradient.addColorStop(0, "#0a0a1a");
    gradient.addColorStop(1, "#1a1a3a");
  } else if (score < 20) {
    gradient.addColorStop(0, "#0f0f2a");
    gradient.addColorStop(1, "#252550");
  } else if (score < 30) {
    gradient.addColorStop(0, "#151535");
    gradient.addColorStop(1, "#303060");
  } else if (score < 40) {
    gradient.addColorStop(0, "#1a1a45");
    gradient.addColorStop(1, "#404075");
  } else {
    gradient.addColorStop(0, "#252555");
    gradient.addColorStop(1, "#505085");
  }
  $ctx.fillStyle = gradient;
  $ctx.fillRect(0, 0, $canvas.width, $canvas.height);

  $ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let i = 0; i < 50; i++) {
    const x = (i * 97) % $canvas.width;
    const y = (i * 73 + score * 2) % $canvas.height;
    $ctx.beginPath();
    $ctx.arc(x, y, 1, 0, Math.PI * 2);
    $ctx.fill();
  }
}

function drawBoxes() {
  if (!ui) return;

  const { $ctx, $canvas } = ui;

  for (let i = 0; i < state.boxes.length; i++) {
    const box = state.boxes[i];
    const { x, y, width, color } = box;
    const newY = INIT_BOX_Y_POS - y + state.cameraY;

    const rgb = parseRgbaColor(color);
    const lighterColor = `rgba(${Math.min(255, rgb.r + 80)}, ${Math.min(255, rgb.g + 80)}, ${Math.min(255, rgb.b + 80)}, ${rgb.a})`;
    const baseColor = `rgba(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)}, ${rgb.a})`;
    const darkerColor = `rgba(${Math.max(0, rgb.r - 50)}, ${Math.max(0, rgb.g - 50)}, ${Math.max(0, rgb.b - 50)}, ${rgb.a})`;

    $ctx.shadowColor = color;
    $ctx.shadowBlur = 20;
    $ctx.shadowOffsetX = 0;
    $ctx.shadowOffsetY = 6;

    const gradient = $ctx.createLinearGradient(x, newY, x, newY + BOX_HEIGHT);
    gradient.addColorStop(0, lighterColor);
    gradient.addColorStop(0.3, baseColor);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkerColor);

    $ctx.fillStyle = gradient;
    drawRoundedRect($ctx, x, newY, width, BOX_HEIGHT, 6);

    $ctx.shadowBlur = 0;
    $ctx.shadowOffsetY = 0;

    $ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
    $ctx.lineWidth = 2;
    $ctx.stroke();

    $ctx.save();
    drawRoundedRect($ctx, x, newY, width, BOX_HEIGHT, 6);
    $ctx.clip();
    $ctx.strokeStyle = `rgba(255, 255, 255, 0.25)`;
    $ctx.lineWidth = 3;
    $ctx.beginPath();
    for (let offset = -BOX_HEIGHT; offset < width + BOX_HEIGHT; offset += 10) {
      $ctx.moveTo(x + offset, newY);
      $ctx.lineTo(x + offset + BOX_HEIGHT, newY + BOX_HEIGHT);
    }
    $ctx.stroke();
    $ctx.restore();

    $ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
    $ctx.lineWidth = 1;
    $ctx.beginPath();
    $ctx.moveTo(x + 3, newY + 3);
    $ctx.lineTo(x + width - 3, newY + 3);
    $ctx.lineTo(x + width - 3, newY + BOX_HEIGHT - 3);
    $ctx.stroke();
  }
}

function drawDebris() {
  if (!state.debris || !ui) return;
  const { $ctx } = ui;

  const { x, y, color, width } = state.debris;
  const newY = INIT_BOX_Y_POS - y + state.cameraY;

  $ctx.shadowColor = color;
  $ctx.shadowBlur = 20;
  $ctx.fillStyle = color;
  drawRoundedRect($ctx, x, newY, Math.abs(width), BOX_HEIGHT, 4);
  $ctx.shadowBlur = 0;
}

function drawScore() {
  if (!ui) return;
  const { $score } = ui;
  const newScore = String(state.current - 1);
  if ($score.textContent !== newScore) {
    $score.textContent = newScore;
    $score.classList.remove("score-pop");
    void $score.offsetWidth;
    $score.classList.add("score-pop");
  }
}

function updateComboBar() {
  if (!ui) return;
  const { $combo } = ui;
  const comboPercent = (state.combo / state.comboThreshold) * 100;
  $combo.style.width = `${Math.min(comboPercent, 100)}%`;
  if (state.combo >= state.comboThreshold) {
    $combo.classList.add("maxed");
  } else {
    $combo.classList.remove("maxed");
  }
}

function updateProgressBar() {
  if (!ui) return;
  const { $progress } = ui;
  const maxPossibleHeight = 50;
  const progressPercent = Math.min((state.maxHeight / maxPossibleHeight) * 100, 100);
  $progress.style.height = `${progressPercent}%`;
}

function moveAndCheckCollision() {
  if (!ui) return;
  const { $canvas } = ui;

  const currentBox = state.boxes[state.current];
  currentBox.x += state.xSpeed;

  const isMovingRight = state.xSpeed > 0;
  const isMovingLeft = state.xSpeed < 0;

  const hasReachedRight = currentBox.x + currentBox.width > $canvas.width;
  const hasReachedLeft = currentBox.x < 0;

  if ((isMovingRight && hasReachedRight) || (isMovingLeft && hasReachedLeft)) {
    state.xSpeed *= -1;
  }
}

function fixBoxSize(diff: number) {
  const cleanDiff = Math.abs(diff);
  if (diff > 0) {
    // Plenty space on the right
    state.boxes[state.current].width -= cleanDiff;
  } else {
    // Plenty space on the left
    state.boxes[state.current].width -= cleanDiff;
    state.boxes[state.current].x += cleanDiff;
  }

  createNewDebris(diff);
}

function boxHit(currentBox: Box) {
  if (!ui) return;
  const prevBox = state.boxes[state.current - 1];

  const diff = currentBox.x - prevBox.x;

  if (Math.abs(diff) >= currentBox.width) {
    state.slowMoFrames = 30;
    return;
  }

  const accuracyThreshold = currentBox.width * 0.2;
  if (Math.abs(diff) <= accuracyThreshold) {
    state.combo += 1;

    if (state.combo >= state.comboThreshold) {
      if (state.current - 1 >= 15) {
        const bonus = Math.random() < 0.5 ? "size" : "speed";

        if (bonus === "size" && state.sizeBonus < 50) {
          state.sizeBonus = Math.min(state.sizeBonus + 30, 50);
          const currentWidth = state.boxes[state.current].width;
          state.boxes[state.current].width = currentWidth + 30;
          prevBox.width = currentWidth + 30;
        } else if (bonus === "speed" && state.speedBonus < 2) {
          state.speedBonus = Math.min(state.speedBonus + 0.5, 2);
          const newSpeed = INIT_X_SPEED - state.speedBonus;
          if (newSpeed < state.xSpeed) {
            state.xSpeed = Math.max(newSpeed, INIT_X_SPEED - 2);
          }
        }

        state.comboThreshold += 1;
      }

      state.combo = 0;
    }
  } else {
    state.combo = 0;
  }

  fixBoxSize(diff);

  const landingX = currentBox.x + currentBox.width / 2;
  const screenY = INIT_BOX_Y_POS - currentBox.y + state.cameraY + BOX_HEIGHT / 2;
  spawnParticles(landingX, screenY, currentBox.color, 12);

  state.xSpeed += state.xSpeed > 0 ? 0.5 : -0.5;
  if (state.xSpeed < 1) state.xSpeed = 1;
  state.current += 1;
  state.scrollCount += BOX_HEIGHT;

  if (state.current - 1 > state.maxHeight) {
    state.maxHeight = state.current - 1;
  }

  HIT_SOUND.pause();
  HIT_SOUND.currentTime = 0;
  HIT_SOUND.play();

  createNewBox();

  state.mode = MODES.BOUNCE;
}

function updateFall() {
  const currentBox = state.boxes[state.current];
  currentBox.y -= state.ySpeed;

  const prevBoxPos = state.boxes[state.current - 1].y + BOX_HEIGHT;

  if (currentBox.y <= prevBoxPos) {
    currentBox.y = prevBoxPos;
    boxHit(currentBox);
  }
}

function updateCamera() {
  if (state.scrollCount > 0) {
    state.cameraY += 1;
    state.scrollCount -= 1;
  }
}

function drawPause() {
  if (!ui) return;
  const { $ctx, $canvas } = ui;

  $ctx.fillStyle = "rgba(10, 10, 30, 0.7)";
  $ctx.fillRect(0, 0, $canvas.width, $canvas.height);

  $ctx.shadowColor = "#00d4ff";
  $ctx.shadowBlur = 20;
  $ctx.fillStyle = "#00d4ff";
  $ctx.font = "16px 'Press Start 2P'";
  $ctx.textAlign = "center";
  $ctx.fillText("PAUSED", $canvas.width / 2, $canvas.height / 2 - 20);

  $ctx.shadowBlur = 0;
  $ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  $ctx.font = "10px 'Press Start 2P'";
  $ctx.fillText(
    "PRESS ENTER TO RESUME",
    $canvas.width / 2,
    $canvas.height / 2 + 30,
  );

  $ctx.textAlign = "left";
}

function draw() {
  if (!ui) return;

  const { $canvas } = ui;

  if (state.mode === MODES.GAME_OVER) {
    drawGameOver();
    return;
  }

  if (state.slowMoFrames > 0) {
    state.slowMoFrames--;
    updateParticles();
    drawBackground(state.current - 1);
    drawBoxes();
    drawDebris();
    drawParticles();
    drawScore();
    updateComboBar();
    updateProgressBar();
    if (state.slowMoFrames === 0) {
      state.mode = MODES.GAME_OVER;
    }
    window.requestAnimationFrame(draw);
    return;
  }

  if (state.mode === MODES.PAUSE) {
    drawPause();
  } else {
    drawBackground(state.current - 1);
    drawBoxes();
    drawDebris();
    updateParticles();
    drawParticles();
    drawScore();
    updateComboBar();
    updateProgressBar();

    if (state.mode === MODES.BOUNCE) {
      moveAndCheckCollision();
    } else if (state.mode === MODES.FALL) {
      updateFall();
    }

    if (state.debris) {
      state.debris.y -= state.ySpeed * 2;

      if (state.debris.y > $canvas.height + BOX_HEIGHT) {
        state.debris = null;
      }
    }

    updateCamera();
  }
  window.requestAnimationFrame(draw);
}
