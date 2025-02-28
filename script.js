document.addEventListener("DOMContentLoaded", async () => {
    const map = L.map('map', {
        center: [52.0, 5.0],  // Startpositie (NL)
        zoom: 5
    });

    let tileLayer;
    const scaleSelect = document.getElementById('scale-select');
    const generateGridButton = document.getElementById('generate-grid');
    const xAxisValue = document.getElementById('x-axis-value');
    const yAxisValue = document.getElementById('y-axis-value');
    const infoJsonUrlInput = document.getElementById('info-json-url');

    let scale = 2500;
    let xAxis = 0;
    let yAxis = 0;

    // IIIF tiles laden
    async function loadTilesFromIIIF(infoJsonUrl) {
        try {
            const response = await fetch(infoJsonUrl);
            const data = await response.json();

            const imageWidth = data.width;
            const imageHeight = data.height;
            const tileSize = data.tiles[0].width;
            const baseUrl = data['@id'];

            if (tileLayer) {
                map.removeLayer(tileLayer);
            }

            // Maak een Leaflet tile layer met IIIF
            tileLayer = L.tileLayer.iiif(`${baseUrl}/{z}/{x}/{y}/full/0/default.jpg`, {
                tileSize: tileSize,
                attribution: 'IIIF Map Viewer',
                minZoom: 1,
                maxZoom: 8,
                bounds: [[0, 0], [imageHeight, imageWidth]]
            });

            tileLayer.addTo(map);
        } catch (error) {
            console.error('Fout bij het laden van de IIIF tiles:', error);
        }
    }

    // Grid tekenen
    function drawGrid() {
        // Verwijder eerdere lagen
        map.eachLayer(layer => {
            if (layer instanceof L.LayerGroup) {
                map.removeLayer(layer);
            }
        });

        const step = (scale === 2500) ? 125 : (scale === 1250) ? 250 : 500;
        const gridLayer = L.layerGroup();

        for (let i = -5; i <= 5; i++) {
            for (let j = -5; j <= 5; j++) {
                const lat = map.getCenter().lat + (i * step * 0.0001);
                const lng = map.getCenter().lng + (j * step * 0.0001);

                const circle = L.circle([lat, lng], {
                    radius: 10,
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5
                });

                gridLayer.addLayer(circle);
            }
        }

        gridLayer.addTo(map);
    }

    // Event listeners
    infoJsonUrlInput.addEventListener("input", () => {
        const newUrl = infoJsonUrlInput.value.trim();
        if (newUrl) {
            loadTilesFromIIIF(newUrl);
        }
    });

    scaleSelect.addEventListener('change', (event) => {
        scale = parseInt(event.target.value);
        drawGrid();
    });

    generateGridButton.addEventListener('click', () => {
        xAxis = parseFloat(xAxisValue.value) || 0;
        yAxis = parseFloat(yAxisValue.value) || 0;
        drawGrid();
    });

    // Automatisch info.json laden uit URL-query
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('infoJsonUrl');
    if (paramUrl) {
        infoJsonUrlInput.value = paramUrl;
        loadTilesFromIIIF(paramUrl);
    }
});
