(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var TraceStore = Ace.TraceStore = function () {
		this.samples = [];
	};

	TraceStore.prototype.add = function (sample) {
		this.samples.push({
			x: sample.x,
			y: sample.y,
			color: sample.color,
			size: sample.size
		});

		return sample;
	};

	TraceStore.prototype.clear = function () {
		this.samples = [];
	};

	TraceStore.prototype.visibleSamples = function (viewport) {
		return this.samples.filter(function (sample) {
			return viewport.containsSample(sample);
		});
	};
})();
