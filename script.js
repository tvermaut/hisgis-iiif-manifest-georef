document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    if (typeof L === "undefined") {
        console.error("❌ Leaflet (L) is niet beschikbaar. Controleer of leaflet.js correct wordt geladen!");
        return;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("❌ Fout: 'map' container niet gevonden.");
        return;
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
            this.dragging = null;
            this.gridLayer = null;
        }

        createSVGIcon(color) {
            return L.divIcon({
                className: "custom-marker",
                html: `<svg width="24" height="24" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
                            <path fill="${color}" d="M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z"/>
                        </svg>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });
        }

        addOrUpdateAxis(id, start, end, color) {
            if (this.axes[id]) {
                this.map.removeLayer(this.axes[id]);
            }
            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);

            L.marker(start, { icon: this.createSVGIcon(color), draggable: true }).addTo(this.map);
            L.marker(end, { icon: this.createSVGIcon(color), draggable: true }).addTo(this.map);

            this.generateGrid();
        }

        generateGrid() {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }

            const xVal = parseFloat(document.getElementById("x-axis-value").value) || 0;
            const yVal = parseFloat(document.getElementById("y-axis-value").value) || 0;
            const scale = parseInt(document.getElementById("scale-select").value, 10);

            const gridSize = scale === 2500 ? 250 : scale === 1250 ? 125 : 500;
            const latStart = this.axes["x"]?.getLatLngs()[0].lat || 0;
            const lngStart = this.axes["y"]?.getLatLngs()[0].lng || 0;

            let gridLines = [];

            for (let i = -10; i <= 10; i++) {
                let xOffset = i * gridSize;
                gridLines.push(L.polyline([
                    [latStart + xOffset, lngStart - 10 * gridSize],
                    [latStart + xOffset, lngStart + 10 * gridSize]
                ], { color: "gray", weight: 1 }));

                let yOffset = i * gridSize;
                gridLines.push(L.polyline([
                    [latStart - 10 * gridSize, lngStart + yOffset],
                    [latStart + 10 * gridSize, lngStart + yOffset]
                ], { color: "gray", weight: 1 }));
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
        console.log(`🖍️ Tekenen van een ${mode === "x" ? "X-as (rood)" : "Y-as (blauw)"} gestart!`);
    }

    map.on("click", (e) => {
        if (!drawMode) return;
        if (!startPoint) {
            startPoint = e.latlng;
            console.log(`📍 Startpunt geselecteerd: ${startPoint.lat}, ${startPoint.lng}`);
        } else {
            const endPoint = e.latlng;
            console.log(`📍 Eindpunt geselecteerd: ${endPoint.lat}, ${endPoint.lng}`);
            const color = drawMode === "x" ? "red" : "blue";
            editor.addOrUpdateAxis(drawMode, startPoint, endPoint, color);
            drawMode = null;
            map.getContainer().style.cursor = "default";
        }
    });

    document.getElementById("draw-x-axis").addEventListener("click", () => enableDrawMode("x"));
    document.getElementById("draw-y-axis").addEventListener("click", () => enableDrawMode("y"));
    document.getElementById("scale-select").addEventListener("change", () => editor.generateGrid());
});
