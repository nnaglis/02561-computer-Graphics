"use strict";

var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

var wire_indices;

const at = vec3(0.3, 0.4, 0.5);
const up = vec3(0.0, 1.0, 0.0);

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;
var near = 0.1;
var far = 4;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    // gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    
    // setting up eye to have isometric view
    var eye = vec3(2.0, 2.0, 2.0);


    var pMatrix = ortho(left, right, bottom, ytop, near, far);

    var modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    var modelViewMatrix = lookAt( eye, at, up );
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix));

    var projection = gl.getUniformLocation( program, "projection" );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

    render();
}

function colorCube()
{
    quad (0, 1, 1, 2, 2, 3, 3, 0);
    quad (2, 3, 3, 7, 7, 6, 6, 2);
    quad (0, 3, 3, 7, 7, 4, 4, 0);
    quad (1, 2, 2, 6, 6, 5, 5, 1);
    quad (4, 5, 5, 6, 6, 7, 7, 4);
    quad (0, 1, 1, 5, 5, 4, 4, 0);
}

function quad(a, b, c, d, e, f, g, h)
{
    var vertices = [
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0),
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(1.0, 1.0, 0.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0)
    ];
    
    

    var vertexColors = [
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
    ];
    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, d, e, f, g, h ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);

    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.LINES, 0, points.length );
}