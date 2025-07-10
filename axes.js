// axes.js
function createAxisLines() {
    const axisLength = 50;
    const tickSize = 0.1;

    // X轴数据
    const xAxisVertices = [];
    const xAxisIndices = [];
    xAxisVertices.push(-axisLength, 0, 0);
    xAxisVertices.push(axisLength, 0, 0);
    xAxisIndices.push(0, 1);
    for (let x = -axisLength; x <= axisLength; x++) {
        if (x === 0) continue;
        xAxisVertices.push(x, -tickSize, 0);
        xAxisVertices.push(x, tickSize, 0);
        xAxisIndices.push(xAxisIndices.length, xAxisIndices.length + 1);
        xAxisVertices.push(x, 0, -tickSize);
        xAxisVertices.push(x, 0, tickSize);
        xAxisIndices.push(xAxisIndices.length, xAxisIndices.length + 1);
    }

    // Y轴数据
    const yAxisVertices = [];
    const yAxisIndices = [];
    yAxisVertices.push(0, -axisLength, 0);
    yAxisVertices.push(0, axisLength, 0);
    yAxisIndices.push(0, 1);
    for (let y = -axisLength; y <= axisLength; y++) {
        if (y === 0) continue;
        yAxisVertices.push(-tickSize, y, 0);
        yAxisVertices.push(tickSize, y, 0);
        yAxisIndices.push(yAxisIndices.length, yAxisIndices.length + 1);
        yAxisVertices.push(0, y, -tickSize);
        yAxisVertices.push(0, y, tickSize);
        yAxisIndices.push(yAxisIndices.length, yAxisIndices.length + 1);
    }

    // Z轴数据
    const zAxisVertices = [];
    const zAxisIndices = [];
    zAxisVertices.push(0, 0, -axisLength);
    zAxisVertices.push(0, 0, axisLength);
    zAxisIndices.push(0, 1);
    for (let z = -axisLength; z <= axisLength; z++) {
        if (z === 0) continue;
        zAxisVertices.push(-tickSize, 0, z);
        zAxisVertices.push(tickSize, 0, z);
        zAxisIndices.push(zAxisIndices.length, zAxisIndices.length + 1);
        zAxisVertices.push(0, -tickSize, z);
        zAxisVertices.push(0, tickSize, z);
        zAxisIndices.push(zAxisIndices.length, zAxisIndices.length + 1);
    }

    return {
        xAxis: { vertices: new Float32Array(xAxisVertices), indices: new Uint16Array(xAxisIndices) },
        yAxis: { vertices: new Float32Array(yAxisVertices), indices: new Uint16Array(yAxisIndices) },
        zAxis: { vertices: new Float32Array(zAxisVertices), indices: new Uint16Array(zAxisIndices) }
    };
}

function initAxisBuffers(axis) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axis.vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, axis.indices, gl.STATIC_DRAW);

    return { vertexBuffer, indexBuffer };
}

function drawAxis(buffers, indexCount, color) {
    const posLoc = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(posLoc);

    const modelMatrix = mat4.create();
    const viewMatrix = camera.getViewMatrix();
    const mvMatrix = mat4.create();
    mat4.multiply(mvMatrix, viewMatrix, modelMatrix);

    const pMatrix = mat4.create();
    mat4.perspective(pMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

    const modelViewMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix');
    const projectionMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_projectionMatrix');
    const normalMatrixLoc = gl.getUniformLocation(shaderProgram, 'u_normalMatrix');

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, mvMatrix);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, pMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, mat3.create());

    const isLightLoc = gl.getUniformLocation(shaderProgram, 'u_isLight');
    const emissiveColorLoc = gl.getUniformLocation(shaderProgram, 'u_emissiveColor');

    gl.uniform1i(isLightLoc, 1);
    gl.uniform3fv(emissiveColorLoc, color);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
    gl.drawElements(gl.LINES, indexCount, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(isLightLoc, 0);
    gl.enable(gl.DEPTH_TEST);
}