// Klasse voor de axis-editor
class AxisEditor {
    constructor(map) {
        this.map = map;
        this.axes = {};
        this.currentAxisId = null;
        this.currentDrawing = false;
        this.startMarker = null;
        this.endMarker = null;
        this.init();
    }

    init() {
        console.log("✅ DOM is volledig geladen!");
        this.map.on('click', this.handleMapClick.bind(this));

        // Event-listeners voor het tekenen van assen
        document.getElementById('draw-x-axis').addEventListener('click', () => {
            this.startDrawingAxis('x-axis');
        });

        document.getElementById('draw-y-axis').addEventListener('click', () => {
            this.startDrawingAxis('y-axis');
        });

        document.getElementById('draw-x2-axis').addEventListener('click', () => {
            this.startDrawingAxis('x-axis-2');
        });

        // Event-listener voor het laden van IIIF afbeelding
        document.getElementById('load-iiif').addEventListener('click', () => {
            const url = document.getElementById('info-json-url').value;
            this.loadIIIFLayer(url);
        });
    }

    // Methode voor het starten van het tekenen van een as
    startDrawingAxis(axisId) {
        console.log(`✏️ ${axisId} tekenen...`);
        this.currentAxisId = axisId;
        this.currentDrawing = true;
        this.axes[axisId] = []; // Nieuwe as toevoegen

        // Verander de cursor naar een crosshair om duidelijk te maken dat je aan het tekenen bent
        this.map.getContainer().style.cursor = 'crosshair';
    }

    // Methode voor het afhandelen van clicks op de kaart
    handleMapClick(event) {
        if (!this.currentDrawing) return;

        const latlng = event.latlng;
        console.log(`🖱️ Klik geregistreerd op: ${latlng}`);

        // Voeg de aangeklikte positie toe aan de lijst van punten van de huidige as
        this.axes[this.currentAxisId].push(latlng);

        // Teken de as als er twee punten zijn aangeklikt
        if (this.axes[this.currentAxisId].length === 2) {
            this.addOrUpdateAxis(this.currentAxisId, this.axes[this.currentAxisId], 'blue');
            this.currentDrawing = false;
            this.map.getContainer().style.cursor = ''; // Terug naar de standaardcursor
        }
    }

    // Methode voor het toevoegen of updaten van een as
    addOrUpdateAxis(axisId, latlngs, color) {
        // Verwijder oude markers als er al een as is getekend
        this.removeMarkers(axisId);

        // Maak een nieuwe polyline aan voor de as
        const polyline = L.polyline(latlngs, { color: color, weight: 2 }).addTo(this.map);

        // Voeg markers toe aan het begin en het einde van de lijn
        this.addMarkersToLine(polyline, color);

        // Sla de lijn op in de axes
        this.axes[axisId] = polyline;
    }

    // Methode voor het verwijderen van oude markers
    removeMarkers(axisId) {
        const polyline = this.axes[axisId];
        if (polyline) {
            this.map.removeLayer(polyline);
            if (this.startMarker) this.map.removeLayer(this.startMarker);
            if (this.endMarker) this.map.removeLayer(this.endMarker);
        }
    }

    // Voeg SVG-icoontjes als markers toe bij het begin en het einde van de lijn
    addMarkersToLine(line, color) {
        const latlngs = line.getLatLngs();
    
        // Verwijder bestaande markers
        if (this.startMarker) this.map.removeLayer(this.startMarker);
        if (this.endMarker) this.map.removeLayer(this.endMarker);
    
        // Voeg marker aan het begin van de lijn toe
        this.startMarker = L.marker(latlngs[0], { icon: this.createSvgIcon(color) }).addTo(this.map);
    
        // Voeg marker aan het einde van de lijn toe
        this.endMarker = L.marker(latlngs[latlngs.length - 1], { icon: this.createSvgIcon(color) }).addTo(this.map);
    }

    // Functie om een SVG-icoontje als marker toe te voegen
    createSvgIcon(color) {
        return L.divIcon({
            className: 'custom-svg-icon',
            html: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128" xml:space="preserve">
                    <path d="M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z" 
                    style="fill:${color}; fill-rule:evenodd;clip-rule:evenodd"/>
                   </svg>`,
            iconSize: [30, 30], // Grootte van het icoontje
            iconAnchor: [15, 30], // Positioneer het icoontje naar beneden
        });
    }

    // Functie voor het laden van de IIIF-afbeelding
    loadIIIFLayer(url) {
        console.log(`🔄 Laden van IIIF-afbeelding van: ${url}`);
        if (!url) {
            console.error('❌ Geen URL opgegeven');
            return;
        }
    
        // Laad de IIIF laag direct met de URL
        const iiifLayer = L.tileLayer.iiif(url, {
            quality: 'default',
            fitBounds: true
        }).addTo(this.map);
    
        // Optioneel: Pas de kaartweergave aan wanneer de laag is geladen
        iiifLayer.on('load', () => {
            const imageSize = iiifLayer.x.options.sizes[0];
            const imageBounds = L.latLngBounds([
                [0, 0],
                [imageSize.height, imageSize.width]
            ]);
            this.map.fitBounds(imageBounds);
            console.log("✅ IIIF-afbeelding geladen!");
        });
    }
    
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

    // Start de AxisEditor
    const editor = new AxisEditor(map);

        // Event listeners voor knoppen
        document.getElementById("draw-x-axis").addEventListener("click", () => editor.startDrawingAxis("x", "blue"));
        document.getElementById("draw-x2-axis").addEventListener("click", () => editor.startDrawingAxis("x2", "orange"));
        document.getElementById("draw-y-axis").addEventListener("click", () => editor.startDrawingAxis("y", "red"));
        document.getElementById("generate-grid").addEventListener("click", () => editor.generateGrid());
});
