import linearGradient from './linearGradient';

function tripleLinearGradient(color, colorState, colorStateSecondary, angle = 310) {
  return `linear-gradient(${angle}deg, ${color}, ${colorState}, ${colorStateSecondary})`;
}

export default tripleLinearGradient;
