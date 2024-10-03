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
}

interface UI {
  $controls: HTMLDivElement;
  $score: HTMLSpanElement;
  $highScore: HTMLSpanElement;
  $canvas: HTMLCanvasElement;
  $ctx: CanvasRenderingContext2D;
  $pause?: HTMLButtonElement;
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
  };

  createNewBox();
}

function setupPauseButton() {
  if (!ui) return;
  ui.$pause = document.createElement("button");
  ui.$pause.innerHTML = "&#9208;";
  ui.$pause.classList.add("pause");
  ui.$pause.addEventListener("click", () => {
    state.mode = MODES.PAUSE;
  });
  document.querySelector(".game-container")?.appendChild(ui.$pause);
}

function resetUI() {
  if (!ui) return;

  const { $score, $highScore, $controls, $canvas } = ui;

  const savedScore = +(localStorage.getItem("high-score") || "0");
  $score.textContent = "0";
  $highScore.textContent = savedScore > 0 ? String(savedScore) : "0";

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
) {
  ui = {
    $controls: controls,
    $score: score,
    $highScore: highScore,
    $canvas: canvas,
    $ctx: ctx,
  };

  if (isMobile) {
    ui.$canvas.width = window.innerWidth;
    ui.$canvas.height = window.innerHeight;
  } else {
    ui.$canvas.width = 460;
    ui.$canvas.height = 800;
  }

  _restart();
}

function drawGameOver() {
  if (!ui) return;

  const { $ctx, $canvas, $highScore, $score } = ui;
  BG_SOUND.pause();

  $ctx.fillStyle = "#250206";
  $ctx.fillRect(0, 0, $canvas.width, $canvas.height);
  $ctx.textRendering = "optimizeLegibility";
  $ctx.fillStyle = "white";
  $ctx.font = "60px Tahoma";
  const $textInfo = $ctx.measureText("GAME OVER");
  $ctx.fillText(
    "GAME OVER",
    $canvas.width / 2 - $textInfo.width / 2,
    $canvas.height / 2,
  );

  $ctx.font = "20px Tahoma";
  const $restartInfo = $ctx.measureText(
    `${isMobile ? "TAP" : "PRESS R"} TO RESTART`,
  );
  $ctx.fillText(
    `${isMobile ? "TAP" : "PRESS R"} TO RESTART`,
    $canvas.width / 2 - $restartInfo.width / 2,
    $canvas.height / 2 + 70,
  );

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

function drawBackground(score: number) {
  if (!ui) return;
  const { $canvas, $ctx } = ui;

  if (score < 10) {
    $ctx.fillStyle = "black";
  } else if (score < 20) {
    $ctx.fillStyle = "#111111";
  } else if (score < 30) {
    $ctx.fillStyle = `#333333`;
  } else if (score < 40) {
    $ctx.fillStyle = `#555555`;
  } else if (score > 50) {
    $ctx.fillStyle = `#999999`;
  }
  $ctx.fillRect(0, 0, $canvas.width, $canvas.height);
}

function drawBoxes() {
  if (!ui) return;

  const { $ctx, $canvas } = ui;

  for (let box of state.boxes) {
    const { x, y, width, color } = box;
    const newY = INIT_BOX_Y_POS - y + state.cameraY;

    //if (newY > $canvas.height) continue;

    $ctx.fillStyle = color;
    $ctx.fillRect(x, newY, width, BOX_HEIGHT);
  }
}

function drawDebris() {
  if (!state.debris || !ui) return;
  const { $ctx } = ui;

  const { x, y, color, width } = state.debris;
  const newY = INIT_BOX_Y_POS - y + state.cameraY;

  $ctx.fillStyle = color;
  $ctx.fillRect(x, newY, width, BOX_HEIGHT);
}

function drawScore() {
  if (!ui) return;
  const { $score } = ui;
  $score.textContent = String(state.current - 1);
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
    state.mode = MODES.GAME_OVER;
    return;
  }

  fixBoxSize(diff);

  state.xSpeed += state.xSpeed > 0 ? 0.5 : -0.5;
  state.current += 1;
  state.scrollCount += BOX_HEIGHT;

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

  $ctx.fillStyle = "white";
  $ctx.textRendering = "optimizeLegibility";
  $ctx.font = "20px Tahoma";
  const $pauseInfo = $ctx.measureText("PAUSED");
  $ctx.fillText(
    "PAUSED",
    $canvas.width / 2 - $pauseInfo.width / 2,
    $canvas.height / 2,
  );
  const $unpauseInfo = $ctx.measureText("PRESS ENTER TO START");
  $ctx.fillText(
    "PRESS ENTER TO START",
    $canvas.width / 2 - $unpauseInfo.width / 2,
    $canvas.height / 2 + 30,
  );
}

function draw() {
  if (!ui) return;

  const { $canvas } = ui;

  if (state.mode === MODES.GAME_OVER) {
    drawGameOver();
    return;
  }

  if (state.mode === MODES.PAUSE) {
    drawPause();
  } else {
    drawBackground(state.current - 1);
    drawBoxes();
    drawDebris();
    drawScore();

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
