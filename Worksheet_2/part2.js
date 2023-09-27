var gl;
var index;
var selectedColor;

// needed for the bufferdata function as i cannot change the size of the buffer
var maxNumPoints = 200;

window.onload = function init() {
    
    /** @type {WebGLRenderingContext} */
    var canvas = document.getElementById("canvas")
    gl = setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    //
    // Generate points
    //
    index =0;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    selectedColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxNumPoints*sizeof['vec2'], gl.STATIC_DRAW);
    gl.buffer
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxNumPoints*sizeof['vec4'], gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor);

    canvas.addEventListener("click", function(event) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

        // Get the offset of the canvas
        var rect = event.target.getBoundingClientRect()


        var t = vec2(-1 + 2 * (event.clientX - rect.left) / canvas.width, //- 2* rect.left / canvas.width,
                     -1 + 2 * (canvas.height - event.clientY + rect.top) / canvas.height);
 
        // Calculate the offset in bytes
        var offsetInBytes = sizeof['vec2'] * (index);
        // Update the buffer with the new data at the calculated offset
        gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(t));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        // Calculate the offset in bytes
        var offsetInBytes = sizeof['vec4'] * (index);
        gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(selectedColor));
        index++;
        
    });

    document.getElementById("clearButton").addEventListener("click", function() { 
        index = 0;
        gl.clearColor(selectedColor[0], selectedColor[1], selectedColor[2], selectedColor[3]);});

    document.getElementById("colors").onclick = function(event) {
        switch(event.target.index) {
        //black
          case 0:
            selectedColor = vec4(0.0, 0.0, 0.0, 1.0);
            break;
        //white
         case 1:
            selectedColor = vec4(1.0, 1.0, 1.0, 1.0);
            break;
        //yellow
         case 2:
            selectedColor = vec4(1.0, 1.0, 0.0, 1.0);
            break;
        //green
            case 3:
                selectedColor = vec4(0.0, 1.0, 0.0, 1.0);
                break;
        //blue
            case 4:
                selectedColor = vec4(0.0, 0.0, 1.0, 1.0);
                break;
        //red
            case 5:
                selectedColor = vec4(1.0, 0.0, 0.0, 1.0);
                break;
        //purple
            case 6:
                selectedColor = vec4(0.4157, 0.0510, 0.6784, 1.0);
                break;
       }
    };

    render();

};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, index);
    requestAnimFrame(render);
}


/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}



