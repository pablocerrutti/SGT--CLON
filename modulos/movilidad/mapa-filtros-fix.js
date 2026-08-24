// SGT - Corrección de filtros y geometrías especiales de Movilidad
// Se carga después de mapa.js.
(function () {
    "use strict";

    const TIPO_ET = "Estacionamiento Tarifado";
    const TIPO_CR = "Cordón Rojo";

    function normalizarLocal(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function filtroTipoActual() {
        const el = document.getElementById("filtroTipo");
        return el ? el.value : "";
    }

    // Las variables de mapa.js son let globales y no propiedades de window.
    // Por eso se accede directamente a ellas aquí.
    const originalMostrarZonas = mostrarZonasEstacionamiento;
    const originalMostrarCordones = mostrarCordonesRojos;

    window.mostrarZonasEstacionamiento = function () {
        const filtro = filtroTipoActual();
        const mostrar = !filtro || normalizarLocal(filtro) === normalizarLocal(TIPO_ET);

        capaZonasEstacionamiento.clearLayers();
        if (!mostrar) return;
        originalMostrarZonas();
    };

    window.mostrarCordonesRojos = function () {
        const filtro = filtroTipoActual();
        const mostrar = !filtro || normalizarLocal(filtro) === normalizarLocal(TIPO_CR);

        capaCordonesRojos.clearLayers();
        if (!mostrar) return;
        originalMostrarCordones();
    };

    function leerPuntos(valor) {
        if (Array.isArray(valor)) return valor.slice(0, 2);
        try {
            const datos = JSON.parse(valor || "[]");
            return Array.isArray(datos) ? datos.slice(0, 2) : [];
        } catch (_) {
            return [];
        }
    }

    function construirElemento(datos, respuesta) {
        const puntos = leerPuntos(datos.coordenadas);
        const primero = puntos[0] || ["", ""];

        return {
            id: respuesta?.id || respuesta?.datos?.id || "",
            codigo: respuesta?.codigo || respuesta?.datos?.codigo || "",
            tipo: datos.tipo,
            nombre: datos.nombre || "",
            descripcion: datos.descripcion || "",
            direccion: datos.direccion || "",
            estado: datos.estado || "Activo",
            caracteristicas: datos.caracteristicas || "",
            latitud: primero[0] ?? "",
            longitud: primero[1] ?? "",
            coordenadas: JSON.stringify(puntos),
            ciudad: datos.localidad || "",
            localidad: datos.localidad || "",
            localidadNombre: datos.localidad || "",
            origenGeometrico: "SI",
            usuario: datos.usuario || ""
        };
    }

    async function registrarEnElementos(datos, respuesta) {
        const elemento = construirElemento(datos, respuesta);
        const resultado = await apiGuardarElemento(elemento);

        if (!resultado || !resultado.ok) {
            console.warn(
                "La geometría se guardó en su hoja específica, pero no pudo registrarse en Elementos:",
                resultado?.mensaje
            );
            return false;
        }

        return true;
    }

    // Estacionamiento Tarifado: hoja especializada + hoja Elementos.
    window.guardarZonaEnServidor = async function (datos) {
        try {
            const usuario = typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : {};
            datos.usuario = usuario.nombre || usuario.usuario || "admin";
            datos.coordenadas = JSON.stringify(leerPuntos(datos.coordenadas));

            const respuesta = await apiGuardarZonaEstacionamiento(datos);
            if (!respuesta || !respuesta.ok) {
                throw new Error(respuesta?.mensaje || "No fue posible guardar el estacionamiento tarifado.");
            }

            const indexado = await registrarEnElementos(datos, respuesta);

            mostrarMensaje(
                indexado
                    ? "Estacionamiento tarifado guardado y registrado como elemento."
                    : "Estacionamiento tarifado guardado, pero no pudo indexarse como elemento.",
                indexado ? "exito" : "error"
            );

            const form = document.getElementById("formElemento");
            if (form) form.reset();
            limpiarDibujoZona();
            await cargarZonasEstacionamiento();
            await cargarElementos();

        } catch (error) {
            console.error("Error guardando estacionamiento tarifado:", error);
            mostrarMensaje(error.message || "Error al guardar el estacionamiento tarifado.", "error");
        }
    };

    // Cordón Rojo: hoja especializada + hoja Elementos.
    window.guardarCordonRojoEnServidor = async function (datos) {
        try {
            const usuario = typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : {};
            datos.usuario = usuario.nombre || usuario.usuario || "admin";
            datos.coordenadas = JSON.stringify(leerPuntos(datos.coordenadas));

            const respuesta = await apiGuardarCordonRojo(datos);
            if (!respuesta || !respuesta.ok) {
                throw new Error(respuesta?.mensaje || "No fue posible guardar el cordón rojo.");
            }

            const indexado = await registrarEnElementos(datos, respuesta);

            mostrarMensaje(
                indexado
                    ? "Cordón rojo guardado y registrado como elemento."
                    : "Cordón rojo guardado, pero no pudo indexarse como elemento.",
                indexado ? "exito" : "error"
            );

            const form = document.getElementById("formElemento");
            if (form) form.reset();
            limpiarDibujoCordon();
            await cargarCordonesRojos();
            await cargarElementos();

        } catch (error) {
            console.error("Error guardando cordón rojo:", error);
            mostrarMensaje(error.message || "Error al guardar el cordón rojo.", "error");
        }
    };

    // Cuando hay texto en Buscar, las geometrías se buscan desde Elementos.
    // Así participan del mismo buscador que el resto de los elementos.
    const renderOriginal = window.renderizarMapaCompleto;

    window.renderizarMapaCompleto = function () {
        if (typeof renderOriginal === "function") renderOriginal();
        dibujarEspecialesDesdeElementosEnBusqueda();
    };

    function dibujarEspecialesDesdeElementosEnBusqueda() {
        const buscar = document.getElementById("buscar");
        const filtroTipo = document.getElementById("filtroTipo");
        const filtroLocalidad = document.getElementById("filtroLocalidad");

        const texto = normalizarLocal(buscar?.value);
        if (!texto) return;

        const tipo = normalizarLocal(filtroTipo?.value);
        const localidad = normalizarLocal(filtroLocalidad?.value);

        capaZonasEstacionamiento.clearLayers();
        capaCordonesRojos.clearLayers();

        elementos.forEach(function (elemento) {
            const tipoElemento = normalizarLocal(elemento.tipo);
            if (tipoElemento !== normalizarLocal(TIPO_ET) && tipoElemento !== normalizarLocal(TIPO_CR)) return;

            if (tipo && tipo !== tipoElemento) return;

            const localidadElemento = normalizarLocal(
                elemento.localidadNombre || elemento.localidad || elemento.ciudad
            );
            if (localidad && localidadElemento !== localidad) return;

            const textoCompleto = normalizarLocal([
                elemento.id,
                elemento.codigo,
                elemento.tipo,
                elemento.nombre,
                elemento.descripcion,
                elemento.direccion,
                elemento.caracteristicas
            ].join(" "));

            if (!textoCompleto.includes(texto)) return;

            const puntos = leerPuntos(elemento.coordenadas);
            if (puntos.length !== 2) return;

            const linea = L.polyline(puntos, {
                color: tipoElemento === normalizarLocal(TIPO_CR) ? "#d50000" : "#4fc3f7",
                weight: tipoElemento === normalizarLocal(TIPO_CR) ? 5 : 6,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round"
            });

            linea.bindPopup(crearPopup(elemento));
            linea.addTo(mapa);
        });
    }
})();
