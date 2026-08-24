/********************************************************
 * SGT - ZONAS DE ESTACIONAMIENTO TARIFADO
 * Hoja: ID, Código, Tipo, Serie, Nombre, Descripción, Dirección,
 * Estado, Características, Localidad, Coordenadas, Fecha alta,
 * Usuario alta, Fecha modificación, Usuario modificación, Activo.
 ********************************************************/

function hojaZonasEstacionamiento_() {
  let sh = bd().getSheetByName('ZonasEstacionamiento');
  if (!sh) {
    sh = bd().insertSheet('ZonasEstacionamiento');
    sh.appendRow(['ID','Código','Tipo','Serie','Nombre','Descripción','Dirección','Estado','Características','Localidad','Coordenadas','FechaAlta','UsuarioAlta','FechaMod','UsuarioMod','Activo']);
  }
  return sh;
}

function obtenerZonasEstacionamiento() {
  try {
    const sh = hojaZonasEstacionamiento_();
    const ultimaFila = sh.getLastRow();
    if (ultimaFila < 2) return {ok:true, datos:[]};
    const datos = sh.getRange(2, 1, ultimaFila - 1, 16).getDisplayValues();
    const lista = datos.filter(function(f){ return String(f[0] || '').trim() !== ''; }).map(function(f) {
      return {id:f[0],codigo:f[1],tipo:f[2],serie:f[3],nombre:f[4],descripcion:f[5],direccion:f[6],estado:f[7],caracteristicas:f[8],localidad:f[9],coordenadas:f[10],fechaAlta:f[11],usuarioAlta:f[12],fechaModificacion:f[13],usuarioModificacion:f[14],activo:f[15]};
    });
    return {ok:true, datos:lista};
  } catch (error) { return {ok:false, mensaje:'No fue posible obtener las zonas de estacionamiento: ' + error.message}; }
}

function guardarZonaEstacionamiento(e) {
  const p = (e && e.parameter) || {};
  const tipo = 'Estacionamiento Tarifado';
  const coordenadasTexto = String(p.coordenadas || '').trim();

  if (!coordenadasTexto) {
    return {ok:false, mensaje:'Debe seleccionar exactamente 2 puntos en el mapa para definir el tramo.'};
  }

  // La geometría de Estacionamiento Tarifado es SIEMPRE una línea de 2 puntos.
  // El servidor valida esto para impedir que se guarden polígonos o trazados de 3+ puntos.
  let coordenadas;
  try {
    coordenadas = JSON.parse(coordenadasTexto);
  } catch (error) {
    return {ok:false, mensaje:'Las coordenadas no tienen un formato válido.'};
  }

  if (!Array.isArray(coordenadas) || coordenadas.length !== 2) {
    return {ok:false, mensaje:'Estacionamiento Tarifado debe definirse con exactamente 2 puntos. No se permiten 3 o más puntos.'};
  }

  for (let i = 0; i < 2; i++) {
    if (!Array.isArray(coordenadas[i]) || coordenadas[i].length < 2 || !Number.isFinite(Number(coordenadas[i][0])) || !Number.isFinite(Number(coordenadas[i][1]))) {
      return {ok:false, mensaje:'Los dos puntos de la línea deben contener latitud y longitud válidas.'};
    }
  }

  // Normalizar siempre a exactamente dos pares [lat,lng].
  coordenadas = coordenadas.map(function(punto) {
    return [Number(punto[0]), Number(punto[1])];
  });

  const bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(30000);
    const sh = hojaZonasEstacionamiento_();
    const serie = obtenerSiguienteSerieEnHoja_(sh, tipo);
    const prefijo = obtenerPrefijoZona_();
    const codigo = prefijo + '-' + ('000000' + serie).slice(-6);
    const usuario = String(p.usuario || 'admin').trim() || 'admin';
    sh.appendRow([generarID('ZE'),codigo,tipo,serie,String(p.nombre || '').trim(),String(p.descripcion || '').trim(),String(p.direccion || '').trim(),String(p.estado || 'Activo').trim(),String(p.caracteristicas || '').trim(),String(p.localidad || '').trim(),JSON.stringify(coordenadas),ahora(),usuario,'','','SI']);
    return {ok:true,mensaje:'Zona de estacionamiento guardada correctamente.',codigo:codigo,serie:serie};
  } catch (error) { return {ok:false,mensaje:'No fue posible guardar la zona de estacionamiento: ' + error.message}; }
  finally { if (bloqueo.hasLock()) bloqueo.releaseLock(); }
}

function eliminarZonaEstacionamiento(e) {
  const id = String(((e && e.parameter) || {}).id || '').trim();
  if (!id) return {ok:false,mensaje:'Falta el identificador de la zona.'};
  try {
    const sh = hojaZonasEstacionamiento_();
    const fila = buscarFila(sh, id);
    if (fila === -1) return {ok:false,mensaje:'Zona de estacionamiento no encontrada.'};
    sh.deleteRow(fila);
    return {ok:true,mensaje:'Zona de estacionamiento eliminada.'};
  } catch (error) { return {ok:false,mensaje:'No fue posible eliminar la zona: ' + error.message}; }
}

function obtenerPrefijoZona_() { return 'ET'; }
