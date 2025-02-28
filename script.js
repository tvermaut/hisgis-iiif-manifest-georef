document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    const map = L.map("map", {
        center: [52.0, 5.0],
        zoom: 4,
        crs: L.CRS.Simple
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

    document.getElementById("draw-x-axis").addEventListener("click", () => {
        const xValue = parseFloat(document.getElementById("x-axis-value").value);
        if (!isNaN(xValue)) {
            drawAxis(xValue, "red", "x");
        }
    });

    document.getElementById("draw-y-axis").addEventListener("click", () => {
        const yValue = parseFloat(document.getElementById("y-axis-value").value);
        if (!isNaN(yValue)) {
            drawAxis(yValue, "blue", "y");
        }
    });

    function drawAxis(value, color, type) {
        let bounds = map.getBounds();
        let latLngs;
        
        if (type === "x") {
            latLngs = [[value, bounds.getWest()], [value, bounds.getEast()]];
        } else {
            latLngs = [[bounds.getSouth(), value], [bounds.getNorth(), value]];
        }

        L.polyline(latLngs, { color: color }).addTo(map);
    }
});
