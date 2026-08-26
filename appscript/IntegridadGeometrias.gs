//==================================================
// SGT - INTEGRIDAD DE GEOMETRIAS
//==================================================

function obtenerClavesGeometriasActivas_() {
  const claves = { cordones: new Set(), zonas: new Set() };

  try {
    if (typeof obtenerCordonesRojos === 'function') {
      const r = obtenerCordonesRojos({parameter:{}});
      if (r && r.ok && Array.isArray(r.datos)) {
        r.datos.forEach(function(x) {
          const id = String(x.id || '').trim().toUpperCase();
          const codigo = String(x.codigo || '').trim().toUpperCase();
          if (id) claves.cordones.add('ID:' + id);
          if (codigo) claves.cordones.add('CODIGO:' + codigo);
        });
      }
    }
  } catch (e) {
    console.warn('No se pudieron comprobar cordones:', e);
  }

  try {
    if (typeof obtenerZonasEstacionamiento === 'function') {
      const r = obtenerZonasEstacionamiento({parameter:{}});
      if (r && r.ok && Array.isArray(r.datos)) {
        r.datos.forEach(function(x) {
          const id = String(x.id || '').trim().toUpperCase();
          const codigo = String(x.codigo || '').trim().toUpperCase();
          if (id) claves.zonas.add('ID:' + id);
          if (codigo) claves.zonas.add('CODIGO:' + codigo);
        });
      }
    }
  } catch (e) {
    console.warn('No se pudieron comprobar zonas:', e);
  }

  return claves;
}

function elementoEspecialSigueExistiendo_(elemento, claves) {
  const tipo = String(elemento.tipo || '')
    .trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  if (tipo !== 'CORDON ROJO' && tipo !== 'ESTACIONAMIENTO TARIFADO') return true;

  const id = String(elemento.id || '').trim().toUpperCase();
  const codigo = String(elemento.codigo || '').trim().toUpperCase();
  const conjunto = tipo === 'CORDON ROJO' ? claves.cordones : claves.zonas;

  return conjunto.has('ID:' + id) || conjunto.has('CODIGO:' + codigo);
}
