/********************************************************
 SGT
 Sistema de Gestión de Tránsito
********************************************************/

function doGet(e) {

  e = e || { parameter: {} };
  e.parameter = e.parameter || {};

  const accion = String(e.parameter.accion || "").trim();

  switch (accion) {

    case "login":
      return json(login(e));

    case "obtenerUsuarios":
      return json(obtenerUsuarios());

    case "guardarUsuario":
      return json(guardarUsuario(e));

    case "eliminarUsuario":
      return json(eliminarUsuario(e));

    case "obtenerCategorias":
      return json(obtenerCategorias());

    case "obtenerLocalidades":
      return json(obtenerLocalidades());

    case "obtenerElementos":
      return json(obtenerElementos());

    case "guardarElemento":
      return json(guardarElemento(e));

    case "actualizarElemento":
      return json(actualizarElemento(e));

    case "eliminarElemento":
      return json(eliminarElemento(e));

    case "obtenerZonasEstacionamiento":
      return json(obtenerZonasEstacionamiento(e));

    case "guardarZonaEstacionamiento":
      return json(guardarZonaEstacionamiento(e));

    case "eliminarZonaEstacionamiento":
      return json(eliminarZonaEstacionamiento(e));

    case "obtenerCordonesRojos":
      return json(obtenerCordonesRojos(e));

    case "guardarCordonRojo":
      return json(guardarCordonRojo(e));

    case "eliminarCordonRojo":
      return json(eliminarCordonRojo(e));

    case "obtenerCatalogoElementosInformables":
      return json(obtenerCatalogoElementosInformables());

    case "obtenerInspecciones":
      return json(obtenerInspecciones(e));

    case "guardarInspeccion":
      return json(guardarInspeccion(e));

    case "subirArchivo":
      return json(subirArchivo(e));

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
