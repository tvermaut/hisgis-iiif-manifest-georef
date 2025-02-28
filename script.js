document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    if (typeof L === "undefined") {
        console.error("❌ Leaflet (L) is niet beschikbaar. Controleer of leaflet.js correct wordt geladen!");
        return;
    } else {
        console.log("✅ Leaflet is correct geladen.");
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("❌ Fout: 'map' container niet gevonden.");
        return;
    } else {
        console.log("✅ 'map' container gevonden.");
    }

    const map = L.map("map", {
        center: [0, 0],
        zoom: 1,
        crs: L.CRS.Simple,
        preferCanvas: true,
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

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
        if (!infoUrl) {
            console.error("❌ Geen info.json URL ingevoerd.");
            return;
        }
        loadIIIFLayer(infoUrl);
    });

    class AxisEditor {
        constructor(map) {
            this.map = map;
            this.axes = {};
            this.gridLayer = null;
            this.markers = {};
        }

        addOrUpdateAxis(id, start, end, color) {
            if (this.axes[id]) {
                this.map.removeLayer(this.axes[id]);
                this.removeMarkers(id);
            }
            
            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);
            
            this.addDraggableMarker(id, start, color, "start");
            this.addDraggableMarker(id, end, color, "end");
            
            this.checkAndGenerateGrid();
        }

        addDraggableMarker(id, position, color, type) {
            const icon = L.icon({
                iconUrl: "data:image/svg+xml;base64," + btoa(`
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128' width='20' height='20'>
                        <path fill='${color}' d='M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z'/>
                    </svg>`),
                iconSize: [20, 20],
                iconAnchor: [10, 20]
            });
            
            const marker = L.marker(position, { icon, draggable: true }).addTo(this.map);
            
            marker.on("dragend", (event) => {
                const newPos = event.target.getLatLng();
                if (type === "start") {
                    this.addOrUpdateAxis(id, newPos, this.axes[id].getLatLngs()[1], color);
                } else {
                    this.addOrUpdateAxis(id, this.axes[id].getLatLngs()[0], newPos, color);
                }
            });
            
            this.markers[id] = this.markers[id] || {};
            this.markers[id][type] = marker;
        }

        removeMarkers(id) {
            if (this.markers[id]) {
                Object.values(this.markers[id]).forEach(marker => this.map.removeLayer(marker));
                delete this.markers[id];
            }
        }

        checkAndGenerateGrid() {
            if (this.axes['x'] && this.axes['y']) {
                this.generateGrid();
            }
        }

        generateGrid() {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }

            const scale = document.getElementById("scale-selector").value;
            const gridSize = scale === "2500" ? 250 : scale === "1250" ? 125 : 500;
            const xBase = parseFloat(document.getElementById("y-axis-value").value) || 0;
            const yBase = parseFloat(document.getElementById("x-axis-value").value) || 0;
            
            let gridLines = [];

            for (let i = -10; i <= 10; i++) {
                let xOffset = xBase + i * gridSize;
                let yOffset = yBase + i * gridSize;

                gridLines.push(L.polyline([
                    [yBase - 10 * gridSize, xOffset],
                    [yBase + 10 * gridSize, xOffset]
                ], { color: "gray", weight: 1, opacity: 0.5 }));

                gridLines.push(L.polyline([
                    [yOffset, xBase - 10 * gridSize],
                    [yOffset, xBase + 10 * gridSize]
                ], { color: "gray", weight: 1, opacity: 0.5 }));
            }

            this.gridLayer = L.layerGroup(gridLines).addTo(this.map);
            console.log("✅ Grid gegenereerd!");
        }
    }

    const editor = new AxisEditor(map);
    let drawMode = null;
    let startPoint = null;

    function enableDrawMode(mode) {
        drawMode = mode;
        startPoint = null;
        console.log(`🖍️ Tekenen van een ${mode === 'x' ? 'X-as (rood)' : 'Y-as (blauw)'} gestart! Klik twee punten.`);
    }

    map.on("click", (e) => {
        if (!drawMode) return;
        if (!startPoint) {
            startPoint = e.latlng;
        } else {
            editor.addOrUpdateAxis(drawMode, startPoint, e.latlng, drawMode === "x" ? "red" : "blue");
            drawMode = null;
            startPoint = null;
        }
    });
});
