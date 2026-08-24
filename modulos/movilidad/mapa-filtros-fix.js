// SGT - Corrección de filtros de Movilidad
// Este archivo se carga después de mapa.js para mantener intacta
// la lógica existente y hacer que las categorías especiales sean exclusivas.
(function () {
    "use strict";

    const originalMostrarZonas = window.mostrarZonasEstacionamiento;
    const originalMostrarCordones = window.mostrarCordonesRojos;

    function filtroTipoActual() {
        const el = document.getElementById("filtroTipo");
        return el ? el.value : "";
    }

    function normalizarLocal(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    // Estacionamiento Tarifado SOLO se muestra cuando esa categoría está seleccionada
    window.mostrarZonasEstacionamiento = function () {
        if (!window.capaZonasEstacionamiento) return;

        const filtro = filtroTipoActual();
        const mostrar = !filtro ||
            normalizarLocal(filtro) === normalizarLocal("Estacionamiento Tarifado");

        window.capaZonasEstacionamiento.clearLayers();

        if (!mostrar) return;
        if (typeof originalMostrarZonas === "function") {
            originalMostrarZonas();
        }
    };

    // Cordón Rojo SOLO se muestra cuando esa categoría está seleccionada
    window.mostrarCordonesRojos = function () {
        if (!window.capaCordonesRojos) return;

        const filtro = filtroTipoActual();
        const mostrar = !filtro ||
            normalizarLocal(filtro) === normalizarLocal("Cordón Rojo");

        window.capaCordonesRojos.clearLayers();

        if (!mostrar) return;
        if (typeof originalMostrarCordones === "function") {
            originalMostrarCordones();
        }
    };
})();
