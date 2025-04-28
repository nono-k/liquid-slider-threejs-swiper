import { LiquidSlider } from './liquidSlider';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.liquid-canvas');

  const slider = new LiquidSlider({
    container: container,
    images: [
      'image01.jpg',
      'image02.jpg',
      'image03.jpg',
      'image04.jpg',
      'image05.jpg',
    ],
    noiseImage: 'disp.webp',
  });
});
