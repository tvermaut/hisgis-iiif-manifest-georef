class Axis {
    constructor(lbl, color) {
        this.lbl = lbl;
        this.color = color;
        this.html = {};
        this.polyline = null;
        this.startMarker = null;
        this.endMarker = null;
        this.map = null; // Dit moet je later instellen
    }

    getAngle() {
        const points = this.polyline.getLatLngs();
        const dx = points[1].lng - points[0].lng;
        const dy = points[1].lat - points[0].lat;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    addMarkersToLine(map) {
        const latlngs = this.polyline.getLatLngs();
    
        const createOrUpdateMarker = (marker, latlng) => {
            if (marker) {
                marker.setLatLng(latlng);
            } else {
                marker = L.marker(latlng, {icon: this.createSvgIcon(), draggable: true}).addTo(map);
                marker.on('drag', () => {        
                    if (this.polyline && this.startMarker && this.endMarker) {
                        const newCoords = [this.startMarker.getLatLng(), this.endMarker.getLatLng()];
                        this.polyline.setLatLngs(newCoords);
                    } 
                });
            }
            return marker;
        };
    
        // Maak of update markers voor het begin- en eindpunt van de lijn
        this.startMarker = createOrUpdateMarker(this.startMarker, latlngs[0]);
        this.endMarker = createOrUpdateMarker(this.endMarker, latlngs[latlngs.length - 1]);
    }       

    createSvgIcon() {
        return L.divIcon({
            className: 'custom-svg-icon',
            html: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128" xml:space="preserve">
                    <path d="M33.1 31.3C33.1 14.6 47.2 1 64.2 1s30.7 13.5 30.7 30.2c0 14.4-10.2 26.4-23.8 29.4L63.8 127l-7.3-66.4c-13.3-3.5-23.4-15.2-23.4-29.3zm30.7-8.1c0-4.6-3.8-8.2-8.4-8.2S47 18.6 47 23.2s3.8 8.2 8.4 8.2 8.4-3.7 8.4-8.2z" 
                    style="fill:${this.color}; fill-rule:evenodd;clip-rule:evenodd"/>
                    </svg>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
        });
    }

    setMap(map) {
        this.map = map;
    }
}

// Als je ES6 modules gebruikt, voeg deze regel toe:
export default Axis;