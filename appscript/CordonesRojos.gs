/********************************************************
 * SGT - CORDONES ROJOS
 * Hoja:
 * ID, Código, Tipo, Serie, Nombre, Descripción, Dirección,
 * Estado, Características, Localidad, Coordenadas, Fecha alta,
 * Usuario alta, Fecha modificación, Usuario modificación, Activo.
 *
 * La localidad NO depende de lo que envíe el navegador:
 * se determina en servidor a partir de las coordenadas y
 * de la hoja Localidades.
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

    const lista = datos
      .filter(function(f){ return String(f[0] || '').trim() !== ''; })
      .map(function(f) {
        return {
          id:f[0],
          codigo:f[1],
          tipo:f[2],
          serie:f[3],
          nombre:f[4],
          descripcion:f[5],
          direccion:f[6],
          estado:f[7],
          caracteristicas:f[8],
          localidad:f[9],
          coordenadas:f[10],
          fechaAlta:f[11],
          usuarioAlta:f[12],
          fechaModificacion:f[13],
          usuarioModificacion:f[14],
          activo:f[15]
        };
      });

    // Solo elementos vigentes.
    return {
      ok:true,
      datos:lista.filter(function(c) {
        return normalizarActivoCordon_(c.activo) === 'SI';
      })
    };

  } catch (error) {
    return {ok:false, mensaje:'No fue posible obtener los cordones rojos: ' + error.message};
  }
}

function guardarCordonRojo(e) {
  const p = (e && e.parameter) || {};
  const tipo = 'Cordón Rojo';
  const coordenadas = String(p.coordenadas || '').trim();

  if (!coordenadas) {
    return {ok:false, mensaje:'Seleccione puntos en el mapa para definir el cordón.'};
  }

  const puntos = leerPuntosCordon_(coordenadas);
  if (puntos.length < 2) {
    return {ok:false, mensaje:'El cordón rojo debe contener al menos 2 puntos válidos.'};
  }

  const bloqueo = LockService.getScriptLock();
  try {
    bloqueo.waitLock(30000);

    const sh = hojaCordonesRojos_();
    const serie = obtenerSiguienteSerieEnHoja_(sh, tipo);
    const prefijo = obtenerPrefijoCordon_();
    const codigo = prefijo + '-' + ('000000' + serie).slice(-6);
    const usuario = String(p.usuario || p.usuarioAlta || 'admin').trim() || 'admin';

    // Determinación territorial: se prueban extremos y punto medio.
    // La búsqueda se hace contra la hoja Localidades, usando centro + radio.
    const localidad = determinarLocalidadCordon_(puntos);

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
      JSON.stringify(puntos),
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
  } finally {
    if (bloqueo.hasLock()) bloqueo.releaseLock();
  }
}

//==================================================
// LOCALIDAD DESDE COORDENADAS
//==================================================

function determinarLocalidadCordon_(puntos) {
  if (!Array.isArray(puntos) || !puntos.length) return 'Sin localidad';

  const candidatos = [];

  // Extremos.
  candidatos.push(puntos[0]);
  if (puntos.length > 1) candidatos.push(puntos[puntos.length - 1]);

  // Punto medio aproximado del trazado.
  const medio = puntos[Math.floor(puntos.length / 2)];
  if (medio) candidatos.push(medio);

  const encontrados = [];

  candidatos.forEach(function(punto) {
    const resultado = obtenerLocalidadPorCoordenadas(punto[0], punto[1]);
    if (resultado && resultado.nombre && resultado.nombre !== 'Sin localidad') {
      encontrados.push(resultado);
    }
  });

  if (!encontrados.length) return 'Sin localidad';

  // Si dos puntos coinciden en una localidad, esa es la opción más fiable.
  const conteo = {};
  encontrados.forEach(function(item) {
    const clave = normalizarTextoCordon_(item.nombre);
    conteo[clave] = (conteo[clave] || 0) + 1;
  });

  let mejor = encontrados[0];
  let mayor = 0;

  encontrados.forEach(function(item) {
    const cantidad = conteo[normalizarTextoCordon_(item.nombre)] || 0;
    if (cantidad > mayor) {
      mayor = cantidad;
      mejor = item;
    }
  });

  return mejor.nombre;
}

function leerPuntosCordon_(valor) {
  let puntos = valor;
  if (typeof puntos === 'string') {
    try { puntos = JSON.parse(puntos); }
    catch (_) { return []; }
  }
  if (!Array.isArray(puntos)) return [];

  const resultado = [];
  puntos.forEach(function(p) {
    if (!Array.isArray(p) || p.length < 2) return;
    const lat = Number(String(p[0]).replace(',', '.'));
    const lng = Number(String(p[1]).replace(',', '.'));
    if (Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180) {
      resultado.push([lat, lng]);
    }
  });
  return resultado;
}

function normalizarTextoCordon_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizarActivoCordon_(valor) {
  const t = String(valor == null ? '' : valor).trim().toUpperCase();
  return ['SI','SÍ','YES','TRUE','VERDADERO','ACTIVO','1'].indexOf(t) !== -1 ? 'SI' : 'NO';
}

function eliminarCordonRojo(e) {
  const id = String(((e && e.parameter) || {}).id || '').trim();
  if (!id) return {ok:false,mensaje:'Falta el identificador del cordón.'};

  try {
    const sh = hojaCordonesRojos_();
    const fila = buscarFila(sh, id);
    if (fila === -1) return {ok:false,mensaje:'Cordón rojo no encontrado.'};

    // Eliminación física para que no vuelva a aparecer en informes/mapas.
    sh.deleteRow(fila);
    return {ok:true,mensaje:'Cordón rojo eliminado.'};
  } catch (error) {
    return {ok:false,mensaje:'No fue posible eliminar el cordón rojo: ' + error.message};
  }
}

function obtenerPrefijoCordon_() { return 'CR'; }
