(function () {
	if (typeof Ace === "undefined") {
		Ace = {};
	};

	var Util = Ace.Util = {};

	var inherits = Util.inherits = function (ChildClass, ParentClass) {
		function Surrogate () {};
		Surrogate.prototype = ParentClass.prototype;
		ChildClass.prototype = new Surrogate ();
	};

  var randomVec = Util.randomVec = function (length, dir) {
    var deg = 2 * Math.PI * Math.random();

    switch (dir) {
	    case 'up':
	    	var y = -Math.abs(Math.cos(deg))
	    	break;
	    case 'down':
	    	var y = Math.abs(Math.cos(deg))
	   		break;
	    default:
	    	var y = Math.cos(deg)
	    	break;
		}
    return scale([Math.sin(deg), y], length);
  };

	var scale = Util.scale = function (vec, m) {
		return [vec[0] * m, vec[1] * m];
	};

  var norm = Util.norm = function (vec) {
    return Util.dist([0, 0], vec);
  };

  var dir = Util.dir = function (vec) {
    var norm = Util.norm(vec);
    return Util.scale(vec, 1 / norm);
  };

	var dist = Util.dist = function (pos1, pos2)	{
		return Math.sqrt(
			Math.pow(pos1[0] - pos2[0], 2),
			Math.pow(pos1[1] - pos2[1], 2)
		);
	};

	_.extend(Util,
		{	colorIdx: 0,

			drawLine: function (ctx, pos1, pos2, width, color) {
				ctx.beginPath();
				ctx.moveTo(pos1[0], pos1[1]);
				ctx.lineTo(pos2[0], pos2[1]);
				ctx.lineWidth = width;
				ctx.strokeStyle = color || 'white';
				ctx.stroke();
			},

			randomColor: function (color) {
				if (color) {
					return color
				}

				if (this.colorIdx % Ace.Util.COLORS.length === 0) {
					this.colorIdx = 0;
				}

				var color = Ace.Util.COLORS[this.colorIdx];
				this.colorIdx += 1;
				return color;
			},

			

			COLORS: [
				"#FF00FF",
				"#A6121F",
				"#FF1D23",
				"#F2D0A7",
				"#F29727",
				"#EC97FF",
				"#D93E30",
				"#32CC6B",
				"#80FF57",
				"#8532CC",
				"#FDFD96",
				"#0578A6",
				"#729980",
				"#D40D12",
				"#6495ED",
				"#FFDEAD",
				"#F49AC2",
				"#FFDE00",
				'#FFF',
			],
		}
	);
})();
