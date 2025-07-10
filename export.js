// export.js

// 下载OBJ模型
function exportOBJ() {
    let objText = '';
    let vertexOffset = 0;

    objects.forEach(obj => {
        const vertices = obj.vertices;
        const indices = obj.indices;
        const modelMatrix = mat4.create();

        mat4.translate(modelMatrix, modelMatrix, obj.position);
        mat4.scale(modelMatrix, modelMatrix, [obj.size, obj.size, obj.size]);
        mat4.rotateX(modelMatrix, modelMatrix, obj.rotation[0]);
        mat4.rotateY(modelMatrix, modelMatrix, obj.rotation[1]);
        mat4.rotateZ(modelMatrix, modelMatrix, obj.rotation[2]);

        for (let i = 0; i < vertices.length; i += 3) {
            const v = vec4.fromValues(vertices[i], vertices[i + 1], vertices[i + 2], 1.0);
            vec4.transformMat4(v, v, modelMatrix);
            objText += `v ${v[0]} ${v[1]} ${v[2]}\n`;
        }

        for (let i = 0; i < indices.length; i += 3) {
            const a = indices[i] + 1 + vertexOffset;
            const b = indices[i + 1] + 1 + vertexOffset;
            const c = indices[i + 2] + 1 + vertexOffset;
            objText += `f ${a} ${b} ${c}\n`;
        }

        vertexOffset += vertices.length / 3;
    });

    const blob = new Blob([objText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.obj';
    a.click();
    URL.revokeObjectURL(url);
}

// 保存项目为JSON
function saveProject() {
    const sceneData = objects.map(obj => ({
        type: obj.name.toLowerCase(),
        size: obj.size,
        position: obj.position,
        rotation: obj.rotation
    }));

    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene_project.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 打开项目文件并还原场景
function openProjectFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
        if (input.files.length === 0) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                objects.length = 0;
                data.forEach(item => {
                    let obj;
                    if (item.type === 'cube') obj = createCube();
                    else if (item.type === 'sphere') obj = createSphere();
                    else if (item.type === 'cylinder') obj = createCylinder();
                    else return;
                    obj.name = item.type.charAt(0).toUpperCase() + item.type.slice(1);
                    obj.size = item.size;
                    obj.position = item.position;
                    obj.rotation = item.rotation;
                    objects.push(obj);
                });
                selectedObject = null;
                updateObjectList();
            } catch (err) {
                alert('导入失败：文件格式错误。');
            }
        };
        reader.readAsText(file);
    });
    input.click();
}

// 显示帮助信息
function showHelp() {
    alert(
        "🛠 使用帮助：\n\n" +
        "👉 添加物体：点击左侧按钮添加立方体、球体或圆柱体。\n" +
        "👉 选择物体：点击右侧“选中”按钮，在左侧对物体进行编辑。\n" +
        "👉 下载模型：导出当前场景的模型为OBJ格式。\n" +
        "👉 保存项目：将当前场景保存为JSON文件，供后续导入。\n" +
        "👉 打开项目：导入之前保存的项目文件以恢复模型。\n\n" +
        "😊 如果有任何疑问和建议，请加微信cong275624215！🐱"
    );
}


document.getElementById('downloadObject').addEventListener('click', exportOBJ);
document.getElementById('saveProject').addEventListener('click', saveProject);
document.getElementById('openProject').addEventListener('click', openProjectFile);
document.getElementById('showHelp').addEventListener('click', showHelp);