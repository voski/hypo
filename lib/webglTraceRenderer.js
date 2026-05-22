(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var WebGLTraceRenderer = Ace.WebGLTraceRenderer = function (canvas, options) {
		options = options || {};
		this.canvas = canvas;
		this.gl = canvas.getContext("webgl2", {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: false
		});

		if (!this.gl) {
			throw new Error("WebGL2 is unavailable");
		}

		this.cellSize = options.cellSize || 0.25;
		this.capacity = options.initialCapacity || 65536;
		this.count = 0;
		this.data = new Float32Array(this.capacity * WebGLTraceRenderer.FLOATS_PER_SAMPLE);
		this.sampleIndices = {};
		this.colorCache = {};
		this.dirtyStart = 0;
		this.dirtyEnd = 0;
		this.brushScale = options.brushScale || 1.35;
		this.brushSoftness = options.brushSoftness || 0.45;

		this.initialize();
	};

	WebGLTraceRenderer.FLOATS_PER_SAMPLE = 7;

	WebGLTraceRenderer.prototype.initialize = function () {
		var gl = this.gl;

		this.program = this.createProgram(
			WebGLTraceRenderer.VERTEX_SHADER,
			WebGLTraceRenderer.FRAGMENT_SHADER
		);
		this.locations = {
			origin: gl.getUniformLocation(this.program, "u_origin"),
			scale: gl.getUniformLocation(this.program, "u_scale"),
			viewportSize: gl.getUniformLocation(this.program, "u_viewportSize"),
			brushScale: gl.getUniformLocation(this.program, "u_brushScale"),
			brushSoftness: gl.getUniformLocation(this.program, "u_brushSoftness")
		};

		this.vertexArray = gl.createVertexArray();
		gl.bindVertexArray(this.vertexArray);

		this.cornerBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([
				0, 0,
				1, 0,
				0, 1,
				1, 1
			]),
			gl.STATIC_DRAW
		);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		this.instanceBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);

		var stride = WebGLTraceRenderer.FLOATS_PER_SAMPLE * 4;
		gl.enableVertexAttribArray(1);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 0);
		gl.vertexAttribDivisor(1, 1);

		gl.enableVertexAttribArray(2);
		gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 2 * 4);
		gl.vertexAttribDivisor(2, 1);

		gl.enableVertexAttribArray(3);
		gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 3 * 4);
		gl.vertexAttribDivisor(3, 1);

		gl.bindVertexArray(null);
		gl.disable(gl.DEPTH_TEST);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0, 0, 0, 1);
	};

	WebGLTraceRenderer.prototype.resize = function (width, height) {
		this.gl.viewport(0, 0, width, height);
	};

	WebGLTraceRenderer.prototype.clear = function () {
		this.count = 0;
		this.sampleIndices = {};
		this.dirtyStart = 0;
		this.dirtyEnd = 0;
		this.clearSurface();
	};

	WebGLTraceRenderer.prototype.clearSurface = function () {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	};

	WebGLTraceRenderer.prototype.add = function (sample) {
		var cellX = Math.floor(sample.x / this.cellSize);
		var cellY = Math.floor(sample.y / this.cellSize);
		var key = cellX + "," + cellY;
		var index = this.sampleIndices[key];

		if (typeof index === "undefined") {
			index = this.count;
			this.sampleIndices[key] = index;
			this.count += 1;
			this.ensureCapacity(this.count);
		}

		this.writeSample(index, sample);
		this.markDirty(index);
	};

	WebGLTraceRenderer.prototype.ensureCapacity = function (count) {
		if (count <= this.capacity) {
			return;
		}

		while (this.capacity < count) {
			this.capacity *= 2;
		}

		var nextData = new Float32Array(this.capacity * WebGLTraceRenderer.FLOATS_PER_SAMPLE);
		nextData.set(this.data);
		this.data = nextData;

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.data.byteLength, this.gl.DYNAMIC_DRAW);
		this.dirtyStart = 0;
		this.dirtyEnd = this.count;
	};

	WebGLTraceRenderer.prototype.writeSample = function (index, sample) {
		var offset = index * WebGLTraceRenderer.FLOATS_PER_SAMPLE;
		var color = this.parseColor(sample.color);

		this.data[offset] = sample.x;
		this.data[offset + 1] = sample.y;
		this.data[offset + 2] = sample.size || this.cellSize;
		this.data[offset + 3] = color[0];
		this.data[offset + 4] = color[1];
		this.data[offset + 5] = color[2];
		this.data[offset + 6] = color[3];
	};

	WebGLTraceRenderer.prototype.markDirty = function (index) {
		if (this.dirtyStart === this.dirtyEnd) {
			this.dirtyStart = index;
			this.dirtyEnd = index + 1;
			return;
		}

		this.dirtyStart = Math.min(this.dirtyStart, index);
		this.dirtyEnd = Math.max(this.dirtyEnd, index + 1);
	};

	WebGLTraceRenderer.prototype.uploadDirty = function () {
		if (this.dirtyStart === this.dirtyEnd) {
			return;
		}

		var start = this.dirtyStart * WebGLTraceRenderer.FLOATS_PER_SAMPLE;
		var end = this.dirtyEnd * WebGLTraceRenderer.FLOATS_PER_SAMPLE;
		var byteOffset = start * 4;

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
		this.gl.bufferSubData(
			this.gl.ARRAY_BUFFER,
			byteOffset,
			this.data.subarray(start, end)
		);

		this.dirtyStart = 0;
		this.dirtyEnd = 0;
	};

	WebGLTraceRenderer.prototype.draw = function (viewport) {
		var gl = this.gl;

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);

		if (this.count === 0) {
			return;
		}

		this.uploadDirty();

		gl.useProgram(this.program);
		gl.uniform2f(this.locations.origin, viewport.origin[0], viewport.origin[1]);
		gl.uniform1f(this.locations.scale, viewport.scale);
		gl.uniform2f(this.locations.viewportSize, viewport.width, viewport.height);
		gl.uniform1f(this.locations.brushScale, this.brushScale);
		gl.uniform1f(this.locations.brushSoftness, this.brushSoftness);
		gl.bindVertexArray(this.vertexArray);
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count);
		gl.bindVertexArray(null);
	};

	WebGLTraceRenderer.prototype.createShader = function (type, source) {
		var gl = this.gl;
		var shader = gl.createShader(type);

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			var message = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(message);
		}

		return shader;
	};

	WebGLTraceRenderer.prototype.createProgram = function (vertexSource, fragmentSource) {
		var gl = this.gl;
		var vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
		var fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
		var program = gl.createProgram();

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			var message = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(message);
		}

		return program;
	};

	WebGLTraceRenderer.prototype.parseColor = function (color) {
		if (this.colorCache[color]) {
			return this.colorCache[color];
		}

		var parsed = this.parseRgbColor(color) || this.parseHexColor(color) || [1, 1, 1, 1];
		this.colorCache[color] = parsed;
		return parsed;
	};

	WebGLTraceRenderer.prototype.parseRgbColor = function (color) {
		var match = /^rgba?\(([^)]+)\)$/.exec(color);

		if (!match) {
			return null;
		}

		var parts = match[1].split(",").map(function (part) {
			return parseFloat(part);
		});

		return [
			parts[0] / 255,
			parts[1] / 255,
			parts[2] / 255,
			typeof parts[3] === "number" && !isNaN(parts[3]) ? parts[3] : 1
		];
	};

	WebGLTraceRenderer.prototype.parseHexColor = function (color) {
		var value = color.charAt(0) === "#" ? color.slice(1) : color;

		if (value.length === 3) {
			value = value.charAt(0) + value.charAt(0) +
				value.charAt(1) + value.charAt(1) +
				value.charAt(2) + value.charAt(2);
		}

		if (!/^[0-9a-fA-F]{6}$/.test(value)) {
			return null;
		}

		var intValue = parseInt(value, 16);

		return [
			((intValue >> 16) & 255) / 255,
			((intValue >> 8) & 255) / 255,
			(intValue & 255) / 255,
			1
		];
	};

	WebGLTraceRenderer.VERTEX_SHADER = [
		"#version 300 es",
		"precision highp float;",
		"layout(location = 0) in vec2 a_corner;",
		"layout(location = 1) in vec2 a_position;",
		"layout(location = 2) in float a_size;",
		"layout(location = 3) in vec4 a_color;",
		"uniform vec2 u_origin;",
		"uniform float u_scale;",
		"uniform vec2 u_viewportSize;",
		"uniform float u_brushScale;",
		"out vec4 v_color;",
		"out vec2 v_brushCoord;",
		"void main() {",
		"	float brushSize = (a_size * u_brushScale) + (2.0 / u_scale);",
		"	vec2 brushCenter = a_position + vec2(a_size * 0.5);",
		"	vec2 world = brushCenter + ((a_corner - vec2(0.5)) * brushSize);",
		"	vec2 screen = (world - u_origin) * u_scale;",
		"	vec2 clip = vec2(",
		"		(screen.x / u_viewportSize.x) * 2.0 - 1.0,",
		"		1.0 - ((screen.y / u_viewportSize.y) * 2.0)",
		"	);",
		"	gl_Position = vec4(clip, 0.0, 1.0);",
		"	v_color = a_color;",
		"	v_brushCoord = (a_corner * 2.0) - vec2(1.0);",
		"}"
	].join("\n");

	WebGLTraceRenderer.FRAGMENT_SHADER = [
		"#version 300 es",
		"precision mediump float;",
		"in vec4 v_color;",
		"in vec2 v_brushCoord;",
		"uniform float u_brushSoftness;",
		"out vec4 outColor;",
		"void main() {",
		"	float dist = length(v_brushCoord);",
		"	float alpha = 1.0 - smoothstep(1.0 - u_brushSoftness, 1.0, dist);",
		"	if (alpha <= 0.0) {",
		"		discard;",
		"	}",
		"	outColor = vec4(v_color.rgb, v_color.a * alpha);",
		"}"
	].join("\n");
})();
