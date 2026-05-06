(function() {
  if (typeof Ace === "undefined") {
    Ace = {};
  }

  if (typeof Hypo === "undefined") {
    Hypo = {};
  }

  var ColorGradient = Ace.ColorGradient = function (options) {
    this.red = this.startRed = options.start[0];
    this.green = this.startGreen = options.start[1];
    this.blue = this.startBlue = options.start[2];

    this.endRed = options.end[0];
    this.endGreen = options.end[1];
    this.endBlue = options.end[2];

    this.dRed = (this.endRed - this.startRed) / 100;
    this.dGreen = (this.endGreen - this.startGreen) / 100;
    this.dBlue = (this.endBlue - this.startBlue) / 100;
  };

  ColorGradient.prototype.toString = function () {
    return 'rgb('
    + [
        Math.floor(this.red),
        Math.floor(this.green),
        Math.floor(this.blue)
      ].toString() + ')'
  };

  ColorGradient.prototype.step = function () {
    if (this.red !== this.endRed) {
      this.red = this.red + this.dRed
    }

    if (this.green !== this.endGreen) {
      this.green = this.green + this.dGreen
    }

    if (this.blue !== this.endBlue) {
      this.blue = this.blue + this.dBlue
    }

    if ((this.blue == this.endBlue) || (this.green == this.endGreen) || (this.red == this.endRed)) {
      this.reverse();
    }
  }

  ColorGradient.prototype.reverse = function () {
    var temp = this.endRed
    this.endRed = this.startRed
    this.startRed = temp

    temp = this.endGreen
    this.endGreen = this.startGreen
    this.startGreen = temp

    temp = this.endBlue
    this.endBlue = this.startBlue
    this.startBlue = temp

    this.dRed *= -1
    this.dGreen *= -1
    this.dBlue *= -1

  }

  ColorGradient.prototype.randomGradient = function (gradient) {
    if (gradient) {
      return gradient
    }

    if (this.colorIdx % Ace.Util.COLORS.length === 0) {
      this.colorIdx = 0;
    }

    var color = Ace.Util.COLORS[this.colorIdx];
    this.colorIdx += 1;
    return color;
  }

  Hypo.Gradient = ColorGradient;
})();
