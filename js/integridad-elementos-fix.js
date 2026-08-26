//==================================================
// SGT - INTEGRIDAD DE ELEMENTOS
// Verificación cliente antes de mostrar mapas/informes.
//==================================================
(function(){
    'use strict';

    function clave(valor){
        return String(valor || '').trim().toUpperCase();
    }

    function tipoNormalizado(valor){
        return String(valor || '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toUpperCase();
    }

    function esEspecial(e){
        const t = tipoNormalizado(e && e.tipo);
        return t === 'CORDON ROJO' || t === 'ESTACIONAMIENTO TARIFADO';
    }

    async function obtenerClavesActuales(){
        const resultado = { cordones:new Set(), zonas:new Set() };

        try {
            if(typeof window.apiObtenerCordonesRojos === 'function'){
                const r = await window.apiObtenerCordonesRojos();
                if(r && r.ok && Array.isArray(r.datos)){
                    r.datos.forEach(function(x){
                        const id = clave(x.id), codigo = clave(x.codigo);
                        if(id) resultado.cordones.add('ID:'+id);
                        if(codigo) resultado.cordones.add('CODIGO:'+codigo);
                    });
                }
            }
        } catch(e){
            console.warn('Integridad: no se pudieron comprobar cordones.', e);
        }

        try {
            if(typeof window.apiObtenerZonasEstacionamiento === 'function'){
                const r = await window.apiObtenerZonasEstacionamiento();
                if(r && r.ok && Array.isArray(r.datos)){
                    r.datos.forEach(function(x){
                        const id = clave(x.id), codigo = clave(x.codigo);
                        if(id) resultado.zonas.add('ID:'+id);
                        if(codigo) resultado.zonas.add('CODIGO:'+codigo);
                    });
                }
            }
        } catch(e){
            console.warn('Integridad: no se pudieron comprobar zonas.', e);
        }

        return resultado;
    }

    function existeGeometria(e, claves){
        if(!esEspecial(e)) return true;

        const id = clave(e.id);
        const codigo = clave(e.codigo);
        const t = tipoNormalizado(e.tipo);
        const conjunto = t === 'CORDON ROJO' ? claves.cordones : claves.zonas;

        return (id && conjunto.has('ID:'+id)) ||
               (codigo && conjunto.has('CODIGO:'+codigo));
    }

    async function filtrar(datos){
        if(!Array.isArray(datos) || !datos.length) return [];

        const claves = await obtenerClavesActuales();

        return datos.filter(function(e){
            // Los elementos normales no dependen de geometrías especiales.
            // Los CR/ET sí: si fueron eliminados de su hoja, desaparecen.
            return existeGeometria(e, claves);
        });
    }

    // Esperar a que api.js haya creado sus funciones.
    function instalar(){
        if(typeof window.apiObtenerElementos !== 'function'){
            setTimeout(instalar, 50);
            return;
        }

        if(window.__sgtIntegridadInstalada) return;
        window.__sgtIntegridadInstalada = true;

        const originalElementos = window.apiObtenerElementos;
        window.apiObtenerElementos = async function(){
            const respuesta = await originalElementos.apply(this, arguments);
            if(!respuesta || !respuesta.ok) return respuesta;

            const datosOriginales = Array.isArray(respuesta.datos) ? respuesta.datos : [];
            const datosActuales = await filtrar(datosOriginales);

            return Object.assign({}, respuesta, {
                datos: datosActuales,
                totalActuales: datosActuales.length
            });
        };

        // También protegemos el catálogo usado por Informes.
        if(typeof window.apiObtenerCatalogoElementosInformables === 'function'){
            const originalCatalogo = window.apiObtenerCatalogoElementosInformables;
            window.apiObtenerCatalogoElementosInformables = async function(){
                const respuesta = await originalCatalogo.apply(this, arguments);
                if(!respuesta || !respuesta.ok) return respuesta;

                const datosOriginales = Array.isArray(respuesta.datos) ? respuesta.datos : [];
                const datosActuales = await filtrar(datosOriginales);

                return Object.assign({}, respuesta, {
                    datos: datosActuales,
                    totalActuales: datosActuales.length
                });
            };
        }

        console.log('SGT: verificación de integridad de elementos instalada.');
    }

    instalar();
})();
