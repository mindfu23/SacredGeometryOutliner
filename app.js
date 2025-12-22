/**
 * Sacred Geometry Outliner
 * Transforms images into sacred geometric line art
 */

// Constants
const PHI = 1.618033988749895; // Golden Ratio
const SACRED_ANGLES = [0, 36, 60, 72, 90, 108, 120, 144, 180, 216, 240, 252, 270, 288, 300, 324, 360];

// State
let state = {
  originalImage: null,
  imageData: null,
  edges: [],
  contours: [],
  geometricPaths: [],
  detectedSubject: null,
  subjectBounds: null,  // Bounding box for detected subject
  model: null,
  isProcessing: false,
  
  // Settings
  style: 50,           // 0 = angular, 100 = flowing
  detail: 50,          // 1 = minimal, 100 = complex
  recognizability: 70, // 0 = abstract, 100 = realistic
  smoothing: 50,       // 0 = raw edges, 100 = very smooth
  lineWeight: 2,
  lineColor: '#ffffff',
  bgColor: '#0a0a0f',
  goldenRatio: true,
  sacredAngles: true,
  circularConnections: true,
  geometricShapesOnly: false,  // New: only draw complete geometric shapes
  isolateSubject: true,
  subjectPadding: 20,
  connectionDistance: 80,
  showSubjectLabel: true
};

// DOM Elements
const elements = {
  uploadZone: document.getElementById('uploadZone'),
  imageInput: document.getElementById('imageInput'),
  previewSection: document.getElementById('previewSection'),
  controlsSection: document.getElementById('controlsSection'),
  originalCanvas: document.getElementById('originalCanvas'),
  outputCanvas: document.getElementById('outputCanvas'),
  processingCanvas: document.getElementById('processingCanvas'),
  edgeCanvas: document.getElementById('edgeCanvas'),
  statusMessage: document.getElementById('statusMessage'),
  detectedSubject: document.getElementById('detectedSubject'),
  
  // Sliders
  styleSlider: document.getElementById('styleSlider'),
  detailSlider: document.getElementById('detailSlider'),
  recognizabilitySlider: document.getElementById('recognizabilitySlider'),
  lineWeightSlider: document.getElementById('lineWeightSlider'),
  
  // Values
  styleValue: document.getElementById('styleValue'),
  detailValue: document.getElementById('detailValue'),
  recognizabilityValue: document.getElementById('recognizabilityValue'),
  smoothingSlider: document.getElementById('smoothingSlider'),
  smoothingValue: document.getElementById('smoothingValue'),
  lineWeightValue: document.getElementById('lineWeightValue'),
  
  // Checkboxes
  goldenRatioCheck: document.getElementById('goldenRatioCheck'),
  sacredAnglesCheck: document.getElementById('sacredAnglesCheck'),
  circularConnectionsCheck: document.getElementById('circularConnectionsCheck'),
  geometricShapesOnlyCheck: document.getElementById('geometricShapesOnlyCheck'),
  isolateSubjectCheck: document.getElementById('isolateSubjectCheck'),
  subjectPaddingSlider: document.getElementById('subjectPaddingSlider'),
  subjectPaddingValue: document.getElementById('subjectPaddingValue'),
  connectionDistanceSlider: document.getElementById('connectionDistanceSlider'),
  connectionDistanceValue: document.getElementById('connectionDistanceValue'),
  showSubjectLabel: document.getElementById('showSubjectLabel'),
  
  // Colors
  lineColor: document.getElementById('lineColor'),
  bgColor: document.getElementById('bgColor'),
  
  // Export
  exportSvg: document.getElementById('exportSvg'),
  exportPng: document.getElementById('exportPng')
};

// Initialize
async function init() {
  setupEventListeners();
  setStatus('Loading AI model...', 'loading');
  
  try {
    state.model = await cocoSsd.load();
    setStatus('Ready! Upload an image to begin.', 'success');
  } catch (error) {
    console.error('Failed to load model:', error);
    setStatus('AI model loaded with limited detection. Upload an image to begin.', 'success');
  }
}

// Event Listeners
function setupEventListeners() {
  // Upload
  elements.uploadZone.addEventListener('click', () => elements.imageInput.click());
  elements.imageInput.addEventListener('change', handleImageUpload);
  
  // Drag and drop
  elements.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadZone.classList.add('drag-over');
  });
  elements.uploadZone.addEventListener('dragleave', () => {
    elements.uploadZone.classList.remove('drag-over');
  });
  elements.uploadZone.addEventListener('drop', handleDrop);
  
  // Sliders with real-time update
  elements.styleSlider.addEventListener('input', (e) => {
    state.style = parseInt(e.target.value);
    elements.styleValue.textContent = state.style;
    requestRender();
  });
  
  elements.detailSlider.addEventListener('input', (e) => {
    state.detail = parseInt(e.target.value);
    const labels = ['Minimal', 'Low', 'Medium', 'High', 'Complex'];
    elements.detailValue.textContent = labels[Math.floor(state.detail / 25)];
    requestRender();
  });
  
  elements.recognizabilitySlider.addEventListener('input', (e) => {
    state.recognizability = parseInt(e.target.value);
    elements.recognizabilityValue.textContent = state.recognizability;
    requestRender();
  });
  
  elements.smoothingSlider.addEventListener('input', (e) => {
    state.smoothing = parseInt(e.target.value);
    elements.smoothingValue.textContent = state.smoothing;
    requestRender();
  });
  
  elements.lineWeightSlider.addEventListener('input', (e) => {
    state.lineWeight = parseInt(e.target.value);
    elements.lineWeightValue.textContent = state.lineWeight + 'px';
    requestRender();
  });
  
  // Checkboxes
  elements.goldenRatioCheck.addEventListener('change', (e) => {
    state.goldenRatio = e.target.checked;
    requestRender();
  });
  
  elements.sacredAnglesCheck.addEventListener('change', (e) => {
    state.sacredAngles = e.target.checked;
    requestRender();
  });
  
  elements.circularConnectionsCheck.addEventListener('change', (e) => {
    state.circularConnections = e.target.checked;
    requestRender();
  });
  
  elements.geometricShapesOnlyCheck.addEventListener('change', (e) => {
    state.geometricShapesOnly = e.target.checked;
    if (state.originalImage) {
      convertToSacredGeometry();
      render();
    }
  });
  
  elements.isolateSubjectCheck.addEventListener('change', (e) => {
    state.isolateSubject = e.target.checked;
    if (state.originalImage) {
      processImage();
    }
  });
  
  elements.subjectPaddingSlider.addEventListener('input', (e) => {
    state.subjectPadding = parseInt(e.target.value);
    elements.subjectPaddingValue.textContent = state.subjectPadding + 'px';
    if (state.isolateSubject && state.originalImage) {
      processImage();
    }
  });
  
  elements.connectionDistanceSlider.addEventListener('input', (e) => {
    state.connectionDistance = parseInt(e.target.value);
    elements.connectionDistanceValue.textContent = state.connectionDistance + 'px';
    requestRender();
  });
  
  elements.showSubjectLabel.addEventListener('change', (e) => {
    state.showSubjectLabel = e.target.checked;
    updateSubjectDisplay();
  });
  
  // Colors
  elements.lineColor.addEventListener('input', (e) => {
    state.lineColor = e.target.value;
    requestRender();
  });
  
  elements.bgColor.addEventListener('input', (e) => {
    state.bgColor = e.target.value;
    requestRender();
  });
  
  // Export
  elements.exportSvg.addEventListener('click', exportSVG);
  elements.exportPng.addEventListener('click', exportPNG);
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) processImageFile(file);
}

function handleDrop(e) {
  e.preventDefault();
  elements.uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processImageFile(file);
  }
}

async function processImageFile(file) {
  setStatus('Loading image...', 'loading');
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const img = new Image();
    img.onload = async () => {
      state.originalImage = img;
      await processImage(img);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Process image
async function processImage(img) {
  state.isProcessing = true;
  setStatus('Processing image...', 'loading');
  
  // Set canvas sizes
  const maxSize = 800;
  let width = img.width;
  let height = img.height;
  
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }
  
  // Apply golden ratio to dimensions if enabled
  if (state.goldenRatio) {
    // Adjust to closest golden ratio proportion
    const currentRatio = width / height;
    if (Math.abs(currentRatio - PHI) < Math.abs(currentRatio - 1/PHI)) {
      width = height * PHI;
    }
  }
  
  width = Math.round(width);
  height = Math.round(height);
  
  // Setup canvases
  [elements.originalCanvas, elements.outputCanvas, elements.processingCanvas, elements.edgeCanvas]
    .forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });
  
  // Draw original
  const origCtx = elements.originalCanvas.getContext('2d');
  origCtx.drawImage(img, 0, 0, width, height);
  
  // Detect subject
  setStatus('Detecting subject...', 'loading');
  await detectSubject(elements.originalCanvas);
  
  // Extract edges
  setStatus('Extracting edges...', 'loading');
  extractEdges(width, height);
  
  // Convert to geometry
  setStatus('Converting to sacred geometry...', 'loading');
  convertToSacredGeometry();
  
  // Show UI
  elements.previewSection.style.display = 'block';
  elements.controlsSection.style.display = 'grid';
  
  // Render
  render();
  
  state.isProcessing = false;
  setStatus('Complete! Adjust sliders to refine.', 'success');
}

// Detect subject using COCO-SSD
async function detectSubject(canvas) {
  if (!state.model) {
    state.detectedSubject = { class: 'subject', score: 1.0 };
    state.subjectBounds = null;
    updateSubjectDisplay();
    return;
  }
  
  try {
    const predictions = await state.model.detect(canvas);
    if (predictions.length > 0) {
      // Get highest confidence prediction
      const best = predictions.reduce((a, b) => a.score > b.score ? a : b);
      state.detectedSubject = best;
      // Store bounding box [x, y, width, height]
      state.subjectBounds = {
        x: best.bbox[0],
        y: best.bbox[1],
        width: best.bbox[2],
        height: best.bbox[3]
      };
      console.log('Detected subject:', best.class, 'bounds:', state.subjectBounds);
    } else {
      state.detectedSubject = { class: 'subject', score: 1.0 };
      state.subjectBounds = null;
    }
  } catch (error) {
    console.error('Detection error:', error);
    state.detectedSubject = { class: 'subject', score: 1.0 };
    state.subjectBounds = null;
  }
  
  updateSubjectDisplay();
}

function updateSubjectDisplay() {
  if (state.showSubjectLabel && state.detectedSubject) {
    const confidence = Math.round(state.detectedSubject.score * 100);
    elements.detectedSubject.textContent = 
      `Detected: ${state.detectedSubject.class} (${confidence}% confidence)`;
  } else {
    elements.detectedSubject.textContent = '';
  }
}

// Edge detection (Sobel operator)
function extractEdges(width, height) {
  const ctx = elements.processingCanvas.getContext('2d');
  ctx.drawImage(elements.originalCanvas, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Determine processing bounds based on subject isolation
  let bounds = { x: 0, y: 0, width, height };
  if (state.isolateSubject && state.subjectBounds) {
    const padding = state.subjectPadding || 20;
    bounds = {
      x: Math.max(0, Math.floor(state.subjectBounds.x - padding)),
      y: Math.max(0, Math.floor(state.subjectBounds.y - padding)),
      width: Math.min(width - bounds.x, Math.ceil(state.subjectBounds.width + padding * 2)),
      height: Math.min(height - bounds.y, Math.ceil(state.subjectBounds.height + padding * 2))
    };
    // Recalculate width/height to stay in bounds
    bounds.width = Math.min(bounds.width, width - bounds.x);
    bounds.height = Math.min(bounds.height, height - bounds.y);
    console.log('Isolating subject with bounds:', bounds);
  }
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  
  // Apply Gaussian blur
  const blurred = gaussianBlur(gray, width, height, 1.4);
  
  // Sobel operator
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  
  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  
  const edges = new Float32Array(width * height);
  const directions = new Float32Array(width * height);
  let maxEdge = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          gx += blurred[idx] * sobelX[ky + 1][kx + 1];
          gy += blurred[idx] * sobelY[ky + 1][kx + 1];
        }
      }
      
      const idx = y * width + x;
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
      directions[idx] = Math.atan2(gy, gx);
      maxEdge = Math.max(maxEdge, edges[idx]);
    }
  }
  
  // Normalize edges to 0-255
  if (maxEdge > 0) {
    for (let i = 0; i < edges.length; i++) {
      edges[i] = (edges[i] / maxEdge) * 255;
    }
  }
  
  // Non-maximum suppression
  const suppressed = nonMaxSuppression(edges, directions, width, height);
  
  // Dynamic threshold based on detail level (lower = more edges)
  // detail 1 = threshold ~50 (fewer edges), detail 100 = threshold ~5 (more edges)
  const threshold = Math.max(5, 50 - (state.detail * 0.45));
  
  console.log('Edge detection - maxEdge:', maxEdge, 'threshold:', threshold);
  
  // Extract edge points (filtered by subject bounds if isolation is enabled)
  state.edges = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Skip points outside subject bounds if isolating
      if (state.isolateSubject && state.subjectBounds) {
        if (x < bounds.x || x >= bounds.x + bounds.width ||
            y < bounds.y || y >= bounds.y + bounds.height) {
          continue;
        }
      }
      if (suppressed[y * width + x] > threshold) {
        state.edges.push({ x, y, strength: suppressed[y * width + x] });
      }
    }
  }
  
  console.log('Found edge points:', state.edges.length);
  
  // Trace contours (pass bounds for filtering)
  state.contours = traceContours(suppressed, width, height, threshold, bounds);
  
  console.log('Found contours:', state.contours.length);
  
  // If no contours found, create some from edge points directly
  if (state.contours.length === 0 && state.edges.length > 0) {
    console.log('Creating contours from edge points');
    state.contours = createContoursFromEdges(state.edges, width, height);
  }
}

// Gaussian blur helper
function gaussianBlur(data, width, height, sigma) {
  const kernel = createGaussianKernel(sigma);
  const kSize = kernel.length;
  const kHalf = Math.floor(kSize / 2);
  const result = new Float32Array(width * height);
  
  // Horizontal pass
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, weightSum = 0;
      for (let k = -kHalf; k <= kHalf; k++) {
        const px = Math.min(Math.max(x + k, 0), width - 1);
        const weight = kernel[k + kHalf];
        sum += data[y * width + px] * weight;
        weightSum += weight;
      }
      temp[y * width + x] = sum / weightSum;
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, weightSum = 0;
      for (let k = -kHalf; k <= kHalf; k++) {
        const py = Math.min(Math.max(y + k, 0), height - 1);
        const weight = kernel[k + kHalf];
        sum += temp[py * width + x] * weight;
        weightSum += weight;
      }
      result[y * width + x] = sum / weightSum;
    }
  }
  
  return result;
}

function createGaussianKernel(sigma) {
  const size = Math.ceil(sigma * 6) | 1;
  const kernel = [];
  const half = Math.floor(size / 2);
  
  for (let i = -half; i <= half; i++) {
    kernel.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  }
  
  return kernel;
}

// Non-maximum suppression
function nonMaxSuppression(edges, directions, width, height) {
  const result = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const angle = directions[idx] * 180 / Math.PI;
      const magnitude = edges[idx];
      
      let n1, n2;
      
      // Determine neighbors based on gradient direction
      if ((angle >= -22.5 && angle < 22.5) || (angle >= 157.5 || angle < -157.5)) {
        n1 = edges[y * width + (x - 1)];
        n2 = edges[y * width + (x + 1)];
      } else if ((angle >= 22.5 && angle < 67.5) || (angle >= -157.5 && angle < -112.5)) {
        n1 = edges[(y - 1) * width + (x + 1)];
        n2 = edges[(y + 1) * width + (x - 1)];
      } else if ((angle >= 67.5 && angle < 112.5) || (angle >= -112.5 && angle < -67.5)) {
        n1 = edges[(y - 1) * width + x];
        n2 = edges[(y + 1) * width + x];
      } else {
        n1 = edges[(y - 1) * width + (x - 1)];
        n2 = edges[(y + 1) * width + (x + 1)];
      }
      
      result[idx] = (magnitude >= n1 && magnitude >= n2) ? magnitude : 0;
    }
  }
  
  return result;
}

// Trace contours from edge map
function traceContours(edges, width, height, threshold, bounds) {
  const contours = [];
  const visited = new Set();
  
  // Use bounds if provided for subject isolation, otherwise use full image
  const startX = bounds ? Math.max(1, bounds.x) : 1;
  const startY = bounds ? Math.max(1, bounds.y) : 1;
  const endX = bounds ? Math.min(width - 1, bounds.x + bounds.width) : width - 1;
  const endY = bounds ? Math.min(height - 1, bounds.y + bounds.height) : height - 1;
  
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = y * width + x;
      if (edges[idx] > threshold && !visited.has(idx)) {
        const contour = traceContour(edges, visited, x, y, width, height, threshold, bounds);
        if (contour.length > 5) {
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

function traceContour(edges, visited, startX, startY, width, height, threshold, bounds) {
  const contour = [];
  const stack = [{ x: startX, y: startY }];
  
  // Use bounds for neighbor checking if provided
  const minX = bounds ? bounds.x : 0;
  const minY = bounds ? bounds.y : 0;
  const maxX = bounds ? bounds.x + bounds.width : width;
  const maxY = bounds ? bounds.y + bounds.height : height;
  
  while (stack.length > 0 && contour.length < 1000) {
    const { x, y } = stack.pop();
    const idx = y * width + x;
    
    if (visited.has(idx)) continue;
    visited.add(idx);
    
    if (edges[idx] > threshold) {
      contour.push({ x, y });
      
      // Check 8-connected neighbors (constrained by bounds)
      const neighbors = [
        { x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
        { x: x - 1, y: y },                         { x: x + 1, y: y },
        { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
      ];
      
      for (const n of neighbors) {
        if (n.x >= minX && n.x < maxX && n.y >= minY && n.y < maxY) {
          const nIdx = n.y * width + n.x;
          if (!visited.has(nIdx) && edges[nIdx] > threshold) {
            stack.push(n);
          }
        }
      }
    }
  }
  
  return contour;
}

// Create contours from sparse edge points when tracing fails
function createContoursFromEdges(edgePoints, width, height) {
  if (edgePoints.length === 0) return [];
  
  const contours = [];
  const gridSize = 20; // Group nearby points
  const grid = new Map();
  
  // Group points into grid cells
  for (const point of edgePoints) {
    const cellX = Math.floor(point.x / gridSize);
    const cellY = Math.floor(point.y / gridSize);
    const key = `${cellX},${cellY}`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key).push(point);
  }
  
  // Create contours by connecting nearby points
  const visited = new Set();
  
  for (const [key, points] of grid) {
    if (points.length < 2) continue;
    
    // Sort points by position to create connected lines
    points.sort((a, b) => {
      const da = a.x + a.y;
      const db = b.x + b.y;
      return da - db;
    });
    
    // Sample points to create cleaner lines
    const sampledPoints = [];
    const step = Math.max(1, Math.floor(points.length / 20));
    for (let i = 0; i < points.length; i += step) {
      sampledPoints.push(points[i]);
    }
    
    if (sampledPoints.length >= 2) {
      contours.push(sampledPoints);
    }
  }
  
  // Also create some longer contours by connecting grid cells
  const sortedKeys = Array.from(grid.keys()).sort();
  for (let i = 0; i < sortedKeys.length - 1; i++) {
    const points1 = grid.get(sortedKeys[i]);
    const points2 = grid.get(sortedKeys[i + 1]);
    
    if (points1.length > 0 && points2.length > 0) {
      // Connect center points of adjacent cells
      const center1 = {
        x: points1.reduce((s, p) => s + p.x, 0) / points1.length,
        y: points1.reduce((s, p) => s + p.y, 0) / points1.length
      };
      const center2 = {
        x: points2.reduce((s, p) => s + p.x, 0) / points2.length,
        y: points2.reduce((s, p) => s + p.y, 0) / points2.length
      };
      
      contours.push([center1, center2]);
    }
  }
  
  console.log('Created', contours.length, 'contours from edge points');
  return contours;
}

// Convert contours to sacred geometry
function convertToSacredGeometry() {
  state.geometricPaths = [];
  
  console.log('Converting', state.contours.length, 'contours to sacred geometry');
  console.log('Geometric shapes only mode:', state.geometricShapesOnly);
  
  if (state.contours.length === 0 && state.edges.length === 0) {
    console.log('No contours or edges to convert');
    return;
  }
  
  // If geometric shapes only mode is enabled, generate shapes from edge points
  if (state.geometricShapesOnly) {
    generateGeometricShapes();
    return;
  }
  
  // Simplification tolerance based on recognizability
  // Lower recognizability = more simplification = more abstract
  const tolerance = 1 + ((100 - state.recognizability) / 5);
  
  // Number of points to keep based on detail level
  const maxPoints = 20 + (state.detail * 4); // 20 to 420 points per contour
  
  // Collect all endpoints for later connection
  const allEndpoints = [];
  
  for (const contour of state.contours) {
    if (contour.length < 2) continue;
    
    // Apply smoothing first (before other simplification)
    let processed = smoothContour(contour, state.smoothing);
    
    // Douglas-Peucker simplification
    processed = douglasPeucker(processed, tolerance);
    
    // Limit points
    if (processed.length > maxPoints) {
      processed = subsamplePoints(processed, maxPoints);
    }
    
    // Apply smoothing again after simplification for cleaner results
    if (state.smoothing > 30) {
      processed = smoothContour(processed, state.smoothing / 2);
    }
    
    if (processed.length < 2) continue;
    
    // Convert to geometric path
    const path = createGeometricPath(processed);
    if (path.segments.length > 0) {
      state.geometricPaths.push(path);
      
      // Track endpoints for circular arc connections
      const firstSeg = path.segments[0];
      const lastSeg = path.segments[path.segments.length - 1];
      allEndpoints.push({
        point: firstSeg.start,
        pathIndex: state.geometricPaths.length - 1,
        isStart: true
      });
      allEndpoints.push({
        point: lastSeg.end,
        pathIndex: state.geometricPaths.length - 1,
        isStart: false
      });
    }
  }
  
  // Create circular arc connections between nearby disconnected endpoints
  const connectionPaths = createCircularConnections(allEndpoints);
  state.geometricPaths.push(...connectionPaths);
  
  console.log('Created', state.geometricPaths.length, 'geometric paths (including connections)');
}

// Generate complete geometric shapes from edge points
function generateGeometricShapes() {
  const canvas = elements.outputCanvas;
  const width = canvas.width;
  const height = canvas.height;
  
  // Cluster edge points to find regions of interest
  const clusters = clusterEdgePoints(state.edges, state.detail);
  
  console.log('Found', clusters.length, 'clusters for geometric shapes');
  
  // Shape types based on style slider
  // Lower style = more angular (triangles, squares, hexagons)
  // Higher style = more circular
  const shapeTypes = getShapeTypesForStyle(state.style);
  
  // Generate shapes for each cluster
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.points.length < 3) continue;
    
    // Calculate cluster bounds and center
    const bounds = getClusterBounds(cluster.points);
    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
    
    // Determine shape size based on cluster size and golden ratio
    const baseSize = Math.max(bounds.width, bounds.height);
    const size = baseSize * (state.recognizability / 100) * PHI / 2;
    
    if (size < 5) continue; // Skip tiny shapes
    
    // Choose shape type (cycle through available types)
    const shapeType = shapeTypes[i % shapeTypes.length];
    
    // Create the geometric shape
    const shape = createGeometricShape(shapeType, center, size);
    if (shape) {
      state.geometricPaths.push(shape);
    }
    
    // Add nested shapes for more complex patterns (based on detail level)
    if (state.detail > 50) {
      const innerSize = size / PHI;
      const innerShape = createGeometricShape(shapeType, center, innerSize);
      if (innerShape) {
        state.geometricPaths.push(innerShape);
      }
    }
    
    // Add connecting lines between shapes (Flower of Life style)
    if (state.circularConnections && i > 0) {
      const prevCluster = clusters[i - 1];
      const prevBounds = getClusterBounds(prevCluster.points);
      const prevCenter = {
        x: prevBounds.x + prevBounds.width / 2,
        y: prevBounds.y + prevBounds.height / 2
      };
      
      const connectionPath = createConnectionLine(prevCenter, center);
      if (connectionPath) {
        state.geometricPaths.push(connectionPath);
      }
    }
  }
  
  // Add a central Flower of Life pattern if golden ratio is enabled
  if (state.goldenRatio && clusters.length > 0) {
    const flowerPaths = createFlowerOfLifeOverlay(width, height, clusters);
    state.geometricPaths.push(...flowerPaths);
  }
  
  console.log('Generated', state.geometricPaths.length, 'geometric shapes');
}

// Cluster edge points into groups
function clusterEdgePoints(edges, detail) {
  if (edges.length === 0) return [];
  
  // Grid-based clustering - cell size based on detail level
  const cellSize = Math.max(20, 100 - detail);
  const grid = new Map();
  
  // Assign points to grid cells
  for (const point of edges) {
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    const key = `${cellX},${cellY}`;
    
    if (!grid.has(key)) {
      grid.set(key, { points: [], cellX, cellY });
    }
    grid.get(key).points.push(point);
  }
  
  // Filter clusters by minimum point count
  const minPoints = Math.max(3, Math.floor(detail / 10));
  const clusters = Array.from(grid.values())
    .filter(c => c.points.length >= minPoints)
    .sort((a, b) => b.points.length - a.points.length);
  
  // Limit number of clusters based on detail
  const maxClusters = 10 + Math.floor(detail / 5);
  return clusters.slice(0, maxClusters);
}

// Get cluster bounding box
function getClusterBounds(points) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Get shape types based on style slider
function getShapeTypesForStyle(style) {
  if (style < 25) {
    // Very angular: triangles and squares
    return ['triangle', 'square', 'triangle', 'hexagon'];
  } else if (style < 50) {
    // Angular: mixed polygons
    return ['triangle', 'hexagon', 'square', 'pentagon'];
  } else if (style < 75) {
    // Flowing: hexagons and circles
    return ['hexagon', 'circle', 'hexagon', 'octagon'];
  } else {
    // Very flowing: mostly circles
    return ['circle', 'hexagon', 'circle', 'vesicaPiscis'];
  }
}

// Create a complete geometric shape
function createGeometricShape(type, center, size) {
  const segments = [];
  let points = [];
  
  switch (type) {
    case 'circle':
      points = createCirclePoints(center, size, 36); // 36 segments for smooth circle
      break;
    case 'triangle':
      points = createPolygonPoints(center, size, 3);
      break;
    case 'square':
      points = createPolygonPoints(center, size, 4);
      break;
    case 'pentagon':
      points = createPolygonPoints(center, size, 5);
      break;
    case 'hexagon':
      points = createPolygonPoints(center, size, 6);
      break;
    case 'octagon':
      points = createPolygonPoints(center, size, 8);
      break;
    case 'vesicaPiscis':
      return createVesicaPiscis(center, size);
    default:
      points = createPolygonPoints(center, size, 6);
  }
  
  if (points.length < 2) return null;
  
  // Convert points to path segments
  for (let i = 0; i < points.length; i++) {
    const nextI = (i + 1) % points.length;
    segments.push({
      type: 'line',
      start: points[i],
      end: points[nextI]
    });
  }
  
  return {
    segments,
    closed: true,
    shapeType: type
  };
}

// Create circle points
function createCirclePoints(center, radius, numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
}

// Create regular polygon points
function createPolygonPoints(center, radius, sides) {
  const points = [];
  const angleOffset = -Math.PI / 2; // Start from top
  
  for (let i = 0; i < sides; i++) {
    const angle = angleOffset + (i / sides) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  return points;
}

// Create Vesica Piscis (two overlapping circles)
function createVesicaPiscis(center, size) {
  const segments = [];
  const offset = size / 2;
  
  // First circle
  const circle1Points = createCirclePoints(
    { x: center.x - offset / 2, y: center.y },
    size,
    24
  );
  
  // Second circle
  const circle2Points = createCirclePoints(
    { x: center.x + offset / 2, y: center.y },
    size,
    24
  );
  
  // Add first circle segments
  for (let i = 0; i < circle1Points.length; i++) {
    const nextI = (i + 1) % circle1Points.length;
    segments.push({
      type: 'line',
      start: circle1Points[i],
      end: circle1Points[nextI]
    });
  }
  
  // Add second circle segments
  for (let i = 0; i < circle2Points.length; i++) {
    const nextI = (i + 1) % circle2Points.length;
    segments.push({
      type: 'line',
      start: circle2Points[i],
      end: circle2Points[nextI]
    });
  }
  
  return {
    segments,
    closed: true,
    shapeType: 'vesicaPiscis'
  };
}

// Create connection line between two centers
function createConnectionLine(from, to) {
  return {
    segments: [{
      type: 'line',
      start: { x: from.x, y: from.y },
      end: { x: to.x, y: to.y }
    }],
    closed: false,
    shapeType: 'connection'
  };
}

// Create Flower of Life overlay based on edge clusters
function createFlowerOfLifeOverlay(width, height, clusters) {
  const paths = [];
  
  // Find the centroid of all clusters
  let totalX = 0, totalY = 0;
  for (const cluster of clusters) {
    const bounds = getClusterBounds(cluster.points);
    totalX += bounds.x + bounds.width / 2;
    totalY += bounds.y + bounds.height / 2;
  }
  const centerX = totalX / clusters.length;
  const centerY = totalY / clusters.length;
  
  // Calculate base radius using golden ratio
  const baseRadius = Math.min(width, height) / 6;
  
  // Central circle
  const centralCircle = createGeometricShape('circle', 
    { x: centerX, y: centerY }, 
    baseRadius * 0.3
  );
  if (centralCircle) {
    centralCircle.isOverlay = true;
    paths.push(centralCircle);
  }
  
  // Surrounding circles (6 circles in Flower of Life pattern)
  const numPetals = 6;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i / numPetals) * Math.PI * 2;
    const petalCenter = {
      x: centerX + Math.cos(angle) * baseRadius * 0.3,
      y: centerY + Math.sin(angle) * baseRadius * 0.3
    };
    
    const petal = createGeometricShape('circle', petalCenter, baseRadius * 0.3);
    if (petal) {
      petal.isOverlay = true;
      paths.push(petal);
    }
  }
  
  return paths;
}

// Create circular arc connections between nearby endpoints
function createCircularConnections(endpoints) {
  if (!state.circularConnections) {
    return [];
  }
  
  const connections = [];
  const used = new Set();
  
  // Maximum distance to connect (controlled by slider)
  const maxDistance = state.connectionDistance;
  
  // Minimum distance (don't connect points that are too close)
  const minDistance = 5;
  
  for (let i = 0; i < endpoints.length; i++) {
    if (used.has(i)) continue;
    
    const ep1 = endpoints[i];
    let bestMatch = null;
    let bestDist = Infinity;
    
    for (let j = i + 1; j < endpoints.length; j++) {
      if (used.has(j)) continue;
      
      // Don't connect endpoints from the same path
      if (endpoints[j].pathIndex === ep1.pathIndex) continue;
      
      const ep2 = endpoints[j];
      const dist = Math.sqrt(
        (ep2.point.x - ep1.point.x) ** 2 + 
        (ep2.point.y - ep1.point.y) ** 2
      );
      
      if (dist >= minDistance && dist <= maxDistance && dist < bestDist) {
        bestDist = dist;
        bestMatch = { index: j, endpoint: ep2 };
      }
    }
    
    if (bestMatch) {
      used.add(i);
      used.add(bestMatch.index);
      
      // Create a circular arc connection
      const arcPath = createCircularArc(ep1.point, bestMatch.endpoint.point);
      if (arcPath) {
        connections.push(arcPath);
      }
    }
  }
  
  console.log('Created', connections.length, 'circular arc connections');
  return connections;
}

// Create a circular arc between two points
function createCircularArc(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 1) return null;
  
  // Calculate midpoint
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  
  // Calculate perpendicular direction
  const perpX = -dy / dist;
  const perpY = dx / dist;
  
  // Arc bulge based on style slider (more flowing = more bulge)
  // Also apply golden ratio for sacred geometry feel
  const bulgeAmount = (dist / 3) * (state.style / 100) * (1 / PHI);
  
  // Alternate bulge direction based on position for variety
  const bulgeDir = ((p1.x + p1.y) % 2 === 0) ? 1 : -1;
  
  // Control point for quadratic bezier (approximates circular arc)
  const controlX = midX + perpX * bulgeAmount * bulgeDir;
  const controlY = midY + perpY * bulgeAmount * bulgeDir;
  
  // For more perfect circular arcs, we use two quadratic curves
  // This better approximates a true arc
  const quarterX1 = p1.x + dx * 0.25;
  const quarterY1 = p1.y + dy * 0.25;
  const quarterX2 = p1.x + dx * 0.75;
  const quarterY2 = p1.y + dy * 0.75;
  
  // Calculate radius for the arc (using golden ratio)
  const radius = dist * PHI / 2;
  
  // Control points for first and second half of arc
  const ctrl1X = p1.x + perpX * bulgeAmount * bulgeDir * 0.75;
  const ctrl1Y = p1.y + perpY * bulgeAmount * bulgeDir * 0.75 + dy * 0.25;
  const ctrl2X = p2.x + perpX * bulgeAmount * bulgeDir * 0.75;
  const ctrl2Y = p2.y + perpY * bulgeAmount * bulgeDir * 0.75 - dy * 0.25;
  
  return {
    segments: [
      {
        type: 'curve',
        start: p1,
        end: { x: midX + perpX * bulgeAmount * bulgeDir * 0.3, y: midY + perpY * bulgeAmount * bulgeDir * 0.3 },
        control: { x: ctrl1X, y: p1.y + dy * 0.3 + perpY * bulgeAmount * bulgeDir }
      },
      {
        type: 'curve',
        start: { x: midX + perpX * bulgeAmount * bulgeDir * 0.3, y: midY + perpY * bulgeAmount * bulgeDir * 0.3 },
        end: p2,
        control: { x: ctrl2X, y: p2.y - dy * 0.3 + perpY * bulgeAmount * bulgeDir }
      }
    ],
    closed: false,
    isConnection: true
  };
}

// Douglas-Peucker line simplification
function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  
  let maxDist = 0;
  let maxIdx = 0;
  
  const first = points[0];
  const last = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  
  return [first, last];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return Math.sqrt(
    (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
  );
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (len * len);
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

function subsamplePoints(points, maxPoints) {
  if (points.length <= maxPoints) return points;
  
  const step = points.length / maxPoints;
  const result = [];
  
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.floor(i * step);
    result.push(points[idx]);
  }
  
  return result;
}

// Smooth contour points by removing direction changes
function smoothContour(points, smoothingLevel) {
  if (points.length < 3 || smoothingLevel === 0) return points;
  
  // First pass: Moving average smoothing
  let smoothed = movingAverageSmooth(points, smoothingLevel);
  
  // Second pass: Remove points that don't significantly change direction
  smoothed = removeMinorDirectionChanges(smoothed, smoothingLevel);
  
  // Third pass: Merge nearly collinear segments
  smoothed = mergeCollinearSegments(smoothed, smoothingLevel);
  
  return smoothed;
}

// Moving average smoothing
function movingAverageSmooth(points, smoothingLevel) {
  if (points.length < 3) return points;
  
  // Window size based on smoothing level (1-5)
  const windowSize = Math.max(1, Math.floor(smoothingLevel / 20));
  
  if (windowSize < 1) return points;
  
  const result = [];
  
  for (let i = 0; i < points.length; i++) {
    let sumX = 0, sumY = 0, count = 0;
    
    for (let j = -windowSize; j <= windowSize; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < points.length) {
        sumX += points[idx].x;
        sumY += points[idx].y;
        count++;
      }
    }
    
    result.push({
      x: sumX / count,
      y: sumY / count
    });
  }
  
  return result;
}

// Remove points that don't significantly change direction
function removeMinorDirectionChanges(points, smoothingLevel) {
  if (points.length < 3) return points;
  
  // Angle threshold in degrees - higher smoothing = higher threshold = fewer points
  const angleThreshold = (smoothingLevel / 100) * 45; // 0-45 degrees
  
  const result = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate angles
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
    
    // Angle difference in degrees
    let angleDiff = Math.abs(angle2 - angle1) * (180 / Math.PI);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    
    // Keep point if angle change is significant
    if (angleDiff > angleThreshold) {
      result.push(curr);
    }
  }
  
  // Always keep the last point
  result.push(points[points.length - 1]);
  
  return result;
}

// Merge nearly collinear segments into single straight lines
function mergeCollinearSegments(points, smoothingLevel) {
  if (points.length < 3) return points;
  
  // Collinearity tolerance - higher smoothing = more merging
  const tolerance = (smoothingLevel / 100) * 10; // 0-10 pixels
  
  const result = [points[0]];
  let segmentStart = 0;
  
  for (let i = 2; i < points.length; i++) {
    const start = points[segmentStart];
    const end = points[i];
    
    // Check if all intermediate points are close to the line from start to end
    let allCollinear = true;
    
    for (let j = segmentStart + 1; j < i; j++) {
      const dist = perpendicularDistance(points[j], start, end);
      if (dist > tolerance) {
        allCollinear = false;
        break;
      }
    }
    
    if (!allCollinear) {
      // Previous point was the end of a collinear segment
      result.push(points[i - 1]);
      segmentStart = i - 1;
    }
  }
  
  // Always add the last point
  result.push(points[points.length - 1]);
  
  return result;
}

// Create geometric path from points
function createGeometricPath(points) {
  const path = {
    segments: [],
    closed: isClosedContour(points)
  };
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Calculate angle
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    
    // Snap to sacred angles if enabled
    if (state.sacredAngles) {
      angle = snapToSacredAngle(angle);
    }
    
    // Decide if line or curve based on style slider
    const useCurve = Math.random() * 100 < state.style;
    
    if (useCurve && i < points.length - 2) {
      // Create curve using next point as influence
      const p3 = points[i + 2];
      path.segments.push({
        type: 'curve',
        start: p1,
        end: p2,
        control: calculateControlPoint(p1, p2, p3),
        angle
      });
    } else {
      // Straight line
      path.segments.push({
        type: 'line',
        start: applyGoldenRatio(p1, p2, 'start'),
        end: applyGoldenRatio(p1, p2, 'end'),
        angle
      });
    }
  }
  
  return path;
}

function isClosedContour(points) {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  const dist = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
  return dist < 20;
}

function snapToSacredAngle(angle) {
  // Normalize to 0-360
  angle = ((angle % 360) + 360) % 360;
  
  let closest = SACRED_ANGLES[0];
  let minDiff = Math.abs(angle - SACRED_ANGLES[0]);
  
  for (const sacred of SACRED_ANGLES) {
    const diff = Math.abs(angle - sacred);
    if (diff < minDiff) {
      minDiff = diff;
      closest = sacred;
    }
  }
  
  // Only snap if close enough (within 15 degrees)
  return minDiff < 15 ? closest : angle;
}

function calculateControlPoint(p1, p2, p3) {
  // Create smooth bezier control point
  const midX = (p1.x + p3.x) / 2;
  const midY = (p1.y + p3.y) / 2;
  
  // Offset perpendicular to line
  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { x: p2.x, y: p2.y };
  
  const offsetScale = (state.style / 100) * 0.3;
  
  return {
    x: p2.x + (-dy / len) * len * offsetScale,
    y: p2.y + (dx / len) * len * offsetScale
  };
}

function applyGoldenRatio(p1, p2, which) {
  if (!state.goldenRatio) {
    return which === 'start' ? p1 : p2;
  }
  
  // Apply golden ratio subdivision
  const t = which === 'start' ? 0 : 1;
  const goldenT = which === 'start' ? (1 - 1/PHI) * 0.1 : 1 - (1 - 1/PHI) * 0.1;
  
  return {
    x: p1.x + (p2.x - p1.x) * goldenT,
    y: p1.y + (p2.y - p1.y) * goldenT
  };
}

// Rendering
let renderRequested = false;

function requestRender() {
  if (!renderRequested && state.originalImage && !state.isProcessing) {
    renderRequested = true;
    requestAnimationFrame(() => {
      renderRequested = false;
      
      // Re-process with new settings
      const ctx = elements.processingCanvas.getContext('2d');
      const width = elements.processingCanvas.width;
      const height = elements.processingCanvas.height;
      
      extractEdges(width, height);
      convertToSacredGeometry();
      render();
    });
  }
}

function render() {
  const canvas = elements.outputCanvas;
  const ctx = canvas.getContext('2d');
  
  // Clear with background color
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw subject bounding box indicator on original canvas if isolation is enabled
  drawSubjectBoundingBox();
  
  console.log('Rendering', state.geometricPaths.length, 'paths');
  
  // If no geometric paths, draw edge points directly as fallback
  if (state.geometricPaths.length === 0 && state.edges.length > 0) {
    console.log('Fallback: drawing', state.edges.length, 'edge points');
    ctx.fillStyle = state.lineColor;
    
    // Sample edge points based on detail level
    const step = Math.max(1, Math.floor(state.edges.length / (state.detail * 10)));
    for (let i = 0; i < state.edges.length; i += step) {
      const edge = state.edges[i];
      ctx.beginPath();
      ctx.arc(edge.x, edge.y, state.lineWeight / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  
  // Set line style
  ctx.strokeStyle = state.lineColor;
  ctx.lineWidth = state.lineWeight;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw geometric paths
  for (const path of state.geometricPaths) {
    if (!path.segments || path.segments.length === 0) continue;
    
    ctx.beginPath();
    
    for (let i = 0; i < path.segments.length; i++) {
      const seg = path.segments[i];
      
      if (i === 0) {
        ctx.moveTo(seg.start.x, seg.start.y);
      }
      
      if (seg.type === 'line') {
        ctx.lineTo(seg.end.x, seg.end.y);
      } else if (seg.type === 'curve') {
        ctx.quadraticCurveTo(seg.control.x, seg.control.y, seg.end.x, seg.end.y);
      }
    }
    
    if (path.closed) {
      ctx.closePath();
    }
    
    ctx.stroke();
  }
  
  // Add sacred geometry overlay elements based on style
  if (state.style > 70) {
    drawSacredOverlay(ctx, canvas.width, canvas.height);
  }
}

function drawSacredOverlay(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = state.lineColor;
  ctx.lineWidth = 1;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;
  
  // Vesica piscis circles
  ctx.beginPath();
  ctx.arc(centerX - radius / 2, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX + radius / 2, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.restore();
}

// Draw subject bounding box indicator on original canvas
function drawSubjectBoundingBox() {
  if (!state.subjectBounds) return;
  
  const canvas = elements.originalCanvas;
  const ctx = canvas.getContext('2d');
  
  // Redraw original image first
  if (state.originalImage) {
    ctx.drawImage(state.originalImage, 0, 0, canvas.width, canvas.height);
  }
  
  const bounds = state.subjectBounds;
  const padding = state.subjectPadding || 20;
  
  // Calculate padded bounds
  const x = Math.max(0, bounds.x - padding);
  const y = Math.max(0, bounds.y - padding);
  const w = Math.min(canvas.width - x, bounds.width + padding * 2);
  const h = Math.min(canvas.height - y, bounds.height + padding * 2);
  
  // Draw semi-transparent overlay outside the bounds (mask effect)
  if (state.isolateSubject) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    // Top region
    ctx.fillRect(0, 0, canvas.width, y);
    // Bottom region
    ctx.fillRect(0, y + h, canvas.width, canvas.height - (y + h));
    // Left region
    ctx.fillRect(0, y, x, h);
    // Right region
    ctx.fillRect(x + w, y, canvas.width - (x + w), h);
    
    ctx.restore();
  }
  
  // Draw bounding box outline
  ctx.save();
  ctx.strokeStyle = state.isolateSubject ? '#00ff88' : '#ffaa00';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x, y, w, h);
  
  // Draw label
  if (state.showSubjectLabel && state.detectedSubject) {
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = state.isolateSubject ? '#00ff88' : '#ffaa00';
    const label = `${state.detectedSubject.class} (${Math.round(state.detectedSubject.score * 100)}%)`;
    const textWidth = ctx.measureText(label).width;
    
    // Background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y - 22, textWidth + 10, 20);
    
    // Text
    ctx.fillStyle = state.isolateSubject ? '#00ff88' : '#ffaa00';
    ctx.fillText(label, x + 5, y - 7);
  }
  
  ctx.restore();
}

// Export functions
function exportSVG() {
  const canvas = elements.outputCanvas;
  const width = canvas.width;
  const height = canvas.height;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${state.bgColor}"/>
  <g stroke="${state.lineColor}" stroke-width="${state.lineWeight}" fill="none" stroke-linecap="round" stroke-linejoin="round">
`;
  
  for (const path of state.geometricPaths) {
    if (path.segments.length === 0) continue;
    
    let d = '';
    for (let i = 0; i < path.segments.length; i++) {
      const seg = path.segments[i];
      
      if (i === 0) {
        d += `M ${seg.start.x.toFixed(2)} ${seg.start.y.toFixed(2)} `;
      }
      
      if (seg.type === 'line') {
        d += `L ${seg.end.x.toFixed(2)} ${seg.end.y.toFixed(2)} `;
      } else if (seg.type === 'curve') {
        d += `Q ${seg.control.x.toFixed(2)} ${seg.control.y.toFixed(2)} ${seg.end.x.toFixed(2)} ${seg.end.y.toFixed(2)} `;
      }
    }
    
    if (path.closed) {
      d += 'Z';
    }
    
    svg += `    <path d="${d.trim()}"/>\n`;
  }
  
  svg += `  </g>
</svg>`;
  
  downloadFile(svg, 'sacred-geometry.svg', 'image/svg+xml');
  setStatus('SVG exported!', 'success');
}

function exportPNG() {
  const canvas = elements.outputCanvas;
  const dataUrl = canvas.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.download = 'sacred-geometry.png';
  link.href = dataUrl;
  link.click();
  
  setStatus('PNG exported!', 'success');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// Utility functions
function setStatus(message, type = '') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = 'status-message ' + type;
  
  if (type === 'loading') {
    elements.statusMessage.innerHTML = '<span class="loading-spinner"></span>' + message;
  }
}

// Start app
init();
