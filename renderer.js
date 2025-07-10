// renderer.js
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
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    objects.forEach(obj => drawObject(obj));
    drawAxis(xAxisBuffers, axes.xAxis.indices.length, [1, 0, 0]);
    drawAxis(yAxisBuffers, axes.yAxis.indices.length, [0, 0.7, 0]);
    drawAxis(zAxisBuffers, axes.zAxis.indices.length, [0, 0, 1]);
}