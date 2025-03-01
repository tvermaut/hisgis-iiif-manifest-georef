// Wacht tot de DOM geladen is voordat we de editor starten
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        center: [0, 0],
        zoom: 1,
        crs: L.CRS.Simple, // Gebruik een eigen orthogonaal stelsel
        minZoom: -2, // Minimaal zoomniveau
        maxZoom: 10, // Maximaal zoomniveau
    });

    const pencilIcon = L.divIcon({
        html: '<span style="font-size: 24px;">✎</span>',
        className: 'pencil-icon'
    });
    
    const gridIcon = L.divIcon({
        html: '<span style="font-size: 24px;">▦</span>',
        className: 'grid-icon'
    });

    // Start de AxisEditor
    const editor = new AxisEditor(map);
    // Event listeners voor knoppen
    document.getElementById("draw-x-axis").addEventListener("click", () => editor.startDrawingAxis("x-axis"));
    document.getElementById("draw-x2-axis").addEventListener("click", () => editor.startDrawingAxis("x-axis-2"));
    document.getElementById("draw-y-axis").addEventListener("click", () => editor.startDrawingAxis("y-axis"));
    document.getElementById("generate-grid").addEventListener("click", () => editor.generateGrid());
    });

// Klasse voor de axis-editor
class AxisEditor {
    constructor(map) {
        this.map = map;
        this.axes = {};
        this.currentAxisId = null;
        this.currentDrawing = false;
        this.axisColors = {
            'x-axis': 'red',
            'y-axis': 'blue',
            'x-axis-2': 'orange'
        };
        this.init();
        this.isLoadingInfoJson = false;

    }
    
    normalizeAngle(angle) {
        while (angle > 45) angle -= 90;
        while (angle <= -45) angle += 90;
        return angle;
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
            this.addOrUpdateAxis(this.currentAxisId, this.axes[this.currentAxisId], this.axisColors[this.currentAxisId]);
            this.currentDrawing = false;
            this.map.getContainer().style.cursor = ''; // Terug naar de standaardcursor
        }
    }

    // Methode voor het toevoegen of updaten van een as
    addOrUpdateAxis(axisId, latlngs, color) {
        // Verwijder oude polyline als er al een as is getekend
        if (this.axes[axisId] && this.axes[axisId].polyline) {
            this.map.removeLayer(this.axes[axisId].polyline);
        }

        // Maak een nieuwe polyline aan voor de as
        const polyline = L.polyline(latlngs, { color: color, weight: 2 }).addTo(this.map);

        // Voeg markers toe aan het begin en het einde van de lijn
        this.addMarkersToLine(axisId, polyline, color);

        // Sla de lijn en markers op in de axes
        this.axes[axisId] = {
            polyline: polyline,
            startMarker: this.axes[axisId].startMarker,
            endMarker: this.axes[axisId].endMarker
        };
    }

    updateAxisLine(axisId) {
        const axis = this.axes[axisId];
        if (axis && axis.polyline && axis.startMarker && axis.endMarker) {
            const newLatLngs = [axis.startMarker.getLatLng(), axis.endMarker.getLatLng()];
            axis.polyline.setLatLngs(newLatLngs);
        }
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
    addMarkersToLine(axisId, line, color) {
        const latlngs = line.getLatLngs();

        // Functie om marker te maken of bij te werken
        const createOrUpdateMarker = (marker, latlng) => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, {
                    icon: this.createSvgIcon(color),
                    draggable: true
                }).addTo(this.map);

                marker.on('drag', () => this.updateAxisLine(axisId));
            }
            return marker;
        };

        // Maak of update start- en eindmarkers
        this.axes[axisId].startMarker = createOrUpdateMarker(this.axes[axisId].startMarker, latlngs[0]);
        this.axes[axisId].endMarker = createOrUpdateMarker(this.axes[axisId].endMarker, latlngs[latlngs.length - 1]);
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
        if (this.isLoadingInfoJson) return; // Voorkom dubbele verzoeken

        this.isLoadingInfoJson = true;

        console.log(`🔄 Laden van IIIF-afbeelding van: ${url}`);
        if (!url) {
            console.error('❌ Geen URL opgegeven');
            return;
        }
    
        // Maak een nieuwe IIIF-laag
        const iiifLayer = new L.TileLayer.Iiif(url).addTo(this.map).on('tileerror', function(error, tile) {
            console.log('Tegel laad fout:', error, tile);
          });
    
        // Bereken handmatig de bounds als fitBounds niet werkt zoals verwacht
        fetch(url)
            .then(response => response.json())
            .then(info => {
                this.isLoadingInfoJson = false;
                const width = info.width;
                const height = info.height;
    
                if (width && height) {
                    // Stel bounds in op basis van breedte en hoogte
                    const imageBounds = L.latLngBounds([
                        [0, 0],
                        [height, width]
                    ]);
    
                    this.map.fitBounds(imageBounds);
                    console.log("✅ IIIF-afbeelding geladen!");
                } else {
                    console.warn("⚠️ Breedte of hoogte ontbreekt in info.json");
                }
            })
            .catch(error => {
                console.error("❌ Fout bij het laden van info.json:", error);
            });
    }
    
    generateGrid() {
        if (!this.axes['x-axis'] || !this.axes['y-axis'] || !this.axes['x-axis-2']) {
            console.error('Alle drie de assen moeten getekend zijn voordat het grid kan worden gegenereerd.');
            return;
        }

        const xAxis = this.axes['x-axis'];
        const yAxis = this.axes['y-axis'];
        const x2Axis = this.axes['x-axis-2'];

        // Bereken pixels per meter
        const xAxisStart = xAxis.polyline.getLatLngs()[0];
        const x2AxisStart = x2Axis.polyline.getLatLngs()[0];
        const pixelDistance = this.map.latLngToLayerPoint(x2AxisStart).distanceTo(this.map.latLngToLayerPoint(xAxisStart));
        
        // Haal ingevoerde waarden op (deze moeten ergens in de UI worden ingevoerd)
        const xAxisValue = parseFloat(document.getElementById('x-axis-value').value);
        const x2AxisValue = parseFloat(document.getElementById('x2-axis-value').value);
        const meterDistance = Math.abs(x2AxisValue - xAxisValue);

        const pixelsPerMeter = pixelDistance / meterDistance;

        // Bereken kaartschaal
        const inchesPerMeter = pixelsPerMeter / 300; // 300 DPI
        const scale = 1 / (inchesPerMeter * 39.3701); // 1 inch = 2.54 cm, 1 m = 100 cm
        const roundedScale = Math.round(scale / 50) * 50; // Rond af naar dichtstbijzijnde 50

        // Toon de kaartschaal in het paneel
        document.getElementById('measured-rotation').textContent = `1:${roundedScale}`;

        // Bereken rotatiehoek (vereenvoudigd, zonder regressie)
        const xAngle = this.calculateAngle(xAxis.polyline.getLatLngs());
        const yAngle = this.calculateAngle(yAxis.polyline.getLatLngs());
        const x2Angle = this.calculateAngle(x2Axis.polyline.getLatLngs());

        const optimalAngle = (xAngle + x2Angle) / 2;

        // Toon afwijkingen
        document.getElementById('x-axis-deviation').textContent = `(${this.normalizeAngle(xAngle - optimalAngle).toFixed(2)}°)`;
        document.getElementById('y-axis-deviation').textContent = `(${this.normalizeAngle(yAngle - optimalAngle - 90).toFixed(2)}°)`;
        document.getElementById('x2-axis-deviation').textContent = `(${this.normalizeAngle(x2Angle - optimalAngle).toFixed(2)}°)`;

        // Bepaal gridafstand
        let gridDistance;
        if (roundedScale <= 1250) gridDistance = 125;
        else if (roundedScale <= 2500) gridDistance = 250;
        else gridDistance = 500;

        // Teken grid
        this.drawGrid(gridDistance, pixelsPerMeter, optimalAngle);
    }

    calculateAngle(points) {
        const dx = points[1].lng - points[0].lng;
        const dy = points[1].lat - points[0].lat;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    rotatePoint(point, angle, origin) {
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

    drawGrid(gridDistance, pixelsPerMeter, optimalAngle) {
        const gridLayer = L.layerGroup().addTo(this.map);
    
        // Bereken de grenzen van de afbeelding (niet afhankelijk van viewport)
        const bounds = this.imageBounds; // Zorg dat je imageBounds opslaat bij het laden van de afbeelding
        const northWest = bounds.getNorthWest();
        const southEast = bounds.getSouthEast();
        const startPoint = this.map.latLngToLayerPoint(northWest);
        const endPoint = this.map.latLngToLayerPoint(southEast);
    
        // Pas rotatie toe
        const correctedAngle = optimalAngle;
        const rotatedStart = this.rotatePoint(startPoint, -correctedAngle, startPoint);
        const rotatedEnd = this.rotatePoint(endPoint, -correctedAngle, startPoint);
    
        // Bereken gridlijnen
        let startX = rotatedStart.x;
        let startY = rotatedStart.y;
        let endX = rotatedEnd.x;
        let endY = rotatedEnd.y;
    
        let firstX = Math.floor(startX / (gridDistance * pixelsPerMeter)) * (gridDistance * pixelsPerMeter);
        let firstY = Math.floor(startY / (gridDistance * pixelsPerMeter)) * (gridDistance * pixelsPerMeter);
    
        // Teken verticale lijnen
        for (let x = firstX; x <= endX; x += gridDistance * pixelsPerMeter) {
            const point1 = this.rotatePoint(L.point(x, startY), correctedAngle, startPoint);
            const point2 = this.rotatePoint(L.point(x, endY), correctedAngle, startPoint);
            const latlng1 = this.map.layerPointToLatLng(point1);
            const latlng2 = this.map.layerPointToLatLng(point2);
            L.polyline([latlng1, latlng2], { color: 'rgba(255, 0, 0, 0.5)', weight: 1 }).addTo(gridLayer);
        }
    
        // Teken horizontale lijnen
        for (let y = firstY; y <= endY; y += gridDistance * pixelsPerMeter) {
            const point1 = this.rotatePoint(L.point(startX, y), correctedAngle, startPoint);
            const point2 = this.rotatePoint(L.point(endX, y), correctedAngle, startPoint);
            const latlng1 = this.map.layerPointToLatLng(point1);
            const latlng2 = this.map.layerPointToLatLng(point2);
            L.polyline([latlng1, latlng2], { color: 'rgba(255, 0, 0, 0.5)', weight: 1 }).addTo(gridLayer);
        }
    }
    
    
}