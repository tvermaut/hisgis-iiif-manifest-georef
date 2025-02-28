document.addEventListener("DOMContentLoaded", async () => {
    const infoJsonUrlInput = document.getElementById('info-json-url');

    let map = L.map('map', {
        center: [0, 0],  // Leaflet-IIIF coördinaten beginnen meestal rond (0,0)
        zoom: 1,
        crs: L.CRS.Simple  // Gebruik Simple CRS omdat IIIF geen geografische coördinaten heeft
    });

    let iiifLayer;

    async function loadIIIFLayer(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (iiifLayer) {
                map.removeLayer(iiifLayer);
            }

            iiifLayer = L.tileLayer.iiif(url, {
                tileSize: data.tiles[0].width,  // Correcte tile-grootte ophalen
                attribution: "Bron: IIIF",
                fitBounds: true  // Automatisch zoomen naar het volledige beeld
            });

            iiifLayer.addTo(map);
        } catch (error) {
            console.error("Fout bij laden van IIIF:", error);
        }
    }

    // Automatisch laden wanneer een URL wordt ingevoerd
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
