(function (root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.HypotrochoidFormula = factory();
	}
})(typeof self !== "undefined" ? self : this, function () {
	"use strict";

	var centerOrOrigin = function (center) {
		return center || [0, 0];
	};

	var hypocycloidPoint = function (theta, radius, k, center) {
		var origin = centerOrOrigin(center);
		var kMinusOne = k - 1;

		return [
			radius * (kMinusOne * Math.cos(theta) + Math.cos(kMinusOne * theta)) + origin[0],
			radius * (kMinusOne * Math.sin(theta) - Math.sin(kMinusOne * theta)) + origin[1]
		];
	};

	var harmonicPoint = function (theta, a, b, c, d, j, k, amplitude, center) {
		var origin = centerOrOrigin(center);

		return [
			Math.cos(a * theta) - Math.pow(Math.cos(b * theta), j) * amplitude + origin[0],
			Math.sin(c * theta) - Math.pow(Math.sin(d * theta), k) * amplitude + origin[1]
		];
	};

	return {
		hypocycloidPoint: hypocycloidPoint,
		harmonicPoint: harmonicPoint
	};
});
