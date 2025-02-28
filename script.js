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

    // IIIF-afbeelding laden
    document.getElementById("load-iiif").addEventListener("click", () => {
        const infoUrl = document.getElementById("info-json-url").value.trim();
        if (!infoUrl) {
            console.error("❌ Geen info.json URL ingevoerd.");
            return;
        }
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
    }

    class AxisEditor {
        constructor(map) {
            this.map = map;
            this.axes = {};
            this.markers = {};
        }

        addOrUpdateAxis(id, start, end, color) {
            if (this.axes[id]) {
                this.map.removeLayer(this.axes[id]);
                this.markers[id].forEach(marker => this.map.removeLayer(marker));
            }

            this.axes[id] = L.polyline([start, end], { color, weight: 3 }).addTo(this.map);
            this.markers[id] = this.createDraggableMarkers(id, start, end);
        }

        createDraggableMarkers(axisId, start, end) {
            const markerOptions = {
                draggable: true,
                icon: L.divIcon({
                    className: "axis-marker",
                    html: "⬤",
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            };

            const startMarker = L.marker(start, markerOptions).addTo(this.map);
            const endMarker = L.marker(end, markerOptions).addTo(this.map);

            [startMarker, endMarker].forEach((marker, index) => {
                marker.on("drag", (event) => {
                    let latlngs = this.axes[axisId].getLatLngs();
                    latlngs[index] = event.target.getLatLng();
                    this.axes[axisId].setLatLngs(latlngs);
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
            map.getContainer().style.cursor = ""; // Reset cursor na tekenen
        }
    });

    document.getElementById("draw-x-axis").addEventListener("click", () => enableDrawMode("x"));
    document.getElementById("draw-y-axis").addEventListener("click", () => enableDrawMode("y"));
});
