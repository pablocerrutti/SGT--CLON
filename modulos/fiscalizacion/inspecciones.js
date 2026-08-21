```javascript
/********************************************************
 SGT
 MODULO FISCALIZACION
 ACTUACIONES DE TRANSITO
********************************************************/


let usuario = null;

let rol = "";


//======================================================
// OBTENER USUARIO
//======================================================

try {

    usuario =
        JSON.parse(
            localStorage.getItem(
                "usuarioActual"
            )
        );

} catch(e) {

    usuario = null;

}


//======================================================
// NORMALIZAR ROL
//======================================================

rol =
    String(
        (usuario || {}).rol || ""
    )
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .toLowerCase()
    .trim();


//======================================================
// VALIDAR SESION Y PERMISOS
//======================================================

if(!usuario){

    location.href =
        "../../index.html";


}else if(
    ![
        "super admin",
        "supervisor",
        "fiscalizacion",
        "movilidad"
    ].includes(rol)
){

    location.href =
        "../../pages/dashboard.html";


}else{

    const usuarioNombre =
        document.getElementById(
            "usuarioNombre"
        );


    if(usuarioNombre){

        usuarioNombre.textContent =
            usuario.nombre ||
            usuario.usuario ||
            "";

    }


    iniciar();

}


//======================================================
// INICIO
//======================================================

function iniciar(){

    //==================================================
    // VOLVER AL DASHBOARD
    //==================================================

    const btnVolver =
        document.getElementById(
            "btnVolver"
        );


    if(btnVolver){

        btnVolver.onclick =
            function(){

                location.href =
                    "../../pages/dashboard.html";

            };

    }


    //==================================================
    // DATOS INSPECTOR
    //==================================================

    cargarInspector();


    //==================================================
    // FORMULARIO
    //==================================================

    const formulario =
        document.getElementById(
            "formInspeccion"
        );


    if(formulario){

        formulario.onsubmit =
            guardar;

    }


    //==================================================
    // LISTADO
    //==================================================

    cargar();

}


//======================================================
// DATOS DEL INSPECTOR
//======================================================

function cargarInspector(){

    const beta =
        document.getElementById(
            "beta"
        );


    const inspector =
        document.getElementById(
            "inspector"
        );


    if(inspector){

        inspector.value =
            usuario.nombre ||
            usuario.usuario ||
            "";

    }


    if(beta){

        beta.value =
            usuario.beta ||
            "";

    }


    /*
      Los usuarios de Fiscalización
      necesitan Número Beta obligatorio.

      Los usuarios de Movilidad pueden
      utilizar el módulo sin Beta.
    */

    if(
        rol === "fiscalizacion" &&
        !usuario.beta
    ){

        mensaje(
            "El inspector no tiene Número Beta asignado. Contacte al administrador.",
            "error"
        );

    }

}


//======================================================
// SUBIR ARCHIVOS
//======================================================

async function archivoBase64(
    file,
    max
){

    if(!file){

        return "";

    }


    if(file.size > max){

        throw new Error(
            file.name +
            " supera el tamaño permitido."
        );

    }


    const data =
        await new Promise(
            function(ok,no){

                const r =
                    new FileReader();


                r.onload =
                    function(){

                        ok(
                            String(
                                r.result
                            )
                            .split(",")[1]
                        );

                    };


                r.onerror =
                    no;


                r.readAsDataURL(
                    file
                );

            }
        );


    const respuesta =
        await apiSubirArchivo({

            archivoBase64:
                data,

            nombreArchivo:
                file.name,

            mimeType:
                file.type

        });


    if(
        !respuesta ||
        !respuesta.ok
    ){

        throw new Error(
            respuesta?.mensaje ||
            "No fue posible subir el archivo."
        );

    }


    return respuesta.url;

}


//======================================================
// GUARDAR ACTUACION
//======================================================

async function guardar(ev){

    ev.preventDefault();


    const boton =
        ev.submitter;


    if(boton){

        boton.disabled =
            true;

    }


    try{

        //================================================
        // BETA OBLIGATORIA SOLO PARA FISCALIZACION
        //================================================

        if(
            rol === "fiscalizacion" &&
            !usuario.beta
        ){

            throw new Error(
                "No tiene Número Beta asignado."
            );

        }


        //================================================
        // TIPO
        //================================================

        const tipo =
            document.getElementById(
                "tipoActuacion"
            ).value;


        //================================================
        // FOTOGRAFIA OBLIGATORIA
        //================================================

        const requiereFoto =
            tipo === "Multa" ||
            tipo === "Apercibimiento";


        //================================================
        // VIDEO
        //================================================

        const video =
            await archivoBase64(
                document.getElementById(
                    "video"
                ).files[0],
                30 * 1024 * 1024
            );


        //================================================
        // DOCUMENTO / FOTO
        //================================================

        const documento =
            await archivoBase64(
                document.getElementById(
                    "documento"
                ).files[0],
                10 * 1024 * 1024
            );


        if(
            requiereFoto &&
            !documento
        ){

            throw new Error(
                "Debe adjuntar fotografía de la actuación."
            );

        }


        //================================================
        // DATOS
        //================================================

        const datos = {

            beta:
                usuario.beta ||
                "",


            inspector:
                usuario.nombre ||
                usuario.usuario ||
                "",


            matricula:
                document.getElementById(
                    "matricula"
                )
                .value
                .trim()
                .toUpperCase(),


            tipoActuacion:
                tipo,


            numeroBoleta:
                document.getElementById(
                    "numeroBoleta"
                )
                .value
                .trim(),


            nombreInfractor:
                document.getElementById(
                    "nombreInfractor"
                )
                .value
                .trim(),


            cedula:
                document.getElementById(
                    "cedula"
                )
                .value
                .trim(),


            detalle:
                document.getElementById(
                    "detalle"
                )
                .value
                .trim(),


            videoUrl:
                video,


            documentoUrl:
                documento

        };


        console.log(
            "Guardando actuación:",
            datos
        );


        //================================================
        // GUARDAR EN SERVIDOR
        //================================================

        const r =
            await apiGuardarInspeccion(
                datos
            );


        if(
            !r ||
            !r.ok
        ){

            throw new Error(
                r?.mensaje ||
                "No fue posible guardar la actuación."
            );

        }


        //================================================
        // ÉXITO
        //================================================

        mensaje(
            r.mensaje ||
            "Actuación guardada correctamente.",
            "exito"
        );


        //================================================
        // LIMPIAR FORMULARIO
        //================================================

        ev.target.reset();


        //================================================
        // VOLVER A CARGAR DATOS DEL USUARIO
        //================================================

        cargarInspector();


        //================================================
        // ACTUALIZAR LISTADO
        //================================================

        await cargar();


    }
    catch(error){

        console.error(
            "Error guardando actuación:",
            error
        );


        mensaje(
            error.message ||
            "No fue posible guardar la actuación.",
            "error"
        );

    }
    finally{

        if(boton){

            boton.disabled =
                false;

        }

    }

}


//======================================================
// LISTADO
//======================================================

async function cargar(){

    try{

        const r =
            await apiObtenerInspecciones();


        const lista =
            document.getElementById(
                "lista"
            );


        if(!lista){

            return;

        }


        lista.replaceChildren();


        if(
            !r ||
            !r.ok
        ){

            mensaje(
                r?.mensaje ||
                "No fue posible cargar las actuaciones.",
                "error"
            );

            return;

        }


        (
            r.datos ||
            []
        )
        .forEach(
            function(i){

                const x =
                    document.createElement(
                        "article"
                    );


                x.className =
                    "inspeccion";


                x.innerHTML = `

                    <strong>
                        ${esc(i.matricula || "")}
                        -
                        ${esc(i.tipoActuacion || "")}
                    </strong>


                    <p>
                        ${esc(i.detalle || "")}
                    </p>


                    <small>

                        ${esc(i.inspector || "")}

                        ${
                            i.beta
                            ?
                            " - Beta " +
                            esc(i.beta)
                            :
                            ""
                        }

                        -

                        ${esc(i.fecha || "")}

                    </small>


                    ${
                        i.videoUrl
                        ?
                        `
                        <br>

                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="${esc(i.videoUrl)}"
                        >
                            Video BodyCam
                        </a>
                        `
                        :
                        ""
                    }


                    ${
                        i.documentoUrl
                        ?
                        `
                        <br>

                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="${esc(i.documentoUrl)}"
                        >
                            Foto actuación
                        </a>
                        `
                        :
                        ""
                    }

                `;


                lista.appendChild(
                    x
                );

            }
        );

    }
    catch(error){

        console.error(
            "Error cargando actuaciones:",
            error
        );

        mensaje(
            "Error cargando las actuaciones.",
            "error"
        );

    }

}


//======================================================
// MENSAJES
//======================================================

function mensaje(
    t,
    c = ""
){

    const e =
        document.getElementById(
            "mensaje"
        );


    if(!e){

        return;

    }


    e.textContent =
        t;


    e.className =
        c;

}


//======================================================
// SEGURIDAD HTML
//======================================================

function esc(v){

    return String(
        v || ""
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}
```