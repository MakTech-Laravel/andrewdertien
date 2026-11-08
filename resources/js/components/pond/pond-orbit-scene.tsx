import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ORBIT_BALLS = [
    { src: '/quantum/images/ball-100.png', radius: 1.6, speed: 0.55, scale: 0.7, phase: 0 },
    { src: '/quantum/images/ball-10.png', radius: 2.0, speed: 0.4, scale: 0.85, phase: 1.2 },
    { src: '/quantum/images/ball-50.png', radius: 2.35, speed: 0.32, scale: 0.65, phase: 2.4 },
    { src: '/quantum/images/ball-20.png', radius: 1.85, speed: 0.48, scale: 0.75, phase: 3.5 },
    { src: '/quantum/images/ball-5.png', radius: 2.5, speed: 0.28, scale: 0.6, phase: 4.6 },
    { src: '/quantum/images/ball-500.png', radius: 2.15, speed: 0.36, scale: 0.7, phase: 5.5 },
];

export function PondOrbitScene({ className = '' }: { className?: string }) {
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
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
        camera.position.set(0, 0.4, 6.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = 'askupon-three-canvas askupon-three-canvas-soft';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.pointerEvents = 'none';
        host.style.pointerEvents = 'none';
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1));

        const loader = new THREE.TextureLoader();
        const sprites: Array<{
            sprite: THREE.Sprite;
            radius: number;
            speed: number;
            phase: number;
            scale: number;
        }> = [];

        ORBIT_BALLS.forEach((ball) => {
            const texture = loader.load(ball.src);
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthWrite: false,
                opacity: 0.9,
            });
            const sprite = new THREE.Sprite(material);
            sprite.scale.setScalar(ball.scale);
            scene.add(sprite);
            sprites.push({
                sprite,
                radius: ball.radius,
                speed: ball.speed,
                phase: ball.phase,
                scale: ball.scale,
            });
        });

        let frame = 0;
        let running = true;
        let visible = true;
        const clock = new THREE.Clock();

        const resize = () => {
            const width = host.clientWidth || 1;
            const height = host.clientHeight || 1;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };
        resize();

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);

        const intersection = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
            },
            { threshold: 0.08 },
        );
        intersection.observe(host);

        const animate = () => {
            frame = requestAnimationFrame(animate);
            if (!running || !visible) {
                return;
            }

            const t = clock.getElapsedTime() * (reduceMotion ? 0.2 : 1);
            sprites.forEach((item) => {
                const angle = t * item.speed + item.phase;
                item.sprite.position.set(
                    Math.cos(angle) * item.radius,
                    Math.sin(angle * 1.4) * 0.45,
                    Math.sin(angle) * item.radius * 0.35,
                );
                const pulse = 1 + Math.sin(t * 2 + item.phase) * 0.05;
                item.sprite.scale.setScalar(item.scale * pulse);
            });

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            running = false;
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            intersection.disconnect();
            scene.traverse((object) => {
                if (object instanceof THREE.Sprite) {
                    object.material.map?.dispose();
                    object.material.dispose();
                }
            });
            renderer.dispose();
            if (renderer.domElement.parentElement === host) {
                host.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={hostRef} className={`askupon-orbit-host ${className}`} />;
}
