/********************************************************
 SGT
 Sistema de Gestión de Tránsito
********************************************************/

function doGet(e) {

  const accion = e.parameter.accion || "";

  switch (accion) {

    //=========================
    // LOGIN
    //=========================

    case "login":
      return json(login(e));

    //=========================
    // USUARIOS
    //=========================

    case "obtenerUsuarios":
      return json(obtenerUsuarios());

    case "guardarUsuario":
      return json(guardarUsuario(e));

    case "eliminarUsuario":
      return json(eliminarUsuario(e));

    //=========================
    // ELEMENTOS
    //=========================

    case "obtenerElementos":
      return json(obtenerElementos());

    case "guardarElemento":
      return json(guardarElemento(e));

    case "actualizarElemento":
      return json(actualizarElemento(e));

    case "eliminarElemento":
      return json(eliminarElemento(e));

    //=========================
    // INSPECCIONES
    //=========================

    case "obtenerInspecciones":
      return json(obtenerInspecciones(e));

    case "guardarInspeccion":
      return json(guardarInspeccion(e));

    case "subirArchivo":
      return json(subirArchivo(e));

    //=========================
    // ZONAS DE ESTACIONAMIENTO
    //=========================

    case "obtenerZonasEstacionamiento":
      return json(obtenerZonasEstacionamiento());

    case "guardarZonaEstacionamiento":
      return json(guardarZonaEstacionamiento(e));

    case "eliminarZonaEstacionamiento":
      return json(eliminarZonaEstacionamiento(e));

    //=========================
    // CORDONES ROJOS
    //=========================

    case "obtenerCordonesRojos":
      return json(obtenerCordonesRojos());

    case "guardarCordonRojo":
      return json(guardarCordonRojo(e));

    case "eliminarCordonRojo":
      return json(eliminarCordonRojo(e));

    //=========================
    // CATÁLOGO INFORMABLE
    //=========================

    case "obtenerCatalogoElementosInformables":
      return json(obtenerCatalogoElementosInformables());

    //=========================
    // FOTOS
    //=========================

    default:

      return json({

        ok: false,
        mensaje: "Acción inválida: " + accion

      });

  }

}

function doPost(e) {

  return doGet(e);

}

function json(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

}
