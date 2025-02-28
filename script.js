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
        center: [0, 0], // Wordt aangepast zodra de afbeelding wordt geladen
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
                const tileSize = data.tiles[0].width || 256;  // Meestal 256
                const scaleFactors = data.tiles[0].scaleFactors;
                const maxZoom = Math.max(...scaleFactors);
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

                // **Correcte** IIIF Tile URL-opbouw als **functie**
                function constructIIIFTileUrl(coords) {
                    const zoomLevel = scaleFactors.find(factor => factor === Math.pow(2, maxZoom - coords.z));
                    if (!zoomLevel) return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

                    const tileX = coords.x * tileSize * zoomLevel;
                    const tileY = coords.y * tileSize * zoomLevel;
                    const tileW = Math.min(tileSize * zoomLevel, imageWidth - tileX);
                    const tileH = Math.min(tileSize * zoomLevel, imageHeight - tileY);

                    if (tileX >= imageWidth || tileY >= imageHeight || tileX < 0 || tileY < 0) {
                        return "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
                    }

                    return `${baseUrl}/${tileX},${tileY},${tileW},${tileH}/full/0/default.jpg`;
                }

                // Maak een nieuwe IIIF-laag aan
                window.iiifLayer = L.tileLayer(constructIIIFTileUrl, {
                    tileSize: tileSize,
                    maxZoom: maxZoom,
                    noWrap: true,
                    bounds: [[0, 0], [imageHeight, imageWidth]],
                });

                map.addLayer(window.iiifLayer);
                map.fitBounds([[0, 0], [imageHeight, imageWidth]]);
                console.log("✅ IIIF-kaartlaag succesvol geladen!");
            })
            .catch(error => console.error("❌ Fout bij laden van IIIF:", error));
    }
});
