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

    // Initialiseer Leaflet-kaart
    const map = L.map("map", {
        center: [0, 0], 
        zoom: 1,
        crs: L.CRS.Simple,
        preferCanvas: true,
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

    // Event listener voor IIIF URL invoer
    document.getElementById("load-iiif").addEventListener("click", () => {
        const infoUrl = document.getElementById("info-json-url").value.trim();
        if (!infoUrl) {
            console.error("❌ Geen info.json URL ingevoerd.");
            return;
        }

        console.log(`🔄 Laden van IIIF-afbeelding van: ${infoUrl}`);
        loadIIIFLayer(infoUrl);
    });

    function loadIIIFLayer(infoUrl) {
        if (window.iiifLayer) {
            map.removeLayer(window.iiifLayer);
        }

        window.iiifLayer = L.tileLayer.iiif(infoUrl, {
            fitBounds: true,  
            setMaxBounds: true,
        }).addTo(map);

        console.log("✅ IIIF-kaartlaag succesvol geladen!");
    }

    class AxisEditor {
        constructor(map) {
            this.map = map;
            this.axes = {};
            this.dragging = null;
        }

        addOrUpdateAxis(id, start, end, color) {
            if (this.axes[id]) {
                this.map.removeLayer(this.axes[id]);
            }
            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);
        }

        enableDragging(axisId) {
            if (!this.axes[axisId]) return;
            this.axes[axisId].eachLatLng((latlng, index) => {
                let marker = L.marker(latlng, {
                    draggable: true,
                    icon: L.divIcon({ className: 'draggable-marker' })
                }).addTo(this.map);
                marker.on('drag', (event) => {
                    let newLatLng = event.target.getLatLng();
                    let latlngs = this.axes[axisId].getLatLngs();
                    latlngs[index] = newLatLng;
                    this.axes[axisId].setLatLngs(latlngs);
                });
            });
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
            console.log(`📍 Startpunt geselecteerd: ${startPoint.lat}, ${startPoint.lng}`);
        } else {
            const endPoint = e.latlng;
            console.log(`📍 Eindpunt geselecteerd: ${endPoint.lat}, ${endPoint.lng}`);
            const color = drawMode === "x" ? "red" : "blue";
            editor.addOrUpdateAxis(drawMode, startPoint, endPoint, color);
            editor.enableDragging(drawMode);
            drawMode = null;
            startPoint = null;
        }
    });

    document.getElementById("draw-x-axis").addEventListener("click", () => enableDrawMode("x"));
    document.getElementById("draw-y-axis").addEventListener("click", () => enableDrawMode("y"));
});
