/********************************************************
 * SGT - LOCALIDADES GEOGRÁFICAS
 *
 * Hoja requerida: Localidades
 * Columnas:
 * ID | Nombre | Latitud Centro | Longitud Centro | Radio Km | Activo
 ********************************************************/

function obtenerLocalidades() {
  try {
    const sh = hoja("Localidades");
    if (!sh) {
      return { ok: false, mensaje: "No existe la hoja Localidades." };
    }

    const ultimaFila = sh.getLastRow();
    if (ultimaFila < 2) return { ok: true, datos: [] };

    const datos = sh.getRange(2, 1, ultimaFila - 1, 6).getDisplayValues();

    const lista = datos
      .filter(function(f) { return String(f[0] || "").trim() !== ""; })
      .map(function(f) {
        return {
          id: String(f[0] || "").trim(),
          nombre: String(f[1] || "").trim(),
          latitud: Number(String(f[2] || "").replace(",", ".")),
          longitud: Number(String(f[3] || "").replace(",", ".")),
          radioKm: Number(String(f[4] || "").replace(",", ".")),
          activo: String(f[5] || "").trim()
        };
      });

    return { ok: true, datos: lista };
  } catch (error) {
    return {
      ok: false,
      mensaje: "Error obteniendo localidades: " + error.message
    };
  }
}

function obtenerLocalidadPorCoordenadas(latitud, longitud) {
  const lat = Number(String(latitud == null ? "" : latitud).replace(",", "."));
  const lng = Number(String(longitud == null ? "" : longitud).replace(",", "."));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { id: "", nombre: "" };
  }

  const resultado = obtenerLocalidades();
  if (!resultado.ok || !Array.isArray(resultado.datos)) {
    return { id: "", nombre: "" };
  }

  let mejor = null;
  let mejorDistancia = Infinity;

  resultado.datos.forEach(function(loc) {
    if (String(loc.activo || "").trim().toUpperCase() !== "SI") return;
    if (!Number.isFinite(loc.latitud) || !Number.isFinite(loc.longitud) || !Number.isFinite(loc.radioKm)) return;
    if (loc.radioKm < 0) return;

    const distancia = calcularDistanciaKmLocalidad_(lat, lng, loc.latitud, loc.longitud);

    if (distancia <= loc.radioKm && distancia < mejorDistancia) {
      mejor = loc;
      mejorDistancia = distancia;
    }
  });

  return mejor
    ? { id: mejor.id, nombre: mejor.nombre }
    : { id: "", nombre: "Sin localidad" };
}

function calcularDistanciaKmLocalidad_(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
