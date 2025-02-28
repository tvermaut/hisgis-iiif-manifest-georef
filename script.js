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

    let scale = 2500;
    let xAxis = 0;
    let yAxis = 0;
    let infoJsonUrl = "";

    // Functie: Canvas aanpassen aan venstergrootte
    function resizeCanvas() {
        mapCanvas.width = window.innerWidth;
        mapCanvas.height = window.innerHeight;
        regenerateGrid();
    }

    // Functie: Ophalen van info.json URL en kaart laden
    function loadMap() {
        infoJsonUrl = infoJsonUrlInput.value.trim();
        if (infoJsonUrl) {
            loadTilesFromIIIF(infoJsonUrl);
        }
    }

    // Functie: Genereren van ruitkruisnet
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

    // Event: Canvas aanpassen bij vensterverandering
    window.addEventListener('resize', resizeCanvas);

    // Event: Kaart automatisch laden bij invoer van info.json URL
    infoJsonUrlInput.addEventListener('input', loadMap);

    // Event: Genereren van ruitkruisnet bij klikken op knop
    generateGridButton.addEventListener('click', () => {
        xAxis = parseFloat(xAxisValue.value) || 0;
        yAxis = parseFloat(yAxisValue.value) || 0;
        regenerateGrid();
    });

    // Start canvas grootte instellen
    resizeCanvas();
});

