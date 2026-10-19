export function crearMapa() {
    const contenedor = document.getElementById("map");

    if (!contenedor) {
        console.error("No se encontró el elemento mapa");
        return null;
    }

    const map = L.map(contenedor).setView(
        [9.7489, -83.7534],
        8
    );

    // Pane para las etiquetas y carreteras sobre el satélite.
    map.createPane("etiquetasSatelitales");
    map.getPane("etiquetasSatelitales").style.zIndex = 350;

    // 1. Capa base: imágenes satelitales.
    const capaSatelital = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 18,
            attribution: "Imagery &copy; Esri y sus proveedores"
        }
    );

    capaSatelital.addTo(map

    );

    // 2. Nombres de lugares y límites geográficos.
    const capaEtiquetas = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
            pane: "etiquetasSatelitales",
            maxZoom: 18,
            attribution: "Labels &copy; Esri"
        }
    );

    capaEtiquetas.addTo(map);

    // 3. Carreteras y referencias de transporte.
    const capaCarreteras = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        {
            pane: "etiquetasSatelitales",
            maxZoom: 18,
            opacity: 0.9,
            attribution: "Transportation &copy; Esri, HERE, Garmin y OpenStreetMap"
        }
    );
    capaCarreteras.addTo(map);
    return map;
}