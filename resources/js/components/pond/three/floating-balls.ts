import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createDimpleTexture, createGolfBallMaterial, GOLF_BALL_COLORS } from '@/components/pond/three/golf-ball';

// [share of half the width, y, z, radius, color]: to the sides, clear of the buttons.
const LAYOUT: [number, number, number, number, number][] = [
    [-0.7, 0.9, -1, 1.2, GOLF_BALL_COLORS.blue],
    [-0.62, -1.75, 0, 0.72, GOLF_BALL_COLORS.yellow],
    [-0.9, -1.1, -2, 0.95, GOLF_BALL_COLORS.white],
    [0.72, 1, -1, 1.25, GOLF_BALL_COLORS.purple],
    [0.63, -1.7, 0, 0.7, GOLF_BALL_COLORS.green],
    [0.91, -1.05, -2, 1, GOLF_BALL_COLORS.red],
];

/** Half the visible height of the panel, in the same units as the layout above. */
const HALF_HEIGHT = 2.7;

export type FloatingBalls = {
    dispose: () => void;
};

/**
 * Golf balls drifting behind a call to action. They follow the pointer a little and
 * ignore clicks, so the buttons above them always work.
 */
export function mountFloatingBalls(container: HTMLElement, onFailure: () => void): FloatingBalls {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.32;
    scene.add(new THREE.HemisphereLight(0xdcecff, 0x0a2a60, 0.75));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(-3, 6, 6);
    scene.add(key);

    // Orthographic: on a very wide, short panel a perspective camera stretches the
    // balls at the sides into ovals.
    const camera = new THREE.OrthographicCamera(-7, 7, HALF_HEIGHT, -HALF_HEIGHT, 0.1, 50);
    camera.position.z = 12;

    const dimples = createDimpleTexture();
    const geometry = new THREE.SphereGeometry(1, 64, 48);
    const balls = LAYOUT.map(([side, y, z, radius, color], index) => {
        const mesh = new THREE.Mesh(geometry, createGolfBallMaterial(color, dimples));
        mesh.position.set(0, y, z);
        mesh.scale.setScalar(radius);
        mesh.rotation.set(index, index * 2, 0);
        scene.add(mesh);

        return { mesh, side, y, phase: index * 1.3, speed: 0.5 + (index % 3) * 0.13 };
    });

    let halfWidth = 7;

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();

    const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();

        pointerTarget.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
    };

    const section = container.parentElement ?? container;
    section.addEventListener('pointermove', onPointerMove, { passive: true });

    const resize = () => {
        const { width, height } = container.getBoundingClientRect();

        if (width && height) {
            renderer.setSize(width, height, false);
            halfWidth = HALF_HEIGHT * (width / height);
            camera.left = -halfWidth;
            camera.right = halfWidth;
            camera.updateProjectionMatrix();
        }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frame = 0;
    let isOnScreen = false;
    let elapsed = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
        frame = requestAnimationFrame(loop);

        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (!isOnScreen || document.hidden) {
            return;
        }

        elapsed += delta;
        pointer.lerp(pointerTarget, 1 - Math.exp(-delta * 2.5));

        for (const ball of balls) {
            ball.mesh.position.x = ball.side * halfWidth + Math.sin(elapsed * ball.speed * 0.6 + ball.phase) * 0.18 + pointer.x * 0.22;
            ball.mesh.position.y = ball.y + Math.sin(elapsed * ball.speed + ball.phase) * 0.24 + pointer.y * 0.16;
            ball.mesh.rotation.x += delta * 0.12;
            ball.mesh.rotation.y += delta * 0.2;
        }

        renderer.render(scene, camera);
    };

    const visibility = new IntersectionObserver(([entry]) => {
        isOnScreen = entry.isIntersecting;
    });
    visibility.observe(container);

    const onContextLost = (event: Event) => {
        event.preventDefault();
        onFailure();
    };

    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    frame = requestAnimationFrame(loop);

    return {
        dispose: () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            visibility.disconnect();
            section.removeEventListener('pointermove', onPointerMove);
            renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
            balls.forEach((ball) => (ball.mesh.material as THREE.Material).dispose());
            geometry.dispose();
            dimples.dispose();
            environment.dispose();
            pmrem.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
        },
    };
}
