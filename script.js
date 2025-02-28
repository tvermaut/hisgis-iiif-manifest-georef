document.addEventListener("DOMContentLoaded", () => {
    const mapElement = document.getElementById('map');

    if (!mapElement) {
        console.error("Fout: 'map' container niet gevonden.");
        return;
    }

    // Verwijder bestaande kaart als deze al bestaat
    if (window.map !== undefined) {
        window.map.remove();
    }

    // Initialiseer Leaflet-kaart
    window.map = L.map('map', {
        center: [0, 0],
        zoom: 1,
        crs: L.CRS.Simple
    });

    let iiifLayer;

    async function loadIIIFLayer(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (iiifLayer) {
                window.map.removeLayer(iiifLayer);
            }

            iiifLayer = L.tileLayer.iiif(url, {
                tileSize: data.tiles[0].width,
                attribution: "Bron: IIIF",
                fitBounds: true
            });

            iiifLayer.addTo(window.map);
        } catch (error) {
            console.error("Fout bij laden van IIIF:", error);
        }
    }

    const infoJsonUrlInput = document.getElementById('info-json-url');

    infoJsonUrlInput.addEventListener("change", () => {
        const newUrl = infoJsonUrlInput.value.trim();
        if (newUrl) {
            loadIIIFLayer(newUrl);
        }
    });

    // Controleer GET-parameter 'infoJsonUrl'
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get("infoJsonUrl");
    if (paramUrl) {
        infoJsonUrlInput.value = paramUrl;
        loadIIIFLayer(paramUrl);
    }
});
