//==================================================
// SGT - GEOMETRÍAS ESPECIALES COMO ELEMENTOS
// Estacionamiento Tarifado + Cordón Rojo
//==================================================

(function () {
    "use strict";

    const TIPO_ET = "Estacionamiento Tarifado";
    const TIPO_CR = "Cordón Rojo";

    function normalizarLocal(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }

    function leerPuntos(valor) {
        if (Array.isArray(valor)) return valor.slice(0, 2);
        try {
            const datos = JSON.parse(valor || "[]");
            return Array.isArray(datos) ? datos.slice(0, 2) : [];
        } catch (_) {
            return [];
        }
    }

    function obtenerFichaCompleta(datos) {
        return {
            tipo: datos.tipo || "",
            nombre: datos.nombre || "",
            descripcion: datos.descripcion || "",
            direccion: datos.direccion || "",
            estado: datos.estado || "Activo",
            caracteristicas: datos.caracteristicas || "",
            localidad: datos.localidad || datos.localidadNombre || "",
            ciudad: datos.ciudad || datos.localidad || datos.localidadNombre || "",
            zona: datos.zona || "",
            usuario: datos.usuario || datos.usuarioAlta || ""
        };
    }

    function construirElemento(datos, respuesta) {
        const puntos = leerPuntos(datos.coordenadas);
        const primero = puntos[0] || ["", ""];
        const ficha = obtenerFichaCompleta(datos);

        return {
            id: respuesta?.id || respuesta?.datos?.id || "",
            codigo: respuesta?.codigo || respuesta?.datos?.codigo || "",
            tipo: ficha.tipo,
            nombre: ficha.nombre,
            descripcion: ficha.descripcion,
            direccion: ficha.direccion,
            estado: ficha.estado,
            caracteristicas: ficha.caracteristicas,
            latitud: primero[0] ?? "",
            longitud: primero[1] ?? "",
            // Se conservan exactamente los dos puntos de la geometría.
            coordenadas: JSON.stringify(puntos),
            ciudad: ficha.ciudad,
            localidad: ficha.localidad,
            localidadNombre: ficha.localidad,
            zona: ficha.zona,
            origenGeometrico: "SI",
            usuario: ficha.usuario,
            usuarioAlta: ficha.usuario
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

    async function guardarGeometria(tipo, datos, apiGuardar, mensajeOk, mensajeError, limpiar, cargar) {
        const usuario = typeof obtenerUsuarioActual === "function" ? obtenerUsuarioActual() : {};
        datos.usuario = usuario.nombre || usuario.usuario || datos.usuario || "admin";
        datos.usuarioAlta = datos.usuario;
        datos.localidad = datos.localidad || datos.localidadNombre || "";
        datos.ciudad = datos.ciudad || datos.localidad || "";
        datos.coordenadas = JSON.stringify(leerPuntos(datos.coordenadas));

        const puntos = leerPuntos(datos.coordenadas);
        if (puntos.length !== 2) {
            throw new Error("El " + (tipo === TIPO_CR ? "cordón rojo" : "estacionamiento tarifado") + " debe contener exactamente 2 puntos.");
        }

        const respuesta = await apiGuardar(datos);
        if (!respuesta || !respuesta.ok) {
            throw new Error(respuesta?.mensaje || mensajeError);
        }

        const indexado = await registrarEnElementos(datos, respuesta);
        mostrarMensaje(
            indexado ? mensajeOk : mensajeOk + " Pero no pudo registrarse en Elementos.",
            indexado ? "exito" : "error"
        );

        const form = document.getElementById("formElemento");
        if (form) form.reset();
        if (typeof limpiar === "function") limpiar();
        if (typeof cargar === "function") await cargar();
        if (typeof cargarElementos === "function") await cargarElementos();
    }

    window.guardarZonaEnServidor = async function (datos) {
        try {
            const estado = document.getElementById("estadoZona");
            if (estado) estado.textContent = "Guardando estacionamiento tarifado...";
            await guardarGeometria(
                TIPO_ET,
                datos,
                apiGuardarZonaEstacionamiento,
                "Estacionamiento tarifado guardado y registrado como elemento.",
                "No fue posible guardar el estacionamiento tarifado.",
                window.limpiarDibujoZona,
                window.cargarZonasEstacionamiento
            );
        } catch (error) {
            console.error("Error guardando estacionamiento tarifado:", error);
            mostrarMensaje(error.message || "Error al guardar el estacionamiento tarifado.", "error");
        }
    };

    window.guardarCordonRojoEnServidor = async function (datos) {
        try {
            const estado = document.getElementById("estadoZona");
            if (estado) estado.textContent = "Guardando cordón rojo...";
            await guardarGeometria(
                TIPO_CR,
                datos,
                apiGuardarCordonRojo,
                "Cordón rojo guardado y registrado como elemento.",
                "No fue posible guardar el cordón rojo.",
                window.limpiarDibujoCordon,
                window.cargarCordonesRojos
            );
        } catch (error) {
            console.error("Error guardando cordón rojo:", error);
            mostrarMensaje(error.message || "Error al guardar el cordón rojo.", "error");
        }
    };

    const renderOriginal = window.renderizarMapaCompleto;

    window.renderizarMapaCompleto = function () {
        if (typeof renderOriginal === "function") renderOriginal();
        dibujarEspecialesDesdeElementosEnBusqueda();
    };

    function dibujarEspecialesDesdeElementosEnBusqueda() {
        if (typeof mapa === "undefined" || typeof elementos === "undefined") return;

        const buscar = document.getElementById("buscar");
        const filtroTipo = document.getElementById("filtroTipo");
        const filtroLocalidad = document.getElementById("filtroLocalidad");

        const texto = normalizarLocal(buscar?.value);
        const tipo = normalizarLocal(filtroTipo?.value);
        const localidad = normalizarLocal(filtroLocalidad?.value);

        if (!texto) return;

        if (typeof capaZonasEstacionamiento !== "undefined" && capaZonasEstacionamiento) {
            capaZonasEstacionamiento.clearLayers();
        }
        if (typeof capaCordonesRojos !== "undefined" && capaCordonesRojos) {
            capaCordonesRojos.clearLayers();
        }

        elementos.forEach(function (elemento) {
            const tipoElemento = normalizarLocal(elemento.tipo);
            if (tipoElemento !== normalizarLocal(TIPO_ET) && tipoElemento !== normalizarLocal(TIPO_CR)) return;

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
                elemento.caracteristicas,
                elemento.localidad,
                elemento.ciudad,
                elemento.zona
            ].join(" "));

            if (texto && !textoCompleto.includes(texto)) return;
            if (tipo && tipo !== tipoElemento) return;

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
