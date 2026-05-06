(function() {
  if (typeof Ace === "undefined") {
    Ace = {};
  }

  var Menu = Ace.Menu = {
    initialize: function (animator) {
      this.animator = animator;
      this.gameView = animator;
      this.$el = $('#controls')
      this.$el.draggable();
      this.setupTracerOptions(this.$el.find('fieldset.tracer-set'))
      this.setupHypotrochoidOptions(this.$el.find('fieldset.hypotrochoid-set'))
      this.setupGeneralOptions(this.$el.find('fieldset.general'))
      this.setupSpinOptions(this.$el.find('fieldset.spin-set'))
    },

    setupSpinOptions: function ($el) {
      this.hookSpinPeriodControl($el.find("#spin-period-mult"));
    },

    setupGeneralOptions: function($el) {
      this.hookSteps($el);
      this.hookStartStop($el);
      this.hookClear($el);
    },

    hookClear: function ($el) {
      var btn = this.$el.find("button.clear-btn")
      btn.click(function(e){
        this.animator.clearCanvas();
      }.bind(this))
    },

    hookStartStop: function ($el) {
      var btn = this.$el.find("button.start-stop-btn");

      var toggleText = function ($el) {
         $el.html() === "Stop" ? $el.html("Start") : $el.html("Stop")
      }

      btn.click(function(e) {
        e.preventDefault();
        this.animator.toggle();
        toggleText($(e.currentTarget))
      }.bind(this))
    },

    hookDim: function ($el) {
      var $x = $el.find("#dim-x");
      var $y = $el.find("#dim-y");
      $x.val(Ace.Sketch.DIM_X);
      $y.val(Ace.Sketch.DIM_Y);

      $x.change(function(e) {
        var val = parseFloat($(e.currentTarget).val())
        Ace.Sketch.DIM_X = val;
      });

      $y.change(function(e) {
        var val = parseFloat($(e.currentTarget).val())
        Ace.Sketch.DIM_Y = val;
      });
    },

    setupTracerOptions: function ($el) {
      this.tracerDisplayToggle($el.find('#tracer-toggle'))
      this.centerPeriodControl($el.find('#center-period-mult'))
    },

    centerPeriodControl: function ($el) {
      $el.val(Ace.RollingTracer.centerPeriodMult)
      $el.change(function(e) {
        var val = $(e.currentTarget).val();
        Ace.RollingTracer.centerPeriodMult = parseFloat(val);
        Ace.RollingTracer.resetCache();
      })
    },

    hookSpinPeriodControl: function ($el) {
      $el.val(Ace.RollingTracer.spinPeriodMult)
      $el.change(function(e) {
        var val = $(e.currentTarget).val();
        Ace.RollingTracer.spinPeriodMult = parseFloat(val);
        Ace.RollingTracer.resetCache();
      })
    },

    tracerDisplayToggle: function ($el) {
      var updateText = function () {
        if (Ace.RollingTracer.drawRollingTracer) {
          $el.text('Hide')
        } else {
          $el.text('Show')
        }
      }

      updateText();

      $el.on('click', function(e) {
        e.preventDefault();
        Ace.RollingTracer.toggleDisplay();
        updateText();
      })
    },

    setupHypotrochoidOptions: function ($el) {
    },

    hookSteps: function ($el) {
      var spinner = $el.find('#steps');
      spinner.val(Ace.Animator.stepsPerFrame);
      spinner.change(function(e) {
        var val = $(e.currentTarget).val();
        Ace.Animator.stepsPerFrame = parseFloat(val);
      })
    },
  };
})();
