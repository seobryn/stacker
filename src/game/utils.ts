export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getAlphaFromScore(score: number) {
  if (score < 15) return 1;
  if (score < 20) return 0.8;
  if (score < 25) return 0.6;
  if (score < 30) return 0.5;
  if (score < 35) return 0.4;
  if (score < 40) return 0.3;
  if (score < 45) return 0.2;
  return 1;
}

export function randomColor(score: number) {
  let alpha = getAlphaFromScore(score);
  return `rgba(${randomBetween(0, 255)},${randomBetween(0, 255)},${randomBetween(0, 255)},${alpha})`;
}
