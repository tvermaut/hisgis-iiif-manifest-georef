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
        // Verwijder vorige IIIF-laag als die bestaat
        if (window.iiifLayer) {
            map.removeLayer(window.iiifLayer);
        }

        // **Gebruik Leaflet-IIIF om de afbeelding correct te laden**
        window.iiifLayer = L.tileLayer.iiif(infoUrl, {
            fitBounds: true,  // Automatisch inzoomen op de afbeelding
            setMaxBounds: true,  // Zorgt dat de gebruiker niet buiten de afbeelding kan scrollen
        }).addTo(map);

        console.log("✅ IIIF-kaartlaag succesvol geladen!");
    }
});
