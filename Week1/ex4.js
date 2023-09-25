var gl;
var theta;
var thetaLoc;

window.onload = function init() {

    /** @type {WebGLRenderingContext} */
    var canvas = document.getElementById("canvas")
    gl = setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    //
    // Generate points
    //
    points = [];
    points.push(vec2(0, 0.5));
    points.push(vec2(-0.5, 0));
    points.push(vec2(0.5, 0));
    points.push(vec2(0, -0.5));

    


    ///
    /// Generate colors
    ///
    var pointColors = [];
    pointColors.push(vec4(1.0, 0.0, 0.0));
    pointColors.push(vec4(0.0, 1.0, 0.0));
    pointColors.push(vec4(0.0, 0.0, 1.0));
    pointColors.push(vec4(1.0, 1.0, 0.0));


    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    ///
    /// Rotation and centering
    ///
    theta = 0.0;

    thetaLoc = gl.getUniformLocation(program, "theta");
    gl.uniform1f(thetaLoc, theta);

    // Load the data into the GPU

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointColors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    
    render();
};


function render() {
    theta += 0.02;
    gl.uniform1f(thetaLoc, theta);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, points.length);
    requestAnimFrame(render);
}


/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}