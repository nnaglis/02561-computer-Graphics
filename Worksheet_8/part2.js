"use strict";

var canvas;
var gl;
var program;

var numVertices  = 6;


var texSize = 1;

//var flag = true;

var near = 0.1;
var far = 100.0;


var  fovy = 90.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect = 1.0;       // Viewport aspect ratio



var texture0;
var texture1;

var g_tex_ready = 0;

// Create a checkerboard pattern using floats



var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var lightCenter = vec4(0.0, 2.0, -2.0, 0.0 );
var m;
var radius = 2.0;
var theta  = 0.0;


//Create texture coordinates (−1.5, 0.0), (2.5, 0.0), (2.5, 10.0),(−1.5, 10.0)
var texCoord = [
    vec2( 0.0, 1.0 ),
    vec2( 0.0, 0.0 ),
    vec2( 1.0, 0.0 ),
    vec2( 1.0, 1.0 )
];



var vertices = [
    vec4( -2.0, -1.0, -1.0, 1.0 ),
    vec4( -2.0, -1.0, -5.0, 1.0 ),
    vec4( 2.0, -1.0, -5.0, 1.0 ),
    vec4( 2.0, -1.0, -1.0, 1.0 ),

    vec4( 0.25, -0.5, -1.25, 1.0),
    vec4( 0.25, -0.5, -1.75, 1.0),
    vec4( 0.75, -0.5, -1.75, 1.0),
    vec4( 0.75, -0.5, -1.25, 1.0),

    vec4( -1.0, 0.0, -2.5, 1.0),
    vec4( -1.0, 0.0, -3.0, 1.0),
    vec4( -1.0, -1.0, -3.0, 1.0),
    vec4( -1.0, -1.0, -2.5, 1.0),

    
    
];


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta

    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];
window.onload = init;

function initTexture0 ()
{
    var normalMap = 'textures/xamp23.png';
    var image = document.createElement('img');
    image.crossOrigin = 'anonymous';
    image.onload = function(event)
    {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        texture0 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        ++g_tex_ready;
        // gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    };
    image.src = normalMap;
}

function initTexture1() {
    texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    // gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
};

function quad(a, b, c, d) {

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[1]);
     texCoordsArray.push(texCoord[3]);
}


function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.3, 1.0 );

    // gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE); // Enable face culling
    // gl.cullFace(gl.BACK);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    quad( 1, 0, 3, 2 );
    quad( 5, 4, 7, 6 );
    quad( 9, 8, 11, 10 );


    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    initTexture0();
    initTexture1();


    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    m = mat4();    // Shadow projection matrix initially an identity matrix
    m[3][3] = 0.0;
    m[3][1] = -1.0/(3.0);
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT);
    if(g_tex_ready < 1) {
        requestAnimFrame(render);
        return;
    }
    theta += 0.01;

    var lightPositionX = Math.sin(theta)*radius+lightCenter[0];
    var lightPositionZ = Math.cos(theta)*radius+lightCenter[2];
    var lightPosition = vec3(lightPositionX, 2.0, lightPositionZ);

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    //change the texture to the red texture
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);

    // Model-view matrix for shadow then render
    var modelViewMatrix2 = mult(modelViewMatrix, translate(lightPosition[0], lightPosition[1],lightPosition[2]));
    modelViewMatrix2 = mult(modelViewMatrix2, m);
    modelViewMatrix2 = mult(modelViewMatrix2, translate(-lightPosition[0],-lightPosition[1], -lightPosition[2]));
    console.log(modelViewMatrix);
    console.log(m);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false,flatten(modelViewMatrix2));

    gl.drawArrays( gl.TRIANGLES, 6, numVertices );
    gl.drawArrays( gl.TRIANGLES, 12, numVertices );

    gl.uniformMatrix4fv(modelViewMatrixLoc, false,flatten(modelViewMatrix));
    gl.drawArrays( gl.TRIANGLES, 6, numVertices );
    gl.drawArrays( gl.TRIANGLES, 12, numVertices );

    requestAnimFrame(render);
}