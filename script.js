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

// function convertCoordinates(point, map) {
//     console.log('Ontvangen point:', point);
//     console.log('Map referentie:', map);
//     return map.unproject(point, map.getMaxZoom());
// }

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
    
        // Verkrijg containerpunt (pixel binnen de viewport)
        // console.log('Klik event:', event.containerPoint);
        // console.log('Geconverteerd punt:', convertCoordinates(event.containerPoint, this.map));
        // console.log('Huidige map bounds:', this.map.getBounds());

    
        // Converteer containerpunt naar LatLng-coördinaten binnen het afbeeldingsgebied
        // const latlng = this.map.unproject(containerPoint);
    
        console.log(`🖱️ Klik geregistreerd op pixel: (${containerPoint.x}, ${containerPoint.y}), LatLng: ${latlng}`);
    
        // Controleer of dit het eerste of tweede punt van de lijn is
        if (!this.axes[this.currentAxisId].polyline) {
            // Eerste punt van de lijn
            this.axes[this.currentAxisId].polyline = L.polyline([event.containerPoint], { color: this.axes[this.currentAxisId].color }).addTo(this.map);
        } else {
            // Tweede punt van de lijn
            this.axes[this.currentAxisId].polyline.addLatLng(event.containerPoint);
            this.addOrUpdateAxis(this.currentAxisId, this.axes[this.currentAxisId].polyline.getLatLngs());
            this.currentDrawing = false;
            this.map.getContainer().style.cursor = ''; // Reset cursor
        }
    }    
 
    addOrUpdateAxis(axisId, latlngs) {
        // Update polyline met LatLng-coördinaten
        this.axes[axisId].polyline.setLatLngs(latlngs);
    
        // Voeg markers toe aan het begin en einde van de lijn
        this.axes[axisId].addMarkersToLine(this.map);
    
        // Update imageBounds voor gridberekeningen
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

    loadIIIFLayer(infoJsonUrl) {
        if (this.isLoadingInfoJson) {
            console.log("❗ Al bezig met laden van een IIIF laag");
            return;
        }
        this.isLoadingInfoJson = true;
    
        console.log(`🔄 Start laden van IIIF-afbeelding info van: ${infoJsonUrl}`);
        console.log(`Huidige map center:`, this.map.getCenter());
        console.log(`Huidige map zoom:`, this.map.getZoom());
    
        fetch(infoJsonUrl)
            .then(response => {
                console.log(`📥 Ontvangen response van info.json request`);
                return response.json();
            })
            .then(info => {
                console.log(`✅ info.json succesvol geparsed:`, info);
                this.isLoadingInfoJson = false;
                const width = info.width;
                const height = info.height;
    
                console.log(`📐 Afbeeldingsafmetingen: ${width}x${height}`);
    
                if (width && height) {
                    // Bereken de imageBounds correct
                    const southWest = this.map.unproject([0, height], this.map.getMaxZoom());
                    const northEast = this.map.unproject([width, 0], this.map.getMaxZoom());
                    this.imageBounds = L.latLngBounds(southWest, northEast);
    
                    console.log(`🗺️ Berekende imageBounds:`, this.imageBounds);
                    console.log(`southWest:`, southWest);
                    console.log(`northEast:`, northEast);
    
                    console.log(`🔧 Aanmaken van IIIF tileLayer...`);
                    const iiifLayer = L.tileLayer.iiif(infoJsonUrl, {
                        attribution: 'IIIF',
                        tileSize: 256,
                        minZoom: 0,
                        //maxZoom: this.map.getMaxZoom(),
                        reuseTiles: true,
                        continuousWorld: true,
                        noWrap: true,
                        crs: L.CRS.Simple,
                        zIndex: 100
                    });
    
                    console.log(`➕ IIIF tileLayer aangemaakt, toevoegen aan map...`);
                    iiifLayer.addTo(this.map);
    
                    console.log(`🔍 Aanpassen van map view...`);
                    this.map.fitBounds(this.imageBounds);
    
                    console.log(`Na fitBounds - Nieuwe map center:`, this.map.getCenter());
                    console.log(`Na fitBounds - Nieuwe map zoom:`, this.map.getZoom());
    
                    console.log(`📏 Updaten van grid imageBounds...`);
                    this.grid.imageBounds = this.imageBounds;
    
                    // Extra controle op zichtbaarheid van de layer
                    iiifLayer.on('load', function() {
                        console.log(`🖼️ IIIF layer geladen event ontvangen`);
                    });
    
                    // Controleer of de layer daadwerkelijk is toegevoegd aan de map
                    if (this.map.hasLayer(iiifLayer)) {
                        console.log(`✅ IIIF layer is succesvol toegevoegd aan de map`);
                    } else {
                        console.warn(`⚠️ IIIF layer is niet toegevoegd aan de map`);
                    }
    
                    console.log("✅ IIIF-afbeelding laadproces voltooid!");
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
