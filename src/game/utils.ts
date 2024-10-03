export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getAlphaFromScore(score: number) {
  if (score < 15) {
    return 1;
  } else if (score > 15 && score < 20) {
    return 0.8;
  } else if (score > 20 && score < 25) {
    return 0.6;
  } else if (score > 25 && score < 30) {
    return 0.5;
  } else if (score > 30 && score < 35) {
    return 0.4;
  } else if (score > 35 && score < 40) {
    return 0.3;
  } else if (score > 40 && score < 45) {
    return 0.2;
  } else if (score > 45 && score < 100) {
    return 1;
  }
}

export function randomColor(score: number) {
  let alpha = getAlphaFromScore(score);
  return `rgba(${randomBetween(0, 255)},${randomBetween(0, 255)},${randomBetween(0, 255)},${alpha})`;
}
