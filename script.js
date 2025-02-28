let viewer;
let lines = [];
let drawingLine = false;
let currentLineType;
let tempLine = null;
let lineStartPoint = null;

function loadImage() {
    const infoJsonUrl = document.getElementById('infoJsonUrl').value;
    console.log("Loading image with URL:", infoJsonUrl);

    viewer = OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/3.1.0/images/",
        tileSources: infoJsonUrl,
        maxZoomPixelRatio: 10,
        gestureSettingsMouse: {
            clickToZoom: false
        }
    });

    viewer.addHandler('open', function () {
        console.log("Viewer opened.");
        viewer.addHandler('canvas-click', handleCanvasClick);
    });

    viewer.addHandler('update-viewport', function () {
        console.log("Viewport updated.");
        updateAllLines();
    });
}

function handleCanvasClick(event) {
    if (!event.quick) return;
    event.preventDefaultAction = true;

    const viewportPoint = viewer.viewport.pointFromPixel(event.position);
    console.log("Canvas clicked at viewport point:", viewportPoint);

    if (drawingLine) {
        handleLineDrawing(viewportPoint);
    } else {
        console.log("No active drawing mode.");
    }
}

function handleLineDrawing(viewportPoint) {
    if (!lineStartPoint) {
        lineStartPoint = viewportPoint;
        tempLine = drawLine(lineStartPoint, viewportPoint, currentLineType);
        console.log("Started drawing line at:", lineStartPoint);
    } else {
        updateLine(tempLine, lineStartPoint, viewportPoint);
        console.log("Finished drawing line from", lineStartPoint, "to", viewportPoint);
        
        lines.push({
            start: lineStartPoint,
            end: viewportPoint,
            type: currentLineType,
            overlay: tempLine
        });

        // Reset temporary variables
        lineStartPoint = null;
        tempLine = null;
        drawingLine = false;
    }
}

function startDrawLine(lineType) {
    drawingLine = true;
    currentLineType = lineType;
    lineStartPoint = null;

    if (tempLine) {
        viewer.removeOverlay(tempLine.element);
        tempLine = null;
    }

    console.log(`Started drawing a ${lineType} line.`);
}

function drawLine(start, end, lineType) {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.backgroundColor = lineType === 'x' ? 'red' : 'blue';
    line.style.height = '2px';
    line.style.transformOrigin = '0 50%';

    const overlay = {
        element: line,
        location: new OpenSeadragon.Rect(start.x, start.y, 0, 0),
        placement: OpenSeadragon.Placement.TOP_LEFT
    };

    viewer.addOverlay(overlay);
    updateLine(overlay, start, end);

    console.log("Created a new line overlay:", overlay);
    return overlay;
}

function updateLine(lineOverlay, start, end) {
    const startPixel = viewer.viewport.pixelFromPoint(start);
    const endPixel = viewer.viewport.pixelFromPoint(end);

    console.log("Updating line:");
    console.log("  Start (viewport):", start);
    console.log("  End (viewport):", end);
    console.log("  Start (pixel):", startPixel);
    console.log("  End (pixel):", endPixel);

    const dx = endPixel.x - startPixel.x;
    const dy = endPixel.y - startPixel.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    console.log("  Calculated length:", length);
    console.log("  Calculated angle:", angle);

    // Update the DOM element's style
    lineOverlay.element.style.width = `${length}px`;
    lineOverlay.element.style.transform = `rotate(${angle}deg)`;

    // Update the overlay's location to match the starting point
    const rectLocation = new OpenSeadragon.Point(startPixel.x, startPixel.y);
    
    // Ensure the overlay is updated
    viewer.updateOverlay(lineOverlay);

}

function updateAllLines() {
    console.log("Updating all lines...");
    
}
