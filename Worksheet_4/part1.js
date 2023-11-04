"use strict";

var canvas;
var gl;


var pointsArray = [];
var colors = [];


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

var numTimesToSubdivide = 5;

var maxNumSubdivisions = 10;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
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

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    updateBuffers();

    
    // setting up eye 
    var eye = vec3(0.5, 0.5, 6.0);

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
    }


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
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    colors.push(vec4(0.0, 1.0, 0.0, 1.0));
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
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

    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix));
    modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(translationMatrixLoc, false, flatten(translate(0,0,0)));
    
    gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );
    requestAnimFrame(render);


}
