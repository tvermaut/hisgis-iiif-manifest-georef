function resizeCanvas() {
    mapCanvas.width = window.innerWidth;
    mapCanvas.height = window.innerHeight;
    regenerateGrid();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener("DOMContentLoaded", () => {
    const mapCanvas = document.getElementById('mapCanvas');
    const ctx = mapCanvas.getContext('2d');
    const scaleSelect = document.getElementById('scale-select');
    const generateGridButton = document.getElementById('generate-grid');
    const xAxisValue = document.getElementById('x-axis-value');
    const yAxisValue = document.getElementById('y-axis-value');
    const infoJsonUrlInput = document.getElementById('info-json-url');

    let scale = 2500;  // Default scale
    let xAxis = 0;
    let yAxis = 0;
    let mapImage = new Image();
    let tiles = [];

    // Haal de URL van de info.json op (via de GET-parameter of invoerveld)
    const getInfoJsonUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const paramUrl = urlParams.get('infoJsonUrl');
        return paramUrl || infoJsonUrlInput.value || '';  // Krijg de URL via de GET-parameter of het invoerveld
    }

    // Laad de afbeelding van de IIIF ImageAPI via de tiles
    async function loadTilesFromIIIF(infoJsonUrl) {
        try {
            // Verkrijg de info.json van de IIIF API
            const response = await fetch(infoJsonUrl);
            const data = await response.json();

            // Verkrijg de breedte en hoogte van de afbeelding
            const width = data.width;
            const height = data.height;

            // Verkrijg de tile layout (bijvoorbeeld 256x256)
            const tileWidth = data.tiles[0].width;  // Neem het tile-grootte van de eerste tegel
            const tileHeight = data.tiles[0].height;

            // Haal de tiles op die in het zichtbare gebied vallen
            const topLeftX = Math.floor(xAxis / tileWidth);
            const topLeftY = Math.floor(yAxis / tileHeight);
            const bottomRightX = Math.ceil((xAxis + mapCanvas.width) / tileWidth);
            const bottomRightY = Math.ceil((yAxis + mapCanvas.height) / tileHeight);

            // Laad de tiles in het zichtbare gebied
            tiles = [];
            for (let i = topLeftX; i <= bottomRightX; i++) {
                for (let j = topLeftY; j <= bottomRightY; j++) {
                    const tileUrl = `${data['@id']}/tile/${i},${j},${scale}.jpg`;  // Bouw de tile URL
                    tiles.push({ x: i * tileWidth, y: j * tileHeight, url: tileUrl });
                }
            }

            // Teken de tiles op het canvas
            tiles.forEach(tile => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, tile.x, tile.y);
                };
                img.src = tile.url;
            });

        } catch (error) {
            console.error('Fout bij het laden van de IIIF tiles:', error);
        }
    }

    // Als de URL is ingevoerd of via een GET-parameter, laad de kaart
    const infoJsonUrl = getInfoJsonUrl();
    if (infoJsonUrl) {
        loadTilesFromIIIF(infoJsonUrl);
    }

    // Event listener voor schaalselectie
    scaleSelect.addEventListener('change', (event) => {
        scale = parseInt(event.target.value);
        regenerateGrid();
    });

    // Event listener voor het genereren van het ruitkruisnet
    generateGridButton.addEventListener('click', () => {
        xAxis = parseFloat(xAxisValue.value) || 0;
        yAxis = parseFloat(yAxisValue.value) || 0;
        regenerateGrid();
    });

    // Functie om het ruitkruisnet te genereren
    function regenerateGrid() {
        ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

        // Herlaad de tiles
        if (infoJsonUrl) {
            loadTilesFromIIIF(infoJsonUrl);
        }

        const step = (scale === 2500) ? 125 : (scale === 1250) ? 250 : 500;
        const centerX = mapCanvas.width / 2;
        const centerY = mapCanvas.height / 2;

        for (let i = -5; i <= 5; i++) {
            for (let j = -5; j <= 5; j++) {
                const x = centerX + (i * step);
                const y = centerY + (j * step);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    // Functie voor het tekenen van de Gauss-curve en schaalgrafiek
    function drawGraphs() {
        // Implementatie van grafieken voor de afwijkingen en schaal
    }

    // Functie voor het toepassen van de Helmert-transformatie
    function applyHelmertTransformation(points) {
        // Berekeningen en transformatie op basis van slepen van de punten
    }
});
