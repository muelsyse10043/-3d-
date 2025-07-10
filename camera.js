// camera.js
const camera = {
    position: [5, 5, 5],
    yaw: Math.atan2(-5, -5),
    pitch: Math.asin(-5 / Math.sqrt(5 * 5 + 5 * 5 + 5 * 5)),
    up: [0, 1, 0],
    speed: 0.2,
    sensitivity: 0.005,
    getViewMatrix: function () {
        const front = [
            Math.cos(this.pitch) * Math.cos(this.yaw),
            Math.sin(this.pitch),
            Math.cos(this.pitch) * Math.sin(this.yaw)
        ];
        let frontNormalized = vec3.create();
        vec3.normalize(frontNormalized, front);
        const target = vec3.create();
        vec3.add(target, this.position, frontNormalized);
        let view = mat4.create();
        mat4.lookAt(view, this.position, target, this.up);
        return view;
    }
};

const keys = {};

function updateCamera() {
    let front = vec3.fromValues(
        Math.cos(camera.pitch) * Math.cos(camera.yaw),
        Math.sin(camera.pitch),
        Math.cos(camera.pitch) * Math.sin(camera.yaw)
    );
    vec3.normalize(front, front);
    let right = vec3.create();
    vec3.cross(right, front, camera.up);
    vec3.normalize(right, right);
    
    if (keys['w'] || keys['W']) {
        let delta = vec3.create();
        vec3.scale(delta, front, camera.speed);
        vec3.add(camera.position, camera.position, delta);
    }
    if (keys['s'] || keys['S']) {
        let delta = vec3.create();
        vec3.scale(delta, front, camera.speed);
        vec3.sub(camera.position, camera.position, delta);
    }
    if (keys['a'] || keys['A']) {
        let delta = vec3.create();
        vec3.scale(delta, right, camera.speed);
        vec3.sub(camera.position, camera.position, delta);
    }
    if (keys['d'] || keys['D']) {
        let delta = vec3.create();
        vec3.scale(delta, right, camera.speed);
        vec3.add(camera.position, camera.position, delta);
    }
    if (keys['q'] || keys['Q']) {
        camera.position[1] -= camera.speed;
    }
    if (keys['e'] || keys['E']) {
        camera.position[1] += camera.speed;
    }
}