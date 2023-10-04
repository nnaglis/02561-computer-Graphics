var gl;
var index;
var selectedColor;

var drawTriangles;
var drawCircles;
//define triangle vertices holding points (vec2)
var verticePoints = [];
var verticeColors= [];

// needed for the bufferdata function as i cannot change the size of the buffer
var maxNumPoints = 2000;
var circlePoints = 100;
var pointSize = 10.0;

window.onload = function init() {

    /** @type {WebGLRenderingContext} */
    var canvas = document.getElementById("canvas")
    gl = setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    //
    // Generate points
    //
    index = 0;
    drawTriangles = false;
    drawCircles = false;

    gl.viewport(0, 0, canvas.width, canvas.height);
    selectedColor = vec4(0.3921, 0.5843, 0.9294, 1.0);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxNumPoints * sizeof['vec2'], gl.STATIC_DRAW);
    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var vPointSize = gl.getAttribLocation(program, "vPointSize");
    gl.vertexAttribPointer(vPointSize, 1, gl.FLOAT, false, 0, 0);
    //set point size
    gl.vertexAttrib1f(vPointSize, pointSize);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxNumPoints * sizeof['vec4'], gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vColor);

    canvas.addEventListener("click", function (event) {
        

        // Get the offset of the canvas
        var rect = event.target.getBoundingClientRect()

        var points = [
            vec2(-1 + 2 * (event.clientX - rect.left - (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top + (pointSize / 2)) / canvas.height ),
            vec2(-1 + 2 * (event.clientX - rect.left - (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top - (pointSize / 2)) / canvas.height ),
            vec2(-1 + 2 * (event.clientX - rect.left + (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top + (pointSize / 2)) / canvas.height ),
            vec2(-1 + 2 * (event.clientX - rect.left + (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top - (pointSize / 2)) / canvas.height ),
            vec2(-1 + 2 * (event.clientX - rect.left - (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top - (pointSize / 2)) / canvas.height ),
            vec2(-1 + 2 * (event.clientX - rect.left + (pointSize / 2)) / canvas.width,
                -1 + 2 * (canvas.height - event.clientY + rect.top + (pointSize / 2)) / canvas.height ),
        ];
        // Calculate the offset in bytes
        for (var i = 0; i < points.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            var offsetInBytes = sizeof['vec2'] * (index);
            // Update the buffer with the new data at the calculated offset
            t = points[i];
            gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(t));

            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            // Calculate the offset in bytes
            var offsetInBytes = sizeof['vec4'] * (index);
            gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(selectedColor));
            index++;
        }
        if (drawTriangles)
        {
            t = vec2(-1 + 2 * (event.clientX - rect.left) / canvas.width,
            -1 + 2 * (canvas.height - event.clientY + rect.top) / canvas.height);
            verticePoints.push(t);
            verticeColors.push(selectedColor);
            if (verticePoints.length == 3)
            {
                index = index - (6*3);
                for (var i = 0; i < verticePoints.length; i++) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                    var offsetInBytes = sizeof['vec2'] * (index);
                    // Update the buffer with the new data at the calculated offset
                    t = verticePoints[i];
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(t));

                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                    // Calculate the offset in bytes
                    var offsetInBytes = sizeof['vec4'] * (index);
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(verticeColors[i]));
                    index++;
                }
                verticePoints = [];
                verticeColors = [];
            }
        }

        if(drawCircles)
        {
            t = vec2(-1 + 2 * (event.clientX - rect.left) / canvas.width,
            -1 + 2 * (canvas.height - event.clientY + rect.top) / canvas.height);
            verticePoints.push(t);
            verticeColors.push(selectedColor);
            if (verticePoints.length == 2)
            {
                index = index - (6*2);
                var radius = Math.sqrt(Math.pow(verticePoints[0][0] - verticePoints[1][0], 2) + Math.pow(verticePoints[0][1] - verticePoints[1][1], 2));
                var angle = 2 * Math.PI / circlePoints;
                for (var i = 0; i < circlePoints; i++) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                    var offsetInBytes = sizeof['vec2'] * (index);
                    // Update the buffer with the new data at the calculated offset
                    points = [];
                    points.push(verticePoints[0]);
                    points.push(vec2(verticePoints[0][0] + radius * Math.cos(angle * i), verticePoints[0][1] + radius * Math.sin(angle * i)));
                    points.push(vec2(verticePoints[0][0] + radius * Math.cos(angle * (i + 1)), verticePoints[0][1] + radius * Math.sin(angle * (i + 1))));
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(points));

                    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
                    // Calculate the offset in bytes
                    var offsetInBytes = sizeof['vec4'] * (index);
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, flatten(verticeColors[0]));
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes + sizeof['vec4'], flatten(verticeColors[1]));
                    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes + (2 * sizeof['vec4']), flatten(verticeColors[1]));
                    index+=3;
                }
                verticePoints = [];
                verticeColors = [];
            }
        }




    });

    document.getElementById("clearButton").addEventListener("click", function () {
        index = 0;
        gl.clearColor(selectedColor[0], selectedColor[1], selectedColor[2], selectedColor[3]);
    });

    document.getElementById("pointsButton").addEventListener("click", function () {
        drawTriangles = false;
        drawCircles = false;
        verticeColors = [];
        verticePoints = [];
    }
    );

    document.getElementById("trianglesButton").addEventListener("click", function () {
        drawTriangles = true;
        drawCircles = false;
    }
    );

    document.getElementById("circlesButton").addEventListener("click", function () {
        drawCircles = true;
        drawTriangles = false;
        verticeColors = [];
        verticePoints = [];
    }
    );


    document.getElementById("colors").onclick = function (event) {
        switch (event.target.index) {
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
    gl.drawArrays(gl.TRIANGLES, 0, index);
    requestAnimFrame(render);
}


/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}



