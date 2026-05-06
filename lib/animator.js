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
	};

	Animator.stepsPerFrame = 15;

	Animator.prototype.start = function () {
		this._running = true;
		var animator = this;
		function animate() {
			animator.animationRequest = requestAnimationFrame(animate);

			for (var i = 0; i < Ace.Animator.stepsPerFrame; i++) {
				animator.sketch.step();
				animator.sketch.draw(animator.overlayCtx, animator.traceCtx);
			}
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
		this.traceCtx.clearRect(0, 0, Ace.Sketch.DIM_X, Ace.Sketch.DIM_Y);
	};

	Ace.GameView = Animator;
})();
