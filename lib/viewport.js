(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var Viewport = Ace.Viewport = function (options) {
		options = options || {};
		this.origin = options.origin || [0, 0];
		this.width = options.width || 0;
		this.height = options.height || 0;
		this.scale = options.scale || 1;
	};

	Viewport.MIN_SCALE = 0.1;
	Viewport.MAX_SCALE = 8;

	Viewport.prototype.resize = function (width, height) {
		this.width = width;
		this.height = height;
	};

	Viewport.prototype.panBy = function (dx, dy) {
		this.origin[0] -= dx / this.scale;
		this.origin[1] -= dy / this.scale;
	};

	Viewport.prototype.setScale = function (scale) {
		this.scale = Math.max(Viewport.MIN_SCALE, Math.min(Viewport.MAX_SCALE, scale));
	};

	Viewport.prototype.zoomBy = function (factor, screenPoint) {
		var anchor = screenPoint || [this.width / 2, this.height / 2];
		var worldAnchor = this.screenToWorld(anchor);

		this.setScale(this.scale * factor);

		this.origin[0] = worldAnchor[0] - (anchor[0] / this.scale);
		this.origin[1] = worldAnchor[1] - (anchor[1] / this.scale);
	};

	Viewport.prototype.applyTransform = function (ctx) {
		ctx.scale(this.scale, this.scale);
		ctx.translate(-this.origin[0], -this.origin[1]);
	};

	Viewport.prototype.screenToWorld = function (pos) {
		return [
			(pos[0] / this.scale) + this.origin[0],
			(pos[1] / this.scale) + this.origin[1]
		];
	};
})();
