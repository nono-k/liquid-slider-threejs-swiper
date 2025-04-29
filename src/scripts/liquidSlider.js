import gsap from 'gsap';
import { Swiper } from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import * as THREE from 'three';

export class LiquidSlider {
  constructor(options) {
    this.container = options.container;
    this.images = options.images;
    this.noiseImage = options.noiseImage;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.currentIndex = 0;
    this.isAnimating = false;

    this.initThree();
    this.initSwiper();
    this.loadTextures();
    this.render();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      this.width / -2,
      this.width / 2,
      this.height / 2,
      this.height / -2,
      0.1,
      1000,
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  initSwiper() {
    this.swiper = new Swiper('.swiper', {
      modules: [Navigation, Autoplay],
      slidesPerView: 1,
      loop: true,
      speed: 1000,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
      },
      on: {
        slideChangeTransitionStart: slider => {
          const newIndex = slider.realIndex;
          const total = this.textures.length;

          const diff = newIndex - this.currentIndex;
          const forward = (diff > 0 && diff < total / 2) || diff < -total / 2;

          this.uniforms.uEffect.value = forward ? -1 : 1;

          this.nextSlide(newIndex);
        },
      },
    });
  }

  loadTextures() {
    const loader = new THREE.TextureLoader();
    const imagePromises = this.images.map(src => loader.loadAsync(src));
    const noisePromise = loader.loadAsync(this.noiseImage);

    Promise.all([...imagePromises, noisePromise]).then(results => {
      this.textures = results.slice(0, -1);
      this.noiseTexture = results[results.length - 1];
      this.createMesh();
    });
  }

  createMesh() {
    this.uniforms = {
      uProgress: { value: 0 },
      uEffect: { value: -1 },
      uTexture1: { value: this.textures[this.currentIndex] },
      uTexture2: {
        value: this.textures[(this.currentIndex + 1) % this.textures.length],
      },
      uNoiseTexture: { value: this.noiseTexture },
      uResolution: { value: new THREE.Vector2(this.width, this.height) },
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture1;
      uniform sampler2D uTexture2;
      uniform sampler2D uNoiseTexture;
      uniform float uProgress;
      uniform float uEffect;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec4 noise = texture2D(uNoiseTexture, uv);
        vec2 distortedPosition = vec2(
          uv.x + uProgress * (noise.r * uEffect),
          uv.y + uProgress * (noise.g * uEffect)
        );
        vec2 distortedPosition2 = vec2(
          uv.x - (1.0 - uProgress) * (noise.r * uEffect),
          uv.y - (1.0 - uProgress) * (noise.g * uEffect)
        );

        vec4 texture1 = texture2D(uTexture1, distortedPosition);
        vec4 texture2 = texture2D(uTexture2, distortedPosition2);

        gl_FragColor = mix(texture1, texture2, vec4(uProgress));
      }
    `;

    const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  nextSlide(index) {
    if (this.isAnimating) return;

    this.isAnimating = true;
    const nextTexture = this.textures[index];
    this.uniforms.uTexture2.value = nextTexture;

    gsap.to(this.uniforms.uProgress, {
      value: 1,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        this.currentIndex = index;
        this.uniforms.uTexture1.value = nextTexture;
        this.uniforms.uProgress.value = 0;

        const nextIndex = (this.currentIndex + 1) % this.textures.length;
        this.uniforms.uTexture2.value = this.textures[nextIndex];

        this.isAnimating = false;
      },
    });
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.left = -this.width / 2;
    this.camera.right = this.width / 2;
    this.camera.top = this.height / 2;
    this.camera.bottom = -this.height / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);

    if (this.uniforms.uResolution) {
      this.uniforms.uResolution.value.set(this.width, this.height);
    }

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(
        this.width,
        this.height,
        1,
        1,
      );
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}
