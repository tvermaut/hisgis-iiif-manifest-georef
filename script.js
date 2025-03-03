import Axis from './Axis.js';
import Grid from './Grid.js';

function rotatePoint(point, angle, origin) {
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    return L.point(
        origin.x + dx * cos - dy * sin,
        origin.y + dx * sin + dy * cos
    );
}

function normalizeAngle(angle) {
    while (angle > 45) angle -= 90;
    while (angle <= -45) angle += 90;
    return angle;
}

// Wacht tot de DOM geladen is voordat we de editor starten
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        center: [0, 0],
        zoom: 1,
        crs: L.CRS.Simple, // Gebruik een eigen orthogonaal stelsel
        minZoom: -2, // Minimaal zoomniveau
        maxZoom: 10, // Maximaal zoomniveau
    });

    const pencilIcon = L.divIcon({html: '<span style="font-size: 24px;">✎</span>', className: 'pencil-icon'});
    const gridIcon   = L.divIcon({html: '<span style="font-size: 24px;">▦</span>', className: 'grid-icon'});

    const editor = new Editor(map);
    document.getElementById("draw-x-axis").addEventListener("click", () => editor.startDrawingAxis("x"));
    document.getElementById("draw-x2-axis").addEventListener("click", () => editor.startDrawingAxis("x2"));
    document.getElementById("draw-y-axis").addEventListener("click", () => editor.startDrawingAxis("y"));
    document.getElementById("generate-grid").addEventListener("click", () => editor.generateGrid());
});

class Editor {
    constructor(map) {
        this.map = map;
        this.axes = {
            'x': new Axis('x', 'red'), 
            'y': new Axis('y', 'blue'), 
            'x2': new Axis('x2', 'orange')
        };
        this.currentAxisId = null;
        this.currentDrawing = false;
        this.isLoadingInfoJson = false;
        this.imageBounds = null;
        this.init();
        this.grid = new Grid(this.axes, this.imageBounds);
        this.grid.setMap(this.map);
    }

    init() {
        console.log("✅ DOM is volledig geladen!");
        this.map.on('click', this.handleMapClick.bind(this));

        this.axes.x.map = this.map;
        this.axes.y.map = this.map;
        this.axes.x2.map = this.map;

        // Event-listener voor het laden van IIIF afbeelding
        document.getElementById('load-iiif').addEventListener('click', () => {
            const url = document.getElementById('info-json-url').value;
            this.loadIIIFLayer(url);
        });
    }

    startDrawingAxis(axisId) {
        console.log(`✏️ ${axisId} tekenen...`);
        this.currentAxisId = axisId;
        this.currentDrawing = true;
        this.map.getContainer().style.cursor = 'crosshair';
    }

    handleMapClick(event) {
        if (!this.currentDrawing) return;
    
        const containerPoint = event.containerPoint; // Pixelcoördinaten
        const latlng = this.map.unproject(containerPoint); // Converteer naar LatLng
    
        console.log(`🖱️ Klik geregistreerd op pixel: (${containerPoint.x}, ${containerPoint.y}), LatLng: ${latlng}`);
    
        if (!this.axes[this.currentAxisId].polyline) {
            // Eerste punt van de as
            this.axes[this.currentAxisId].polyline = L.polyline([latlng], { color: this.axes[this.currentAxisId].color }).addTo(this.map);
        } else {
            // Tweede punt van de as
            this.axes[this.currentAxisId].polyline.addLatLng(latlng);
            this.addOrUpdateAxis(this.currentAxisId, this.axes[this.currentAxisId].polyline.getLatLngs());
            this.currentDrawing = false;
            this.map.getContainer().style.cursor = '';
        }
    }
 
    addOrUpdateAxis(axisId, latlngs) {
        this.axes[axisId].polyline.setLatLngs(latlngs);
        this.axes[axisId].addMarkersToLine(this.map);
        this.grid.imageBounds = this.imageBounds;
    }

    generateGrid() {
        this.leesWaarden();
        if (!this.axes.x.value || !this.axes.y.value || !this.axes.x2.value) {
            console.error('Alle drie de assen moeten getekend zijn en waarden hebben voordat het grid kan worden gegenereerd.');
            return;
        }
        this.grid.generate();
    }

    leesWaarden() {
        this.axes.x.value  = parseFloat(document.getElementById('x-axis-value').value);
        this.axes.y.value  = parseFloat(document.getElementById('y-axis-value').value);
        this.axes.x2.value = parseFloat(document.getElementById('x2-axis-value').value);
    }

    loadIIIFLayer(url) {
        if (this.isLoadingInfoJson) return;

        this.isLoadingInfoJson = true;

        console.log(`🔄 Laden van IIIF-afbeelding van: ${url}`);
        if (!url) {
            console.error('❌ Geen URL opgegeven');
            return;
        }
    
        const iiifLayer = new L.TileLayer.Iiif(url).addTo(this.map);
    
        fetch(url)
            .then(response => response.json())
            .then(info => {
                this.isLoadingInfoJson = false;
                const width = info.width;
                const height = info.height;
    
                if (width && height) {
                    this.imageBounds = L.latLngBounds([
                        [0, 0],
                        [height, width]
                    ]);
                    this.map.fitBounds(this.imageBounds);
                    this.grid.imageBounds = this.imageBounds;
                    console.log("✅ IIIF-afbeelding geladen!");
                } else {
                    console.warn("⚠️ Breedte of hoogte ontbreekt in info.json");
                }
            })
            .catch(error => {
                console.error("❌ Fout bij het laden van info.json:", error);
                this.isLoadingInfoJson = false;
            });
    }
}

export default Editor;
