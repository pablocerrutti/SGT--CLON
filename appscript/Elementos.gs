/********************************************************
 * SGT - ELEMENTOS
 * Hoja: ID, Código, Tipo, Serie, Nombre, Descripción, Latitud,
 * Longitud, Dirección, Estado, Características, Fecha alta,
 * Usuario alta, Fecha modificación, Usuario modificación, Activo.
 ********************************************************/
function obtenerPrefijo(tipo) {
  const prefijos = {'Semáforo':'SEM','Radar':'RAD','Cruce Peatonal':'CRU','Lomo de Burro':'LOM','Cartel':'CAR','Señal Vertical':'SVE','Señal Horizontal':'SHO','Cámara':'CAM','Estacionamiento Tarifado':'ET','Cordón Rojo':'CR','Otro':'OTR'};
  return prefijos[String(tipo || '').trim()] || 'OTR';
}
function obtenerSiguienteSerie(tipo) { return obtenerSiguienteSerieEnHoja_(hoja('Elementos'), tipo); }
function obtenerSiguienteSerieEnHoja_(sh, tipo) {
  const ultimaFila = sh.getLastRow();
  if (ultimaFila < 2) return 1;
  const datos = sh.getRange(2, 3, ultimaFila - 1, 2).getValues();
  const tipoNormalizado = String(tipo || '').trim();
  let mayor = 0;
  datos.forEach(function(fila) {
    if (String(fila[0] || '').trim() !== tipoNormalizado) return;
    const serie = Number(fila[1]);
    if (Number.isFinite(serie) && serie > mayor) mayor = serie;
  });
  return mayor + 1;
}
function obtenerElementos() {
  try {
    const sh = hoja('Elementos');
    const ultimaFila = sh.getLastRow();
    if (ultimaFila < 2) return {ok:true, datos:[]};
    asegurarColumnasTerritoriales_(sh);
    const datos = sh.getRange(2, 1, ultimaFila - 1, 19).getDisplayValues();
    const lista = datos.filter(function(f){ return String(f[0] || '').trim() !== ''; }).map(function(f) {
      return {id:f[0],codigo:f[1],tipo:f[2],serie:f[3],nombre:f[4],descripcion:f[5],latitud:f[6],longitud:f[7],direccion:f[8],estado:f[9],caracteristicas:f[10],fechaAlta:f[11],usuarioAlta:f[12],fechaModificacion:f[13],usuarioModificacion:f[14],activo:f[15],ciudad:f[16],localidad:f[17],zona:f[18]};
    });
    return {ok:true, datos:lista};
  } catch (error) { return {ok:false, mensaje:'No fue posible obtener los elementos: ' + error.message}; }
}
function guardarElemento(e) {
  const p = (e && e.parameter) || {};
  const tipo = String(p.tipo || '').trim() || 'Otro';
  const coordenadas = validarCoordenadas_(p.latitud, p.longitud);
  if (!coordenadas.ok) return coordenadas;
  const bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(30000);
    const sh = hoja('Elementos');
    const serie = obtenerSiguienteSerieEnHoja_(sh, tipo);
    const codigo = obtenerPrefijo(tipo) + '-' + ('000000' + serie).slice(-6);
    const usuario = String(p.usuario || 'admin').trim() || 'admin';
    asegurarColumnasTerritoriales_(sh);
    sh.appendRow([generarID('EL'),codigo,tipo,serie,String(p.nombre || '').trim(),String(p.descripcion || '').trim(),coordenadas.latitud,coordenadas.longitud,String(p.direccion || '').trim(),String(p.estado || 'Activo').trim(),String(p.caracteristicas || '').trim(),ahora(),usuario,'','','SI',String(p.ciudad||'').trim(),String(p.localidad||'').trim(),String(p.zona||'').trim()]);
    return {ok:true,mensaje:'Elemento guardado correctamente.',codigo:codigo,serie:serie};
  } catch (error) { return {ok:false,mensaje:'No fue posible guardar el elemento: ' + error.message};
  } finally { if (bloqueo.hasLock()) bloqueo.releaseLock(); }
}
function actualizarElemento(e) {
  const p = (e && e.parameter) || {};
  const id = String(p.id || '').trim();
  if (!id) return {ok:false,mensaje:'Falta el identificador del elemento.'};
  const coordenadas = validarCoordenadas_(p.latitud, p.longitud);
  if (!coordenadas.ok) return coordenadas;
  try {
    const sh = hoja('Elementos'); const fila = buscarFila(sh, id);
    if (fila === -1) return {ok:false,mensaje:'Elemento no encontrado.'};
    sh.getRange(fila, 5, 1, 7).setValues([[String(p.nombre || '').trim(),String(p.descripcion || '').trim(),coordenadas.latitud,coordenadas.longitud,String(p.direccion || '').trim(),String(p.estado || '').trim(),String(p.caracteristicas || '').trim()]]);
    sh.getRange(fila, 14, 1, 2).setValues([[ahora(),String(p.usuario || 'admin').trim() || 'admin']]);
    return {ok:true,mensaje:'Elemento actualizado.'};
  } catch (error) { return {ok:false,mensaje:'No fue posible actualizar el elemento: ' + error.message}; }
}
function eliminarElemento(e) {
  const id = String(((e && e.parameter) || {}).id || '').trim();
  if (!id) return {ok:false,mensaje:'Falta el identificador del elemento.'};
  try { const sh = hoja('Elementos'); const fila = buscarFila(sh, id); if (fila === -1) return {ok:false,mensaje:'Elemento no encontrado.'}; sh.deleteRow(fila); return {ok:true,mensaje:'Elemento eliminado.'};
  } catch (error) { return {ok:false,mensaje:'No fue posible eliminar el elemento: ' + error.message}; }
}
function validarCoordenadas_(latitud, longitud) {
  const lat = Number(String(latitud == null ? '' : latitud).replace(',', '.'));
  const lng = Number(String(longitud == null ? '' : longitud).replace(',', '.'));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return {ok:false,mensaje:'Seleccione un punto válido en el mapa antes de guardar.'};
  return {ok:true,latitud:lat,longitud:lng};
}
function asegurarColumnasTerritoriales_(sh){if(sh.getLastColumn()<19){sh.getRange(1,17,1,3).setValues([['Ciudad','Localidad','Zona']]);}}
