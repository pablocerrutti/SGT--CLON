// =====================================================
// SGT - Cliente de la API de Google Apps Script
// =====================================================

const API_URL =
'https://script.google.com/macros/s/AKfycbzYU8xREGRuJ3-8ZrK-dbYUZNzVBhPiIceVWU3OftmxvO6fNCBFcFwrnurmWofjkFxR/exec';


//======================================================
// API GENERAL
//======================================================

async function api(accion, datos = {}) {

    const params =
        new URLSearchParams({ accion });


    Object.keys(datos).forEach(function(clave) {

        const valor = datos[clave];

        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ''
        ) {

            params.set(
                clave,
                String(valor)
            );

        }

    });


    try {

        const respuesta =
            await fetch(
                API_URL + '?' + params.toString(),
                {
                    method: 'GET',
                    cache: 'no-store',
                    redirect: 'follow'
                }
            );


        if (!respuesta.ok) {

            return {

                ok: false,

                mensaje:
                    'La API respondió con error '
                    + respuesta.status
                    + '.'

            };

        }


        const texto =
            await respuesta.text();


        try {

            return JSON.parse(texto);

        } catch (_) {

            return {

                ok: false,

                mensaje:
                    'La API devolvió una respuesta no válida. Verifique la implementación de Apps Script.'

            };

        }


    } catch (error) {

        return {

            ok: false,

            mensaje:
                'No se pudo conectar con la API: '
                + error.message

        };

    }

}



//======================================================
// LOGIN
//======================================================

async function apiLogin(
    usuario,
    password
) {

    return api(
        'login',
        {
            usuario,
            password
        }
    );

}



//======================================================
// USUARIOS
//======================================================

async function apiObtenerUsuarios() {

    return api(
        'obtenerUsuarios'
    );

}


async function apiGuardarUsuario(
    usuario
) {

    return api(
        'guardarUsuario',
        usuario
    );

}


async function apiEliminarUsuario(
    id
) {

    return api(
        'eliminarUsuario',
        {
            id
        }
    );

}



//======================================================
// ELEMENTOS
//======================================================

async function apiObtenerElementos() {

    return api(
        'obtenerElementos'
    );

}


async function apiGuardarElemento(
    elemento
) {

    return api(
        'guardarElemento',
        elemento
    );

}


async function apiActualizarElemento(
    elemento
) {

    return api(
        'actualizarElemento',
        elemento
    );

}


async function apiEliminarElemento(
    id
) {

    return api(
        'eliminarElemento',
        {
            id
        }
    );

}



//======================================================
// CATEGORIAS
//======================================================

async function apiObtenerCategorias() {

    return api(
        'obtenerCategorias'
    );

}



//======================================================
// LOCALIDADES
//======================================================

async function apiObtenerLocalidades() {

    return api(
        'obtenerLocalidades'
    );

}



//======================================================
// INSPECCIONES
//======================================================

async function apiObtenerInspecciones(
    idElemento
) {

    return api(
        'obtenerInspecciones',
        {
            id: idElemento
        }
    );

}


async function apiGuardarInspeccion(
    datos
) {

    return api(
        'guardarInspeccion',
        datos
    );

}



//======================================================
// ARCHIVOS
//======================================================

async function apiSubirFoto(
    datos
) {

    return api(
        'subirFoto',
        datos
    );

}


async function apiSubirArchivo(
    archivo
) {

    const params =
        new URLSearchParams({
            accion: 'subirArchivo'
        });


    Object.keys(archivo).forEach(
        function(k) {

            if (
                archivo[k] !== undefined &&
                archivo[k] !== null
            ) {

                params.set(
                    k,
                    archivo[k]
                );

            }

        }
    );


    try {

        const r =
            await fetch(
                API_URL,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body:
                        params.toString()
                }
            );


        return JSON.parse(
            await r.text()
        );


    } catch (error) {

        return {

            ok: false,

            mensaje:
                'No fue posible cargar el archivo: '
                + error.message

        };

    }

}



//======================================================
// ZONAS DE ESTACIONAMIENTO
//======================================================

async function apiObtenerZonasEstacionamiento() {

    return api(
        'obtenerZonasEstacionamiento'
    );

}


async function apiGuardarZonaEstacionamiento(
    zona
) {

    return api(
        'guardarZonaEstacionamiento',
        zona
    );

}


async function apiEliminarZonaEstacionamiento(
    id
) {

    return api(
        'eliminarZonaEstacionamiento',
        {
            id
        }
    );

}
//======================================================
// CORDONES ROJOS
//======================================================

async function apiObtenerCordonesRojos() {

    return api(
        'obtenerCordonesRojos'
    );

}


async function apiGuardarCordonRojo(
    cordon
) {

    return api(
        'guardarCordonRojo',
        cordon
    );

}


async function apiEliminarCordonRojo(
    id
) {

    return api(
        'eliminarCordonRojo',
        {
            id
        }
    );

}


//======================================================
// CATÁLOGO PARA INFORMES
//======================================================

async function apiObtenerCatalogoElementosInformables() {

    return api(
        'obtenerCatalogoElementosInformables'
    );

}
