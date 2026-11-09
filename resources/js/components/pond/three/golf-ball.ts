import * as THREE from 'three';

/** Golf ball colors from the client's artwork. */
export const GOLF_BALL_COLORS = {
    blue: 0x0b4fe0,
    yellow: 0xf7b500,
    green: 0x12b31c,
    purple: 0x7f1fd6,
    orange: 0xf0540a,
    red: 0xd90f1e,
    white: 0xeef2f8,
} as const;

/**
 * A bump map of hexagonally packed dimples. Rows hold fewer dimples toward the
 * poles, and each is stretched sideways, so they stay round once wrapped on a sphere.
 */
export function createDimpleTexture(): THREE.CanvasTexture {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    const rows = 24;
    const radius = (height / rows) * 0.56;

    for (let row = 0; row <= rows; row++) {
        const y = (row / rows) * height;
        const stretch = Math.max(Math.cos(((row / rows) - 0.5) * Math.PI), 0.12);
        const count = Math.max(Math.round(48 * stretch), 1);

        for (let column = 0; column < count; column++) {
            const x = ((column + (row % 2) * 0.5) / count) * width;

            context.save();
            context.translate(x, y);
            context.scale(1 / stretch, 1);

            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, '#454545');
            gradient.addColorStop(0.72, '#6e6e6e');
            gradient.addColorStop(1, '#ffffff');
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(0, 0, radius, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;

    return texture;
}

export function createGolfBallMaterial(color: number, dimples: THREE.Texture): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.42,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        bumpMap: dimples,
        bumpScale: 2.2,
        envMapIntensity: 0.7,
    });
}
