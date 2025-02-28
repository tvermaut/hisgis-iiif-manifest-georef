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

    // 🖌️ Lijn tekenen via muisklikken
    let drawMode = null;
    let tempLine = null;
    let startPoint = null;

    function enableDrawMode(mode) {
        drawMode = mode;
        startPoint = null;
        if (tempLine) {
            map.removeLayer(tempLine);
            tempLine = null;
        }
        console.log(`🖍️ Tekenen van een ${mode === 'red' ? 'X-as (rood)' : 'Y-as (blauw)'} gestart! Klik twee punten.`);
    }

    map.on("click", (e) => {
        if (!drawMode) return;

        if (!startPoint) {
            startPoint = e.latlng;
            console.log(`📍 Startpunt geselecteerd: ${startPoint.lat}, ${startPoint.lng}`);
        } else {
            const endPoint = e.latlng;
            console.log(`📍 Eindpunt geselecteerd: ${endPoint.lat}, ${endPoint.lng}`);

            const color = drawMode === "red" ? "red" : "blue";
            tempLine = L.polyline([startPoint, endPoint], { color, weight: 3 }).addTo(map);
            console.log(`✅ Lijn getekend in ${color}`);
            
            // Reset
            drawMode = null;
            startPoint = null;
        }
    });

    // Buttons om lijnen te tekenen
    document.getElementById("draw-x-axis").addEventListener("click", () => enableDrawMode("red"));
    document.getElementById("draw-y-axis").addEventListener("click", () => enableDrawMode("blue"));
});
