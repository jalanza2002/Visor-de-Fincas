
export function cargarHidrografia(mapa) {
    fetch("./data/RioJabonal.geojson")
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar la hidrografía");
            }

            return respuesta.json();
        })
        .then(datos => {
            const capaHidrografia = L.geoJSON(datos, {
                style: {
                    color: "#00BFFF",
                    weight: 4,
                    opacity: 1
                },
                onEachFeature: function (feature, layer) {
                    layer.bindTooltip("Río Jabonal",
                        {
                            sticky: true, direction: "top"
                        });
                    layer.bindPopup("<b>Río Jabonal</b><br>Este es el Río Jabonal");
                }
            });

            capaHidrografia.addTo(mapa);

            console.log("Hidrografía cargada:", datos);
        })
        .catch(error => {
            console.error("Error cargando la hidrografía:", error);
        });
}
