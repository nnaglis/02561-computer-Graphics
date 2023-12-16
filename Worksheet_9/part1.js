"use strict";

var canvas;
var gl;
var program;
var program2;

var numVertices = 6;

var texSize = 1;

//var flag = true;

var near = 0.1;
var far = 100.0;

var fovy = 90.0; // Field-of-view in Y direction angle (in degrees)
var aspect = 1.0; // Viewport aspect ratio

var texture0;
var texture1;

var g_tex_ready = 0;

// Create a checkerboard pattern using floats

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var lightCenter = vec4(0.0, 2.0, -2.0, 0.0);
var m;
var radius = 2.0;
var theta = 0.0;

//Create texture coordinates (−1.5, 0.0), (2.5, 0.0), (2.5, 10.0),(−1.5, 10.0)
var texCoord = [vec2(0.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0)];

var vertices = [
    vec4(-2.0, -1.0, -1.0, 1.0),
    vec4(-2.0, -1.0, -5.0, 1.0),
    vec4(2.0, -1.0, -5.0, 1.0),
    vec4(2.0, -1.0, -1.0, 1.0),
];

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMat, normalMatrixLoc;

var model;

var lightPosition = vec4(-1.0, -1.0, -1.0, 0.0);
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var rotationAngle = 0.0;
var motion = false;

var kd = vec4(1.0, 1.0, 1.0, 1.0);
var ka = vec4(0.0, 0.0, 0.0, 1.0);
var ks = vec4(1.0, 1.0, 1.0, 1.0);
var shininess = 255.078431;

var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var vertexColors = [
    vec4(1.0, 1.0, 1.0, 1.0), // white
];

var cBuffer;
var vBuffer;
var tBuffer;
var vColor;
var vPosition;
var vTexCoord;

window.onload = init;

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.3, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    // gl.enable(gl.CULL_FACE); // Enable face culling
    // gl.cullFace(gl.BACK);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    quad(1, 0, 3, 2);

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    initTexture0();
    initTexture1();

    const ext = gl.getExtension("OES_element_index_uint");
    if (!ext) {
        console.log("Warning: Unable to use an extension");
    }

    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");
    initObject("teapot.obj", 0.25);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    document.getElementById("Motion").addEventListener("click", function () {
        motion = !motion;
    });

    m = mat4(); // Shadow projection matrix initially an identity matrix
    m[3][3] = 0.0;
    m[3][1] = -1.0 / 3.0001;
    render();
}

function initTexture0() {
    var normalMap = "textures/xamp23.png";
    var image = document.createElement("img");
    image.crossOrigin = "anonymous";
    image.onload = function (event) {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        texture0 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        ++g_tex_ready;
    };
    image.src = normalMap;
}

function initTexture1() {
    texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        1,
        1,
        0,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
}

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[0]);
    texCoordsArray.push(texCoord[3]);
}

function setMaterial() {
    var ambientProduct = mult(lightAmbient, ka);
    gl.uniform4fv(
        gl.getUniformLocation(program2, "ambientProduct"),
        flatten(ambientProduct)
    );

    var diffuseProduct = mult(lightDiffuse, kd);
    gl.uniform4fv(
        gl.getUniformLocation(program2, "diffuseProduct"),
        flatten(diffuseProduct)
    );

    var specularProduct = mult(lightSpecular, ks);
    gl.uniform4fv(
        gl.getUniformLocation(program2, "specularProduct"),
        flatten(specularProduct)
    );

    gl.uniform1f(gl.getUniformLocation(program2, "shininess"), shininess);
}

function initObject(obj_filename, scale) {
    program2.vPosition = gl.getAttribLocation(program2, "vPosition");
    program2.vNormal = gl.getAttribLocation(program2, "vNormal");
    program2.vColor = gl.getAttribLocation(program2, "vColor");
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    model = initVertexBuffers();
    // Start reading the OBJ file
    readOBJFile(obj_filename, gl, model, scale, true);
    return model;
}

function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status !== 404) {
            onReadOBJFile(
                request.responseText,
                fileName,
                gl,
                model,
                scale,
                reverse
            );
        }
    };
    request.open("GET", fileName, true); // Create a request to acquire the file
    request.send(); // Send the request
}

var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model

// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
        g_objDoc = null;
        g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

function initVertexBuffers() {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(program2.vPosition, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(program2.vNormal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(program2.vColor, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (
        !o.vertexBuffer ||
        !o.normalBuffer ||
        !o.colorBuffer ||
        !o.indexBuffer
    ) {
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return o;
}

function createEmptyArrayBuffer(a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    if (!buffer) {
        console.log("Failed to create the buffer object");
        return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0); // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment

    return buffer;
}

function onReadComplete(model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderPot();
    renderPlane();

    requestAnimFrame(render);
};

function renderPlane() {
    if (g_tex_ready < 1) {
        requestAnimFrame(render);
        return;
    }
    gl.useProgram(program);
    gl.depthFunc(gl.LESS);
    theta += 0.01;
    var lightPosition = vec4(
        Math.sin(theta) * 2,
        2.0,
        Math.cos(theta) * 2 - 2,
        1.0
    );

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    // update visibility in fragment shader
    gl.uniform1f(gl.getUniformLocation(program, "visibility"), 1.0);


    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
}

function renderPot() {
    if (g_objDoc != null && g_objDoc.isMTLComplete()) {
        // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(model, g_objDoc);
        g_objDoc = null;
    }
    if (!g_drawingInfo) {
        return;
    }
    gl.useProgram(program2);
    setMaterial();
    gl.uniform4fv(
        gl.getUniformLocation(program2, "lightPosition"),
        flatten(lightPosition)
    );
    normalMatrixLoc = gl.getUniformLocation(program2, "normalMatrix");
    if (motion) {
        rotationAngle += 0.005;
    }
    var yPos = 0.75 * Math.sin(rotationAngle) - 0.25;

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, yPos, -3.0));

    normalMat = normalMatrix(modelViewMatrix, true);

    projectionMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program2, "modelViewMatrix"),
        false,
        flatten(modelViewMatrix)
    );
    gl.uniformMatrix4fv(
        gl.getUniformLocation(program2, "projectionMatrix"),
        false,
        flatten(projectionMatrix)
    );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMat));

    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.vertexAttribPointer(program2.vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program2.vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.vertexAttribPointer(program2.vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program2.vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.vertexAttribPointer(program2.vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program2.vColor);

    // Draw
    gl.drawElements(
        gl.TRIANGLES,
        g_drawingInfo.indices.length,
        gl.UNSIGNED_INT,
        0
    );
    // gl.drawArrays( gl.TRIANGLES, 0, g_drawingInfo.indices.length );
}
