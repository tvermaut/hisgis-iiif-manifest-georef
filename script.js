document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    // Initialiseer Leaflet-kaart
    const map = L.map("map", {
        center: [52.0, 5.0],
        zoom: 4,
        crs: L.CRS.Simple
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

    // Laad IIIF-afbeelding na invoeren van info.json
    document.getElementById("load-iiif").addEventListener("click", () => {
        const infoUrl = document.getElementById("info-json-url").value;
        
        if (!infoUrl) {
            alert("Voer een geldige IIIF info.json URL in!");
            return;
        }

        fetch(infoUrl)
            .then(response => response.json())
            .then(data => {
                console.log("✅ IIIF info.json geladen:", data);
                
                const iiifLayer = L.tileLayer.iiif(infoUrl.replace("info.json", "{z}/{x}/{y}.jpg"), {
                    attribution: "IIIF Afbeelding",
                    fitBounds: true
                });

                iiifLayer.addTo(map);
            })
            .catch(error => console.error("❌ Fout bij laden van IIIF:", error));
    });

    // X-as tekenen (rood)
    document.getElementById("draw-x-axis").addEventListener("click", () => {
        const xValue = parseFloat(document.getElementById("x-axis-value").value);
        if (!isNaN(xValue)) {
            drawAxis(xValue, "red", "x");
        }
    });

    // Y-as tekenen (blauw)
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
