/********************************************************
 SGT
 Sistema de Gestión de Tránsito
 API PRINCIPAL
********************************************************/

function doGet(e) {
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};

  const accion = String(e.parameter.accion || "").trim();

  try {
    switch (accion) {
      case "login": return json(login(e));

      case "obtenerUsuarios": return json(obtenerUsuarios());
      case "guardarUsuario": return json(guardarUsuario(e));
      case "eliminarUsuario": return json(eliminarUsuario(e));

      case "obtenerCategorias": return json(obtenerCategorias());
      case "obtenerLocalidades": return json(obtenerLocalidades());

      case "obtenerElementos": return json(obtenerElementos());
      case "guardarElemento": return json(guardarElemento(e));
      case "actualizarElemento": return json(actualizarElemento(e));
      case "eliminarElemento": return json(eliminarElemento(e));

      case "obtenerZonasEstacionamiento": return json(obtenerZonasEstacionamiento(e));
      case "guardarZonaEstacionamiento": return json(guardarZonaEstacionamiento(e));
      case "eliminarZonaEstacionamiento": return json(eliminarZonaEstacionamiento(e));

      case "obtenerCordonesRojos": return json(obtenerCordonesRojos(e));
      case "guardarCordonRojo": return json(guardarCordonRojo(e));
      case "eliminarCordonRojo": return json(eliminarCordonRojo(e));

      case "obtenerCatalogoElementosInformables":
        return json(obtenerCatalogoElementosInformables());

      case "obtenerInspecciones": return json(obtenerInspecciones(e));
      case "guardarInspeccion": return json(guardarInspeccion(e));
      case "subirArchivo": return json(subirArchivo(e));

      case "ping":
        return json({
          ok: true,
          mensaje: "API SGT funcionando correctamente.",
          fecha: new Date().toISOString()
        });

      default:
        return json({
          ok: false,
          mensaje: "Acción inválida: " + accion
        });
    }
  } catch (error) {
    console.error("ERROR API SGT:", error);
    return json({
      ok: false,
      mensaje: error && error.message ? error.message : "Error interno del servidor."
    });
  }
}

function doPost(e) {
  return doGet(e);
}


//======================================================
// CATÁLOGO ACTUAL PARA INFORMES
//======================================================
// Fuente única del módulo Informes.
// Incluye TODOS los elementos que actualmente existen:
//   1. Elementos normales de la hoja Elementos
//   2. Zonas de estacionamiento de la hoja correspondiente
//   3. Cordones rojos de la hoja correspondiente
//
// Se excluyen únicamente registros inactivos/eliminados.
// No se usa localStorage ni datos históricos del navegador.
//======================================================

function obtenerCatalogoElementosInformables() {
  try {
    const datos = [];

    //==================================================
    // 1) ELEMENTOS NORMALES
    //==================================================
    const elementos = obtenerElementos();

    if (elementos && elementos.ok && Array.isArray(elementos.datos)) {
      elementos.datos.forEach(function(elemento) {
        if (!elemento || !String(elemento.id || "").trim()) return;

        if (!esActivoCatalogo_(elemento.activo)) return;

        const lat = String(elemento.latitud == null ? "" : elemento.latitud).trim();
        const lng = String(elemento.longitud == null ? "" : elemento.longitud).trim();

        datos.push({
          tipoElemento: "ELEMENTO",
          id: String(elemento.id || "").trim(),
          codigo: String(elemento.codigo || "").trim(),
          tipo: String(elemento.tipo || "").trim(),
          serie: String(elemento.serie || "").trim(),
          nombre: String(elemento.nombre || "").trim(),
          descripcion: String(elemento.descripcion || "").trim(),
          direccion: String(elemento.direccion || "").trim(),
          estado: String(elemento.estado || "").trim(),
          caracteristicas: String(elemento.caracteristicas || "").trim(),
          ciudad: String(elemento.ciudad || "").trim(),
          localidad: String(
            elemento.localidad ||
            elemento.localidadNombre ||
            elemento.ciudad ||
            ""
          ).trim(),
          zona: String(elemento.zona || "").trim(),
          coordenadas: (lat !== "" && lng !== "") ? lat + ", " + lng : "",
          geometria: "PUNTO",
          fechaAlta: String(elemento.fechaAlta || "").trim(),
          usuarioAlta: String(elemento.usuarioAlta || "").trim(),
          activo: "SI"
        });
      });
    }


    //==================================================
    // 2) ESTACIONAMIENTO TARIFADO
    //==================================================
    const zonas = obtenerZonasEstacionamiento({
      parameter: { incluirInactivos: "NO" }
    });

    if (zonas && zonas.ok && Array.isArray(zonas.datos)) {
      zonas.datos.forEach(function(zona) {
        if (!zona || !String(zona.id || "").trim()) return;
        if (!esActivoCatalogo_(zona.activo)) return;

        datos.push({
          tipoElemento: "ZONA_ESTACIONAMIENTO",
          id: String(zona.id || "").trim(),
          codigo: String(zona.codigo || "").trim(),
          tipo: String(zona.tipo || "Estacionamiento Tarifado").trim(),
          serie: String(zona.serie || "").trim(),
          nombre: String(zona.nombre || "").trim(),
          descripcion: String(zona.descripcion || "").trim(),
          direccion: String(zona.direccion || "").trim(),
          estado: String(zona.estado || "").trim(),
          caracteristicas: String(zona.caracteristicas || "").trim(),
          ciudad: String(zona.ciudad || "").trim(),
          localidad: String(zona.localidad || zona.localidadNombre || "").trim(),
          zona: String(zona.zona || "").trim(),
          coordenadas: String(zona.coordenadas || "[]").trim(),
          geometria: "LINEA",
          fechaAlta: String(zona.fechaAlta || "").trim(),
          usuarioAlta: String(zona.usuarioAlta || "").trim(),
          activo: "SI"
        });
      });
    }


    //==================================================
    // 3) CORDÓN ROJO
    //==================================================
    const cordones = obtenerCordonesRojos({
      parameter: { incluirInactivos: "NO" }
    });

    if (cordones && cordones.ok && Array.isArray(cordones.datos)) {
      cordones.datos.forEach(function(cordon) {
        if (!cordon || !String(cordon.id || "").trim()) return;
        if (!esActivoCatalogo_(cordon.activo)) return;

        datos.push({
          tipoElemento: "CORDON_ROJO",
          id: String(cordon.id || "").trim(),
          codigo: String(cordon.codigo || "").trim(),
          tipo: String(cordon.tipo || "Cordón Rojo").trim(),
          serie: String(cordon.serie || "").trim(),
          nombre: String(cordon.nombre || "").trim(),
          descripcion: String(cordon.descripcion || "").trim(),
          direccion: String(cordon.direccion || "").trim(),
          estado: String(cordon.estado || "").trim(),
          caracteristicas: String(cordon.caracteristicas || "").trim(),
          ciudad: String(cordon.ciudad || "").trim(),
          localidad: String(cordon.localidad || cordon.localidadNombre || "").trim(),
          zona: String(cordon.zona || "").trim(),
          coordenadas: String(cordon.coordenadas || "[]").trim(),
          geometria: "LINEA",
          fechaAlta: String(cordon.fechaAlta || "").trim(),
          usuarioAlta: String(cordon.usuarioAlta || "").trim(),
          activo: "SI"
        });
      });
    }


    //==================================================
    // DEDUPLICACIÓN SEGURA
    //==================================================
    const vistos = {};
    const resultado = [];

    datos.forEach(function(elemento) {
      const id = String(elemento.id || "").trim();
      if (!id) return;

      const clave = String(elemento.tipoElemento || "") + "|" + id;
      if (vistos[clave]) return;

      vistos[clave] = true;
      resultado.push(elemento);
    });

    console.log("Catálogo informable ACTUAL:", resultado.length);

    return {
      ok: true,
      datos: resultado,
      cantidad: resultado.length
    };

  } catch (error) {
    console.error("ERROR catálogo informable:", error);
    return {
      ok: false,
      datos: [],
      cantidad: 0,
      mensaje: error && error.message
        ? error.message
        : "No fue posible obtener el catálogo informable."
    };
  }
}


//======================================================
// ACTIVO / VIGENTE
//======================================================

function esActivoCatalogo_(valor) {
  const texto = String(valor == null ? "" : valor).trim().toUpperCase();
  return [
    "SI", "SÍ", "YES", "TRUE", "VERDADERO", "ACTIVO", "1"
  ].indexOf(texto) !== -1;
}


//======================================================
// JSON
//======================================================

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
