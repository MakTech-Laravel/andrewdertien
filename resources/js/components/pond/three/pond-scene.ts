import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createDimpleTexture, createGolfBallMaterial, GOLF_BALL_COLORS } from '@/components/pond/three/golf-ball';

/** The client's scene artwork is 1075 x 460; the horizon sits 30% from its top. */
const ART_WIDTH = 1075;
const ART_HEIGHT = 460;
const HORIZON = 0.3;
const FOV = 32;

const MAX_BALLS = 16;
const MAX_RIPPLES = 10;
const MAX_TOSSED = 6;
const DROPLETS = 72;

const vertexShader = /* glsl */ `
    varying vec3 vWorld;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`;

const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uCamera;
    uniform vec4 uRipples[${MAX_RIPPLES}];
    uniform vec4 uBalls[${MAX_BALLS}];
    uniform vec3 uBallColors[${MAX_BALLS}];
    uniform int uBallCount;
    varying vec3 vWorld;

    float waveHeight(vec2 p) {
        float t = uTime;

        return sin(p.x * 1.7 + p.y * 2.3 + t * 0.9) * 0.5
            + sin(p.x * -2.9 + p.y * 3.7 - t * 1.2) * 0.3
            + sin(p.x * 6.1 + p.y * 7.9 + t * 1.7) * 0.14
            + sin(p.x * -11.0 + p.y * 13.0 - t * 2.3) * 0.07;
    }

    void main() {
        vec2 p = vWorld.xz;
        float dist = length(vWorld - uCamera);
        float detail = clamp(14.0 / dist, 0.0, 1.0);

        float e = 0.03;
        vec2 slope = vec2(waveHeight(p + vec2(e, 0.0)) - waveHeight(p - vec2(e, 0.0)), waveHeight(p + vec2(0.0, e)) - waveHeight(p - vec2(0.0, e))) / (2.0 * e);
        slope *= 0.05 * detail;

        float rings = 0.0;

        for (int i = 0; i < ${MAX_RIPPLES}; i++) {
            vec4 ripple = uRipples[i];

            if (ripple.w <= 0.0) {
                continue;
            }

            float age = uTime - ripple.z;

            if (age < 0.0 || age > 3.2) {
                continue;
            }

            vec2 delta = p - ripple.xy;
            float d = length(delta);
            float front = age * 1.15;
            float fade = ripple.w * (1.0 - age / 3.2) * (1.0 - age / 3.2);
            float wave = exp(-pow((d - front) * 5.0, 2.0)) * sin((d - front) * 22.0);

            slope += normalize(delta + 0.0001) * wave * fade * 0.5;
            rings += exp(-pow((d - front) * 9.0, 2.0)) * fade;
        }

        float horizonGlow = smoothstep(4.0, 26.0, dist);
        vec3 deep = vec3(0.004, 0.05, 0.27);
        vec3 royal = vec3(0.008, 0.095, 0.40);
        vec3 far = vec3(0.03, 0.19, 0.53);
        vec3 color = mix(deep, royal, smoothstep(6.5, 11.0, dist));
        color = mix(color, far, horizonGlow);
        color += slope.x * vec3(0.05, 0.11, 0.24) - slope.y * vec3(0.03, 0.08, 0.18);

        float lane = (p.x + slope.x * 5.0) / max(uCamera.z - p.y, 0.5);
        float column = exp(-lane * lane * 90.0);
        float stripes = 0.5 + 0.5 * sin(p.y * 13.0 + slope.x * 40.0 + uTime * 1.3 + sin(p.x * 9.0 + uTime) * 1.6);
        float sun = column * (0.25 + stripes * stripes * 0.95) * smoothstep(5.0, 20.0, dist);
        color += sun * vec3(1.0, 0.76, 0.28);

        float glitter = pow(max(0.0, 1.0 - abs(slope.x * 7.0 + slope.y * 7.0 - 0.35)), 24.0);
        color += glitter * 0.07 * vec3(0.7, 0.85, 1.0) * detail;

        for (int i = 0; i < ${MAX_BALLS}; i++) {
            if (i >= uBallCount) {
                break;
            }

            vec4 ball = uBalls[i];
            vec2 offset = p - ball.xy;
            float towardCamera = offset.y / ball.z;
            float across = (offset.x + sin(offset.y * 7.0 + uTime * 1.6) * ball.z * 0.14) / ball.z;
            float reflected = exp(-across * across * 1.5) * smoothstep(-0.1, 0.7, towardCamera) * exp(-towardCamera * 0.55) * ball.w;

            color = mix(color, uBallColors[i] * 0.95, clamp(reflected * 0.62, 0.0, 0.8));

            float d = length(offset) / ball.z;
            float halo = exp(-pow((d - 1.28 - 0.05 * sin(uTime * 1.3 + ball.x * 3.0)) * 13.0, 2.0));
            float outer = exp(-pow((d - 1.86 - 0.07 * sin(uTime * 0.9 + ball.y * 3.0)) * 16.0, 2.0));

            rings += (halo * 0.42 + outer * 0.17) * ball.w;
        }

        color += rings * vec3(0.55, 0.68, 0.85);

        gl_FragColor = vec4(color, 1.0);

        #include <colorspace_fragment>
    }
`;

type Ball = {
    mesh: THREE.Mesh;
    radius: number;
    color: THREE.Color;
    rest: number;
    phase: number;
    /** Vertical spring offset, kicked by splashes and taps. */
    offset: number;
    velocity: number;
    spin: THREE.Vector3;
    flight: { from: THREE.Vector3; to: THREE.Vector3; start: number; duration: number } | null;
    /** Seconds until a retired tossed ball finishes shrinking away. */
    leaving: number | null;
};

export type PondScene = {
    /** Throw a ball into the water. With no point given, it lands somewhere open. */
    toss: () => void;
    dispose: () => void;
};

type Options = {
    onReady: () => void;
    onFailure: () => void;
    onToss: () => void;
};

export function mountPondScene(container: HTMLElement, { onReady, onFailure, onToss }: Options): PondScene {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const canvas = renderer.domElement;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.32;

    const camera = new THREE.PerspectiveCamera(FOV, ART_WIDTH / ART_HEIGHT, 0.1, 80);
    const pitch = Math.atan((1 - 2 * HORIZON) * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    const cameraBase = new THREE.Vector3(0, 2.7, 9);
    camera.position.copy(cameraBase);
    camera.rotation.set(-pitch, 0, 0);
    camera.updateMatrixWorld();

    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x123c86, 0.75));

    const sunlight = new THREE.DirectionalLight(0xffe2ad, 1.3);
    sunlight.position.set(0, 7, -9);
    scene.add(sunlight);

    const fill = new THREE.DirectionalLight(0xffffff, 1.5);
    fill.position.set(-4, 7, 8);
    scene.add(fill);

    const uniforms = {
        uTime: { value: 0 },
        uCamera: { value: camera.position.clone() },
        uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0)) },
        uBalls: { value: Array.from({ length: MAX_BALLS }, () => new THREE.Vector4()) },
        uBallColors: { value: Array.from({ length: MAX_BALLS }, () => new THREE.Color()) },
        uBallCount: { value: 0 },
    };

    const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, toneMapped: false }));
    water.rotation.x = -Math.PI / 2;
    water.position.z = -24;
    scene.add(water);

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const planeHit = new THREE.Vector3();

    /** Where a point in the artwork's pixels lands on a horizontal plane at this height. */
    const artToWorld = (x: number, y: number, height: number): THREE.Vector3 => {
        ndc.set((x / ART_WIDTH) * 2 - 1, -((y / ART_HEIGHT) * 2 - 1));
        raycaster.setFromCamera(ndc, camera);
        raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -height), planeHit);

        return planeHit.clone();
    };

    /** The world radius that draws at this many artwork pixels at a given distance. */
    const worldRadius = (pixels: number, position: THREE.Vector3): number =>
        pixels * ((2 * position.distanceTo(camera.position) * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / ART_HEIGHT);

    const dimples = createDimpleTexture();
    const geometry = new THREE.SphereGeometry(1, 72, 54);
    const marbleGeometry = new THREE.SphereGeometry(1, 40, 30);
    const balls: Ball[] = [];

    const addBall = (material: THREE.Material, radius: number, position: THREE.Vector3, color: number, sphere = geometry): Ball => {
        const mesh = new THREE.Mesh(sphere, material);
        mesh.scale.setScalar(radius);
        mesh.position.copy(position);
        mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        scene.add(mesh);

        const ball: Ball = {
            mesh,
            radius,
            color: new THREE.Color(color),
            rest: position.y,
            phase: Math.random() * Math.PI * 2,
            offset: 0,
            velocity: 0,
            spin: new THREE.Vector3((Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.22, 0),
            flight: null,
            leaving: null,
        };
        balls.push(ball);

        return ball;
    };

    // Placed where the client's artwork draws them: [x, y, radius in artwork pixels].
    const artBalls: [number, number, number, number][] = [
        [326, 209, 84, GOLF_BALL_COLORS.blue],
        [720, 199, 74, GOLF_BALL_COLORS.green],
        [540, 309, 86, GOLF_BALL_COLORS.yellow],
        [866, 289, 78, GOLF_BALL_COLORS.purple],
        [166, 319, 70, GOLF_BALL_COLORS.orange],
    ];

    for (const [x, y, pixels, color] of artBalls) {
        const flat = artToWorld(x, y + pixels * 0.4, 0);
        const radius = worldRadius(pixels, flat);
        const position = artToWorld(x, y, radius * 0.34);

        addBall(createGolfBallMaterial(color, dimples), radius, position, color);
    }

    const artMarbles: [number, number, number, number][] = [
        [145, 223, 22, 0xf2c200],
        [484, 202, 28, 0x13a4f5],
        [349, 379, 31, 0x10c23a],
        [726, 394, 30, 0xe62a12],
        [979, 220, 27, 0x7a2be0],
    ];

    for (const [x, y, pixels, color] of artMarbles) {
        const flat = artToWorld(x, y + pixels * 0.4, 0);
        const radius = worldRadius(pixels, flat);
        const position = artToWorld(x, y, radius * 0.4);
        const material = new THREE.MeshPhysicalMaterial({ color, roughness: 0.04, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2 });

        addBall(material, radius, position, color, marbleGeometry);
    }

    const padMaterial = new THREE.MeshStandardMaterial({ color: 0x4aa83a, roughness: 0.65, side: THREE.DoubleSide });
    const padGeometry = new THREE.CircleGeometry(1, 40, 0.28, Math.PI * 2 - 0.44);
    const pads: [number, number, number][] = [[48, 262, 92], [1043, 314, 66], [1013, 414, 118]];

    for (const [x, y, pixels] of pads) {
        const position = artToWorld(x, y, 0.015);
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.rotation.set(-Math.PI / 2, 0, Math.random() * 6);
        pad.scale.setScalar(worldRadius(pixels, position));
        pad.position.copy(position);
        scene.add(pad);
    }

    const dropletPositions = new Float32Array(DROPLETS * 3).fill(-10);
    const dropletVelocities = new Float32Array(DROPLETS * 3);
    const dropletGeometry = new THREE.BufferGeometry();
    dropletGeometry.setAttribute('position', new THREE.BufferAttribute(dropletPositions, 3));
    const droplets = new THREE.Points(dropletGeometry, new THREE.PointsMaterial({ color: 0xe8f6ff, size: 0.075, transparent: true, opacity: 0.9, sizeAttenuation: true }));
    droplets.frustumCulled = false;
    scene.add(droplets);

    let elapsed = 0;
    let nextRipple = 0;
    let nextDroplet = 0;

    const addRipple = (x: number, z: number, strength: number) => {
        uniforms.uRipples.value[nextRipple].set(x, z, elapsed, strength);
        nextRipple = (nextRipple + 1) % MAX_RIPPLES;
    };

    const splash = (at: THREE.Vector3, radius: number) => {
        addRipple(at.x, at.z, 1);
        window.setTimeout(() => addRipple(at.x, at.z, 0.6), 180);

        for (let i = 0; i < 22; i++) {
            const index = nextDroplet * 3;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.8 + Math.random() * 1.6;

            dropletPositions[index] = at.x + Math.cos(angle) * radius * 0.7;
            dropletPositions[index + 1] = 0.05;
            dropletPositions[index + 2] = at.z + Math.sin(angle) * radius * 0.7;
            dropletVelocities[index] = Math.cos(angle) * speed;
            dropletVelocities[index + 1] = 2.2 + Math.random() * 2.6;
            dropletVelocities[index + 2] = Math.sin(angle) * speed;
            nextDroplet = (nextDroplet + 1) % DROPLETS;
        }
    };

    const tossColors = Object.values(GOLF_BALL_COLORS);
    const tossed: Ball[] = [];
    let nextColor = 0;

    /** The nearest open spot to a target, so a toss never lands inside another ball. */
    const openSpot = (target: THREE.Vector3, radius: number): THREE.Vector3 => {
        const spot = target.clone();

        for (let attempt = 0; attempt < 8; attempt++) {
            const crowding = balls.find((ball) => ball.leaving === null && ball.flight === null && ball.mesh.position.distanceTo(spot) < ball.radius + radius);

            if (!crowding) {
                break;
            }

            spot.x += (spot.x >= crowding.mesh.position.x ? 1 : -1) * radius;
            spot.z += radius * 0.6;
        }

        return spot;
    };

    const tossTo = (target: THREE.Vector3) => {
        const color = tossColors[nextColor % tossColors.length];
        nextColor++;

        const radius = 0.34;
        const landing = openSpot(new THREE.Vector3(target.x, radius * 0.34, target.z), radius);
        const start = new THREE.Vector3(landing.x * 0.55, 3.7, landing.z + 2.2);
        const ball = addBall(createGolfBallMaterial(color, dimples), radius, start, color);

        ball.rest = landing.y;
        ball.flight = { from: start, to: landing, start: elapsed, duration: 0.85 };
        ball.spin.set(5, 2, 0);
        tossed.push(ball);

        if (tossed.filter((item) => item.leaving === null).length > MAX_TOSSED) {
            const oldest = tossed.find((item) => item.leaving === null);

            if (oldest) {
                oldest.leaving = 0.7;
                addRipple(oldest.mesh.position.x, oldest.mesh.position.z, 0.5);
            }
        }

        onToss();
    };

    const toss = () => {
        tossTo(artToWorld(180 + Math.random() * 720, 240 + Math.random() * 170, 0));
    };

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let lastHoverRipple = 0;

    const pointerRay = (event: PointerEvent | MouseEvent) => {
        const rect = canvas.getBoundingClientRect();

        ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
        raycaster.setFromCamera(ndc, camera);
    };

    const waterPoint = (): THREE.Vector3 | null => {
        const hit = raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());

        return hit && hit.z > -14 ? hit : null;
    };

    const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();

        pointerTarget.set(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1);

        if (event.pointerType === 'mouse' && elapsed - lastHoverRipple > 0.45) {
            pointerRay(event);

            const hit = waterPoint();

            if (hit) {
                addRipple(hit.x, hit.z, 0.16);
                lastHoverRipple = elapsed;
            }
        }
    };

    const onPointerLeave = () => pointerTarget.set(0, 0);

    const onClick = (event: MouseEvent) => {
        pointerRay(event);

        const hits = raycaster.intersectObjects(balls.filter((ball) => ball.leaving === null).map((ball) => ball.mesh));
        const tapped = hits.length ? balls.find((ball) => ball.mesh === hits[0].object) : undefined;

        if (tapped) {
            tapped.velocity -= 2.4;
            tapped.spin.x += 3;
            addRipple(tapped.mesh.position.x, tapped.mesh.position.z, 0.7);

            return;
        }

        const hit = waterPoint();

        if (hit) {
            tossTo(hit);
        } else {
            toss();
        }
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', onClick);

    const resize = () => {
        const { width, height } = container.getBoundingClientRect();

        if (width && height) {
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let frame = 0;
    let lastTime = performance.now();
    let isOnScreen = true;
    let hasRendered = false;

    const update = (delta: number) => {
        elapsed += delta;
        uniforms.uTime.value = elapsed;

        pointer.lerp(pointerTarget, 1 - Math.exp(-delta * 3));
        camera.position.set(cameraBase.x + pointer.x * 0.28, cameraBase.y + pointer.y * 0.05, cameraBase.z);
        camera.rotation.set(-pitch, -pointer.x * 0.018, 0);
        uniforms.uCamera.value.copy(camera.position);

        let count = 0;

        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            const { mesh } = ball;

            mesh.rotation.x += ball.spin.x * delta;
            mesh.rotation.y += ball.spin.y * delta;

            if (ball.flight) {
                const progress = Math.min((elapsed - ball.flight.start) / ball.flight.duration, 1);

                mesh.position.lerpVectors(ball.flight.from, ball.flight.to, progress);
                mesh.position.y += Math.sin(progress * Math.PI) * 0.55;

                if (progress >= 1) {
                    splash(ball.flight.to, ball.radius);
                    ball.flight = null;
                    ball.velocity = -3;
                    ball.spin.multiplyScalar(0.12);
                }
            } else {
                ball.velocity += (-ball.offset * 26 - ball.velocity * 3.4) * delta;
                ball.offset += ball.velocity * delta;
                ball.spin.multiplyScalar(ball.spin.length() > 0.28 ? 1 - delta * 1.6 : 1);
                mesh.position.y = ball.rest + ball.offset + Math.sin(elapsed * 0.9 + ball.phase) * ball.radius * 0.05;
                mesh.position.x += Math.sin(elapsed * 0.27 + ball.phase) * delta * 0.012;
            }

            if (ball.leaving !== null) {
                ball.leaving -= delta;
                mesh.scale.setScalar(ball.radius * Math.max(ball.leaving / 0.7, 0));

                if (ball.leaving <= 0) {
                    scene.remove(mesh);
                    (mesh.material as THREE.Material).dispose();
                    balls.splice(i, 1);
                    tossed.splice(tossed.indexOf(ball), 1);
                    continue;
                }
            }

            if (count < MAX_BALLS) {
                const visibility = ball.flight ? 0 : 1;

                uniforms.uBalls.value[count].set(mesh.position.x, mesh.position.z, ball.radius, visibility);
                uniforms.uBallColors.value[count].copy(ball.color);
                count++;
            }
        }

        uniforms.uBallCount.value = count;

        let dropletsMoved = false;

        for (let i = 0; i < DROPLETS * 3; i += 3) {
            if (dropletPositions[i + 1] > -5) {
                dropletVelocities[i + 1] -= 9.5 * delta;
                dropletPositions[i] += dropletVelocities[i] * delta;
                dropletPositions[i + 1] += dropletVelocities[i + 1] * delta;
                dropletPositions[i + 2] += dropletVelocities[i + 2] * delta;

                if (dropletPositions[i + 1] < 0) {
                    dropletPositions[i + 1] = -10;
                }

                dropletsMoved = true;
            }
        }

        if (dropletsMoved) {
            dropletGeometry.attributes.position.needsUpdate = true;
        }
    };

    let slowFrames = 0;
    let sampledFrames = 0;

    /** Slower devices trade sharpness for smoothness: under about 30 fps, render fewer pixels. */
    const adaptQuality = (frameSeconds: number) => {
        // A very long gap means the tab was throttled or paused, not that it is slow.
        if (frameSeconds > 0.25) {
            return;
        }

        sampledFrames++;
        slowFrames += frameSeconds > 1 / 30 ? 1 : 0;

        if (sampledFrames < 60) {
            return;
        }

        const pixelRatio = renderer.getPixelRatio();

        if (slowFrames > 36 && pixelRatio > 0.75) {
            renderer.setPixelRatio(Math.max(pixelRatio * 0.7, 0.75));
            resize();
        }

        sampledFrames = 0;
        slowFrames = 0;
    };

    const loop = (now: number) => {
        frame = requestAnimationFrame(loop);

        const frameSeconds = (now - lastTime) / 1000;
        const delta = Math.min(frameSeconds, 0.1);
        lastTime = now;

        if (!isOnScreen || document.hidden) {
            return;
        }

        adaptQuality(frameSeconds);
        update(delta);
        renderer.render(scene, camera);

        if (!hasRendered) {
            hasRendered = true;
            onReady();
        }
    };

    const visibility = new IntersectionObserver(([entry]) => {
        isOnScreen = entry.isIntersecting;
    });
    visibility.observe(container);

    const onContextLost = (event: Event) => {
        event.preventDefault();
        onFailure();
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    frame = requestAnimationFrame(loop);

    return {
        toss,
        dispose: () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            visibility.disconnect();
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerleave', onPointerLeave);
            canvas.removeEventListener('click', onClick);
            canvas.removeEventListener('webglcontextlost', onContextLost);

            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                    (object.material as THREE.Material).dispose();
                }
            });
            geometry.dispose();
            marbleGeometry.dispose();
            padGeometry.dispose();
            water.geometry.dispose();
            dropletGeometry.dispose();
            dimples.dispose();
            environment.dispose();
            pmrem.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            canvas.remove();
        },
    };
}
