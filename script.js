import 'leaflet-iiif';

document.addEventListener("DOMContentLoaded", async () => {
    const infoJsonUrlInput = document.getElementById('info-json-url');
    const scaleSelect = document.getElementById('scale-select');
    const generateGridButton = document.getElementById('generate-grid');
    const xAxisValue = document.getElementById('x-axis-value');
    const yAxisValue = document.getElementById('y-axis-value');

    let map = L.map('map', {
        center: [0, 0],
        zoom: 2,
        crs: L.CRS.Simple
    });

    let iiifLayer;

    async function loadIIIFLayer(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (iiifLayer) {
                map.removeLayer(iiifLayer);
            }

            console.log()

            iiifLayer = L.tileLayer.iiif(url, {
                attribution: "Bron: IIIF"
            });

            iiifLayer.addTo(map);
            map.fitBounds(iiifLayer.getBounds());
        } catch (error) {
            console.error("Fout bij laden van IIIF:", error);
        }
    }

    infoJsonUrlInput.addEventListener("input", () => {
        const newUrl = infoJsonUrlInput.value.trim();
        if (newUrl) {
            loadIIIFLayer(newUrl);
        }
    });

    generateGridButton.addEventListener("click", () => {
        console.log("Grid genereren op:", xAxisValue.value, yAxisValue.value);
    });

    // Check of een info.json URL in de GET-parameters zit
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get("infoJsonUrl");
    if (paramUrl) {
        infoJsonUrlInput.value = paramUrl;
        loadIIIFLayer(paramUrl);
    }
});
