import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type BallSpec = {
    src: string;
    x: number;
    z: number;
    scale: number;
    bob: number;
    spin: number;
    phase: number;
};

const BALLS: BallSpec[] = [
    { src: '/quantum/images/ball-100.png', x: -2.4, z: 0.2, scale: 0.95, bob: 1.1, spin: 0.35, phase: 0.2 },
    { src: '/quantum/images/ball-10.png', x: -1.2, z: -0.35, scale: 1.15, bob: 0.9, spin: -0.28, phase: 1.1 },
    { src: '/quantum/images/ball-50.png', x: 0.1, z: 0.45, scale: 0.85, bob: 1.3, spin: 0.42, phase: 2.0 },
    { src: '/quantum/images/ball-20.png', x: 1.15, z: -0.15, scale: 1.05, bob: 1.0, spin: -0.33, phase: 2.8 },
    { src: '/quantum/images/ball-5.png', x: 2.35, z: 0.25, scale: 0.9, bob: 1.2, spin: 0.25, phase: 3.6 },
    { src: '/quantum/images/ball-500.png', x: -0.55, z: -0.7, scale: 0.78, bob: 0.85, spin: -0.4, phase: 4.4 },
];

const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave =
      sin(pos.x * 1.8 + uTime * 1.4) * 0.08 +
      cos(pos.y * 2.2 - uTime * 1.1) * 0.05 +
      sin((pos.x + pos.y) * 1.1 + uTime * 0.9) * 0.04;
    pos.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const waterFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec2 uv = vUv;
    float sparkle = sin((uv.x + uv.y) * 40.0 + uTime * 3.0) * 0.5 + 0.5;
    sparkle = pow(sparkle, 12.0) * 0.35;

    vec3 deep = vec3(0.03, 0.18, 0.34);
    vec3 mid = vec3(0.08, 0.42, 0.66);
    vec3 light = vec3(0.45, 0.82, 0.98);
    vec3 color = mix(deep, mid, uv.y);
    color = mix(color, light, smoothstep(0.55, 1.0, uv.y + vWave * 2.0));
    color += sparkle * vec3(1.0, 0.95, 0.7);

    float edge = smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x)
      * smoothstep(0.0, 0.16, uv.y) * smoothstep(1.0, 0.78, uv.y);
    float alpha = 0.72 * edge;

    gl_FragColor = vec4(color, alpha);
  }
`;

type PondHeroSceneProps = {
    className?: string;
};

export function PondHeroScene({ className = '' }: PondHeroSceneProps) {
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) {
            return;
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const canWebGL = (() => {
            try {
                const test = document.createElement('canvas');
                return Boolean(test.getContext('webgl2') || test.getContext('webgl'));
            } catch {
                return false;
            }
        })();

        if (!canWebGL) {
            host.dataset.fallback = 'true';
            return;
        }

        const isNarrow = () => host.clientWidth > 0 && host.clientWidth < 640;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 1.55, 5.4);
        camera.lookAt(0, 0.2, 0);

        const renderer = new THREE.WebGLRenderer({
            antialias: !isNarrow(),
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isNarrow() ? 1.25 : 1.75));
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = 'askupon-three-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        host.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xb9dfff, 1.1);
        const key = new THREE.DirectionalLight(0xfff1c2, 1.35);
        key.position.set(-2.5, 4.5, 3.5);
        const fill = new THREE.DirectionalLight(0x7ec8ff, 0.55);
        fill.position.set(3, 1.5, 2);
        scene.add(ambient, key, fill);

        const sunGeo = new THREE.SphereGeometry(0.55, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd54a });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.set(0.15, 1.55, -1.8);
        scene.add(sun);

        const sunGlowGeo = new THREE.SphereGeometry(0.85, 24, 24);
        const sunGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffe082,
            transparent: true,
            opacity: 0.22,
        });
        const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
        sunGlow.position.copy(sun.position);
        scene.add(sunGlow);

        const waterUniforms = { uTime: { value: 0 } };
        const waterSegments = isNarrow() ? [36, 18] as const : [64, 32] as const;
        const waterGeo = new THREE.PlaneGeometry(8.4, 3.4, waterSegments[0], waterSegments[1]);
        const waterMat = new THREE.ShaderMaterial({
            uniforms: waterUniforms,
            vertexShader: waterVertex,
            fragmentShader: waterFragment,
            transparent: true,
            depthWrite: false,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI * 0.5;
        water.position.set(0, -0.35, 0.2);
        scene.add(water);

        const loader = new THREE.TextureLoader();
        const ballGroup = new THREE.Group();
        scene.add(ballGroup);

        type LiveBall = {
            mesh: THREE.Object3D;
            spec: BallSpec;
            baseY: number;
        };
        const liveBalls: LiveBall[] = [];

        const activeBalls = isNarrow() ? BALLS.slice(0, 5) : BALLS;
        activeBalls.forEach((spec) => {
            const texture = loader.load(spec.src);
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.setScalar(spec.scale);
            sprite.position.set(spec.x, 0.15, spec.z);
            ballGroup.add(sprite);
            liveBalls.push({ mesh: sprite, spec, baseY: 0.15 });
        });

        const ripples: Array<{ mesh: THREE.Mesh; age: number; life: number }> = [];
        const rippleGeo = new THREE.RingGeometry(0.05, 0.12, 48);
        const makeRipple = (x: number, z: number) => {
            const mat = new THREE.MeshBasicMaterial({
                color: 0xd7ecff,
                transparent: true,
                opacity: 0.55,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const mesh = new THREE.Mesh(rippleGeo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(x, -0.28, z);
            scene.add(mesh);
            ripples.push({ mesh, age: 0, life: 1.4 });
        };

        const sparkCount = reduceMotion ? 12 : isNarrow() ? 22 : 48;
        const sparkGeo = new THREE.BufferGeometry();
        const sparkPositions = new Float32Array(sparkCount * 3);
        for (let i = 0; i < sparkCount; i++) {
            sparkPositions[i * 3] = (Math.random() - 0.5) * 7;
            sparkPositions[i * 3 + 1] = Math.random() * 2.8 - 0.2;
            sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
        }
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
        const sparkMat = new THREE.PointsMaterial({
            color: 0xfff1b0,
            size: 0.045,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
        });
        const sparks = new THREE.Points(sparkGeo, sparkMat);
        scene.add(sparks);

        const pointer = new THREE.Vector2(0, 0);
        const targetLook = new THREE.Vector2(0, 0);
        const onPointerMove = (event: PointerEvent) => {
            const rect = host.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        };
        const onPointerLeave = () => {
            pointer.set(0, 0);
        };
        const onPointerDown = (event: PointerEvent) => {
            const rect = host.getBoundingClientRect();
            const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const nz = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
            makeRipple(nx * 2.8, nz * 1.1);
        };

        host.addEventListener('pointermove', onPointerMove);
        host.addEventListener('pointerleave', onPointerLeave);
        host.addEventListener('pointerdown', onPointerDown);

        let frame = 0;
        let running = true;
        let visible = true;
        const clock = new THREE.Clock();

        const resize = () => {
            const width = host.clientWidth || 1;
            const height = host.clientHeight || 1;
            const mobile = width < 640;
            camera.aspect = width / height;
            camera.fov = mobile ? 44 : 42;
            camera.position.z = mobile ? 5.5 : 5.4;
            camera.position.y = mobile ? 1.55 : 1.55;
            camera.updateProjectionMatrix();
            ballGroup.scale.setScalar(mobile ? 0.95 : 1);
            ballGroup.position.y = mobile ? 0.1 : 0;
            water.scale.set(mobile ? 0.95 : 1, mobile ? 0.95 : 1, 1);
            sun.scale.setScalar(mobile ? 0.95 : 1);
            sunGlow.scale.setScalar(mobile ? 0.95 : 1);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
            renderer.setSize(width, height, false);
        };
        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        const intersection = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
            },
            { threshold: 0.05 },
        );
        intersection.observe(host);

        const animate = () => {
            frame = requestAnimationFrame(animate);
            if (!running || !visible) {
                return;
            }

            const t = clock.getElapsedTime();
            const motion = reduceMotion ? 0.15 : 1;

            waterUniforms.uTime.value = t * motion;
            sun.position.y = 1.55 + Math.sin(t * 0.6 * motion) * 0.05;
            sunGlow.position.copy(sun.position);
            sunGlowMat.opacity = 0.18 + Math.sin(t * 1.4 * motion) * 0.06;

            const mobileView = host.clientWidth < 640;
            const baseY = mobileView ? 1.55 : 1.55;
            targetLook.x += (pointer.x * (mobileView ? 0.18 : 0.35) - targetLook.x) * 0.05;
            targetLook.y += (pointer.y * (mobileView ? 0.1 : 0.2) - targetLook.y) * 0.05;
            camera.position.x = targetLook.x * (mobileView ? 0.25 : 0.55);
            camera.position.y = baseY + targetLook.y * (mobileView ? 0.12 : 0.25);
            camera.lookAt(targetLook.x * 0.25, 0.15 + targetLook.y * 0.08, 0);

            const xSpread = mobileView ? 0.58 : 1;
            liveBalls.forEach(({ mesh, spec, baseY: ballBaseY }) => {
                const bob = Math.sin(t * spec.bob * motion + spec.phase) * (mobileView ? 0.1 : 0.12);
                mesh.position.y = ballBaseY + bob;
                mesh.position.x = spec.x * xSpread + Math.sin(t * 0.35 * motion + spec.phase) * 0.06;
                mesh.position.z = spec.z * (mobileView ? 0.55 : 1);
                const spin = 1 + Math.sin(t * Math.abs(spec.spin) * motion + spec.phase) * 0.06;
                mesh.scale.setScalar(spec.scale * spin * (mobileView ? 0.92 : 1));
                mesh.rotation.z = Math.sin(t * spec.spin * motion + spec.phase) * 0.18;
            });

            const positions = sparkGeo.attributes.position as THREE.BufferAttribute;
            for (let i = 0; i < sparkCount; i++) {
                const iy = i * 3 + 1;
                positions.array[iy] += 0.004 * motion;
                if (positions.array[iy] > 2.6) {
                    positions.array[iy] = -0.2;
                }
            }
            positions.needsUpdate = true;

            for (let i = ripples.length - 1; i >= 0; i--) {
                const ripple = ripples[i];
                ripple.age += 0.016 * motion;
                const progress = ripple.age / ripple.life;
                const scale = 1 + progress * 8;
                ripple.mesh.scale.set(scale, scale, scale);
                (ripple.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 * (1 - progress));
                if (progress >= 1) {
                    scene.remove(ripple.mesh);
                    (ripple.mesh.material as THREE.Material).dispose();
                    ripples.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            running = false;
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            intersection.disconnect();
            host.removeEventListener('pointermove', onPointerMove);
            host.removeEventListener('pointerleave', onPointerLeave);
            host.removeEventListener('pointerdown', onPointerDown);

            ripples.forEach(({ mesh }) => {
                scene.remove(mesh);
                (mesh.material as THREE.Material).dispose();
            });

            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
                    object.geometry?.dispose();
                    const material = object.material;
                    if (Array.isArray(material)) {
                        material.forEach((item) => item.dispose());
                    } else if (material) {
                        if ('map' in material && material.map) {
                            material.map.dispose();
                        }
                        material.dispose();
                    }
                }
            });

            renderer.dispose();
            if (renderer.domElement.parentElement === host) {
                host.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={hostRef} className={`askupon-three-host ${className}`} />;
}
