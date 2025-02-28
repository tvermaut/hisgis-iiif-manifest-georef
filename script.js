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
    let tiles = [];

    function resizeCanvas() {
        mapCanvas.width = window.innerWidth;
        mapCanvas.height = window.innerHeight;
        
        if (typeof regenerateGrid === 'function') {
            regenerateGrid();
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    async function loadTilesFromIIIF(infoJsonUrl) {
        try {
            const response = await fetch(infoJsonUrl);
            const data = await response.json();

            const width = data.width;
            const height = data.height;
            const tileWidth = data.tiles[0].width;
            const tileHeight = data.tiles[0].height;

            const topLeftX = Math.floor(xAxis / tileWidth);
            const topLeftY = Math.floor(yAxis / tileHeight);
            const bottomRightX = Math.ceil((xAxis + mapCanvas.width) / tileWidth);
            const bottomRightY = Math.ceil((yAxis + mapCanvas.height) / tileHeight);

            tiles = [];
            for (let i = topLeftX; i <= bottomRightX; i++) {
                for (let j = topLeftY; j <= bottomRightY; j++) {
                    const tileUrl = `${data['@id']}/tile/${i},${j},${scale}.jpg`;
                    tiles.push({ x: i * tileWidth, y: j * tileHeight, url: tileUrl });
                }
            }

            ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
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

    function regenerateGrid() {
        ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

        if (infoJsonUrlInput.value.trim()) {
            loadTilesFromIIIF(infoJsonUrlInput.value.trim());
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

    infoJsonUrlInput.addEventListener("input", () => {
        const newUrl = infoJsonUrlInput.value.trim();
        if (newUrl) {
            loadTilesFromIIIF(newUrl);
        }
    });

    scaleSelect.addEventListener('change', (event) => {
        scale = parseInt(event.target.value);
        regenerateGrid();
    });

    generateGridButton.addEventListener('click', () => {
        xAxis = parseFloat(xAxisValue.value) || 0;
        yAxis = parseFloat(yAxisValue.value) || 0;
        regenerateGrid();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('infoJsonUrl');
    if (paramUrl) {
        infoJsonUrlInput.value = paramUrl;
        loadTilesFromIIIF(paramUrl);
    }
});
