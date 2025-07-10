// objects.js
function addObject(type) {
    let newObj;
    if (type === 'cube') {
        newObj = createCube();
        newObj.name = 'Cube';
    } else if (type === 'sphere') {
        newObj = createSphere();
        newObj.name = 'Sphere';
    } else if (type === 'cylinder') {
        newObj = createCylinder();
        newObj.name = 'Cylinder';
    }
    newObj.position = [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 - 10
    ];
    objects.push(newObj);
    selectedObject = newObj;
    updateObjectProperties();
    updateObjectList();
}

function loadObjectProperties() {
    if (!selectedObject) return;
    document.getElementById('size').value = selectedObject.size;
    document.getElementById('positionX').value = selectedObject.position[0];
    document.getElementById('positionY').value = selectedObject.position[1];
    document.getElementById('positionZ').value = selectedObject.position[2];
    document.getElementById('rotationX').value = (selectedObject.rotation[0] * 180 / Math.PI).toFixed(1);
    document.getElementById('rotationY').value = (selectedObject.rotation[1] * 180 / Math.PI).toFixed(1);
    document.getElementById('rotationZ').value = (selectedObject.rotation[2] * 180 / Math.PI).toFixed(1);
}

function updateObjectList() {
    const listContainer = document.getElementById('objectItems');
    listContainer.innerHTML = '';
    objects.forEach((obj, index) => {
        const li = document.createElement('li');
        if (obj === selectedObject) {
            li.classList.add('selected');
        }

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = obj.name;
        nameInput.addEventListener('change', (e) => {
            obj.name = e.target.value;
        });
        li.appendChild(nameInput);

        const selectBtn = document.createElement('button');
        selectBtn.textContent = '选中';
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedObject = obj;
            loadObjectProperties();
            updateObjectList();
        });
        li.appendChild(selectBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            objects.splice(index, 1);
            if (selectedObject === obj) {
                selectedObject = null;
            }
            updateObjectList();
        });
        li.appendChild(deleteBtn);

        li.addEventListener('click', () => {
            selectedObject = obj;
            loadObjectProperties();
            updateObjectList();
        });

        listContainer.appendChild(li);
    });
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