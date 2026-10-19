
export function crearZonaInteres(mapa, coordenadas, radio = 15000) {
    const radios = [
        radio,
        radio * 0.55,
        radio * 0.25
    ];

    const anillos = radios.map((radioAnillo, indice) => {
        const circulo = L.circle(coordenadas, {
            radius: radioAnillo,
            color: "#2563eb",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.08
        });

        circulo.bindTooltip(
            ["Zona general", "Zona cercana", "Finca"][indice]
        );

        return circulo;
    });

    const grupoAnillos = L.featureGroup(anillos);

    grupoAnillos.encogerAnillo = function (indice) {
        const circulo = anillos[indice];

        if (!circulo) return;

        const radioInicial = circulo.getRadius();
        const radioFinal = 0;
        const pasos = 20;
        let paso = 0;

        const intervalo = setInterval(() => {
            paso++;

            const progreso = paso / pasos;
            const nuevoRadio =
                radioInicial + (radioFinal - radioInicial) * progreso;

            circulo.setRadius(nuevoRadio);

            if (paso >= pasos) {
                clearInterval(intervalo);
                circulo.setStyle
                    ({
                        fillOpacity: 0,
                        opacity: 0
                    });
            }
        }, 30);
    };

    anillos.forEach((circulo, indice) => {
        circulo.on("click", () => {
            grupoAnillos.fire("anilloSeleccionado", {
                indice
            });
        });
    });

    return grupoAnillos;
}
