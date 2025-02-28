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

    // Zorg ervoor dat lijnen onder de markers en boven de afbeelding liggen
    map.createPane("imagePane").style.zIndex = 200;
    map.createPane("axesPane").style.zIndex = 400;

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
            pane: "imagePane",
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

            this.axes[id] = L.polyline([start, end], { color, weight: 3, pane: "axesPane" }).addTo(this.map);
            this.markers[id] = this.createDraggableMarkers(id, start, end, color);
        }

        createDraggableMarkers(axisId, start, end, color) {
            const svgIcon = encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                    <path d="M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z" fill="${color}"/>
                </svg>`);

            const markerOptions = {
                draggable: true,
                icon: L.icon({
                    iconUrl: `data:image/svg+xml,${svgIcon}`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]
                }),
                pane: "axesPane",
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
