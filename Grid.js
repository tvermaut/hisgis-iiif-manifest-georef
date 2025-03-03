class Grid {
    constructor(axes, imageBounds) {
        this.axes = axes;
        this.distance = {
            'theoretic': null,
            'pixel': null,
            'meter': null,
            'berekend': null
        };
        this.pixelsPerMeter = null;
        this.kaartschaal = null;
        this.optimalAngle = null;
        this.imageBounds = imageBounds;
        this.map = null; // Dit moet je later instellen
    }

    setMap(map) {
        this.map = map;
    }

    normalizeAngle(angle) {
        return ((angle % 360) + 360) % 360;
    }

    generate() {
        this.distance.pixel = this.map.latLngToLayerPoint(this.axes.x2.polyline.getLatLngs()[0])
            .distanceTo(this.map.latLngToLayerPoint(this.axes.x.polyline.getLatLngs()[0]));
        this.distance.meter = Math.abs(this.axes.x.value - this.axes.x2.value);
        this.pixelsPerMeter = this.distance.pixel / this.distance.meter;
        this.kaartschaal = 300 * 39.3701 / this.pixelsPerMeter; // 300DPI en 1 meter = 39,3701 inch
        this.optimalAngle = (this.axes.x.getAngle() + this.axes.x2.getAngle()) / 2;

        // Bepaal theoretische gridafstand
        const roundedScale = Math.round(this.kaartschaal);
        if (roundedScale <= 1250) this.distance.theoretic = 125;
        else if (roundedScale <= 2500) this.distance.theoretic = 250;
        else this.distance.theoretic = 500;

        document.getElementById('x-axis-deviation').textContent = `(${this.normalizeAngle(this.axes.x.getAngle() - this.optimalAngle).toFixed(2)}°)`;
        document.getElementById('y-axis-deviation').textContent = `(${this.normalizeAngle(this.axes.y.getAngle() - this.optimalAngle - 90).toFixed(2)}°)`;
        document.getElementById('x2-axis-deviation').textContent = `(${this.normalizeAngle(this.axes.x2.getAngle() - this.optimalAngle).toFixed(2)}°)`;

        document.getElementById('measured-scale').textContent = `1:${Math.round(this.kaartschaal)}`;
        document.getElementById('measured-rotation').textContent = `${Math.round(this.optimalAngle)}`;

        const gridLayer = L.layerGroup().addTo(this.map);
        if (!this.imageBounds) {
            console.error('Image bounds zijn niet ingesteld. Laad eerst een afbeelding.');
            return;
        } else {console.log("imageBounds: "); console.log(this.imageBounds)}
        const centerX = this.imageBounds._northEast.lng / 2;
        const centerY = this.imageBounds._northEast.lat / 2;

        const angleRad = (this.optimalAngle * Math.PI) / 180;
        this.distance.berekend = (this.imageBounds._northEast.lng) / (this.axes.x2.value - this.axes.x.value) * this.distance.theoretic;

        const rotatePoint = (x, y) => {
            const dx = x - centerX;
            const dy = y - centerY;
            return {
                x: centerX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
                y: centerY + dx * Math.sin(angleRad) + dy * Math.cos(angleRad)
            };
        };

        // Bereken het startpunt voor het grid (gecentreerd)
        const startX = centerX - Math.floor((this.imageBounds._northEast.lng) / (2 * this.distance.berekend)) * this.distance.berekend;
        const startY = centerY - Math.floor((this.imageBounds._northEast.lat) / (2 * this.distance.berekend)) * this.distance.berekend;

        console.log("beginnen met tekenen...")
        console.log("startX: " + startX);
        console.log("startY: " + startY);
        console.log("distance.berekend: " + this.distance.berekend);

        console.log("map: ", this.map);

        // // Teken verticale lijnen
        // for (let x = startX; x <= this.imageBounds._northEast.lng; x += this.distance.berekend) {
        //     const start = rotatePoint(x, 0);
        //     const end = rotatePoint(x, this.imageBounds._northEast.lat);
        //     L.polyline([[start.y, start.x], [end.y, end.x]], { color: 'rgba(255, 0, 0, 0.5)', weight: 1 }).addTo(gridLayer);
        // }

        // // Teken horizontale lijnen
        // for (let y = startY; y <= this.imageBounds._northEast.lat; y += this.distance.berekend) {
        //     const start = rotatePoint(0, y);
        //     const end = rotatePoint(this.imageBounds._northEast.lng, y);
        //     L.polyline([[start.y, start.x], [end.y, end.x]], { color: 'rgba(255, 0, 0, 0.5)', weight: 1 }).addTo(gridLayer);
        // }
    }
}

// Als je ES6 modules gebruikt, voeg deze regel toe:
export default Grid;
