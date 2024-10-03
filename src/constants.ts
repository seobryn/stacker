export interface Debris {
  x: number;
  y: number;
  width: number;
  color: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  color: string;
}

export enum MODES {
  FALL = "fall",
  BOUNCE = "bounce",
  GAME_OVER = "gameOver",
  PAUSE = "pause",
}

export const INIT_BOX_WIDTH = 200;
export const BOX_HEIGHT = 50;

export const INIT_BOX_Y = 700;
export const INIT_Y_SPEED = 5;
export const INIT_X_SPEED = 3;
export const BOX_OFFSET = 50;
export const DEFAULT_DEBRIS: Debris = { x: 0, y: 0, width: 0, color: "" };

export const BG_SOUND = new Audio("/stacker/sounds/main-loop.wav");
export const HIT_SOUND = new Audio("/stacker/sounds/click.wav");
