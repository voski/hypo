(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	};

	var SketchObject = Ace.SketchObject = function (options) {
		options = options || {};
		this.vel = options.vel;
		this.pos = options.pos || this.pos;
		this.radius = options.radius;
		this.color = options.color;
		this.sketch = options.sketch || options.game;
		this.game = this.sketch;
		this.width = options.width;
		this.height = options.height;
		this._aliveFor = false;
	};

	SketchObject.prototype.draw = function (ctx) {
		var center = this.rollingCenter || this.pos;
		ctx.beginPath();
		ctx.arc(center[0], center[1], this.radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = this.color;
		ctx.fill();
	};

	SketchObject.prototype.move = function () {
		if (!this.pos || !this.vel) {
			return;
		}

		this.pos[0] += this.vel[0];
		this.pos[1]	+= this.vel[1];
	};

	Ace.MovingObject = SketchObject;
})();
