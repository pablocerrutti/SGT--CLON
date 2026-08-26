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

    // La localidad se determina por la posición geográfica del cordón.
    // Se intenta con ambos extremos y se prioriza una localidad coincidente.
    const localidadPorCoordenadas = determinarLocalidadPorCoordenadas_(coordenadas);
    const localidad = localidadPorCoordenadas || String(p.localidad || '').trim();

    sh.appendRow([
      generarID('CR'),
      codigo,
      tipo,
      serie,
      String(p.nombre || '').trim(),
      String(p.descripcion || '').trim(),
      String(p.direccion || '').trim(),
      String(p.estado || 'Activo').trim(),
      String(p.caracteristicas || '').trim(),
      localidad,
      coordenadas,
      ahora(),
      usuario,
      '',
      '',
      'SI'
    ]);

    return {
      ok:true,
      mensaje:'Cordón rojo guardado correctamente.',
      codigo:codigo,
      serie:serie,
      localidad:localidad
    };
  } catch (error) {
    return {ok:false,mensaje:'No fue posible guardar el cordón rojo: ' + error.message};
  }
  finally {
    if (bloqueo.hasLock()) bloqueo.releaseLock();
  }
}

//==================================================
// DETERMINAR LOCALIDAD DESDE COORDENADAS
//==================================================

function determinarLocalidadPorCoordenadas_(coordenadas) {
  const puntos = leerPuntosCordon_(coordenadas);
  if (!puntos.length) return '';

  const localidades = [];

  puntos.forEach(function(punto) {
    const localidad = geocodificarLocalidad_(punto[0], punto[1]);
    if (localidad) localidades.push(localidad);
  });

  if (!localidades.length) return '';

  // Si ambos extremos pertenecen a la misma localidad, es la opción inequívoca.
  const primera = normalizarTextoCordon_(localidades[0]);
  for (let i = 1; i < localidades.length; i++) {
    if (normalizarTextoCordon_(localidades[i]) === primera) {
      return localidades[i];
    }
  }

  // Si el cordón está justo en el límite, se toma la localidad del primer punto.
  return localidades[0];
}

function leerPuntosCordon_(valor) {
  let puntos = valor;
  if (typeof puntos === 'string') {
    try { puntos = JSON.parse(puntos); } catch (_) { return []; }
  }
  if (!Array.isArray(puntos)) return [];

  return puntos.filter(function(p) {
    if (!Array.isArray(p) || p.length < 2) return false;
    const lat = Number(String(p[0]).replace(',', '.'));
    const lng = Number(String(p[1]).replace(',', '.'));
    return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  }).slice(0, 2);
}

function geocodificarLocalidad_(lat, lng) {
  try {
    const respuesta = Maps.newGeocoder().setLanguage('es').reverseGeocode(lat, lng);
    const resultados = respuesta && respuesta.results ? respuesta.results : [];

    for (let i = 0; i < resultados.length; i++) {
      const componentes = resultados[i].address_components || [];
      let localidad = '';
      let pueblo = '';

      componentes.forEach(function(componente) {
        const tipos = componente.types || [];
        if (tipos.indexOf('locality') !== -1) localidad = componente.long_name;
        if (!pueblo && tipos.indexOf('postal_town') !== -1) pueblo = componente.long_name;
        if (!pueblo && tipos.indexOf('sublocality') !== -1) pueblo = componente.long_name;
      });

      if (localidad) return localidad.trim();
      if (pueblo) return pueblo.trim();
    }
  } catch (error) {
    console.warn('No se pudo determinar localidad por coordenadas:', error);
  }
  return '';
}

function normalizarTextoCordon_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
    .toLowerCase();
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
