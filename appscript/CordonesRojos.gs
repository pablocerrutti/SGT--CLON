/********************************************************
 * SGT - CORDONES ROJOS
 * Hoja: ID, Código, Tipo, Serie, Nombre, Descripción, Dirección,
 * Estado, Características, Localidad, Coordenadas, Fecha alta,
 * Usuario alta, Fecha modificación, Usuario modificación, Activo.
 ********************************************************/

function hojaCordonesRojos_() {
  let sh = bd().getSheetByName('CordonesRojos');
  if (!sh) {
    sh = bd().insertSheet('CordonesRojos');
    sh.appendRow(['ID','Código','Tipo','Serie','Nombre','Descripción','Dirección','Estado','Características','Localidad','Coordenadas','FechaAlta','UsuarioAlta','FechaMod','UsuarioMod','Activo']);
  }
  return sh;
}

function obtenerCordonesRojos() {
  try {
    const sh = hojaCordonesRojos_();
    const ultimaFila = sh.getLastRow();
    if (ultimaFila < 2) return {ok:true, datos:[]};
    const datos = sh.getRange(2, 1, ultimaFila - 1, 16).getDisplayValues();
    const lista = datos.filter(function(f){ return String(f[0] || '').trim() !== ''; }).map(function(f) {
      return {id:f[0],codigo:f[1],tipo:f[2],serie:f[3],nombre:f[4],descripcion:f[5],direccion:f[6],estado:f[7],caracteristicas:f[8],localidad:f[9],coordenadas:f[10],fechaAlta:f[11],usuarioAlta:f[12],fechaModificacion:f[13],usuarioModificacion:f[14],activo:f[15]};
    });
    return {ok:true, datos:lista};
  } catch (error) { return {ok:false, mensaje:'No fue posible obtener los cordones rojos: ' + error.message}; }
}

function guardarCordonRojo(e) {
  const p = (e && e.parameter) || {};
  const tipo = 'Cordón Rojo';
  const coordenadas = String(p.coordenadas || '').trim();
  if (!coordenadas) return {ok:false, mensaje:'Seleccione puntos en el mapa para definir el cordón.'};
  const bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(30000);
    const sh = hojaCordonesRojos_();
    const serie = obtenerSiguienteSerieEnHoja_(sh, tipo);
    const prefijo = obtenerPrefijoCordon_();
    const codigo = prefijo + '-' + ('000000' + serie).slice(-6);
    const usuario = String(p.usuario || 'admin').trim() || 'admin';
    sh.appendRow([generarID('CR'),codigo,tipo,serie,String(p.nombre || '').trim(),String(p.descripcion || '').trim(),String(p.direccion || '').trim(),String(p.estado || 'Activo').trim(),String(p.caracteristicas || '').trim(),String(p.localidad || '').trim(),coordenadas,ahora(),usuario,'','','SI']);
    return {ok:true,mensaje:'Cordón rojo guardado correctamente.',codigo:codigo,serie:serie};
  } catch (error) { return {ok:false,mensaje:'No fue posible guardar el cordón rojo: ' + error.message}; }
  finally { if (bloqueo.hasLock()) bloqueo.releaseLock(); }
}

function eliminarCordonRojo(e) {
  const id = String(((e && e.parameter) || {}).id || '').trim();
  if (!id) return {ok:false,mensaje:'Falta el identificador del cordón.'};
  try {
    const sh = hojaCordonesRojos_();
    const fila = buscarFila(sh, id);
    if (fila === -1) return {ok:false,mensaje:'Cordón rojo no encontrado.'};
    sh.deleteRow(fila);
    return {ok:true,mensaje:'Cordón rojo eliminado.'};
  } catch (error) { return {ok:false,mensaje:'No fue posible eliminar el cordón rojo: ' + error.message}; }
}

function obtenerPrefijoCordon_() { return 'CR'; }
