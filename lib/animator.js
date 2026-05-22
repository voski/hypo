(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var Animator = Ace.Animator = function (sketch, overlayCtx, traceCtx) {
		this.sketch = sketch;
		this.game = sketch;
		this.overlayCtx = overlayCtx;
		this.traceCtx = traceCtx;
		this.gameCtx = overlayCtx;
		this.paintCtx = traceCtx;
		this.overlayCanvas = overlayCtx.canvas;
		this.traceCanvas = traceCtx.canvas;
		this.traceStore = new Ace.TraceStore();
		this.viewport = new Ace.Viewport({ origin: [0, 0] });
		this._viewportCentered = false;
		this.resizeCanvases();
		this.bindViewportControls();
	};

	Animator.stepsPerFrame = 15;
	Animator.traceResolution = 8;

	Animator.prototype.start = function () {
		if (this._running) {
			return;
		}

		this._running = true;
		var animator = this;
		function animate() {
			if (!animator._running) {
				return;
			}

			animator.animationRequest = requestAnimationFrame(animate);

			var traceResolution = Math.max(1, Math.floor(Ace.Animator.traceResolution));
			var stepSize = 1 / traceResolution;

			for (var i = 0; i < Ace.Animator.stepsPerFrame; i++) {
				for (var j = 0; j < traceResolution; j++) {
					animator.sketch.step(stepSize);
					animator.recordTraceSamples();
				}
			}

			animator.drawOverlay();
		}
		animate();
	};

	Animator.prototype.stop = function () {
		this._running = false;
		cancelAnimationFrame(this.animationRequest);
	};

	Animator.prototype.toggle = function () {
		if (this._running) {
			this.stop();
		} else {
			this.start();
		}
	};

	Animator.prototype.clearCanvas = function () {
		this.traceStore.clear();
		this.clearTraceCanvas();
	};

	Animator.prototype.recordTraceSamples = function () {
		var animator = this;
		this.sketch.traceSamples().forEach(function (sample) {
			animator.traceStore.add(sample);
			animator.drawTraceSample(sample);
		});
	};

	Animator.prototype.drawOverlay = function () {
		this.sketch.draw(this.overlayCtx, this.viewport);
	};

	Animator.prototype.clearTraceCanvas = function () {
		this.traceCtx.clearRect(0, 0, this.viewport.width, this.viewport.height);
	};

	Animator.prototype.drawTraceSample = function (sample) {
		if (!this.viewport.containsSample(sample)) {
			return;
		}

		var screenPos = this.viewport.worldToScreen([sample.x, sample.y]);
		var size = this.viewport.scaleSize(sample.size);
		this.traceCtx.fillStyle = sample.color;
		this.traceCtx.fillRect(
			screenPos[0],
			screenPos[1],
			size,
			size
		);
	};

	Animator.prototype.redrawTrace = function () {
		var animator = this;
		this.clearTraceCanvas();
		this.traceStore.visibleSamples(this.viewport).forEach(function (sample) {
			animator.drawTraceSample(sample);
		});
	};

	Animator.prototype.resizeCanvases = function () {
		var width = window.innerWidth || document.documentElement.clientWidth || Ace.Sketch.DIM_X;
		var height = window.innerHeight || document.documentElement.clientHeight || Ace.Sketch.DIM_Y;
		var canvases = [this.overlayCanvas, this.traceCanvas];

		canvases.forEach(function (canvas) {
			canvas.width = width;
			canvas.height = height;
		});

		this.viewport.resize(width, height);
		if (!this._viewportCentered) {
			this.centerViewportOn(Ace.Sketch.center());
			this._viewportCentered = true;
		}
		this.redrawTrace();
		this.drawOverlay();
	};

	Animator.prototype.centerViewportOn = function (worldPoint) {
		this.viewport.origin = [
			worldPoint[0] - (this.viewport.width / (2 * this.viewport.scale)),
			worldPoint[1] - (this.viewport.height / (2 * this.viewport.scale))
		];
	};

	Animator.prototype.bindViewportControls = function () {
		var animator = this;
		var controls = document.getElementById("controls");

		var isControlsTarget = function (target) {
			while (target) {
				if (target === controls) {
					return true;
				}

				target = target.parentNode;
			}

			return false;
		};

		var stopPanning = function () {
			animator._panning = false;
			animator._lastPanPoint = null;
			document.body.classList.remove("is-panning");
		};

		document.addEventListener("pointerdown", function (event) {
			if (event.button !== 0 || isControlsTarget(event.target)) {
				return;
			}

			animator._panning = true;
			animator._lastPanPoint = [event.clientX, event.clientY];
			document.body.classList.add("is-panning");
			event.preventDefault();
		});

		document.addEventListener("pointermove", function (event) {
			if (!animator._panning || !animator._lastPanPoint) {
				return;
			}

			var dx = event.clientX - animator._lastPanPoint[0];
			var dy = event.clientY - animator._lastPanPoint[1];
			animator._lastPanPoint = [event.clientX, event.clientY];

			animator.viewport.panBy(dx, dy);
			animator.redrawTrace();
			animator.drawOverlay();
			event.preventDefault();
		});

		document.addEventListener("wheel", function (event) {
			if (isControlsTarget(event.target)) {
				return;
			}

			var factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
			animator.viewport.zoomBy(factor, [event.clientX, event.clientY]);
			animator.redrawTrace();
			animator.drawOverlay();
			event.preventDefault();
		}, { passive: false });

		document.addEventListener("pointerup", stopPanning);
		document.addEventListener("pointercancel", stopPanning);
		window.addEventListener("blur", stopPanning);
		window.addEventListener("resize", function () {
			animator.resizeCanvases();
		});
	};

	Ace.GameView = Animator;
})();
