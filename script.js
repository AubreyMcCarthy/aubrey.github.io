// Hello person checking out my source code
// bear in mind I am a game developer, 
// not a web developer. Please enjoy your stay

var isPaused = false;
let wiggleSpeed = 2;
let acceleration = 0.001;
let scrollMultiplier = -5;

var darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
let backgroundColorLight = new Float32Array([21 / 255, 96 / 255, 100 / 255, 1]);
let foregroundColorLight = new Float32Array([251 / 255, 250 / 255, 248 / 255, 1]);

let backgroundColorDark = new Float32Array([27 / 255, 29 / 255, 31 / 255, 1]);
let foregroundColorDark = new Float32Array([7 / 255, 9 / 255, 11 / 255, 1]);


const smallDeviceWidth = 768;

let body = document.querySelector('body');

window.onload = function () {
	var canvas = document.getElementById('glCanvas');
	var gl = canvas.getContext('webgl2');

	if (!gl) {
		console.error('Unable to initialize WebGL 2.0. Your browser may not support it.');
		return;
	}

	function setPause(value) {
		isPaused = value;
		if (!isPaused) {
			requestAnimationFrame(render); // Resume rendering loop
		}
		previousRenderTime = performance.now();
	}

	// canvas.addEventListener('mouseover', function () {
	// 	setPause(false);
	// });
	// canvas.addEventListener('mouseout', function () {
	// 	setPause(true);
	// });

	let sidebarBg = document.getElementById('sidebar-bg');
	// sidebarBg.addEventListener('mouseover', function () {
	// 	setPause(false);
	// });
	// sidebarBg.addEventListener('mouseout', function () {
	// 	setPause(true);
	// });

	// Vertex shader code
	var vertexShaderSource = `#version 300 es
        in vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

	// Fragment shader code
	var fragmentShaderSource = `#version 300 es
        precision mediump float;
        uniform float u_time;
        uniform vec4 u_resolution;
        uniform vec4 u_backgroundColor;
        uniform vec4 u_foregroundColor;
        out vec4 fragColor;
        float easeOutCirc(float x) {
            return sqrt(1.0 - pow(x - 1.0, 2.0));
        }
        float easeOutExpo(float x) {
            return x >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * x);
        }
        float ease(float x) {
            // return easeOutCirc(x);
            return easeOutExpo(x);
        }
        float sampleWave(vec2 uv) {
            float wave = uv.x + ease(sin(uv.y * 1.15 + u_time * 0.5) * 0.5 + 0.5) * 0.05*2.0;
            // float wave = uv.x + sin(uv.y * 1.1 + u_time * 0.5) * 0.05;
            wave += sin( uv.y * 6.9 + u_time * 0.7 )* 0.03*2.0;
            // wave += ease(sin( uv.y * 8.9 + u_time * 0.7 ) * 0.5 + 0.5) * 0.03;
            return wave;
            // wave -= 0.5;
            // return ( wave / fwidth( wave ) );
        }
        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            float wave = sampleWave(uv);
            // vec3 offset = vec3(u_resolution.zw, 0) * 0.5;
            // float wave = sampleWave(uv)
            //     + sampleWave(uv + offset.xz)
            //     + sampleWave(uv + offset.xy)
            //     + sampleWave(uv + offset.zy) 
            //     * 0.25;
            wave -= 0.25;
            // wave = clamp( wave / fwidth( wave ), 0.0, 1.0 );
            // wave = smoothstep(0.45,0.55,wave);
            wave = clamp(wave * 1.5, 0.0, 1.0);
            wave = 1.0 - ease(wave);

            // vec3 result = mix(
            //     // vec3(137.0/256.0, 173.0/256.0, 174.0/256.0), // fade to green #89ADAE
            //     // vec3(235.0/256.0, 152.0/256.0, 185.0/256.0), // fade to pink #EB98B9
            //     // vec3(243.0/256.0, 201.0/256.0, 217.0/256.0),    // fade to light pink #F3C9D9
            //     // vec3(247.0/256.0, 226.0/256.0, 233.0/256.0),    // fade to lighter pink #F7E2E9
            //     // vec3(0.6980392156862745, 0.4470588235294118, 0.5803921568627451), // fade to grey magenta
            //     vec3(0.9137254901960784, 0.8470588235294118, 0.8745098039215686), // fade to light grey magenta
            //     vec3(251.0/256.0, 250.0/256.0, 248.0/256.0),
            //     ease(uv.y)
            // );
            // vec3 result = vec3(251.0/255.0, 250.0/255.0, 248.0/255.0);
            vec3 result = u_foregroundColor.xyz;
            
            result = mix(
                // vec3(22.0/256.0, 96.0/256.0, 100.0/256.0),
                u_backgroundColor.xyz,
                result,
                wave
            );
            fragColor = vec4(result, 1.0);
        }
    `;

	// Create shaders
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	// Create program
	var program = createProgram(gl, vertexShader, fragmentShader);

	// Set up attributes and uniforms
	var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
	var resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
	var timeUniformLocation = gl.getUniformLocation(program, 'u_time');
	var backgroundColorUniformLocation = gl.getUniformLocation(program, 'u_backgroundColor');
	var foregroundColorUniformLocation = gl.getUniformLocation(program, 'u_foregroundColor');

	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	var positions = [
		-1.0, -1.0,
		1.0, -1.0,
		-1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		1.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	function createShader(gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function createProgram(gl, vertexShader, fragmentShader) {
		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
			return null;
		}

		return program;
	}

	var previousRenderTime = performance.now();
	var elapsedTime = -Math.random() * 17000;
	var speed = 0;
	let titleDiv = document.getElementById('first-section-title');
	var offset = 0;
	function render(currentTime) {
		if (window.innerWidth < smallDeviceWidth) {
			previousRenderTime = currentTime;
			return;
		}

		let rect = titleDiv.getBoundingClientRect();
		// console.log('title div is ' + rect.right)
		sidebarBg.setAttribute("style", "width:" + rect.right + "px");
		canvas.setAttribute("style", "left:" + rect.right + "px");

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program);

		var delta = 0;
		if (!isPaused || speed > 0) {
			delta = currentTime - previousRenderTime;
			elapsedTime += delta * speed;
		}
		gl.uniform1f(timeUniformLocation, (elapsedTime + window.scrollY * scrollMultiplier) / 1000 * wiggleSpeed);
		// gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
		gl.uniform4f(resolutionUniformLocation, canvas.width, canvas.height, 1.0 / canvas.width, 1.0 / canvas.height);

		gl.uniform4fv(foregroundColorUniformLocation,
			darkMode ? foregroundColorDark : foregroundColorLight);
		gl.uniform4fv(backgroundColorUniformLocation,
			darkMode ? backgroundColorDark : backgroundColorLight);

		gl.bindVertexArray(vao);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		previousRenderTime = currentTime;

		speed += delta * acceleration * (isPaused ? -1 : 1);
		// speed = min(1, max(speed, 0));
		if (speed > 1)
			speed = 1;
		if (speed < 0)
			speed = 0;


		if (!isPaused || speed > 0) {
			requestAnimationFrame(render);
		}
	}

	function requestRender() {
		if (window.innerWidth < smallDeviceWidth) {
			return;
		}
		requestAnimationFrame(render);
	}

	requestRender();

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		darkMode = event.matches;
		requestRender();
	});

	body.onresize = (event) => {
		requestRender();
	};
	// body.addEventListener("resize", (event) => {
	// 	requestRender();
	// });

	// var previousScroll = window.screenY;
	body.onscroll = (event) => {
		requestRender();
	};
};

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
	coll[i].addEventListener("click", function () {
		this.classList.toggle("active");
		var content = this.nextElementSibling;
		if (content.style.maxHeight) {
			this.innerHTML = "More...";
			content.style.maxHeight = null;
		} else {
			this.innerHTML = "Less...";
			content.style.maxHeight = content.scrollHeight + "px";
		}
	});
}

function updateImage(slider, el) {
	let clip = slider.value * 0.01 * el.offsetWidth;
	el.style.clip = "rect(0px, " + clip + "px, 100000px, 0px)";

	// slider.style.top = el.offsetHeight / 2 + "px";
}

document.querySelectorAll('.slider').forEach((slider) => {
	updateImage(slider, slider.nextElementSibling);
	slider.onresize
});


// body.addEventListener("resize", (event) => {
// 	document.querySelectorAll('.slider').forEach((slider) => {
// 		updateImage(slider, slider.nextElementSibling);
// 	})
// });

// const myObserver = new ResizeObserver(entries => {
// 	// this will get called whenever div dimension changes
// 	entries.forEach(entry => {
// 		console.log('width', entry.contentRect.width);
// 		console.log('height', entry.contentRect.height);
// 		updateImage(entry, entry.nextElementSibling);
// 	});
// });

// document.querySelectorAll('.slider').forEach((slider) => {
// 	// updateImage(slider, slider.nextElementSibling);
// 	myObserver.observe(slider);
// })

// // myObserver.disconnect();