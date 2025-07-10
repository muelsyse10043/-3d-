// main.js
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let shaderProgram;
let objects = [];
let selectedObject = null;
let watermark = '';
let lightIntensity = 1.0;
const lightPosition = [4, 4, -3];
let axes;
let xAxisBuffers, yAxisBuffers, zAxisBuffers;

// 初始化WebGL
function main() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    initShaders();
    initAxes();
    setupEventListeners();
    
    function render() {
        updateCamera();
        drawScene();
        requestAnimationFrame(render);
    }
    render();
}

// 初始化坐标轴
function initAxes() {
    axes = createAxisLines();
    xAxisBuffers = initAxisBuffers(axes.xAxis);
    yAxisBuffers = initAxisBuffers(axes.yAxis);
    zAxisBuffers = initAxisBuffers(axes.zAxis);
}

// 设置事件监听器
function setupEventListeners() {
    // 摄像机控制
    document.addEventListener('keydown', (e) => { keys[e.key] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    
    let dragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    canvas.addEventListener('mousedown', (e) => {
        dragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener('mouseup', () => { dragging = false; });
    canvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        camera.yaw += deltaX * camera.sensitivity;
        camera.pitch -= deltaY * camera.sensitivity;
        if (camera.pitch > Math.PI / 2) camera.pitch = Math.PI / 2;
        if (camera.pitch < -Math.PI / 2) camera.pitch = -Math.PI / 2;
    });

    // 光照强度滑块
    document.getElementById('lightIntensity').addEventListener('input', (e) => {
        lightIntensity = parseFloat(e.target.value);
    });

    // 添加物体按钮
    document.getElementById('add-cube').addEventListener('click', () => addObject('cube'));
    document.getElementById('add-sphere').addEventListener('click', () => addObject('sphere'));
    document.getElementById('add-cylinder').addEventListener('click', () => addObject('cylinder'));

    // 物体属性输入
    document.querySelectorAll('#controls input').forEach(input => {
        input.addEventListener('input', updateObjectProperties);
    });
}

main();