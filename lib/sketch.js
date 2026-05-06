(function () {
	if (typeof Ace === 'undefined') {
		Ace = {};
	};

	var Sketch = Ace.Sketch = function () {
		this.legacyHostiles = [];
		this.tracers = [];
		this.addLegacyHostiles(Sketch.NUM_LEGACY_HOSTILES);
		this.addRollingTracer({ rollingCenter: [Ace.Sketch.DIM_X / 2, Ace.Sketch.DIM_Y / 2] });
	};

	Sketch.BG_COLOR = "#000";
	Sketch.DIM_X = 1500;
	Sketch.DIM_Y = 1000;
	Sketch.FPS = 150;
	Sketch.NUM_LEGACY_HOSTILES = 0;

	Object.defineProperty(Sketch, "NUM_HOSTILES", {
		get: function () { return Sketch.NUM_LEGACY_HOSTILES; },
		set: function (value) { Sketch.NUM_LEGACY_HOSTILES = value; }
	});

	Sketch.prototype.wrap = function (pos, width) {
		var x = pos[0];
		if (x < 0 || x > Sketch.DIM_X - width) {
			return true;
		};

		return false;
	};

	Sketch.prototype.addLegacyHostiles = function (num) {
		for (var i = 0; i < num; i++) {
			this.add(new Ace.Hostile({ game: this }));
		};
	};

	Sketch.prototype.addRollingTracer = function (options) {
		this.add(new Ace.RollingTracer({
			sketch: this,
			rollingCenter: options.rollingCenter || options.pos
		}));
	};

	Sketch.prototype.allObjects = function () {
		return [].concat(this.legacyHostiles).concat(this.tracers);
	};

	Sketch.prototype.add = function (object) {
		if (typeof Ace.Hostile !== "undefined" && object instanceof Ace.Hostile) {
			this.legacyHostiles.push(object);
		} else if (object instanceof Ace.RollingTracer) {
			this.tracers.push(object);
		} else if (typeof Ace.Bullet !== "undefined" && object instanceof Ace.Bullet) {
			this.bullets.push(object);
		} else {
			throw "Unsupported sketch object";
		}
	};

	Sketch.prototype.randomPosition = function (options) {
		var x = Sketch.DIM_X - options.x;
		var y = options.y || Sketch.DIM_Y;
		return [
			x * Math.random(),
			y * Math.random()
		];
	};

	Sketch.prototype.draw = function (overlayCtx, traceCtx) {
		overlayCtx.clearRect(0, 0, Sketch.DIM_X, Sketch.DIM_Y);
		// overlayCtx.fillStyle = Sketch.BG_COLOR;
		// overlayCtx.fillRect(0, 0, Sketch.DIM_X, Sketch.DIM_Y);
		this.allObjects().forEach(function (object) {
			object.draw(overlayCtx, traceCtx);
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
