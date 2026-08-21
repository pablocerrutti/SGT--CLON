//==================================================
// SGT - INSPECCIONES
//==================================================

let usuario;


try {

    usuario =
        JSON.parse(
            localStorage.getItem("usuarioActual")
        );

} catch (_) {}



if(!usuario){

    location.href="../../index.html";

}



document
    .getElementById("usuarioNombre")
    .textContent =
        usuario.nombre ||
        usuario.usuario ||
        "";



document.addEventListener(
    "DOMContentLoaded",
    iniciar
);



//==================================================
// INICIO
//==================================================

async function iniciar(){


    document
        .getElementById("btnVolver")
        .onclick=function(){

            location.href =
                "../movilidad/mapa.html";

        };



    document
        .getElementById("formInspeccion")
        .addEventListener(
            "submit",
            guardar
        );



    // Cargar solamente el elemento enviado desde el mapa

    await cargarElementoSeleccionado();



    await cargarInspecciones();


}

//==================================================
// OBTENER PARAMETRO URL
//==================================================

function obtenerParametro(nombre){

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    return parametros.get(nombre);

}


//==================================================
// CARGAR ELEMENTOS
//==================================================

async function cargarElementoSeleccionado(){

    const id =
        obtenerParametro("elemento");


    const texto =
        document.getElementById("elementoTexto");


    const campoId =
        document.getElementById("elemento");


    if(!id){

        texto.value =
            "No se seleccionó ningún elemento";

        return;

    }


    const respuesta =
        await apiObtenerElementos();


    if(!respuesta.ok){

        texto.value =
            "Error cargando elemento";

        return;

    }


    const elemento =
        respuesta.datos.find(
            e => e.id == id
        );


    if(!elemento){

        // Intentar buscar en zonas de estacionamiento
        const respZona =
            await apiObtenerZonasEstacionamiento();


        if(
            respZona &&
            respZona.ok &&
            respZona.datos
        ){

            const zona =
                respZona.datos.find(
                    e => e.id == id
                );


            if(zona){

                campoId.value =
                    zona.id;


                texto.value =
                    `${zona.codigo || "ET"} - ${zona.nombre || "Zona estacionamiento"}`;


                return;

            }

        }


        // Intentar buscar en cordones rojos
        const respCordon =
            await apiObtenerCordonesRojos();


        if(
            respCordon &&
            respCordon.ok &&
            respCordon.datos
        ){

            const cordon =
                respCordon.datos.find(
                    e => e.id == id
                );


            if(cordon){

                campoId.value =
                    cordon.id;


                texto.value =
                    `${cordon.codigo || "CR"} - ${cordon.nombre || "Cordón rojo"}`;


                return;

            }

        }


        texto.value =
            "Elemento no encontrado";

        return;

    }


    campoId.value =
        elemento.id;


    texto.value =
        `${elemento.codigo} - ${elemento.nombre || elemento.tipo}`;


}


//==================================================
// ARCHIVO BASE64
//==================================================

async function archivoBase64(file,maximo){


    if(!file)
        return "";



    if(file.size > maximo){

        throw new Error(
            file.name +
            " supera el tamaño permitido."
        );

    }



    const base64 =
        await new Promise(
            (ok,error)=>{


                const reader =
                    new FileReader();



                reader.onload=function(){

                    ok(
                        reader.result
                        .split(",")[1]
                    );

                };


                reader.onerror=error;


                reader.readAsDataURL(file);


            }
        );



    const subida =
        await apiSubirArchivo({

            archivoBase64:base64,

            nombreArchivo:file.name,

            mimeType:file.type

        });



    if(!subida.ok){

        throw new Error(
            subida.mensaje
        );

    }



    return subida.url;


}



//==================================================
// GUARDAR INSPECCION
//==================================================

async function guardar(ev){


    ev.preventDefault();



    const boton =
        ev.submitter;



    boton.disabled=true;



    try{


        const elemento =
            document.getElementById(
                "elemento"
            );



        const video =
            await archivoBase64(

                document
                .getElementById("video")
                .files[0],

                30 * 1024 * 1024

            );



        const documento =
            await archivoBase64(

                document
                .getElementById("documento")
                .files[0],

                10 * 1024 * 1024

            );




        const respuesta =
            await apiGuardarInspeccion({

                elementoId:
                    elemento.value,


                codigoElemento:
    document.getElementById("elementoTexto").value,


                inspector:
                    usuario.nombre ||
                    usuario.usuario,


                incidencia:
                    document
                    .getElementById("incidencia")
                    .value
                    .trim(),


                videoUrl:video,


                documentoUrl:documento

            });



        if(!respuesta.ok){

            throw new Error(
                respuesta.mensaje
            );

        }



        mensaje(
            respuesta.mensaje,
            "exito"
        );



        ev.target.reset();



        await cargarElementoSeleccionado();


        await cargarInspecciones();



    }
    catch(err){


        mensaje(
            err.message,
            "error"
        );


    }



    boton.disabled=false;


}



//==================================================
// HISTORIAL
//==================================================

async function cargarInspecciones(){


    const respuesta =
        await apiObtenerInspecciones();



    const lista =
        document.getElementById(
            "lista"
        );



    lista.innerHTML="";



    if(!respuesta.ok)
        return;




    (respuesta.datos || [])
    .forEach(i=>{


        const art =
            document.createElement(
                "article"
            );



        art.className =
            "inspeccion";



        art.innerHTML=`

        <strong>
            ${esc(i.codigoElemento)}
        </strong>


        <p>
            ${esc(i.incidencia)}
        </p>


        <small>
            ${esc(i.inspector)}
            -
            ${esc(i.fecha)}
        </small>


        ${
            i.videoUrl
            ?
            `<br>
            <a target="_blank" href="${i.videoUrl}">
            🎥 Ver video
            </a>`
            :""
        }


        ${
            i.documentoUrl
            ?
            `<br>
            <a target="_blank" href="${i.documentoUrl}">
            📄 Ver documento
            </a>`
            :""
        }

        `;



        lista.appendChild(art);


    });


}



//==================================================
// MENSAJES
//==================================================

function mensaje(texto,clase){


    const m =
        document.getElementById(
            "mensaje"
        );


    m.textContent =
        texto;


    m.className =
        clase;


}



//==================================================
// ESCAPAR HTML
//==================================================

function esc(valor){


    return String(valor || "")

    .replace(/&/g,"&amp;")

    .replace(/</g,"&lt;")

    .replace(/>/g,"&gt;")

    .replace(/"/g,"&quot;");


}