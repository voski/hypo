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

	Viewport.prototype.worldToScreen = function (pos) {
		return [
			(pos[0] - this.origin[0]) * this.scale,
			(pos[1] - this.origin[1]) * this.scale
		];
	};

	Viewport.prototype.screenToWorld = function (pos) {
		return [
			(pos[0] / this.scale) + this.origin[0],
			(pos[1] / this.scale) + this.origin[1]
		];
	};

	Viewport.prototype.scaleSize = function (size) {
		return size * this.scale;
	};

	Viewport.prototype.containsRect = function (x, y, width, height) {
		return x + width >= this.origin[0] &&
			x <= this.origin[0] + (this.width / this.scale) &&
			y + height >= this.origin[1] &&
			y <= this.origin[1] + (this.height / this.scale);
	};

	Viewport.prototype.containsSample = function (sample) {
		var size = sample.size || 0;
		return this.containsRect(sample.x, sample.y, size, size);
	};
})();
