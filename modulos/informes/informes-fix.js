// SGT - Corrección territorial de Informes
// Se carga después de informes.js para conservar la funcionalidad existente.
(function () {
    "use strict";

    function normalizarInforme(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function localidadDe(elemento) {
        // La hoja Elementos contiene Ciudad, Localidad y Zona.
        // La localidad tiene prioridad; ciudad solo se usa si la localidad está vacía.
        return String(
            elemento.localidad ||
            elemento.localidadNombre ||
            elemento.nombreLocalidad ||
            elemento.ciudad ||
            ""
        ).replace(/\s+/g, " ").trim();
    }

    const originalNormalizarElementoNormal = window.normalizarElementoNormal;
    const originalNormalizarElementoGeometrico = window.normalizarElementoGeometrico;

    window.normalizarElementoNormal = function (elemento) {
        const resultado = originalNormalizarElementoNormal
            ? originalNormalizarElementoNormal(elemento)
            : {};
        resultado.localidad = localidadDe(elemento);
        return resultado;
    };

    window.normalizarElementoGeometrico = function (elemento) {
        const resultado = originalNormalizarElementoGeometrico
            ? originalNormalizarElementoGeometrico(elemento)
            : {};
        resultado.localidad = localidadDe(elemento);
        return resultado;
    };

    // Sustituimos la carga de opciones para evitar duplicados que solo difieran
    // por mayúsculas, tildes o espacios.
    window.cargarOpciones = function (id, etiquetaInicial, valores, valorSeleccionado) {
        const select = document.getElementById(id);
        if (!select) return;

        select.innerHTML = "";
        select.add(new Option(etiquetaInicial, ""));

        const unicos = [];
        (valores || []).forEach(function (valor) {
            const texto = String(valor || "").replace(/\s+/g, " ").trim();
            if (!texto) return;
            if (!unicos.some(function (existente) {
                return normalizarInforme(existente) === normalizarInforme(texto);
            })) {
                unicos.push(texto);
            }
        });

        unicos.sort(function (a, b) {
            return a.localeCompare(b, "es", { sensitivity: "base" });
        });

        unicos.forEach(function (valor) {
            select.add(new Option(valor, valor));
        });

        const buscado = normalizarInforme(valorSeleccionado);
        const opcion = Array.from(select.options).find(function (op) {
            return normalizarInforme(op.value) === buscado;
        });
        if (opcion) select.value = opcion.value;
    };
})();
