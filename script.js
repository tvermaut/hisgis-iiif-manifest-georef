let viewer;
let gcps = [];
let lines = [];
let tempPoint;
let tempMarker;
let activeMarker;
let drawingLine = false;
let currentLineType;
let tempLine;
let lineStartPoint;

function loadImage() {
    const infoJsonUrl = document.getElementById('infoJsonUrl').value;
    viewer = OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/3.1.0/images/",
        tileSources: infoJsonUrl,
        maxZoomPixelRatio: 10,
        gestureSettingsMouse: {
            clickToZoom: false
        }
    });

    viewer.addHandler('open', function() {
        console.log('Viewer opened');
        viewer.addHandler('canvas-click', handleCanvasClick);
    });

    viewer.addHandler('update-viewport', function() {
        lines.forEach(line => {
            updateLine(line.overlay, line.start, line.end);
        });
        updateMarkers();
    });
}

function handleCanvasClick(event) {
    if (!event.quick) return;
    event.preventDefaultAction = true;
    
    const viewportPoint = viewer.viewport.pointFromPixel(event.position);

    if (drawingLine) {
        handleLineDrawing(viewportPoint);
    } else {
        handleMarkerPlacement(viewportPoint);
    }
}

function handleMarkerPlacement(viewportPoint) {
    tempPoint = viewportPoint;
    
    if (tempMarker) {
        viewer.removeOverlay(tempMarker.element);
    }
    
    tempMarker = addMarker(tempPoint, 'temp', true);
    activeMarker = tempMarker;
    
    showModal();
}

function handleLineDrawing(viewportPoint) {
    if (!lineStartPoint) {
        lineStartPoint = viewportPoint;
        tempLine = drawLine(lineStartPoint, viewportPoint, currentLineType);
    } else {
        updateLine(tempLine, lineStartPoint, viewportPoint);
        showLineModal();
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
}

function drawLine(start, end, lineType) {
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.backgroundColor = lineType === 'x' ? 'red' : 'blue';
    line.style.height = '2px'; // Verander width naar height
    line.style.transformOrigin = '0 50%'; // Verander naar midden-links

    const overlay = {
        element: line,
        location: new OpenSeadragon.Rect(start.x, start.y, 0, 0), // Begin met een punt
        placement: OpenSeadragon.Placement.TOP_LEFT
    };

    viewer.addOverlay(overlay);
    updateLine(overlay, start, end);

    return overlay;
}

function updateLine(lineOverlay, start, end) {
    const startPixel = viewer.viewport.viewportToViewerElementCoordinates(start);
    const endPixel = viewer.viewport.viewportToViewerElementCoordinates(end);
    
    const dx = endPixel.x - startPixel.x;
    const dy = endPixel.y - startPixel.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    lineOverlay.element.style.width = `${length}px`; // Gebruik pixels in plaats van percentage
    lineOverlay.element.style.transform = `rotate(${angle}deg)`;
    
    // Update de locatie van de overlay naar het startpunt
    lineOverlay.location.x = start.x;
    lineOverlay.location.y = start.y;

    viewer.updateOverlay(lineOverlay);
}

function showModal() {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('targetX').value = '';
    document.getElementById('targetY').value = '';
    document.getElementById('targetX').focus();
}

function showLineModal() {
    document.getElementById('lineModal').style.display = 'block';
    document.getElementById('lineValue').value = '';
    document.getElementById('lineValue').focus();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    if (tempMarker) {
        viewer.removeOverlay(tempMarker.element);
        tempMarker = null;
    }
    activeMarker = null;
}

function closeLineModal() {
    document.getElementById('lineModal').style.display = 'none';
    if (tempLine) {
        viewer.removeOverlay(tempLine.element);
        tempLine = null;
    }
    lineStartPoint = null;
}

function addGcp() {
    const targetX = parseFloat(document.getElementById('targetX').value);
    const targetY = parseFloat(document.getElementById('targetY').value);
    if (!isNaN(targetX) && !isNaN(targetY)) {
        const gcp = {
            x: tempPoint.x,
            y: tempPoint.y,
            targetX: targetX,
            targetY: targetY
        };
        gcps.push(gcp);
        updateGcpList();
        
        if (tempMarker) {
            viewer.removeOverlay(tempMarker.element);
        }
        addMarker(gcp, gcps.length, false);
        
        closeModal();
    } else {
        alert('Voer geldige numerieke waarden in voor X en Y.');
    }
}

function addLine() {
    const lineValue = parseFloat(document.getElementById('lineValue').value);
    if (!isNaN(lineValue)) {
        const startPoint = new OpenSeadragon.Point(tempLine.location.x, tempLine.location.y);
        const viewerCoordsStart = viewer.viewport.viewportToViewerElementCoordinates(startPoint);

        const endPoint = new OpenSeadragon.Point(tempLine.location.x + tempLine.location.width, tempLine.location.y + tempLine.location.height);
        const viewerCoordsEnd = viewer.viewport.viewportToViewerElementCoordinates(endPoint);

        const line = {
            start: startPoint,
            end: endPoint,
            type: currentLineType,
            value: lineValue,
            overlay: tempLine
        };
        lines.push(line);
        updateLinesList();
        
        tempLine = null;
        lineStartPoint = null;
        closeLineModal();
    } else {
        alert('Voer een geldige numerieke waarde in voor de lijn.');
    }
}

function updateGcpList() {
    const gcpList = document.getElementById('gcpList');
    gcpList.innerHTML = '<h3>GCP-punten:</h3>';
    gcps.forEach((gcp, index) => {
        gcpList.innerHTML += `<p>Punt ${index + 1}: (${gcp.x.toFixed(4)}, ${gcp.y.toFixed(4)}) → (${gcp.targetX}, ${gcp.targetY})</p>`;
    });
    updateLinesList();
}

function updateLinesList() {
    const gcpList = document.getElementById('gcpList');
    gcpList.innerHTML += '<h3>Lijnen:</h3>';
    lines.forEach((line, index) => {
        gcpList.innerHTML += `<p>Lijn ${index + 1} (${line.type}): ${line.value}</p>`;
    });
}

function addMarker(point, id, isTemp) {
    const markerSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128" xml:space="preserve">
        <path d="M64 1C38.8 1 18.3 21.2 18.3 46S64 127 64 127s45.7-56.2 45.7-81S89.2 1 64 1zm0 73.9c-16.6 0-30-13.2-30-29.5C34 29 47.4 15.8 64 15.8S94 29 94 45.3 80.6 74.9 64 74.9z" style="fill-rule:evenodd;clip-rule:evenodd;fill:#191919"/>
        <circle cx="64" cy="45.3" r="29.5" fill="${isTemp ? 'rgba(255,0,0,0.5)' : 'none'}"/>
    </svg>`;
    
    const marker = document.createElement('div');
    marker.innerHTML = markerSvg;
    marker.className = 'gcp-marker';
    marker.style.width = '32px';
    marker.style.height = '32px';
    
    const overlay = {
        element: marker,
        location: new OpenSeadragon.Point(point.x, point.y),
        placement: OpenSeadragon.Placement.BOTTOM,
        checkResize: false
    };
    
    viewer.addOverlay(overlay);

    if (!isTemp) {
        makeMarkerDraggable(marker, id);
    }

    return overlay;
}

function makeMarkerDraggable(markerElement, id) {
    let isDragging = false;
    let startPoint;

    markerElement.addEventListener('mousedown', function(e) {
        isDragging = true;
        startPoint = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(e.clientX, e.clientY));
    });

    viewer.addHandler('mousemove', function(e) {
        if (isDragging) {
            const currentPoint = viewer.viewport.pointFromPixel(e.position);
            const delta = currentPoint.minus(startPoint);
            const overlay = viewer.getOverlayById(`marker-${id}`);
            if (overlay) {
                const newLocation = overlay.location.plus(delta);
                viewer.updateOverlay(overlay, newLocation);
                startPoint = currentPoint;

                gcps[id - 1].x = newLocation.x;
                gcps[id - 1].y = newLocation.y;
                updateGcpList();
            }
        }
    });

    viewer.addHandler('mouseup', function() {
        isDragging = false;
    });
}

function updateMarkers() {
    gcps.forEach((gcp, index) => {
        const marker = viewer.getOverlayById(`marker-${index + 1}`);
        if (marker) {
            viewer.updateOverlay(marker, new OpenSeadragon.Point(gcp.x, gcp.y));
        }
    });
}

function updateLines() {
    lines.forEach((line) => {
        updateLine(line.overlay, line.start, line.end);
    });
}
