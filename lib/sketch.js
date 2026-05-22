(function () {
	if (typeof Ace === 'undefined') {
		Ace = {};
	};

	var Sketch = Ace.Sketch = function () {
		this.tracers = [];
		this.addRollingTracer({ rollingCenter: Sketch.center() });
	};

	Sketch.BG_COLOR = "#000";
	Sketch.DIM_X = 1500;
	Sketch.DIM_Y = 1000;
	Sketch.FPS = 150;

	Sketch.center = function () {
		return [Sketch.DIM_X / 2, Sketch.DIM_Y / 2];
	};

	Sketch.prototype.addRollingTracer = function (options) {
		options = options || {};
		this.add(new Ace.RollingTracer({
			sketch: this,
			rollingCenter: options.rollingCenter || options.pos || Sketch.center()
		}));
	};

	Sketch.prototype.allObjects = function () {
		return this.tracers.slice(0);
	};

	Sketch.prototype.add = function (object) {
		if (object instanceof Ace.RollingTracer) {
			this.tracers.push(object);
		} else {
			throw "Unsupported sketch object";
		}
	};

	Sketch.prototype.draw = function (overlayCtx) {
		this.allObjects().forEach(function (object) {
			object.draw(overlayCtx);
		});
	};

	Sketch.prototype.traceSamples = function () {
		return this.allObjects().map(function (object) {
			if (object.traceSample) {
				return object.traceSample();
			}
		}).filter(function (sample) {
			return !!sample;
		});
	};

	Sketch.prototype.step = function (stepSize) {
		this.moveObjects(stepSize || 1);
		// this.checkCollisions();
	};

	Sketch.prototype.moveObjects = function (stepSize) {
		this.allObjects().forEach(function (object) {
			object.move(stepSize);
		});
	};

	Ace.Game = Sketch;
})();
