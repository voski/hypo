(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	}

	var Animator = Ace.Animator = function (sketch, overlayCtx, traceCanvas) {
		this.sketch = sketch;
		this.game = sketch;
		this.overlayCtx = overlayCtx;
		this.overlayCanvas = overlayCtx.canvas;
		this.traceRenderer = new Ace.WebGLTraceRenderer(traceCanvas);
		this.traceCanvas = this.traceRenderer.canvas;
		this.viewport = new Ace.Viewport({ origin: [0, 0] });
		this._viewportCentered = false;
		this._redrawPending = false;
		this.resizeCanvases();
		this.bindViewportControls();
	};

	Animator.stepsPerFrame = 15;
	Animator.traceResolution = 32;

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

			animator.redrawTrace();
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
		this.traceRenderer.clear();
	};

	Animator.prototype.recordTraceSamples = function () {
		var animator = this;
		var samples = this.sketch.traceSamples();

		samples.forEach(function (sample) {
			animator.traceRenderer.add(sample);
		});
	};

	Animator.prototype.drawOverlay = function () {
		this.clearOverlayCanvas();
		this.overlayCtx.save();
		this.applyViewportTransform(this.overlayCtx);
		this.sketch.draw(this.overlayCtx);
		this.overlayCtx.restore();
	};

	Animator.prototype.clearOverlayCanvas = function () {
		this.clearScreenCanvas(this.overlayCtx);
	};

	Animator.prototype.clearScreenCanvas = function (ctx) {
		ctx.save();
		this.resetCanvasTransform(ctx);
		ctx.clearRect(0, 0, this.viewport.width, this.viewport.height);
		ctx.restore();
	};

	Animator.prototype.resetCanvasTransform = function (ctx) {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	};

	Animator.prototype.applyViewportTransform = function (ctx) {
		this.resetCanvasTransform(ctx);
		this.viewport.applyTransform(ctx);
	};

	Animator.prototype.redrawTrace = function () {
		this.traceRenderer.draw(this.viewport);
	};

	Animator.prototype.redrawScene = function () {
		this.redrawTrace();
		this.drawOverlay();
	};

	Animator.prototype.requestRedraw = function () {
		if (this._redrawPending) {
			return;
		}

		var animator = this;
		this._redrawPending = true;

		requestAnimationFrame(function () {
			animator._redrawPending = false;
			animator.redrawScene();
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
		this.traceRenderer.resize(width, height);

		this.viewport.resize(width, height);
		if (!this._viewportCentered) {
			this.centerViewportOn(Ace.Sketch.center());
			this._viewportCentered = true;
		}
		this.redrawScene();
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
			animator.requestRedraw();
			event.preventDefault();
		});

		document.addEventListener("wheel", function (event) {
			if (isControlsTarget(event.target)) {
				return;
			}

			var factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
			animator.viewport.zoomBy(factor, [event.clientX, event.clientY]);
			animator.requestRedraw();
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
