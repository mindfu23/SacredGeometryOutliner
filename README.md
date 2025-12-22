# ✦ Sacred Geometry Outliner ✦

Transform images into sacred geometric line art with real-time controls.

## Features

- **Upload images** from any device (desktop, Android, iOS)
- **AI-powered subject detection** using TensorFlow.js COCO-SSD
- **Edge detection** with Sobel operator and non-maximum suppression
- **Sacred geometry conversion** with:
  - Golden ratio (φ) proportions
  - Sacred angle snapping (36°, 60°, 72°, 108°)
  - Douglas-Peucker line simplification
  - Bezier curve interpolation

## Real-Time Controls

| Slider | Effect |
|--------|--------|
| **Style** | Angular (straight lines) ↔ Flowing (curves) |
| **Detail Level** | Minimal (~50 lines) ↔ Complex (~550 lines) |
| **Recognizability** | Abstract ↔ Realistic (preserves subject shape) |
| **Line Weight** | 1px to 10px stroke width |

## Additional Options

- **Golden Ratio Proportions** - Apply φ to line segments
- **Sacred Angle Snapping** - Snap lines to sacred geometry angles
- **Custom Colors** - Line and background color pickers
- **Subject Label** - Show/hide detected subject

## Export Formats

- **SVG** - Scalable vector format, editable in Illustrator/Inkscape
- **PNG** - Raster image with transparency support

## Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repo to Netlify
3. Deploy automatically

Or drag and drop the folder to [Netlify Drop](https://app.netlify.com/drop)

### Local Development

Simply open `index.html` in a browser. No build step required.

## Technical Details

### Technologies

- **TensorFlow.js** - COCO-SSD model for object detection
- **Canvas API** - Image processing and rendering
- **Vanilla JavaScript** - No framework dependencies
- **CSS Grid/Flexbox** - Responsive layout

### Sacred Geometry Principles

- **Golden Ratio (φ = 1.618...)** - Applied to proportions and subdivisions
- **Sacred Angles** - 36°, 60°, 72°, 108° (from pentagons, hexagons)
- **Vesica Piscis** - Overlapping circle overlay at high style values

### Algorithm Pipeline

```
Image Upload
    ↓
AI Subject Detection (COCO-SSD)
    ↓
Grayscale Conversion
    ↓
Gaussian Blur (noise reduction)
    ↓
Sobel Edge Detection
    ↓
Non-Maximum Suppression
    ↓
Contour Tracing
    ↓
Douglas-Peucker Simplification
    ↓
Sacred Geometry Conversion
    ↓
Real-time Rendering
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

MIT License - Feel free to use and modify.

---

*Built with sacred proportions • φ = 1.618033988749...*
