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

    // Als er al een bestaande Leaflet-kaart is, verwijder deze en wacht even
    if (window.map !== undefined) {
        console.warn("⚠️ Er was al een Leaflet-kaart, deze wordt verwijderd.");
        window.map.remove();
        window.map = undefined; // Zorg ervoor dat hij volledig wordt gereset
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
        }
    }, 0); // 0ms timeout geeft de browser de kans om de DOM te updaten
});
