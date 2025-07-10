// geometries.js
function createCube() {
    const vertices = new Float32Array([
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, // front
        -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1, // back
        -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, // top
        -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1, // bottom
        1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, // right
        -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1  // left
    ]);
    const normals = new Float32Array([
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ]);
    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        8, 9, 10, 8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ]);
    return { vertices, normals, indices, size: 1, position: [0, 0, -5], rotation: [0, 0, 0], isLight: false };
}

function createSphere(radius = 1, latitudeBands = 30, longitudeBands = 30) {
    const vertices = [], normals = [], indices = [];
    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let long = 0; long <= longitudeBands; long++) {
            const phi = long * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            const x = cosPhi * sinTheta, y = cosTheta, z = sinPhi * sinTheta;
            vertices.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
        }
    }
    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let long = 0; long < longitudeBands; long++) {
            const first = (lat * (longitudeBands + 1)) + long;
            const second = first + longitudeBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint16Array(indices), size: 1, position: [0, 0, -5], rotation: [0, 0, 0], isLight: false };
}

function createCylinder(radius = 1, height = 2, segments = 30) {
    const vertices = [], normals = [], indices = [];
    for (let i = 0; i <= segments; i++) {
        const theta = i * 2 * Math.PI / segments;
        const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
        vertices.push(radius * cosTheta, -height / 2, radius * sinTheta);
        normals.push(cosTheta, 0, sinTheta);
        vertices.push(radius * cosTheta, height / 2, radius * sinTheta);
        normals.push(cosTheta, 0, sinTheta);
    }
    for (let i = 0; i < segments; i++) {
        const p1 = i * 2, p2 = p1 + 1, p3 = p1 + 2, p4 = p1 + 3;
        indices.push(p1, p2, p3);
        indices.push(p2, p4, p3);
    }
    const topCenterIndex = vertices.length / 3;
    vertices.push(0, height / 2, 0);
    normals.push(0, 1, 0);
    for (let i = 0; i <= segments; i++) {
        const theta = i * 2 * Math.PI / segments;
        vertices.push(radius * Math.cos(theta), height / 2, radius * Math.sin(theta));
        normals.push(0, 1, 0);
    }
    for (let i = 0; i < segments; i++) {
        indices.push(topCenterIndex, topCenterIndex + i + 1, topCenterIndex + i + 2);
    }
    const bottomCenterIndex = vertices.length / 3;
    vertices.push(0, -height / 2, 0);
    normals.push(0, -1, 0);
    for (let i = 0; i <= segments; i++) {
        const theta = i * 2 * Math.PI / segments;
        vertices.push(radius * Math.cos(theta), -height / 2, radius * Math.sin(theta));
        normals.push(0, -1, 0);
    }
    for (let i = 0; i < segments; i++) {
        indices.push(bottomCenterIndex, bottomCenterIndex + i + 2, bottomCenterIndex + i + 1);
    }
    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint16Array(indices), size: 1, position: [0, 0, -5], rotation: [0, 0, 0], isLight: false };
}