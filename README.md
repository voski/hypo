# [Hypotrochoid](http://voski.io/hypo)

Hypotrochoid is a creative spirograph sketch built with JavaScript and HTML5 Canvas.

Two canvas elements are layered. The trace canvas stores the persistent drawing, while the overlay canvas shows the live rolling tracer and tracing arm.

This began as a small canvas game, then evolved into a parametric drawing tool. The current mechanism is hypotrochoid-inspired rather than a strict canonical hypotrochoid because the tracing arm can oscillate and the center motion, spin, color, and drawing speed can use independent periods.

## Components

### Rolling Tracer

The rolling tracer owns the moving center point. Its center moves around a circular path with adjustable frequency and amplitude.

The rolling tracer can be displayed or hidden while the trace continues to draw.

### Spin

The tracing arm rotates around the rolling tracer.

### Tracing Arm

The tracing arm extends from the rolling center to the tracing point. Its length can be constant or oscillating.

### Tracing Point

The tracing point is the end of the tracing arm. This is the point painted onto the trace canvas.

### Color

Color can be stepped as a function of the rolling tracer period, which allows color changes across repeated traces.

### Pixel Size

The trace pixel length and width can be adjusted in code.

### Speed

The animator can run multiple simulation steps per animation frame. This is useful because some shapes take a long time to close.

### Spiral

The rolling center path can also oscillate. This can produce more complex creative-spirograph shapes, especially when periods are synced.

## Tips

Try to choose periods with shared multiples. The goal is for the center, spin, tracing arm, and color periods to eventually resync and draw a continuous shape.

## Coming soon

- Presets
- Save/load
- Custom colors
- Share functions
- Gradients
- Oscillating pixel size controls
- Multiple tracing arms
