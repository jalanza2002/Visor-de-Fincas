
import { crearMapa } from "../views/MapaView.js";
import { crearZonaInteres } from "../views/ZonaInteresView.js";
import finca from "../Model/Finca.js";
import { cargarHidrografia } from "../views/RioJabonal.js";


export function iniciarMapa() {
    const mapa = crearMapa();

    if (!mapa) {
        console.error("Error al crear el mapa");
        return;
    }
    cargarHidrografia(mapa);

    let nivelActual = "";
    let capaProvincias = null;
    let capaCantones = null;

    const coordenadas = {
        costaRica: [9.7489, -83.7534],
        puntoMedio: [10.09, -84.73],
        sanRamon: [10.09, -84.47],
        miramar: [10.09, -84.73],
        finca: [10.09, -84.73]
    };

    // Crear el círculo de la zona aproximada de la finca.
    const zonaInteres = crearZonaInteres(
        mapa,
        coordenadas.puntoMedio,
        31000
    );
    let siguienteAnillo = 0;
    let recorridoCompletado = false;

    // Al pulsar el círculo, acercar a la ubicación provisional de la finca.
    // Al pulsar el círculo, ir directamente a la finca.

    function irALaFinca() {
        mapa.flyToBounds(capaFinca.getBounds(), {
            padding: [30, 30],
            maxZoom: 16,
            animate: true,
            duration: 1.5
        });
    }


    zonaInteres.on("anilloSeleccionado", (evento) => {
        if (recorridoCompletado) {
            return;
        }

        // Exigir que se pulse el anillo que corresponde.
        if (evento.indice !== siguienteAnillo) {
            console.log(
                `Pulsa el anillo ${siguienteAnillo + 1} para continuar.`
            );
            return;
        }


        if (evento.indice === 0) {
            // Primer anillo: encoger y acercar.
            zonaInteres.encogerAnillo(0);

            mapa.flyTo(coordenadas.puntoMedio, 9, {
                animate: true,
                duration: 1.5
            });

        } else if (evento.indice === 1) {
            // Segundo anillo: encoger y acercar más.
            zonaInteres.encogerAnillo(1);

            mapa.flyTo(coordenadas.puntoMedio, 11, {
                animate: true,
                duration: 1.5
            });

        } else if (evento.indice === 2) {
            // Tercer anillo: encoger y llegar a la finca.
            zonaInteres.encogerAnillo(2);

            recorridoCompletado = true;

            setTimeout(() => {
                quitarCapa(zonaInteres);
                irALaFinca();
            }, 650);
        }

        siguienteAnillo++;
    });



    function crearMarcador(posicion, nombre, color = "#ff0000") {
        return L.circleMarker(posicion, {
            radius: 8,
            color: "#ffffff",
            weight: 2,
            fillColor: color,
            fillOpacity: 1
        }).bindTooltip(nombre);
    }

    const marcadores = {
        costaRica: crearMarcador(
            coordenadas.costaRica,
            "Costa Rica"
        ),
    };

    // Capa con los polígonos de la finca
    const capaFinca = L.geoJSON(finca.geoJSON, {
        style: function (feature) {
            return {
                color: feature.properties.color || "#16a34a",
                weight: 2,
                fillColor: feature.properties.color || "#16a34a",
                fillOpacity: 0.35
            };
        },
        onEachFeature: function (feature, layer) {
            const nombre = feature.properties.plano
                || feature.properties.nombre
                || feature.properties.id
                || "Finca";

            layer.bindTooltip(nombre);

            // Detectar únicamente el punto del centroide.
            if (feature.properties.id === "UBICACION") {
                const coordenadas = feature.geometry.coordinates;

                // GeoJSON: [longitud, latitud]
                const longitud = coordenadas[0];
                const latitud = coordenadas[1];

                const googleMaps =
                    `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`;

                const waze =
                    `https://waze.com/ul?ll=${latitud},${longitud}&navigate=yes`;

                layer.bindPopup(`
            <strong>Ubicación de la finca</strong>
            <br><br>
            <a href="${googleMaps}" target="_blank" rel="noopener noreferrer">
                Cómo llegar con Google Maps
            </a>
            <br><br>
            <a href="${waze}" target="_blank" rel="noopener noreferrer">
                Cómo llegar con Waze
            </a>
        `);
            }
        }
    });

    // Al pulsar Costa Rica, mostrar la zona y acercar el mapa.
    marcadores.costaRica.on("click", () => {
        zonaInteres.addTo(mapa);

        mapa.flyTo(coordenadas.puntoMedio, 9, {
            animate: true,
            duration: 1.5
        });
    });

    function quitarCapa(capa) {
        if (capa && mapa.hasLayer(capa)) {
            mapa.removeLayer(capa);
        }
    }

    function actualizarNivel() {
        const zoom = mapa.getZoom();
        let nuevoNivel;

        if (zoom <= 8) {
            nuevoNivel = "costaRica";
        } else if (zoom <= 11) {
            nuevoNivel = "miramar";
        } else {
            nuevoNivel = "finca";
        }

        if (nuevoNivel === nivelActual) {
            return;
        }

        nivelActual = nuevoNivel;

        // Mostrar únicamente el marcador correspondiente al zoom.
        Object.entries(marcadores).forEach(([nivel, marcador]) => {
            quitarCapa(marcador);

            if (nivel === nivelActual) {
                marcador.addTo(mapa);
            }
        });

        // Ocultar los límites anteriores.
        quitarCapa(capaProvincias);
        quitarCapa(capaCantones);
        quitarCapa(capaFinca);

        if (nivelActual === "finca") {
            capaFinca.addTo(mapa);
        }

        if (nivelActual === "miramar") {
            cargarProvincias();
        } else if (nivelActual === "finca") {
            cargarCantones();
        }

        console.log("Nivel actual:", nivelActual);
    }

    function cargarProvincias() {
        if (capaProvincias) {
            capaProvincias.addTo(mapa);
            return;
        }

        fetch("./data/costaricaprovincias.geojson")
            .then(respuesta => {
                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar las provincias");
                }

                return respuesta.json();
            })
            .then(datos => {
                capaProvincias = L.geoJSON(datos, {
                    interactive: false,
                    style: {
                        color: "#1565C0",
                        weight: 2,
                        fillColor: "#64B5F6",
                        fillOpacity: 0.15
                    }
                });

                if (nivelActual === "miramar") {
                    capaProvincias.addTo(mapa);
                }
            })
            .catch(error => {
                console.error("Error cargando provincias:", error);
            });
    }

    function cargarCantones() {
        if (capaCantones) {
            capaCantones.addTo(mapa);
            return;
        }

        fetch("./data/costaricacantones.geojson")
            .then(respuesta => {
                if (!respuesta.ok) {
                    throw new Error("No se pudieron cargar los cantones");
                }

                return respuesta.json();
            })
            .then(datos => {
                capaCantones = L.geoJSON(datos, {
                    interactive: false,
                    style: {
                        color: "#D97706",
                        weight: 1.5,
                        fillColor: "#FCD34D",
                        fillOpacity: 0.2
                    }
                });

                if (nivelActual === "finca") {
                    capaCantones.addTo(mapa);
                }
            })
            .catch(error => {
                console.error("Error cargando cantones:", error);
            });
    }

    // Iniciar mostrando Costa Rica.
    mapa.setZoom(8);
    actualizarNivel();

    // Actualizar los marcadores y límites al cambiar el zoom.
    mapa.on("zoomend", actualizarNivel);

    // Mantener el círculo al acercar y quitarlo al alejar.

    mapa.on("zoomend", () => {
        if (mapa.getZoom() <= 8) {
            quitarCapa(zonaInteres);

            // Reiniciar el recorrido si volvemos al mapa general.
            siguienteAnillo = 0;
            recorridoCompletado = false;
        } else if (!recorridoCompletado) {
            zonaInteres.addTo(mapa);
        }
    });

}
