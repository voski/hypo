(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var TraceStore = Ace.TraceStore = function (options) {
		options = options || {};
		this.cellSize = options.cellSize || 0.25;
		this.chunkCellSize = options.chunkCellSize || 128;
		this.maxSampleSize = 0;
		this.sequence = 0;
		this.chunks = {};
	};

	TraceStore.prototype.add = function (sample) {
		var cellX = this.cellCoord(sample.x);
		var cellY = this.cellCoord(sample.y);
		var chunk = this.chunk(
			this.chunkCoord(cellX),
			this.chunkCoord(cellY)
		);

		this.maxSampleSize = Math.max(this.maxSampleSize, sample.size || this.cellSize);
		chunk.samples[this.cellKey(cellX, cellY)] = {
			x: sample.x,
			y: sample.y,
			color: sample.color,
			size: sample.size,
			sequence: this.sequence
		};
		this.sequence += 1;

		return sample;
	};

	TraceStore.prototype.clear = function () {
		this.maxSampleSize = 0;
		this.sequence = 0;
		this.chunks = {};
	};

	TraceStore.prototype.cellCoord = function (value) {
		return Math.floor(value / this.cellSize);
	};

	TraceStore.prototype.cellKey = function (cellX, cellY) {
		return cellX + "," + cellY;
	};

	TraceStore.prototype.chunkCoord = function (cellCoord) {
		return Math.floor(cellCoord / this.chunkCellSize);
	};

	TraceStore.prototype.chunkKey = function (chunkX, chunkY) {
		return chunkX + "," + chunkY;
	};

	TraceStore.prototype.chunk = function (chunkX, chunkY) {
		var key = this.chunkKey(chunkX, chunkY);

		if (!this.chunks[key]) {
			this.chunks[key] = {
				x: chunkX,
				y: chunkY,
				samples: {}
			};
		}

		return this.chunks[key];
	};

	TraceStore.prototype.visibleChunkBounds = function (viewport) {
		var padding = this.maxSampleSize || this.cellSize;
		var minCellX = this.cellCoord(viewport.origin[0] - padding);
		var minCellY = this.cellCoord(viewport.origin[1] - padding);
		var maxCellX = this.cellCoord(viewport.origin[0] + (viewport.width / viewport.scale) + padding);
		var maxCellY = this.cellCoord(viewport.origin[1] + (viewport.height / viewport.scale) + padding);

		return {
			minX: this.chunkCoord(minCellX),
			minY: this.chunkCoord(minCellY),
			maxX: this.chunkCoord(maxCellX),
			maxY: this.chunkCoord(maxCellY)
		};
	};

	TraceStore.prototype.drawVisible = function (ctx, viewport) {
		var bounds = this.visibleChunkBounds(viewport);
		var samples = [];

		for (var chunkY = bounds.minY; chunkY <= bounds.maxY; chunkY++) {
			for (var chunkX = bounds.minX; chunkX <= bounds.maxX; chunkX++) {
				var chunk = this.chunks[this.chunkKey(chunkX, chunkY)];

				if (chunk) {
					this.collectVisibleSamples(samples, viewport, chunk);
				}
			}
		}

		samples.sort(function (a, b) {
			return a.sequence - b.sequence;
		});

		for (var i = 0; i < samples.length; i++) {
			this.drawSample(ctx, viewport, samples[i]);
		}
	};

	TraceStore.prototype.collectVisibleSamples = function (samples, viewport, chunk) {
		for (var key in chunk.samples) {
			if (chunk.samples.hasOwnProperty(key)) {
				var sample = chunk.samples[key];

				if (viewport.containsRect(sample.x, sample.y, sample.size, sample.size)) {
					samples.push(sample);
				}
			}
		}
	};

	TraceStore.prototype.drawSample = function (ctx, viewport, sample) {
		var screenPos = viewport.worldToScreen([sample.x, sample.y]);
		var size = viewport.scaleSize(sample.size);

		ctx.fillStyle = sample.color;
		ctx.fillRect(
			screenPos[0],
			screenPos[1],
			size,
			size
		);
	};
})();
