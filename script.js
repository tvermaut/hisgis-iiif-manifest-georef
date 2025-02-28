document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    if (typeof L === "undefined") {
        console.error("❌ Leaflet (L) is niet beschikbaar. Controleer of leaflet.js correct wordt geladen!");
        return;
    } else {
        console.log("✅ Leaflet is correct geladen.");
    }

    const mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("❌ Fout: 'map' container niet gevonden.");
        console.log(document.body.innerHTML);
        return;
    } else {
        console.log("✅ 'map' container gevonden.");
    }

    setTimeout(() => {
        try {
            window.map = L.map("map", {
                center: [52.0, 5.0], // Nederland als voorbeeld
                zoom: 4,
                crs: L.CRS.Simple
            });
            console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");
        } catch (error) {
            console.error("❌ Fout bij initialiseren van de kaart:", error);
            return;
        }

        // Inputvelden ophalen
        const infoJsonUrlInput = document.getElementById("info-json-url");
        const scaleSelect = document.getElementById("scale-select");
        const generateGridButton = document.getElementById("generate-grid");

        // Event listener voor wijzigen van de URL
        infoJsonUrlInput.addEventListener("change", () => {
            const url = infoJsonUrlInput.value.trim();
            if (url) {
                loadIIIFLayer(url);
            }
        });

        // Event listener voor wijzigen van de schaal
        scaleSelect.addEventListener("change", () => {
            regenerateGrid();
        });

        // Event listener voor genereren van het ruitkruisnet
        generateGridButton.addEventListener("click", () => {
            regenerateGrid();
        });

    }, 0); // 0ms timeout geeft de browser de kans om de DOM te updaten
});

/**
 * Laadt een IIIF-afbeelding en voegt deze als tile-layer toe aan Leaflet.
 */
async function loadIIIFLayer(infoJsonUrl) {
    console.log(`ℹ️ Laden van IIIF-data vanuit: ${infoJsonUrl}`);

    try {
        const response = await fetch(infoJsonUrl);
        const data = await response.json();

        if (!data.tiles || data.tiles.length === 0) {
            console.error("❌ Geen tiles gevonden in de info.json.");
            return;
        }

        if (window.iiifLayer) {
            map.removeLayer(window.iiifLayer);
        }

        window.iiifLayer = L.tileLayer.iiif(infoJsonUrl, {
            fitBounds: true
        }).addTo(map);

        console.log("✅ IIIF-afbeelding succesvol geladen!");
    } catch (error) {
        console.error("❌ Fout bij laden van IIIF:", error);
    }
}

/**
 * Genereert een grid op de kaart.
 */
function regenerateGrid() {
    console.log("ℹ️ Grid wordt gegenereerd...");

    if (!window.map) {
        console.error("❌ Geen Leaflet-kaart beschikbaar.");
        return;
    }

    // Verwijder oude gridlagen als die er zijn
    if (window.gridLayer) {
        map.removeLayer(window.gridLayer);
    }

    // Grid opties bepalen
    const scale = parseInt(document.getElementById("scale-select").value);
    const step = (scale === 2500) ? 125 : (scale === 1250) ? 250 : 500;

    // Gridlaag aanmaken
    window.gridLayer = L.layerGroup();
    const bounds = map.getBounds();

    for (let x = bounds.getWest(); x < bounds.getEast(); x += step) {
        for (let y = bounds.getSouth(); y < bounds.getNorth(); y += step) {
            L.circle([y, x], { radius: 10, color: "red" }).addTo(window.gridLayer);
        }
    }

    window.gridLayer.addTo(map);
    console.log("✅ Grid gegenereerd!");
}
