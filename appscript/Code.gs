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
//
// Fuente única para informes:
// - Elementos normales activos
// - Zonas de estacionamiento activas
// - Cordones rojos activos
//
// Las geometrías se leen directamente de sus hojas.
// Los registros eliminados físicamente o marcados como
// inactivos no se incluyen.
//======================================================

function obtenerCatalogoElementosInformables() {
  try {
    const datos = [];

    //==================================================
    // ELEMENTOS NORMALES
    //==================================================
    const elementos = obtenerElementos();

    if (elementos && elementos.ok && Array.isArray(elementos.datos)) {
      elementos.datos.forEach(function(elemento) {
        if (!elemento) return;

        const activo = String(elemento.activo || "").trim().toUpperCase();
        if (["SI", "SÍ", "YES", "TRUE", "VERDADERO", "ACTIVO", "1"].indexOf(activo) === -1) return;

        datos.push({
          tipoElemento: "ELEMENTO",
          id: String(elemento.id || "").trim(),
          codigo: String(elemento.codigo || "").trim(),
          tipo: String(elemento.tipo || "").trim(),
          nombre: String(elemento.nombre || "").trim(),
          descripcion: String(elemento.descripcion || "").trim(),
          direccion: String(elemento.direccion || "").trim(),
          estado: String(elemento.estado || "").trim(),
          caracteristicas: String(elemento.caracteristicas || "").trim(),
          localidad: String(elemento.localidad || elemento.localidadNombre || "").trim(),
          coordenadas: elemento.coordenadas || "",
          geometria: "PUNTO",
          activo: "SI"
        });
      });
    }


    //==================================================
    // ESTACIONAMIENTO TARIFADO
    //==================================================
    const zonas = obtenerZonasEstacionamiento({
      parameter: { incluirInactivos: "NO" }
    });

    if (zonas && zonas.ok && Array.isArray(zonas.datos)) {
      zonas.datos.forEach(function(zona) {
        if (!zona || !zona.id) return;
        if (String(zona.activo || "").trim().toUpperCase() !== "SI") return;

        datos.push({
          tipoElemento: "ZONA_ESTACIONAMIENTO",
          id: String(zona.id).trim(),
          codigo: String(zona.codigo || "").trim(),
          tipo: String(zona.tipo || "Estacionamiento Tarifado").trim(),
          nombre: String(zona.nombre || "").trim(),
          descripcion: String(zona.descripcion || "").trim(),
          direccion: String(zona.direccion || "").trim(),
          estado: String(zona.estado || "").trim(),
          caracteristicas: String(zona.caracteristicas || "").trim(),
          localidad: String(zona.localidad || zona.localidadNombre || "").trim(),
          coordenadas: zona.coordenadas || "[]",
          geometria: "LINEA",
          activo: "SI"
        });
      });
    }


    //==================================================
    // CORDÓN ROJO
    //==================================================
    const cordones = obtenerCordonesRojos({
      parameter: { incluirInactivos: "NO" }
    });

    if (cordones && cordones.ok && Array.isArray(cordones.datos)) {
      cordones.datos.forEach(function(cordon) {
        if (!cordon || !cordon.id) return;
        if (String(cordon.activo || "").trim().toUpperCase() !== "SI") return;

        datos.push({
          tipoElemento: "CORDON_ROJO",
          id: String(cordon.id).trim(),
          codigo: String(cordon.codigo || "").trim(),
          tipo: String(cordon.tipo || "Cordón Rojo").trim(),
          nombre: String(cordon.nombre || "").trim(),
          descripcion: String(cordon.descripcion || "").trim(),
          direccion: String(cordon.direccion || "").trim(),
          estado: String(cordon.estado || "").trim(),
          caracteristicas: String(cordon.caracteristicas || "").trim(),
          localidad: String(cordon.localidad || cordon.localidadNombre || "").trim(),
          coordenadas: cordon.coordenadas || "[]",
          geometria: "LINEA",
          activo: "SI"
        });
      });
    }


    //==================================================
    // DEDUPLICACIÓN
    //==================================================
    const vistos = {};
    const resultado = [];

    datos.forEach(function(elemento) {
      const clave = String(elemento.tipoElemento) + "|" + String(elemento.id);
      if (vistos[clave]) return;
      vistos[clave] = true;
      resultado.push(elemento);
    });

    console.log("Catálogo informable actual:", resultado.length);

    return {
      ok: true,
      datos: resultado
    };

  } catch (error) {
    console.error("ERROR catálogo informable:", error);
    return {
      ok: false,
      datos: [],
      mensaje: error && error.message
        ? error.message
        : "No fue posible obtener el catálogo informable."
    };
  }
}


//======================================================
// JSON
//======================================================

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
