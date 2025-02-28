document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM is volledig geladen!");

    // Controleer of Leaflet correct is geladen
    if (typeof L === "undefined") {
        console.error("❌ Leaflet (L) is niet beschikbaar. Controleer of leaflet.js correct wordt geladen!");
        return;
    } else {
        console.log("✅ Leaflet is correct geladen.");
    }

    // Controleer of de 'map' div bestaat
    const mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("❌ Fout: 'map' container niet gevonden. Controleer of de ID correct is en de HTML correct geladen wordt.");
        console.log("👉 Controleer of het element wel bestaat in de DOM met `document.body.innerHTML`:");
        console.log(document.body.innerHTML);
        return;
    } else {
        console.log("✅ 'map' container gevonden.");
    }

    // Controleer of er een bestaande Leaflet-kaart is
    if (window.map !== undefined) {
        console.warn("⚠️ Er was al een Leaflet-kaart, deze wordt verwijderd.");
        window.map.remove();
    }

    try {
        // Initialiseer Leaflet-kaart
        window.map = L.map("map", {
            center: [52.0, 5.0], // Nederland als voorbeeld
            zoom: 4,
            crs: L.CRS.Simple
        });
        console.log("✅ Leaflet-kaart succesvol geïnitialiseerd!");
    } catch (error) {
        console.error("❌ Fout bij initialiseren van de kaart:", error);
    }
});
