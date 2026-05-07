(function() {
	if (typeof Ace === 'undefined') {
		Ace = {};
	}

	var RollingTracer = Ace.RollingTracer = function (options) {
		var rollingCenter = options.rollingCenter || options.pos;
		this.colorIdx = 0;
		this.rollingCenter = [rollingCenter[0] - this.findRadius(), rollingCenter[1]];
		this.pos = this.rollingCenter;
		this.startCenter = this.rollingCenter.slice(0);
		this.startPos = this.startCenter;
		// options.color = Ace.Util.COLORS[this.colorIdx];
		options.radius = RollingTracer.RADIUS;
		options.vel = this.velFn;
		Ace.SketchObject.call(this, options);
		this.tracingPoint = [this.rollingCenter[0] + RollingTracer.TRACING_DISTANCE, this.rollingCenter[1]];
		this.spinAlive = false;
		this._path = [];
		this.gradient = new Ace.ColorGradient({
			start: [100, 149, 237],
			end: [250, 150, 200]
		});

		this.color = this.gradient.toString();
	};

	RollingTracer.period = function () {
		return 360 * RollingTracer.centerPeriodMult;
	};

	RollingTracer.spinPeriod = function () {
		return RollingTracer.period() * RollingTracer.spinPeriodMult;
	};

	Ace.Util.inherits(RollingTracer, Ace.SketchObject);
	RollingTracer.drawRollingTracer = true;
	RollingTracer.RADIUS = 10;
	RollingTracer.TRACE_PIXEL_SIZE = 3;

	RollingTracer.centerPeriodMult = 2;
	RollingTracer.amplitude = 1;
	// RollingTracer.period = 360 * RollingTracer.centerPeriodMult;
	RollingTracer.drift = 0;

	RollingTracer.spinPeriodMult = 1;
	RollingTracer.spinDrift = 0;

	RollingTracer.TRACING_DISTANCE_MULT = 6;
	RollingTracer.TRACING_DISTANCE = 300;
	RollingTracer.TRACING_ARM_WIDTH = RollingTracer.TRACE_PIXEL_SIZE;
	RollingTracer.tracingDistanceDrift = 0;
	RollingTracer.oscillatingTracingDistance = true;

	RollingTracer.spiralToggle = false;
	RollingTracer.SPIRAL_PERIOD = RollingTracer.period() * (1/4);
	RollingTracer.SPIRAL_AMP = .7;

	RollingTracer.colorMult = .25;
	RollingTracer.COLOR_PERIOD = RollingTracer.period() * RollingTracer.colorMult;

	RollingTracer.centerSinStore = {};
	RollingTracer.centerCosStore = {};
	RollingTracer.spinSinStore = {};
	RollingTracer.spinCosStore = {};

	RollingTracer.resetCache = function () {
		RollingTracer.centerSinStore = {};
		RollingTracer.centerCosStore = {};
		RollingTracer.spinSinStore = {};
		RollingTracer.spinCosStore = {};
	};

	RollingTracer.tracingDistanceCosStore = [];
	(function () {
		for (var i = 0; i <= (RollingTracer.period() * RollingTracer.TRACING_DISTANCE_MULT); i++) {
			var rad = 2 * Math.PI * (i / (RollingTracer.period() * RollingTracer.TRACING_DISTANCE_MULT));
			RollingTracer.tracingDistanceCosStore.push(Math.pow(Math.cos(rad), 1));
		}
	})();

	RollingTracer.spiralSinStore = [];
	RollingTracer.spiralCosStore = [];
	(function () {
		for (var i = 0; i <= RollingTracer.SPIRAL_PERIOD; i++) {
			var rad = 2 * Math.PI * (i / RollingTracer.SPIRAL_PERIOD);

			RollingTracer.spiralSinStore.push(Math.pow(Math.sin(rad + (Math.PI * 0)), 1));
			RollingTracer.spiralCosStore.push(Math.pow(Math.cos(rad + (Math.PI * 0)), 1));
		}
	})();

	RollingTracer.toggleDisplay = function () {
		RollingTracer.drawRollingTracer = !RollingTracer.drawRollingTracer;
	};

	RollingTracer.prototype.drawMid = function () {
		var ctx = $('#trace-canvas')[0].getContext('2d');
		var radius = this.findRadius();

		Ace.Util.drawLine(
			ctx,
			[0, this.startCenter[1]],
			[Ace.Sketch.DIM_X, this.startCenter[1]]
		);

		Ace.Util.drawLine(
			ctx,
			[this.startCenter[0] + radius, 0],
			[this.startCenter[0] + radius, Ace.Sketch.DIM_Y]
		);

	};

	RollingTracer.prototype.findRadius = function () {
		var d_x = (360 / Math.PI) * (RollingTracer.amplitude * (RollingTracer.period() / 360));
		var r = d_x / 2;
		return r;
	};

	RollingTracer.prototype.velFn = function () {
		if (this._aliveFor === false) {
			this._aliveFor = 0;
			this.spiralAliveFor = 0;
			this._vel = [0, 0];
			this.colorAliveFor = 0;
		} else if (this._aliveFor > 0 && this._aliveFor % RollingTracer.period() === 0) {
			this._aliveFor = 1 + RollingTracer.drift;
		} else {
			this._aliveFor += 1;
		}

		if (this.colorAliveFor > 0 && this.colorAliveFor % RollingTracer.COLOR_PERIOD === 0) {
			this.colorAliveFor = 1;
			this.gradient.step();
			this.color = this.gradient.toString();
		} else {
			this.colorAliveFor += 1;
		}

		if (this.spiralAliveFor > 0 && this.spiralAliveFor % RollingTracer.SPIRAL_PERIOD === 0) {
			this.spiralAliveFor = 1;
		} else {
			this.spiralAliveFor += 1;
		}
		// var spiralTheta = 2 * Math.PI * (this.spiralAliveFor / RollingTracer.SPIRAL_PERIOD)
		// oscAmp = Math.min(oscAmp, 1)

		if (RollingTracer.spiralToggle) {
			var oscAmpY = RollingTracer.SPIRAL_AMP * RollingTracer.spiralSinStore[this.spiralAliveFor];
			var oscAmpX = RollingTracer.SPIRAL_AMP * RollingTracer.spiralCosStore[this.spiralAliveFor];
			this._vel[0] = RollingTracer.centerSinStore[this._aliveFor] * RollingTracer.amplitude * oscAmpX;
			this._vel[1] = RollingTracer.centerCosStore[this._aliveFor] * RollingTracer.amplitude * oscAmpY;
		} else {
			var sin = RollingTracer.centerSinStore[this._aliveFor];
			var cos = RollingTracer.centerCosStore[this._aliveFor];
			if (typeof sin === "undefined" || typeof cos === "undefined") {
				var rad = 2 * Math.PI * (this._aliveFor / RollingTracer.period());
				RollingTracer.centerSinStore[this._aliveFor] = Math.sin(rad);
				RollingTracer.centerCosStore[this._aliveFor] = Math.cos(rad);
			}
			this._vel[0] = RollingTracer.centerSinStore[this._aliveFor] * RollingTracer.amplitude;
			this._vel[1] = RollingTracer.centerCosStore[this._aliveFor] * RollingTracer.amplitude;
		}

		return this._vel;
	};

	RollingTracer.prototype.move = function () {
		var vel = this.vel();
		var rollingCenter = [this.rollingCenter[0], this.rollingCenter[1]];
		// this._recordHistory(rollingCenter);
		this.rollingCenter[0] += vel[0];
		this.rollingCenter[1] += vel[1];
		this.updateTracingPoint();
	};

	RollingTracer.prototype._recordHistory = function (rollingCenter) {
		if (this._path.length < 3000) {
			this._path.push(rollingCenter);
		} else {
			this._path.shift();
			this._path.push(rollingCenter);
		}
	};

	RollingTracer.prototype.updateTracingPoint = function() {
		if (this.spinAlive === false) {
			this.spinAlive = 0;
			this.tracingDistanceAlive = 0;
		} else if (this.spinAlive > 0 && (this.spinAlive % RollingTracer.spinPeriod() === 0)) {
			this.spinAlive = 1 + RollingTracer.spinDrift;
		} else {
			this.spinAlive += 1;
		}

		if (this.tracingDistanceAlive > 0 && (this.tracingDistanceAlive % (RollingTracer.period() * RollingTracer.TRACING_DISTANCE_MULT) === 0)) {
			this.tracingDistanceAlive = 1 + RollingTracer.tracingDistanceDrift;
		} else {
			this.tracingDistanceAlive += 1;
		}

		if (RollingTracer.oscillatingTracingDistance) {
			var length = RollingTracer.TRACING_DISTANCE * RollingTracer.tracingDistanceCosStore[this.tracingDistanceAlive];
		} else {
			var length = RollingTracer.TRACING_DISTANCE;
		}

		var sin = RollingTracer.spinSinStore[this.spinAlive];
		var cos = RollingTracer.spinCosStore[this.spinAlive];
		if (typeof sin === "undefined" || typeof cos === "undefined") {
			var rad = 2 * Math.PI * (this.spinAlive / RollingTracer.spinPeriod());
			RollingTracer.spinSinStore[this.spinAlive] = Math.sin(rad);
			RollingTracer.spinCosStore[this.spinAlive] = Math.cos(rad);
		}

		var rel_x = length * RollingTracer.spinCosStore[this.spinAlive];
		var rel_y = length * RollingTracer.spinSinStore[this.spinAlive];

		this.tracingPoint = [this.rollingCenter[0] + rel_x, this.rollingCenter[1] + rel_y];
	};

	RollingTracer.prototype.draw = function (overlayCtx, traceCtx) {
		if (RollingTracer.drawRollingTracer) {
			overlayCtx.beginPath();
			overlayCtx.arc(this.rollingCenter[0], this.rollingCenter[1], this.radius, 0, 2 * Math.PI, false);
			overlayCtx.fillStyle = this.color;
			overlayCtx.fill();
			Ace.Util.drawLine(overlayCtx, this.tracingPoint, this.rollingCenter, RollingTracer.TRACING_ARM_WIDTH, this.color);
		}

		this.drawTracingPoint(overlayCtx, traceCtx);
	};

	RollingTracer.prototype.drawTracingPoint = function (overlayCtx, traceCtx) {
		traceCtx.fillStyle = this.color;
		overlayCtx.fillStyle = this.color;
		traceCtx.fillRect(
			this.tracingPoint[0],
			this.tracingPoint[1],
			RollingTracer.TRACE_PIXEL_SIZE,
			RollingTracer.TRACE_PIXEL_SIZE
		);
	};

	Ace.Plane = RollingTracer;
})();
