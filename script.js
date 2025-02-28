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
        maxZoom: 10, 
        minZoom: -2, 
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

    class AxisEditor {
        constructor(map) {
            this.map = map;
            this.axes = {};
            this.gridLayer = null;
            this.drawingAxis = false;
            this.currentAxisId = null;
            this.currentAxisColor = null;
            this.currentAxisPoints = [];
            this.iiifLayer = null;
        }

        startDrawingAxis(axisId, color) {
            this.drawingAxis = true;
            this.currentAxisId = axisId;
            this.currentAxisColor = color;
            this.currentAxisPoints = [];
            console.log(`✏️ Start met tekenen van ${axisId} as`);

            // Verwijder bestaande markers en lijnen van dezelfde as
            if (this.axes[axisId]) {
                this.map.removeLayer(this.axes[axisId]);
            }
        }

        handleMapClick(event) {
            if (!this.drawingAxis) return;

            const latlng = event.latlng;
            this.currentAxisPoints.push(latlng);
            
            if (this.currentAxisPoints.length === 2) {
                // Teken de lijn
                this.addOrUpdateAxis(this.currentAxisId, this.currentAxisPoints[0], this.currentAxisPoints[1], this.currentAxisColor);
                this.drawingAxis = false;  // Stop met tekenen
                this.checkAndGenerateGrid();
            }
        }

        addOrUpdateAxis(id, start, end, color) {
            // Verwijder oude lijn als deze bestaat
            if (this.axes[id]) {
                this.map.removeLayer(this.axes[id]);
            }
            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);

            this.checkAndGenerateGrid();
        }

        checkAndGenerateGrid() {
            if (this.axes['x'] && this.axes['x2'] && this.axes['y']) {
                this.generateGrid();
                this.calculateScale();
                this.calculateRotation();
            }
        }

        generateGrid() {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }

            const xStart = this.axes['x'].getLatLngs()[0];
            const xEnd = this.axes['x2'].getLatLngs()[0];
            const yStart = this.axes['y'].getLatLngs()[0];

            const pixelPerMeter = Math.abs(xEnd.lng - xStart.lng) / (parseFloat(document.getElementById("x-axis-2-value").value) || 1);
            console.log(`📏 Pixels per meter: ${pixelPerMeter}`);

            if (!pixelPerMeter || pixelPerMeter <= 0) {
                console.warn("⚠️ Ongeldige pixels per meter waarde. Grid wordt niet gegenereerd.");
                return;
            }

            let gridLines = [];

            for (let i = -10; i <= 10; i++) {
                let xOffset = xStart.lng + i * 10 * pixelPerMeter;
                let yOffset = yStart.lat + i * 10 * pixelPerMeter;

                gridLines.push(L.polyline([
                    [yOffset, xStart.lng - 100 * pixelPerMeter],
                    [yOffset, xStart.lng + 100 * pixelPerMeter]
                ], { color: "gray", weight: 1, opacity: 0.5 }));
            }

            this.gridLayer = L.layerGroup(gridLines).addTo(this.map);
            console.log("✅ Grid succesvol gegenereerd!");
        }

        calculateScale() {
            const xStart = this.axes['x'].getLatLngs()[0];
            const xEnd = this.axes['x2'].getLatLngs()[0];
            const fieldMeters = parseFloat(document.getElementById("x-axis-2-value").value) || 1;

            const pixelDistance = Math.abs(xEnd.lng - xStart.lng);
            const metersPerPixel = fieldMeters / pixelDistance;
            const dpi = 300;
            const scale = metersPerPixel * dpi * 39.37; // 1 inch = 0.0254 meter

            console.log(`📏 Berekende schaal: 1:${scale.toFixed(0)}`);
            document.getElementById("measured-scale").textContent = `1:${scale.toFixed(0)}`;
        }

        calculateRotation() {
            const yStart = this.axes['y'].getLatLngs()[0];
            const yEnd = this.axes['y'].getLatLngs()[1];

            const deltaX = yEnd.lng - yStart.lng;
            const deltaY = yEnd.lat - yStart.lat;

            const angleRad = Math.atan2(deltaY, deltaX);
            const angleDeg = angleRad * (180 / Math.PI);

            console.log(`🔄 Gemeten rotatiehoek: ${angleDeg.toFixed(3)}°`);
            document.getElementById("measured-rotation").textContent = `${angleDeg.toFixed(3)}°`;
        }

        loadIIIFLayer(infoJsonUrl) {
            console.log(`🔄 Laden van IIIF-afbeelding van: ${infoJsonUrl}`);

            // Haal de info.json op
            fetch(infoJsonUrl)
                .then(response => response.json())
                .then(data => {
                    if (data && data.tiles && data.tiles[0] && data.tiles[0].scaleFactors) {
                        const tileWidth = data.tiles[0].width;
                        const tileHeight = data.tiles[0].height;
                        const scaleFactor = data.tiles[0].scaleFactors[0];

                        const imageUrl = data.tiles[0].url;
                        const bounds = [[0, 0], [tileHeight * scaleFactor, tileWidth * scaleFactor]];

                        // Laad de IIIF-afbeelding
                        this.iiifLayer = L.imageOverlay(imageUrl, bounds).addTo(this.map);

                        console.log("✅ IIIF-afbeelding succesvol geladen!");
                    } else {
                        console.error("❌ Fout bij het ophalen van de IIIF info.json of de tile-data.");
                    }
                })
                .catch(error => {
                    console.error("❌ Er is een fout opgetreden bij het ophalen van de IIIF-afbeelding:", error);
                });
        }
    }

    const editor = new AxisEditor(map);

    // Event listeners voor knoppen
    document.getElementById("draw-x-axis").addEventListener("click", () => editor.startDrawingAxis("x", "blue"));
    document.getElementById("draw-x2-axis").addEventListener("click", () => editor.startDrawingAxis("x2", "orange"));
    document.getElementById("draw-y-axis").addEventListener("click", () => editor.startDrawingAxis("y", "red"));
    document.getElementById("generate-grid").addEventListener("click", () => editor.generateGrid());

    // Event listener voor klikken op de kaart
    map.on('click', (event) => editor.handleMapClick(event));

    // Event listener voor het laden van de IIIF-afbeelding
    document.getElementById("load-iiif").addEventListener("click", () => {
        const infoJsonUrl = document.getElementById("info-json-url").value;
        if (infoJsonUrl) {
            editor.loadIIIFLayer(infoJsonUrl);
        } else {
            console.warn("⚠️ Geen info.json URL ingevoerd.");
        }
    });
});
