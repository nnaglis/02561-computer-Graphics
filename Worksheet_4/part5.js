"use strict";

var canvas;
var gl;
var program;


var pointsArray = [];
var colors = [];
var normalsArray = [];

var lightDirection = vec4(0.0, 0.0, -1.0, 1.0);
var lightEmittance = vec4(0.0, 0.0, 0.0, 1.0);
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var rotationAngle = 0.0;

var kd = vec4( 0.5, 0.5, 0.5, 1.0);
var ka = vec4( 0.5, 0.5, 0.5, 1.0);
var ks = vec4( 0.5, 0.5, 0.5, 1.0);
var shininess = 500.0;



const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var near = 0.1;
var far = 10;
var fovy = 45;

var viewMatrix;
var translationMatrix, translationMatrix2, translationMatrix3;
var translationMatrixLoc;
var viewMatrixLoc;
var modelMatrixLoc;
var modelMatrix = [];

var numTimesToSubdivide = 3;

var maxNumSubdivisions = 10;


window.onload = function init()
{
    /** @type {WebGLRenderingContext} */
    canvas = document.getElementById( "gl-canvas" );

    gl = setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Tetrahedron vertices
    var va = vec4(0.0, 0.0, 1.0, 1);
    var vb = vec4(0.0, 0.942809, -0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1);

    // Function to draw terahedron
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var aspect =  canvas.width/canvas.height;


    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE); // Enable face culling
    gl.cullFace(gl.BACK);  

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    updateBuffers();

    gl.uniform4fv( gl.getUniformLocation(program,"lightDirection"),flatten(lightDirection) );



    

    
    // setting up eye 
    var eye = vec3(-2.0, 2.0, -4.0);

    // var pMatrix = ortho(left, right, bottom, ytop, near, far);
    var pMatrix = perspective(fovy, aspect, near, far);

    translationMatrixLoc = gl.getUniformLocation(program, "translationMatrix");
    

    viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );
    viewMatrix = lookAt( eye, at, up );

    modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );

    var projectionMatrix = gl.getUniformLocation( program, "projectionMatrix" );
    gl.uniformMatrix4fv( projectionMatrix, false, flatten(pMatrix) );


    document.getElementById("incSubButton").addEventListener("click", function () {
        numTimesToSubdivide+=1;
        pointsArray = [];
        normalsArray = [];
        colors = [];
        tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
        updateBuffers();
    }
    );

    document.getElementById("decSubButton").addEventListener("click", function () {
        if (numTimesToSubdivide > 0)
        {
            numTimesToSubdivide-=1;
            pointsArray = [];
            normalsArray = [];
            colors = [];
            tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
            updateBuffers();
        }
    }
    );

    function updateBuffers() {
        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
        var vColor = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
    
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        var nBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
        var vNormal = gl.getAttribLocation( program, "vNormal" );
        gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vNormal);
    }

    updateKa(0.7);
    updateKd(0.5);
    updateKs(0.3);
    updateShine(500.0);
    updateLe(1.0);

    render();
}


function tetrahedron(a, b, c, d, n)
{
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count)
{
  if (count > 0) {
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);
    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
}
else {
    triangle(a, b, c);
  }
}

function triangle(a, b, c){
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    //colors as 0.5 * a + 0.5
    colors.push(vec4(0.5 * a[0] + 0.5, 0.5 * a[1] + 0.5, 0.5 * a[2] + 0.5, 1.0));
    colors.push(vec4(0.5 * b[0] + 0.5, 0.5 * b[1] + 0.5, 0.5 * b[2] + 0.5, 1.0));
    colors.push(vec4(0.5 * c[0] + 0.5, 0.5 * c[1] + 0.5, 0.5 * c[2] + 0.5, 1.0));

    normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
  }


function applyRotation(matrix, angle, axis)
{
    //translate to origin
    matrix = mult(matrix, translate(0.5, 0.5, 0.5));
    //rotate
    matrix = mult(matrix, rotate(angle, axis));
    //translate back
    matrix = mult(matrix, translate(-0.5, -0.5, -0.5));
    return matrix;
}

function updateLe(value)
{
    lightSpecular = vec4(value, value, value, 1.0);
    lightAmbient = vec4(value, value, value, 1.0);
    lightDiffuse = vec4(value, value, value, 1.0);

    var ambientProduct = mult(lightAmbient, ka);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));

    var diffuseProduct = mult(lightDiffuse, kd);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));

    var specularProduct = mult(lightSpecular, ks);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
}

function updateKa(value)
{
    
    
    
    ka = vec4(value,value, value, 1.0);
    var ambientProduct = mult(lightAmbient, ka);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));

}

function updateKd(value)
{
    kd = vec4(value, value, value, 1.0);
    var diffuseProduct = mult(lightDiffuse, kd);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));
}

function updateKs(value)
{
    ks = vec4(value, value, value, 1.0);
    var specularProduct = mult(lightSpecular, ks);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));
}

function updateShine(value)
{
    shininess = value;
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),shininess);
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotationAngle += 0.01;
    var radius = 3.0;
    var eyeX = radius * Math.sin(rotationAngle);
    var eyeZ = radius * Math.cos(rotationAngle);
    viewMatrix = lookAt(
        vec3(eyeX, 0.0, eyeZ),  // Eye position in Cartesian coordinates
        at,
        up
    );
    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix));
    modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(translationMatrixLoc, false, flatten(translate(0,0,0)));
    
    gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );
    requestAnimFrame(render);


}


/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}