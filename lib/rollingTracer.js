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
		RollingTracer.tracingDistanceCosStore = {};
		RollingTracer.spiralSinStore = {};
		RollingTracer.spiralCosStore = {};
	};

	RollingTracer.resetCache();

	RollingTracer.cacheGet = function (store, key, compute) {
		if (typeof store[key] === "undefined") {
			store[key] = compute();
		}

		return store[key];
	};

	RollingTracer.cachedWaveValue = function (store, aliveFor, period, waveFn) {
		return RollingTracer.cacheGet(store, aliveFor, function () {
			var rad = 2 * Math.PI * (aliveFor / period);
			return waveFn(rad);
		});
	};

	RollingTracer.centerSin = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.centerSinStore, aliveFor, RollingTracer.period(), Math.sin);
	};

	RollingTracer.centerCos = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.centerCosStore, aliveFor, RollingTracer.period(), Math.cos);
	};

	RollingTracer.spinSin = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.spinSinStore, aliveFor, RollingTracer.spinPeriod(), Math.sin);
	};

	RollingTracer.spinCos = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.spinCosStore, aliveFor, RollingTracer.spinPeriod(), Math.cos);
	};

	RollingTracer.tracingDistanceCos = function (aliveFor) {
		return RollingTracer.cachedWaveValue(
			RollingTracer.tracingDistanceCosStore,
			aliveFor,
			RollingTracer.period() * RollingTracer.TRACING_DISTANCE_MULT,
			Math.cos
		);
	};

	RollingTracer.spiralSin = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.spiralSinStore, aliveFor, RollingTracer.SPIRAL_PERIOD, Math.sin);
	};

	RollingTracer.spiralCos = function (aliveFor) {
		return RollingTracer.cachedWaveValue(RollingTracer.spiralCosStore, aliveFor, RollingTracer.SPIRAL_PERIOD, Math.cos);
	};

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

	RollingTracer.prototype.wrapAliveFor = function (aliveFor, period, drift) {
		if (aliveFor < period) {
			return aliveFor;
		}

		return (aliveFor % period) + drift;
	};

	RollingTracer.prototype.velFn = function (stepSize) {
		stepSize = stepSize || 1;

		if (this._aliveFor === false) {
			this._aliveFor = 0;
			this.spiralAliveFor = 0;
			this._vel = [0, 0];
			this.colorAliveFor = 0;
		} else {
			this._aliveFor = this.wrapAliveFor(
				this._aliveFor + stepSize,
				RollingTracer.period(),
				RollingTracer.drift
			);
		}

		this.colorAliveFor += stepSize;
		if (this.colorAliveFor >= RollingTracer.COLOR_PERIOD) {
			this.colorAliveFor = this.colorAliveFor % RollingTracer.COLOR_PERIOD;
			this.gradient.step();
			this.color = this.gradient.toString();
		}

		this.spiralAliveFor = this.wrapAliveFor(
			this.spiralAliveFor + stepSize,
			RollingTracer.SPIRAL_PERIOD,
			0
		);
		// var spiralTheta = 2 * Math.PI * (this.spiralAliveFor / RollingTracer.SPIRAL_PERIOD)
		// oscAmp = Math.min(oscAmp, 1)

		if (RollingTracer.spiralToggle) {
			var oscAmpY = RollingTracer.SPIRAL_AMP * RollingTracer.spiralSin(this.spiralAliveFor);
			var oscAmpX = RollingTracer.SPIRAL_AMP * RollingTracer.spiralCos(this.spiralAliveFor);
			this._vel[0] = RollingTracer.centerSin(this._aliveFor) * RollingTracer.amplitude * oscAmpX;
			this._vel[1] = RollingTracer.centerCos(this._aliveFor) * RollingTracer.amplitude * oscAmpY;
		} else {
			this._vel[0] = RollingTracer.centerSin(this._aliveFor) * RollingTracer.amplitude;
			this._vel[1] = RollingTracer.centerCos(this._aliveFor) * RollingTracer.amplitude;
		}

		return this._vel;
	};

	RollingTracer.prototype.move = function (stepSize) {
		stepSize = stepSize || 1;
		var vel = this.vel(stepSize);
		var rollingCenter = [this.rollingCenter[0], this.rollingCenter[1]];
		// this._recordHistory(rollingCenter);
		this.rollingCenter[0] += vel[0] * stepSize;
		this.rollingCenter[1] += vel[1] * stepSize;
		this.updateTracingPoint(stepSize);
	};

	RollingTracer.prototype._recordHistory = function (rollingCenter) {
		if (this._path.length < 3000) {
			this._path.push(rollingCenter);
		} else {
			this._path.shift();
			this._path.push(rollingCenter);
		}
	};

	RollingTracer.prototype.updateTracingPoint = function(stepSize) {
		stepSize = stepSize || 1;

		if (this.spinAlive === false) {
			this.spinAlive = 0;
			this.tracingDistanceAlive = 0;
		} else {
			this.spinAlive = this.wrapAliveFor(
				this.spinAlive + stepSize,
				RollingTracer.spinPeriod(),
				RollingTracer.spinDrift
			);
		}

		this.tracingDistanceAlive = this.wrapAliveFor(
			this.tracingDistanceAlive + stepSize,
			RollingTracer.period() * RollingTracer.TRACING_DISTANCE_MULT,
			RollingTracer.tracingDistanceDrift
		);

		if (RollingTracer.oscillatingTracingDistance) {
			var length = RollingTracer.TRACING_DISTANCE * RollingTracer.tracingDistanceCos(this.tracingDistanceAlive);
		} else {
			var length = RollingTracer.TRACING_DISTANCE;
		}

		var rel_x = length * RollingTracer.spinCos(this.spinAlive);
		var rel_y = length * RollingTracer.spinSin(this.spinAlive);

		this.tracingPoint = [this.rollingCenter[0] + rel_x, this.rollingCenter[1] + rel_y];
	};

	RollingTracer.prototype.draw = function (overlayCtx, viewport) {
		var rollingCenter = viewport ? viewport.worldToScreen(this.rollingCenter) : this.rollingCenter;
		var tracingPoint = viewport ? viewport.worldToScreen(this.tracingPoint) : this.tracingPoint;
		var radius = viewport ? viewport.scaleSize(this.radius) : this.radius;
		var armWidth = viewport ? viewport.scaleSize(RollingTracer.TRACING_ARM_WIDTH) : RollingTracer.TRACING_ARM_WIDTH;

		if (RollingTracer.drawRollingTracer) {
			overlayCtx.beginPath();
			overlayCtx.arc(rollingCenter[0], rollingCenter[1], radius, 0, 2 * Math.PI, false);
			overlayCtx.fillStyle = this.color;
			overlayCtx.fill();
			Ace.Util.drawLine(overlayCtx, tracingPoint, rollingCenter, armWidth, this.color);
		}
	};

	RollingTracer.prototype.traceSample = function () {
		return {
			x: this.tracingPoint[0],
			y: this.tracingPoint[1],
			color: this.color,
			size: RollingTracer.TRACE_PIXEL_SIZE
		};
	};

	Ace.Plane = RollingTracer;
})();
