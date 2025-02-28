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
        minZoom: -5, // Laat verder uitzoomen toe
        maxZoom: 5   // Laat verder inzoomen toe
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
            }).addTo(map);
    
            // Sta toe om buiten de afbeelding te pannen
            map.setMaxBounds(null);  // Verwijder bounding box
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
            this.currentDrawing = null;
        }
    
        startDrawingAxis(id, color) {
            console.log(`✏️ Start tekenen van as: ${id}`);
            this.currentDrawing = { id, color };
            this.map.on("click", this.handleMapClick.bind(this));
        }
    
        handleMapClick(event) {
            if (!this.currentDrawing) return;
    
            const { id, color } = this.currentDrawing;
    
            if (!this.axes[id]) {
                this.axes[id] = { start: event.latlng };
                console.log(`📍 Startpunt ${id} gezet.`);
            } else {
                this.addOrUpdateAxis(id, this.axes[id].start, event.latlng, color);
                console.log(`✅ As ${id} getekend.`);
                this.currentDrawing = null;
                this.map.off("click", this.handleMapClick.bind(this));
            }
        }

        addOrUpdateAxis(id, start, end, color) {
            console.log(`🔄 Bijwerken van as: ${id}`);
        
            if (!start || !end) {
                console.error(`❌ Ongeldige start- of eindpositie voor as ${id}.`);
                return;
            }
        
            // Verwijder bestaande lijn en markers als die al bestaan
            if (this.axes[id]) {
                console.log(`🗑️ Oude lijn en markers verwijderen voor as ${id}`);
                this.map.removeLayer(this.axes[id]);
                this.removeMarkers(id);
            }
        
            // Teken de nieuwe lijn
            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);
            console.log(`✅ As ${id} succesvol getekend: ${JSON.stringify(this.axes[id].getLatLngs())}`);
        
            // Voeg de markers toe
            this.addDraggableMarker(id, start, color, "start");
            this.addDraggableMarker(id, end, color, "end");
        
            // Controleer of het grid getekend kan worden
            this.checkAndGenerateGrid();
        }        
    
        removeMarkers(id) {
            if (this.markers[id]) {
                Object.values(this.markers[id]).forEach(marker => this.map.removeLayer(marker));
                delete this.markers[id];
            }
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
    
        checkAndGenerateGrid() {
            if (this.axes['x'] && this.axes['x2'] && this.axes['y']) {
                this.generateGrid();
            }
        }
    
        generateGrid() {
            if (this.gridLayer) {
                this.map.removeLayer(this.gridLayer);
            }
    
            const x1 = this.axes['x'].getLatLngs()[0];
            const x2 = this.axes['x2'].getLatLngs()[0];
            const y1 = this.axes['y'].getLatLngs()[0];
    
            const xValue2 = parseFloat(document.getElementById("x-axis-2-value").value) || 1;
            const pixelPerMeter = Math.abs(x2.lng - x1.lng) / xValue2;
    
            let gridLines = [];
    
            for (let i = -10; i <= 10; i++) {
                let xOffset = x1.lng + i * 10 * pixelPerMeter;
                let yOffset = y1.lat + i * 10 * pixelPerMeter;
    
                gridLines.push(L.polyline([
                    [yOffset, x1.lng - 100 * pixelPerMeter],
                    [yOffset, x1.lng + 100 * pixelPerMeter]
                ], { color: "gray", weight: 1, opacity: 0.5 }));
            }
    
            this.gridLayer = L.layerGroup(gridLines).addTo(this.map);
            console.log("✅ Gedraaid grid gegenereerd!");
        }
    }
    
    const editor = new AxisEditor(map);

document.getElementById("draw-x-axis").addEventListener("click", () => editor.startDrawingAxis("x", "red"));
document.getElementById("draw-y-axis").addEventListener("click", () => editor.startDrawingAxis("y", "blue"));
document.getElementById("draw-x2-axis").addEventListener("click", () => editor.startDrawingAxis("x2", "orange"));

});
