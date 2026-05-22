(function () {
	if (typeof Ace === 'undefined') {
		Ace = {};
	};

	var Sketch = Ace.Sketch = function () {
		this.tracers = [];
		this.addRollingTracer({ rollingCenter: [Sketch.DIM_X / 2, Sketch.DIM_Y / 2] });
	};

	Sketch.BG_COLOR = "#000";
	Sketch.DIM_X = 1500;
	Sketch.DIM_Y = 1000;
	Sketch.FPS = 150;

	Sketch.prototype.addRollingTracer = function (options) {
		options = options || {};
		this.add(new Ace.RollingTracer({
			sketch: this,
			rollingCenter: options.rollingCenter || options.pos || [Sketch.DIM_X / 2, Sketch.DIM_Y / 2]
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

	Sketch.prototype.draw = function (overlayCtx, viewport) {
		var width = viewport ? viewport.width : Sketch.DIM_X;
		var height = viewport ? viewport.height : Sketch.DIM_Y;
		overlayCtx.clearRect(0, 0, width, height);
		// overlayCtx.fillStyle = Sketch.BG_COLOR;
		// overlayCtx.fillRect(0, 0, Sketch.DIM_X, Sketch.DIM_Y);
		this.allObjects().forEach(function (object) {
			object.draw(overlayCtx, viewport);
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

	Sketch.prototype.step = function () {
		this.moveObjects();
		// this.checkCollisions();
	};

	Sketch.prototype.moveObjects = function () {
		this.allObjects().forEach(function (object) {
			object.move();
		});
	};

	Ace.Game = Sketch;
})();
