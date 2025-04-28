import { LiquidSlider } from './liquidSlider';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.liquid-canvas');
  const baseUrl = 'liquid-slider-threejs-swiper';

  const slider = new LiquidSlider({
    container: container,
    images: [
      `${baseUrl}/image01.jpg`,
      `${baseUrl}/image02.jpg`,
      `${baseUrl}/image03.jpg`,
      `${baseUrl}/image04.jpg`,
      `${baseUrl}/image05.jpg`,
    ],
    noiseImage: `${baseUrl}/disp.webp`,
  });
});
