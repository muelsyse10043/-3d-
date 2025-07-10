// shaders.js
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