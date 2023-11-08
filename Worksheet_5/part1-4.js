"use strict";

var canvas;
var gl;
var program;
var model;
var aspect;

var lightPosition = vec4(0.0, -1.0, -1.0, 0.0);
var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var rotationAngle = 0.0;

var kd = vec4( 1.0, 1.0, 1.0, 1.0);
var ka = vec4( 0.0, 0.0, 0.0, 1.0);
var ks = vec4( 1.0, 1.0, 1.0, 1.0);
var shininess = 255.078431;

var eye = vec3(0.0, 0.0, 0.0);
const at = vec3(0.0, 10.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var near = 0.1;
var far = 80;
var fovy = 45;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var normalMat, normalMatrixLoc;



window.onload = function init()
{
    /** @type {WebGLRenderingContext} */
    canvas = document.getElementById( "gl-canvas" );

    gl = setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    aspect =  canvas.width/canvas.height;


    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE); // Enable face culling
    // gl.cullFace(gl.BACK);  
    const ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
      console.log('Warning: Unable to use an extension');
    }

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    gl.program = program;

    gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),flatten(lightPosition) );

    setMaterial();
    // setting up eye 
    // gl.uniform3fv(gl.getUniformLocation(program, "eye"),flatten(normalize(eye)));

    // var pMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // viewMatrix = lookAt( eye, at, up );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    console.log(modelViewMatrixLoc);
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    console.log(projectionMatrixLoc);
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    initObject("Zddd.obj", 1.0);



    var tick = function() {   // Start drawing
        render();
        requestAnimationFrame(tick, canvas);
      };
    tick();
}

function setMaterial() {
    var ambientProduct = mult(lightAmbient, ka);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct));

    var diffuseProduct = mult(lightDiffuse, kd);
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct));

    var specularProduct = mult(lightSpecular, ks);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct));

    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);
}

function initObject(obj_filename, scale)
{ 
    program.vPosition = gl.getAttribLocation(program, 'vPosition');
    program.vNormal = gl.getAttribLocation(program, 'vNormal');
    program.vColor = gl.getAttribLocation(program, 'vColor');
    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    model = initVertexBuffers();
    // Start reading the OBJ file 
    readOBJFile(obj_filename, gl, model, scale, true);
    return model;
}

// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
  
    request.onreadystatechange = function() {
      if (request.readyState === 4 && request.status !== 404) {
        onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
      }
    }
    request.open('GET', fileName, true); // Create a request to acquire the file
    request.send();                      // Send the request
  }
  
  var g_objDoc = null;      // The information of OBJ file
  var g_drawingInfo = null; // The information for drawing 3D model
  
  // OBJ File has been read
  function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse); // Parse the file
    if (!result) {
      g_objDoc = null; g_drawingInfo = null;
      console.log("OBJ file parsing error.");
      return;
    }
    g_objDoc = objDoc;
  }

  function initVertexBuffers() {
    var o = new Object(); // Utilize Object object to return multiple buffer objects
    o.vertexBuffer = createEmptyArrayBuffer(program.vPosition, 3, gl.FLOAT); 
    o.normalBuffer = createEmptyArrayBuffer(program.vNormal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(program.vColor, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) { return null; }
  
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return o;
  }
// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return null;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);  // Assign the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment
  
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
    

function render()
{
    if (g_objDoc != null && g_objDoc.isMTLComplete()){ // OBJ and all MTLs are available
        g_drawingInfo = onReadComplete(model, g_objDoc);
        g_objDoc = null;
      }
    if (!g_drawingInfo) 
    {
        return;
    }
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotationAngle += 0.01;
    var radius = 30.0;
    eye[0]= radius * Math.sin(rotationAngle);
    eye[2] =radius * Math.cos(rotationAngle);
    modelViewMatrix = lookAt(
        vec3(eye[0], 30.0, eye[2]),  // Eye position in Cartesian coordinates
        at,
        up
    );


    normalMat = normalMatrix(modelViewMatrix, true);

    projectionMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMat) );
    
    // Draw
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
}


/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}