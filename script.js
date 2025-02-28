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
        center: [0, 0], // Coördinaten worden later aangepast
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

                // Verwijder vorige IIIF-laag als die bestaat
                if (window.iiifLayer) {
                    map.removeLayer(window.iiifLayer);
                }

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
                window.iiifLayer = new IIIFLayer(null, {
                    tileSize: tileSize,
                    maxZoom: maxZoom,
                    noWrap: true,
                    bounds: [[0, 0], [imageHeight, imageWidth]]
                });

                map.addLayer(window.iiifLayer);
                map.fitBounds([[0, 0], [imageHeight, imageWidth]]);
                console.log("✅ IIIF-kaartlaag succesvol geladen!");
            })
            .catch(error => console.error("❌ Fout bij laden van IIIF:", error));
    }
});
