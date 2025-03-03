const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let shaderProgram;
let objects = [];
let selectedObject = null;
let watermark = '';
let lightIntensity = 1.0; // 全局光照强度
// 使用一个全局变量记录光源位置（不再绘制小球）
const lightPosition = [4, 4, -3];

// -------------------------
// 摄像机系统
// -------------------------
const camera = {
  position: [0, 0, 10],
  yaw: -Math.PI / 2, // 初始朝向沿负 Z 轴
  pitch: 0,
  up: [0, 1, 0],
  speed: 0.2,         // 移动速度
  sensitivity: 0.005, // 鼠标灵敏度
  getViewMatrix: function() {
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
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

// 鼠标拖动调整视角
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

// 更新摄像机位置（W/S 前后，A/D 左右，Q/E 上下）
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

// 监听光照强度滑块变化
document.getElementById('lightIntensity').addEventListener('input', (e) => {
  lightIntensity = parseFloat(e.target.value);
});

// -------------------------
// 着色器部分
// -------------------------
const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec3 a_normal;
  uniform mat4 u_modelViewMatrix;
  uniform mat4 u_projectionMatrix;
  uniform mat3 u_normalMatrix;
  varying vec3 v_normal;
  varying vec3 v_position;
  void main(void) {
    vec4 pos = u_modelViewMatrix * a_position;
    gl_Position = u_projectionMatrix * pos;
    v_position = pos.xyz;
    v_normal = u_normalMatrix * a_normal;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform int u_isLight;
  uniform vec3 u_emissiveColor;
  uniform vec3 u_objectColor;
  uniform vec3 u_lightPosition;
  uniform vec3 u_lightColor;
  varying vec3 v_normal;
  varying vec3 v_position;
  void main(void) {
    if(u_isLight == 1) {
      gl_FragColor = vec4(u_emissiveColor, 1.0);
    } else {
      vec3 normal = normalize(v_normal);
      vec3 lightDir = normalize(u_lightPosition - v_position);
      float diff = max(dot(normal, lightDir), 0.0);
      vec3 diffuse = diff * u_lightColor;
      vec3 finalColor = u_objectColor * diffuse;
      gl_FragColor = vec4(finalColor, 1.0);
    }
  }
`;

function initShaders() {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
  }

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Shader program link error:', gl.getProgramInfoLog(shaderProgram));
  }
  gl.useProgram(shaderProgram);
}

// -------------------------
// 物体几何数据生成
// -------------------------
function createCube() {
  const vertices = new Float32Array([
    -1, -1, -1,   1, -1, -1,   1,  1, -1,  -1,  1, -1, // front
    -1, -1,  1,  -1,  1,  1,   1,  1,  1,   1, -1,  1, // back
    -1,  1, -1,   1,  1, -1,   1,  1,  1,  -1,  1,  1, // top
    -1, -1, -1,  -1, -1,  1,   1, -1,  1,   1, -1, -1, // bottom
     1, -1, -1,   1, -1,  1,   1,  1,  1,   1,  1, -1, // right
    -1, -1, -1,  -1,  1, -1,  -1,  1,  1,  -1, -1,  1  // left
  ]);
  const normals = new Float32Array([
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ]);
  const indices = new Uint16Array([
     0, 1, 2,   0, 2, 3,
     4, 5, 6,   4, 6, 7,
     8, 9, 10,  8, 10, 11,
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
    vertices.push(radius * cosTheta, -height/2, radius * sinTheta);
    normals.push(cosTheta, 0, sinTheta);
    vertices.push(radius * cosTheta, height/2, radius * sinTheta);
    normals.push(cosTheta, 0, sinTheta);
  }
  for (let i = 0; i < segments; i++) {
    const p1 = i * 2, p2 = p1 + 1, p3 = p1 + 2, p4 = p1 + 3;
    indices.push(p1, p2, p3);
    indices.push(p2, p4, p3);
  }
  const topCenterIndex = vertices.length / 3;
  vertices.push(0, height/2, 0);
  normals.push(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const theta = i * 2 * Math.PI / segments;
    vertices.push(radius * Math.cos(theta), height/2, radius * Math.sin(theta));
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(topCenterIndex, topCenterIndex + i + 1, topCenterIndex + i + 2);
  }
  const bottomCenterIndex = vertices.length / 3;
  vertices.push(0, -height/2, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i++) {
    const theta = i * 2 * Math.PI / segments;
    vertices.push(radius * Math.cos(theta), -height/2, radius * Math.sin(theta));
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(bottomCenterIndex, bottomCenterIndex + i + 2, bottomCenterIndex + i + 1);
  }
  return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint16Array(indices), size: 1, position: [0, 0, -5], rotation: [0, 0, 0], isLight: false };
}

// -------------------------
// 添加物体
// -------------------------
function addObject(type) {
  let newObj;
  if (type === 'cube') newObj = createCube();
  else if (type === 'sphere') newObj = createSphere();
  else if (type === 'cylinder') newObj = createCylinder();
  newObj.position = [
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10 - 10
  ];
  objects.push(newObj);
  selectedObject = newObj;
  updateObjectProperties();
}

function updateObjectProperties() {
  if (!selectedObject) return;
  selectedObject.size = parseFloat(document.getElementById('size').value);
  selectedObject.position[0] = parseFloat(document.getElementById('positionX').value);
  selectedObject.position[1] = parseFloat(document.getElementById('positionY').value);
  selectedObject.position[2] = parseFloat(document.getElementById('positionZ').value);
  selectedObject.rotation[0] = parseFloat(document.getElementById('rotationX').value) * Math.PI / 180;
  selectedObject.rotation[1] = parseFloat(document.getElementById('rotationY').value) * Math.PI / 180;
  selectedObject.rotation[2] = parseFloat(document.getElementById('rotationZ').value) * Math.PI / 180;
}

// -------------------------
// 绘制物体及场景
// -------------------------
function initBuffers(obj) {
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.indices, gl.STATIC_DRAW);

  return { vertexBuffer, normalBuffer, indexBuffer };
}

function drawObject(obj) {
  const buffers = initBuffers(obj);
  const posLoc = gl.getAttribLocation(shaderProgram, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posLoc);

  const normalLoc = gl.getAttribLocation(shaderProgram, 'a_normal');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  let modelMatrix = mat4.create();
  mat4.translate(modelMatrix, modelMatrix, obj.position);
  mat4.scale(modelMatrix, modelMatrix, [obj.size, obj.size, obj.size]);
  mat4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
  mat4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
  mat4.rotateZ(modelMatrix, modelMatrix, obj.rotation[2]);

  const viewMatrix = camera.getViewMatrix();
  const mvMatrix = mat4.create();
  mat4.multiply(mvMatrix, viewMatrix, modelMatrix);

  const pMatrix = mat4.create();
  mat4.perspective(pMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

  const normalMatrix = mat3.create();
  mat3.fromMat4(normalMatrix, mvMatrix);
  mat3.invert(normalMatrix, normalMatrix);
  mat3.transpose(normalMatrix, normalMatrix);

  const modelViewMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix');
  const projectionMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_projectionMatrix');
  const normalMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_normalMatrix');
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, mvMatrix);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
  gl.uniformMatrix3fv(normalMatrixLoc, false, normalMatrix);

  const isLightLoc = gl.getUniformLocation(shaderProgram, 'u_isLight');
  const objectColorLoc = gl.getUniformLocation(shaderProgram, 'u_objectColor');
  const emissiveColorLoc = gl.getUniformLocation(shaderProgram, 'u_emissiveColor');
  const lightPositionLoc = gl.getUniformLocation(shaderProgram, 'u_lightPosition');
  const lightColorLoc = gl.getUniformLocation(shaderProgram, 'u_lightColor');

  gl.uniform3fv(lightPositionLoc, lightPosition);
  gl.uniform3fv(lightColorLoc, [lightIntensity, lightIntensity, lightIntensity]);

  if (obj.isLight) {
    gl.uniform1i(isLightLoc, 1);
    gl.uniform3fv(emissiveColorLoc, [1.0, 1.0, 0.8]);
  } else {
    gl.uniform1i(isLightLoc, 0);
    gl.uniform3fv(objectColorLoc, [0.5, 0.3, 0.4]);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
  gl.drawElements(gl.TRIANGLES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.LINES, obj.indices.length, gl.UNSIGNED_SHORT, 0);
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  objects.forEach(obj => drawObject(obj));
  // 不再绘制表示光源的小球
}

// -------------------------
// OBJ 导出与水印
// -------------------------
function exportObj() {
  let objString = '';
  let vertexOffset = 0;
  objects.forEach(obj => {
    for (let i = 0; i < obj.vertices.length; i += 3) {
      const x = obj.vertices[i], y = obj.vertices[i+1], z = obj.vertices[i+2];
      const transformedVertex = transformVertex([x, y, z], obj);
      objString += `v ${transformedVertex[0]} ${transformedVertex[1]} ${transformedVertex[2]}\n`;
    }
    for (let i = 0; i < obj.indices.length; i += 3) {
      const v1 = obj.indices[i] + 1 + vertexOffset;
      const v2 = obj.indices[i+1] + 1 + vertexOffset;
      const v3 = obj.indices[i+2] + 1 + vertexOffset;
      objString += `f ${v1} ${v2} ${v3}\n`;
    }
    vertexOffset += obj.vertices.length / 3;
  });
  objString += `# Watermark: ${watermark}\n`;
  const blob = new Blob([objString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scene_with_watermark.obj';
  link.click();
  URL.revokeObjectURL(url);
}

function extractWatermark(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const content = event.target.result;
    const watermarkMatch = content.match(/# Watermark: (.*)/);
    if (watermarkMatch) {
      alert(`Extracted Watermark: ${watermarkMatch[1]}`);
    } else {
      alert('No watermark found in the model.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('export').addEventListener('click', () => {
  watermark = document.getElementById('watermark').value;
  exportObj();
});

document.getElementById('uploadModel').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) extractWatermark(file);
});

document.getElementById('extractWatermark').addEventListener('click', () => {
  const fileInput = document.getElementById('uploadModel');
  if (fileInput.files.length > 0) extractWatermark(fileInput.files[0]);
  else alert('Please upload a model file first.');
});

function transformVertex(vertex, obj) {
  const [x, y, z] = vertex;
  const transformed = [x * obj.size, y * obj.size, z * obj.size];
  let rotated = vec3.create();
  vec3.rotateX(rotated, transformed, [0, 0, 0], obj.rotation[0]);
  vec3.rotateY(rotated, rotated, [0, 0, 0], obj.rotation[1]);
  vec3.rotateZ(rotated, rotated, [0, 0, 0], obj.rotation[2]);
  rotated[0] += obj.position[0];
  rotated[1] += obj.position[1];
  rotated[2] += obj.position[2];
  return rotated;
}

// -------------------------
// 主程序入口
// -------------------------
function main() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.8, 0.8, 0.8, 1.0);
  gl.enable(gl.DEPTH_TEST);
  initShaders();

  document.getElementById('add-cube').addEventListener('click', () => addObject('cube'));
  document.getElementById('add-sphere').addEventListener('click', () => addObject('sphere'));
  document.getElementById('add-cylinder').addEventListener('click', () => addObject('cylinder'));

  document.querySelectorAll('#controls input').forEach(input => {
    input.addEventListener('input', updateObjectProperties);
  });

  function render() {
    updateCamera();
    drawScene();
    requestAnimationFrame(render);
  }
  render();
}

main();
