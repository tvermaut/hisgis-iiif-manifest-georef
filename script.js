document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    // Initialiseer Leaflet-kaart
    const map = L.map("map", {
        center: [52.0, 5.0],
        zoom: 4,
        crs: L.CRS.Simple
    });

    console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");

    // Laad IIIF-afbeelding
    document.getElementById("load-iiif").addEventListener("click", () => {
        const infoUrl = document.getElementById("info-json-url").value;

        if (!infoUrl) {
            alert("Voer een geldige IIIF info.json URL in!");
            return;
        }

        fetch(infoUrl)
        .then(response => response.json())
        .then(data => {
            console.log("✅ JSON Response:", data);
    
            const baseUrl = data["@id"];
            const tileSize = data.tiles[0].width;  // Meestal 256
            const maxZoom = Math.max(...data.tiles[0].scaleFactors);
            const imageWidth = data.width;
            const imageHeight = data.height;
    
            console.log("ℹ️ Base URL:", baseUrl);
            console.log("ℹ️ Tile Size:", tileSize);
            console.log("ℹ️ Max Zoom Level:", maxZoom);
            console.log("ℹ️ Image Dimensions:", imageWidth, "x", imageHeight);
    
            // Custom Leaflet TileLayer voor IIIF
            const IIIFLayer = L.TileLayer.extend({
                getTileUrl: function(coords) {
                    const scaleFactor = Math.pow(2, maxZoom - coords.z);
                    const x = coords.x * tileSize * scaleFactor;
                    const y = coords.y * tileSize * scaleFactor;
    
                    if (x >= imageWidth || y >= imageHeight || x < 0 || y < 0) {
                        return ""; // Voorkom ongeldige requests
                    }
    
                    return `${baseUrl}/${x},${y},${tileSize},${tileSize}/full/0/default.jpg`;
                }
            });
    
            // Voeg de laag toe aan Leaflet
            const iiifLayer = new IIIFLayer(null, {
                tileSize: tileSize,
                maxZoom: maxZoom,
                noWrap: true,
                bounds: [[0, 0], [imageHeight, imageWidth]]
            });
    
            map.addLayer(iiifLayer);
            console.log("✅ IIIF-kaartlaag succesvol geladen!");
        })
        .catch(error => console.error("❌ Fout bij laden van IIIF:", error));
    
    
            // Voeg de laag toe aan Leaflet
            const iiifLayer = L.tileLayer(customTileUrl, {
                tileSize: tileSize,
                maxZoom: maxZoom,
                noWrap: true,
                bounds: [[0, 0], [imageHeight, imageWidth]]
            }).addTo(map);
    
            console.log("✅ IIIF-kaartlaag succesvol geladen!");
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
