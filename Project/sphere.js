"use strict";

var canvas;
var gl;
var program;


var pointsArray = [];
var colors = [];
var normalsArray = [];

var lightDirection = vec4(0.0, 1.0, -1.0, 1.0);
var lightEmittance = vec4(0.6, 0.6, 0.0, 1.0);
var lightDiffusion;

var rotationAngle = 0.0;

var kd = vec4( 0.15, 0.4, 0.0, 1.0);



const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var near = 0.1;
var far = 10;
var fovy = 45;

var viewMatrix;
var translationMatrix;
var translationMatrixLoc;
var viewMatrixLoc;
var modelMatrixLoc;
var modelMatrix = [];

var numTimesToSubdivide = 3;

var maxNumSubdivisions = 10;

//controllable values
var layerCount = 10;
var layerRadius = 0.006;

var maxLayerCount = 10;
var layerData = [];


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


    // Enable blending
    gl.enable(gl.BLEND);

    gl.depthFunc(gl.LESS);

    // Set the blend function
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.blendEquation(gl.FUNC_ADD);


    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    updateBuffers();

    gl.uniform4fv( gl.getUniformLocation(program,"lightDirection"),flatten(lightDirection) );

    function generateRandomNoise(width, height, minValue, maxValue) {
        var noiseArray = new Array(width * height);
    
        for (var i = 0; i < width * height; i++) {
            // Generate random value between minValue and maxValue
            noiseArray[i] = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        }
    
        return noiseArray;
    }

         
        // Example usage
        var width = 512;
        var height = 512;
        var minValue = 1;
        var maxValue = 255;

    var randomNoise = generateRandomNoise(width, height, minValue, maxValue);
    

    var texture = gl.createTexture();
    console.log(randomNoise);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    var typedRandomNoise = new Uint8Array(randomNoise); // Convert to Uint8Array
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, typedRandomNoise);
    
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

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotationAngle += 0.003;
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

    gl.uniform1f(gl.getUniformLocation(program, "threshhold"), 0.0);
    gl.uniform1f(gl.getUniformLocation(program, "layer"), 0.7);
    updateBuffers();
    gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );
    // create a copy of the points array
    var pointsArray2 = pointsArray.slice();
    
    for (var i = 1; i < layerCount; i++) {
        var layerThreshold = i*(1.0/layerCount);
        gl.uniform1f(gl.getUniformLocation(program, "threshhold"), layerThreshold);
        gl.uniform1f(gl.getUniformLocation(program, "layer"), (i/layerCount));
        // replace points array with the new layer
        pointsArray = increaseSphereRadius(layerRadius, i, pointsArray2)
        updateBuffers();
        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    }
    // reset points array to original
    pointsArray = pointsArray2.slice();

    requestAnimFrame(render);


}

function increaseSphereRadius(layerRadius, layerCount, points)
{
    var radiusIncrease = layerRadius * layerCount;
    var newPointsArray = [];
    for (var i = 0; i < points.length; i++) {
        var x = points[i][0];
        var y = points[i][1];
        var z = points[i][2];

        var radius = Math.sqrt(x * x + y * y + z * z);

        var newX = x/radius * (radius+radiusIncrease);

        var newY = y/radius * (radius+radiusIncrease);
        var newZ = z/radius * (radius+radiusIncrease);
        newPointsArray.push(vec4(newX, newY, newZ, 1.0));
    }
    return newPointsArray;
}

function updateBuffers() {

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

gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
   flatten(kd) );


render();
}


function updateLayerCount(value)
{
    layerCount = value;
}

function updateLayerRadius(value)
{
    layerRadius = value;
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}