"use strict";

var canvas;
var gl;
var program;

var pointsArray = [];
var quadPointsArray = [];
var quadNormalsArray =[];
var colors = [];
var normalsArray = [];

var lightDirection = vec4(0.0, 0.0, -1.0, 1.0);
var lightEmittance = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffusion;

var rotationAngle = 0.0;

var kd = vec4(1.0, 1.0, 1.0, 1.0);

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var near = 0.1;
var far = 40;
var fovy = 80;

var viewMatrix;
var translationMatrix;
var projectionMatrix;
var projectionMatrixLoc;
var translationMatrixLoc;
var viewMatrixLoc;
var modelMatrixLoc;
var M_TexLoc;
var modelMatrix = [];

var numTimesToSubdivide = 3;

var maxNumSubdivisions = 10;

var g_tex_ready = 0;

var vertices = [
    vec4( -1, -1, 0.999, 1 ),
    vec4( -1, 1, 0.999, 1 ),
    vec4( 1, 1, 0.999, 1 ),
    vec4( 1, -1, 0.999, 1 )
];

var cBuffer;
var vBuffer;
var nBuffer;

var cBuffer2;
var vBuffer2;
var nBuffer2;



window.onload = function init() {
    /** @type {WebGLRenderingContext} */
    canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Tetrahedron vertices
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    // Function to draw terahedron
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    quad( 0,3,2,1);

    var aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); // Enable face culling
    gl.cullFace(gl.BACK);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    cBuffer = gl.createBuffer();
    vBuffer = gl.createBuffer();
    nBuffer = gl.createBuffer();

    cBuffer2 = gl.createBuffer();
    vBuffer2 = gl.createBuffer();
    nBuffer2 = gl.createBuffer();

    

    updateBuffers();

    gl.uniform4fv(
        gl.getUniformLocation(program, "lightDirection"),
        flatten(lightDirection)
    );

    initTexture();
    initBumpMap();
    // setting up eye
    var eye = vec3(-2.0, 2.0, -4.0);

    projectionMatrix = perspective(fovy, aspect, near, far);

    translationMatrixLoc = gl.getUniformLocation(program, "translationMatrix");

    M_TexLoc = gl.getUniformLocation(program, "M_Tex");

    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    viewMatrix = lookAt(eye, at, up);

    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    

    document
        .getElementById("incSubButton")
        .addEventListener("click", function () {
            numTimesToSubdivide += 1;
            pointsArray = [];
            normalsArray = [];
            colors = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            updateBuffers();
        });

    document
        .getElementById("decSubButton")
        .addEventListener("click", function () {
            if (numTimesToSubdivide > 0) {
                numTimesToSubdivide -= 1;
                pointsArray = [];
                normalsArray = [];
                colors = [];
                tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
                updateBuffers();
            }
        });

    gl.uniform4fv(
        gl.getUniformLocation(program, "diffuseProduct"),
        flatten(kd)
    );

    render();
};

function updateBuffers() {

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
}

function initTexture ()
{
var cubemap = ['textures/cm_left.png',// POSITIVE_X
    'textures/cm_right.png',  // NEGATIVE X
    'textures/cm_top.png', // POSITIVE_
    'textures/cm_bottom.png', // NEGATIVE_Y 
    'textures/cm_back.png' ,// POSITIVE_Z
    'textures/cm_front.png']; // NEGATIVE Z
gl.activeTexture(gl.TEXTURE0);
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR); 
gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
for(var i = 0; i < 6; ++i) {
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
    image.onload = function(event)
    {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        ++g_tex_ready;
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
    };
image.src = cubemap[i];
}
}

function initBumpMap ()
{
    var normalMap = 'textures/normalMap.png';
    var image = document.createElement('img');
    image.crossOrigin = 'anonymous';
    image.onload = function(event)
    {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE1);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        ++g_tex_ready;
        gl.uniform1i(gl.getUniformLocation(program, "bumpMap"), 1);
    };
    image.src = normalMap;
}


function quad(a, b, c, d) {

    quadPointsArray.push(vertices[a]);
    quadNormalsArray.push(vertices[a]);
    quadPointsArray.push(vertices[b]);
    quadNormalsArray.push(vertices[b]);
    quadPointsArray.push(vertices[c])
    quadNormalsArray.push(vertices[c]);
    quadPointsArray.push(vertices[a]);
    quadNormalsArray.push(vertices[a]);
    quadPointsArray.push(vertices[c]);
    quadNormalsArray.push(vertices[c]);
    quadPointsArray.push(vertices[d]);

    quadNormalsArray.push(vertices[d]);
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    //colors as 0.5 * a + 0.5
    colors.push(
        vec4(0.5 * a[0] + 0.5, 0.5 * a[1] + 0.5, 0.5 * a[2] + 0.5, 1.0)
    );
    colors.push(
        vec4(0.5 * b[0] + 0.5, 0.5 * b[1] + 0.5, 0.5 * b[2] + 0.5, 1.0)
    );
    colors.push(
        vec4(0.5 * c[0] + 0.5, 0.5 * c[1] + 0.5, 0.5 * c[2] + 0.5, 1.0)
    );

    normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
}

function applyRotation(matrix, angle, axis) {
    //translate to origin
    matrix = mult(matrix, translate(0.5, 0.5, 0.5));
    //rotate
    matrix = mult(matrix, rotate(angle, axis));
    //translate back
    matrix = mult(matrix, translate(-0.5, -0.5, -0.5));
    return matrix;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (g_tex_ready < 7) {
        window.requestAnimationFrame(render);
        return;
    }
    rotationAngle += 0.01;
    var radius = 10.0;
    var eyeX = radius * Math.sin(rotationAngle);
    var eyeZ = radius * Math.cos(rotationAngle);
    viewMatrix = lookAt(
        vec3(eyeX, 0.0, -eyeZ), // Eye position in Cartesian coordinates
        at,
        up
    );
    gl.uniform4fv(gl.getUniformLocation(program, "eyePosition"), flatten(vec4(eyeX, 0.0, -eyeZ, 1.0)));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    modelMatrix = mat4();
    //scale 
    modelMatrix = mult(modelMatrix, scalem(5.0, 5.0, 5.0));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(
        translationMatrixLoc,
        false,
        flatten(translate(0, 0, 0))
    );
    gl.uniformMatrix4fv(M_TexLoc, false, flatten(mat4(1)));
    updateBuffers();
    gl.uniform1i(gl.getUniformLocation(program, "reflective"), true);
    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);

    // extract rotation matrix from view matrix
    var invView = inverse(viewMatrix);
    var M_tex = mult(mat4(invView[0][0], invView[0][1], invView[0][2], 0, invView[1][0], invView[1][1], invView[1][2], 0, invView[2][0], invView[2][1], invView[2][2], 0, 0, 0, 0, 0), inverse(projectionMatrix));

    

    gl.uniformMatrix4fv(M_TexLoc, false, flatten(M_tex));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4(1)));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mat4(1)));
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat4(1)));
    gl.uniformMatrix4fv(translationMatrixLoc,false,flatten(mat4(1)));
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadPointsArray), gl.STATIC_DRAW);

    var vPosition2 = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition2);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadNormalsArray), gl.STATIC_DRAW);


    gl.uniform1i(gl.getUniformLocation(program, "reflective"), false);
    gl.drawArrays(gl.TRIANGLES, 0, quadPointsArray.length);
    
    requestAnimFrame(render);
}

/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
