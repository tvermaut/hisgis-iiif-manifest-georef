function loadIIIFLayer(infoUrl) {
    console.log(`🔄 Probeer IIIF-laag te laden van: ${infoUrl}`);

    if (!infoUrl.startsWith("http")) {
        console.error("❌ Ongeldige URL!");
        return;
    }

    if (window.iiifLayer) {
        console.log("🗑️ Oude IIIF-laag verwijderen...");
        map.removeLayer(window.iiifLayer);
    }

    try {
        window.iiifLayer = L.tileLayer.iiif(infoUrl, {
            fitBounds: true,
            setMaxBounds: true,
        }).addTo(map);
        console.log("✅ IIIF-kaartlaag geladen!");
    } catch (error) {
        console.error("🚨 Fout bij laden IIIF-laag:", error);
    }
}

document.getElementById("load-iiif").addEventListener("click", () => {
    console.log("📥 Load-knop geklikt!");

    const infoUrl = document.getElementById("info-json-url").value.trim();
    console.log(`📌 Ingevoerde URL: ${infoUrl}`);

    if (!infoUrl) {
        console.error("❌ Geen info.json URL ingevoerd.");
        return;
    }

    loadIIIFLayer(infoUrl);
});

    const map = L.map("map", {
        center: [0, 0], 
        zoom: 1,
        crs: L.CRS.Simple,
        preferCanvas: true,
    });

    class AxisEditor {
        constructor(map) {
            this.map = map;
            this.axes = {};
            this.markers = {};
            this.gridLayer = null;
            this.axisLayerGroup = L.layerGroup().addTo(map);
        }

        addOrUpdateAxis(id, start, end, color) {
            if (this.axes[id]) {
                this.axisLayerGroup.removeLayer(this.axes[id]);
                this.markers[id].forEach(marker => this.axisLayerGroup.removeLayer(marker));
            }

            this.axes[id] = L.polyline([start, end], { color, weight: 3, interactive: false }).addTo(this.axisLayerGroup);
            this.markers[id] = this.createDraggableMarkers(id, start, end, color);
            
            if (this.axes["x"] && this.axes["y"]) {
                this.generateGrid();
            }
        }

        createDraggableMarkers(axisId, start, end, color) {
            const markerOptions = (latlng) => ({
                draggable: true,
                icon: L.divIcon({
                    className: "axis-marker",
                    html: `<svg width="24" height="24" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                        <path d="M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z" fill="${color}"/>
                        </svg>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            });

            const startMarker = L.marker(start, markerOptions(start)).addTo(this.axisLayerGroup);
            const endMarker = L.marker(end, markerOptions(end)).addTo(this.axisLayerGroup);

            [startMarker, endMarker].forEach((marker, index) => {
                marker.on("drag", (event) => {
                    let latlngs = this.axes[axisId].getLatLngs();
                    latlngs[index] = event.target.getLatLng();
                    this.axes[axisId].setLatLngs(latlngs);
                    this.generateGrid();
                });

                marker.on("mouseover", () => {
                    map.getContainer().style.cursor = "grab";
                });

                marker.on("mouseout", () => {
                    map.getContainer().style.cursor = "";
                });
            });

            return [startMarker, endMarker];
        }

        generateGrid() {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }

            const xAxisLatLngs = this.axes["x"].getLatLngs();
            const yAxisLatLngs = this.axes["y"].getLatLngs();
            const xAxisValue = parseFloat(document.getElementById("x-axis-value").value);
            const yAxisValue = parseFloat(document.getElementById("y-axis-value").value);
            const scale = parseInt(document.getElementById("map-scale").value);
            const gridSizeMeters = scale / 10; // 1:2500 → 250m, 1:1250 → 125m, 1:5000 → 500m

            const origin = {
                lat: yAxisLatLngs[0].lat,
                lng: xAxisLatLngs[0].lng
            };

            const gridLines = [];

            for (let i = -10; i <= 10; i++) {
                let xOffset = i * (gridSizeMeters / scale);
                let yOffset = i * (gridSizeMeters / scale);

                gridLines.push(L.polyline([
                    [origin.lat + yOffset, origin.lng - 10 * (gridSizeMeters / scale)],
                    [origin.lat + yOffset, origin.lng + 10 * (gridSizeMeters / scale)]
                ], { color: "#888", weight: 1, opacity: 0.5 }));

                gridLines.push(L.polyline([
                    [origin.lat - 10 * (gridSizeMeters / scale), origin.lng + xOffset],
                    [origin.lat + 10 * (gridSizeMeters / scale), origin.lng + xOffset]
                ], { color: "#888", weight: 1, opacity: 0.5 }));
            }

            this.gridLayer = L.layerGroup(gridLines).addTo(this.map);
        }
    }

    const editor = new AxisEditor(map);
    let drawMode = null;
    let startPoint = null;

    function enableDrawMode(mode) {
        drawMode = mode;
        startPoint = null;
        map.getContainer().style.cursor = "crosshair";
    }

    map.on("click", (e) => {
        if (!drawMode) return;
        
        if (!startPoint) {
            startPoint = e.latlng;
        } else {
            const endPoint = e.latlng;
            const color = drawMode === "x" ? "red" : "blue";
            editor.addOrUpdateAxis(drawMode, startPoint, endPoint, color);
            drawMode = null;
            startPoint = null;
            map.getContainer().style.cursor = "";
        }
    });

    document.getElementById("draw-x-axis").addEventListener("click", () => enableDrawMode("x"));
    document.getElementById("draw-y-axis").addEventListener("click", () => enableDrawMode("y"));
    document.getElementById("map-scale").addEventListener("change", () => editor.generateGrid());
});
