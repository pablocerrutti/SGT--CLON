//==================================================
// SGT - MOVILIDAD URBANA
// mapa.js
//==================================================

let mapa = null;
let capaMarcadores = null;
let marcadorNuevo = null;

let categorias = [];
let elementos = [];
let localidades = [];


//==================================================
// TIPOS GEOMETRICOS ESPECIALES
//==================================================

const TIPO_ZONA_ESTACIONAMIENTO = "Estacionamiento Tarifado";
const TIPO_CORDON_ROJO = "Cordón Rojo";


//==================================================
// ZONAS DE ESTACIONAMIENTO
//==================================================

let capaZonasEstacionamiento = null;
let zonasEstacionamiento = [];

let dibujandoZona = false;
let puntosZona = [];
let lineaZona = null;
let poligonoZonaTemporal = null;


//==================================================
// CORDONES ROJOS
//==================================================

let capaCordonesRojos = null;
let cordonesRojos = [];

let dibujandoCordon = false;
let puntosCordon = [];
let lineaCordonTemporal = null;


//==================================================
// INICIO
//==================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarPagina
);


async function iniciarPagina() {

    console.clear();

    console.log("====================================");
    console.log("SGT - INICIANDO MAPA");
    console.log("====================================");

    if (!comprobarSesion()) {
        return;
    }

    iniciarMapa();

    if (!mapa) {

        console.error(
            "No se pudo iniciar el mapa."
        );

        return;
    }

    enlazarEventos();

    await cargarCategorias();
    await cargarLocalidades();
    await cargarElementos();
    await cargarZonasEstacionamiento();
    await cargarCordonesRojos();

    console.log("====================================");
    console.log("SGT - MAPA INICIADO CORRECTAMENTE");
    console.log("====================================");

}


//==================================================
// SESION
//==================================================

function comprobarSesion() {

    let usuario = null;

    try {

        usuario = JSON.parse(
            localStorage.getItem(
                "usuarioActual"
            ) || "null"
        );

    } catch (error) {

        console.error(
            "Error leyendo sesión:",
            error
        );

        usuario = null;

    }

    if (!usuario) {

        location.href =
            "../../index.html";

        return false;

    }

    const elemento =
        document.getElementById(
            "usuarioActual"
        );

    if (elemento) {

        elemento.textContent =
            usuario.nombre ||
            usuario.usuario ||
            "";

    }

    return true;

}


//==================================================
// INICIAR MAPA
//==================================================

function iniciarMapa() {

    console.log(
        "Creando Leaflet..."
    );

    const elementoMapa =
        document.getElementById("map");

    if (!elementoMapa) {

        console.error(
            "No existe el elemento #map"
        );

        return;

    }

    if (typeof L === "undefined") {

        console.error(
            "Leaflet no está cargado. Verifique el script de Leaflet en HTML."
        );

        return;

    }

    mapa =
        L.map("map").setView(
            [-34.10385, -56.2155],
            15
        );


    //==============================================
    // MAPA NORMAL
    //==============================================

    const mapaCalles =
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "© OpenStreetMap",

                maxZoom: 20
            }
        );


    //==============================================
    // SATELITE
    //==============================================

    const satelite =
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Tiles © Esri",

                maxZoom: 20
            }
        );


    //==============================================
    // ETIQUETAS
    //==============================================

    const etiquetas =
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
            {
                attribution:
                    "Labels © Esri",

                maxZoom: 20,

                pane:
                    "overlayPane"
            }
        );


    //==============================================
    // HIBRIDO
    //==============================================

    const hibrido =
        L.layerGroup([
            satelite,
            etiquetas
        ]);


    mapaCalles.addTo(mapa);


    //==============================================
    // CONTROL DE CAPAS
    //==============================================

    const mapasBase = {

        "🗺️ Mapa":
            mapaCalles,

        "🛰️ Satélite":
            satelite,

        "🛰️ Híbrido":
            hibrido

    };


    L.control.layers(
        mapasBase,
        null,
        {
            collapsed: true,
            position: "topright"
        }
    ).addTo(mapa);


    //==============================================
    // CAPA MARCADORES
    //==============================================

    capaMarcadores =
        L.layerGroup().addTo(mapa);


    //==============================================
    // CAPA ZONAS
    //==============================================

    capaZonasEstacionamiento =
        L.layerGroup().addTo(mapa);


    //==============================================
    // CAPA CORDONES
    //==============================================

    capaCordonesRojos =
        L.layerGroup().addTo(mapa);


    //==============================================
    // CLICK MAPA
    //==============================================

    mapa.on(
        "click",
        seleccionarUbicacion
    );


    //==============================================
    // CLICK DERECHO
    //==============================================

    mapa.on(
        "contextmenu",
        finalizarDibujoGeometrico
    );


    //==============================================
    // CORREGIR TAMAÑO
    //==============================================

    setTimeout(
        function () {

            if (mapa) {

                mapa.invalidateSize();

            }

        },
        500
    );


    console.log(
        "Leaflet creado correctamente."
    );

}


//==================================================
// CATEGORIAS
//==================================================

async function cargarCategorias() {

    try {

        const respuesta =
            await apiObtenerCategorias();

        console.log(
            "Respuesta categorías:",
            respuesta
        );

        if (
            !respuesta ||
            !respuesta.ok
        ) {

            mostrarMensaje(
                "No se pudieron cargar las categorías.",
                "error"
            );

            return;

        }

        categorias =
            Array.isArray(
                respuesta.datos
            )
                ? respuesta.datos.filter(
                    function (c) {

                        return String(
                            c.activo || ""
                        ).toUpperCase() === "SI";

                    }
                )
                : [];


        //==========================================
        // ESTACIONAMIENTO TARIFADO
        //==========================================

        if (
            !categorias.some(
                function (c) {

                    return normalizar(
                        c.nombre
                    ) === normalizar(
                        TIPO_ZONA_ESTACIONAMIENTO
                    );

                }
            )
        ) {

            categorias.push({

                codigo:
                    "GE001",

                nombre:
                    TIPO_ZONA_ESTACIONAMIENTO,

                icono:
                    "parking",

                color:
                    "naranja",

                activo:
                    "SI",

                geometria:
                    "linea"

            });

        }


        //==========================================
        // CORDON ROJO
        //==========================================

        if (
            !categorias.some(
                function (c) {

                    return normalizar(
                        c.nombre
                    ) === normalizar(
                        TIPO_CORDON_ROJO
                    );

                }
            )
        ) {

            categorias.push({

                codigo:
                    "GE002",

                nombre:
                    TIPO_CORDON_ROJO,

                icono:
                    "road",

                color:
                    "rojo",

                activo:
                    "SI",

                geometria:
                    "linea"

            });

        }


        console.log(
            "Categorías finales:",
            categorias
        );


        const tipo =
            document.getElementById(
                "tipo"
            );

        const filtro =
            document.getElementById(
                "filtroTipo"
            );


        if (tipo) {

            tipo.innerHTML = "";

        }

        if (filtro) {

            filtro.innerHTML = "";

            filtro.add(
                new Option(
                    "Todos los elementos",
                    ""
                )
            );

        }


        categorias.forEach(
            function (categoria) {

                if (tipo) {

                    tipo.add(
                        new Option(
                            categoria.nombre,
                            categoria.nombre
                        )
                    );

                }

                if (filtro) {

                    filtro.add(
                        new Option(
                            categoria.nombre,
                            categoria.nombre
                        )
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

        mostrarMensaje(
            "Error al cargar las categorías.",
            "error"
        );

    }

}


//==================================================
// LOCALIDADES
//==================================================

async function cargarLocalidades() {

    const filtroLocalidad =
        document.getElementById(
            "filtroLocalidad"
        );

    if (!filtroLocalidad) {
        return;
    }

    filtroLocalidad.innerHTML = "";

    filtroLocalidad.add(
        new Option(
            "Todas las localidades",
            ""
        )
    );

    try {

        const respuesta =
            await apiObtenerLocalidades();

        console.log(
            "Respuesta localidades:",
            respuesta
        );

        if (
            !respuesta ||
            !respuesta.ok
        ) {

            console.warn(
                "No se pudieron cargar las localidades."
            );

            return;

        }

        localidades =
            Array.isArray(
                respuesta.datos
            )
                ? respuesta.datos
                : [];

        const nombres = [];


        localidades.forEach(
            function (localidad) {

                let nombre = "";

                if (
                    typeof localidad === "string"
                ) {

                    nombre =
                        localidad.trim();

                } else if (localidad) {

                    nombre =
                        localidad.nombre ||
                        localidad.localidad ||
                        localidad.nombreLocalidad ||
                        localidad.descripcion ||
                        "";

                }

                nombre =
                    String(nombre).trim();

                if (
                    nombre &&
                    !nombres.some(
                        function (n) {

                            return normalizar(n) ===
                                normalizar(nombre);

                        }
                    )
                ) {

                    nombres.push(nombre);

                }

            }
        );


        nombres.sort(
            function (a, b) {

                return a.localeCompare(
                    b,
                    "es",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        nombres.forEach(
            function (nombre) {

                filtroLocalidad.add(
                    new Option(
                        nombre,
                        nombre
                    )
                );

            }
        );


        console.log(
            "Localidades cargadas:",
            nombres
        );

    } catch (error) {

        console.error(
            "Error cargando localidades:",
            error
        );

    }

}


//==================================================
// OBTENER CATEGORIA
//==================================================

function obtenerCategoria(nombre) {

    return categorias.find(
        function (categoria) {

            return normalizar(
                categoria.nombre
            ) === normalizar(
                nombre
            );

        }
    ) || null;

}


//==================================================
// EVENTOS
//==================================================

function enlazarEventos() {

    //==============================================
    // FORMULARIO
    //==============================================

    const form =
        document.getElementById(
            "formElemento"
        );

    if (form) {

        form.addEventListener(
            "submit",
            guardarElemento
        );

    }


    //==============================================
    // TIPO
    //==============================================

    const selectorTipo =
        document.getElementById(
            "tipo"
        );

    if (selectorTipo) {

        selectorTipo.addEventListener(
            "change",
            manejarCambioTipo
        );

    }


    //==============================================
    // ACTUALIZAR
    //==============================================

    const actualizar =
        document.getElementById(
            "btnActualizar"
        );

    if (actualizar) {

        actualizar.addEventListener(
            "click",
            actualizarMapa
        );

    }


    //==============================================
    // BUSCAR
    //==============================================

    const buscar =
        document.getElementById(
            "buscar"
        );

    if (buscar) {

        buscar.addEventListener(
            "input",
            renderizarMapaCompleto
        );

    }


    //==============================================
    // FILTRO TIPO
    //==============================================

    const filtro =
        document.getElementById(
            "filtroTipo"
        );

    if (filtro) {

        filtro.addEventListener(
            "change",
            renderizarMapaCompleto
        );

    }


    //==============================================
    // FILTRO LOCALIDAD
    //==============================================

    const filtroLocalidad =
        document.getElementById(
            "filtroLocalidad"
        );

    if (filtroLocalidad) {

        filtroLocalidad.addEventListener(
            "change",
            function () {

                renderizarMapaCompleto();

                centrarLocalidadSeleccionada();

            }
        );

    }


    //==============================================
    // DASHBOARD
    //==============================================

    const dashboard =
        document.getElementById(
            "btnDashboard"
        );

    if (dashboard) {

        dashboard.onclick =
            function () {

                location.href =
                    "../../pages/dashboard.html";

            };

    }


    //==============================================
    // INFORMES
    //==============================================

    const informes =
        document.getElementById(
            "btnInformes"
        );

    if (informes) {

        informes.onclick =
            function () {

                location.href =
                    "../informes/informes.html";

            };

    }


    //==============================================
    // SALIR
    //==============================================

    const salirBtn =
        document.getElementById(
            "btnSalir"
        );

    if (salirBtn) {

        salirBtn.onclick =
            salir;

    }


    //==============================================
    // NUEVA ZONA
    //==============================================

    const btnNuevaZona =
        document.getElementById(
            "btnNuevaZona"
        );

    if (btnNuevaZona) {

        btnNuevaZona.addEventListener(
            "click",
            iniciarDibujoZona
        );

    }


    //==============================================
    // CANCELAR ZONA
    //==============================================

    const btnCancelarZona =
        document.getElementById(
            "btnCancelarZona"
        );

    if (btnCancelarZona) {

        btnCancelarZona.addEventListener(
            "click",
            cancelarDibujoZona
        );

    }


    //==============================================
    // NUEVO CORDON
    //==============================================

    const btnNuevoCordon =
        document.getElementById(
            "btnNuevoCordon"
        );

    if (btnNuevoCordon) {

        btnNuevoCordon.addEventListener(
            "click",
            iniciarDibujoCordon
        );

    }


    //==============================================
    // CANCELAR CORDON
    //==============================================

    const btnCancelarCordon =
        document.getElementById(
            "btnCancelarCordon"
        );

    if (btnCancelarCordon) {

        btnCancelarCordon.addEventListener(
            "click",
            cancelarDibujoCordon
        );

    }

}


//==================================================
// CAMBIO DE TIPO
//==================================================

function manejarCambioTipo() {

    const selector =
        document.getElementById(
            "tipo"
        );

    if (!selector) {
        return;
    }

    const tipo =
        selector.value;


    if (
        normalizar(tipo) ===
        normalizar(
            TIPO_ZONA_ESTACIONAMIENTO
        )
    ) {

        actualizarTextoAyuda(
            "Haga dos clics para definir el tramo de estacionamiento tarifado."
        );

        if (!dibujandoZona) {

            iniciarDibujoZona();

        }

        return;

    }


    if (
        normalizar(tipo) ===
        normalizar(
            TIPO_CORDON_ROJO
        )
    ) {

        actualizarTextoAyuda(
            "Marque exactamente 2 puntos para definir el cordón rojo. El segundo punto finaliza automáticamente."
        );

        if (!dibujandoCordon) {

            iniciarDibujoCordon();

        }

        return;

    }


    actualizarTextoAyuda(
        "Seleccione un punto del mapa para registrar un nuevo elemento."
    );

}


//==================================================
// TEXTO DE AYUDA
//==================================================

function actualizarTextoAyuda(texto) {

    const elementosAyuda =
        document.querySelectorAll(
            ".contenido header p"
        );

    elementosAyuda.forEach(
        function (elemento) {

            elemento.textContent =
                texto;

        }
    );

}


//==================================================
// SELECCIONAR UBICACION
//==================================================

function seleccionarUbicacion(e) {

    if (dibujandoZona) {

        agregarPuntoZona(e);

        return;

    }

    if (dibujandoCordon) {

        agregarPuntoCordon(e);

        return;

    }


    const lat =
        e.latlng.lat;

    const lng =
        e.latlng.lng;


    const campoLat =
        document.getElementById(
            "lat"
        );

    const campoLng =
        document.getElementById(
            "lng"
        );


    if (campoLat) {

        campoLat.value =
            lat.toFixed(7);

    }

    if (campoLng) {

        campoLng.value =
            lng.toFixed(7);

    }


    if (marcadorNuevo) {

        mapa.removeLayer(
            marcadorNuevo
        );

        marcadorNuevo = null;

    }


    marcadorNuevo =
        L.marker(
            [lat, lng],
            {
                draggable: true,
                icon:
                    crearIconoNuevo()
            }
        )
        .addTo(mapa);


    marcadorNuevo.on(
        "drag",
        function () {

            const posicion =
                marcadorNuevo.getLatLng();

            if (campoLat) {

                campoLat.value =
                    posicion.lat.toFixed(7);

            }

            if (campoLng) {

                campoLng.value =
                    posicion.lng.toFixed(7);

            }

        }
    );


    mapa.flyTo(
        [lat, lng],
        18,
        {
            duration: 0.6
        }
    );

}


//==================================================
// CARGAR ELEMENTOS
//==================================================

async function cargarElementos() {

    mostrarMensaje(
        "Cargando elementos...",
        ""
    );

    try {

        const respuesta =
            await apiObtenerElementos();

        console.log(
            "Respuesta API:",
            respuesta
        );

        if (
            !respuesta ||
            !respuesta.ok
        ) {

            mostrarMensaje(
                respuesta?.mensaje ||
                "No se pudieron obtener los elementos.",
                "error"
            );

            return;

        }

        elementos =
            Array.isArray(
                respuesta.datos
            )
                ? respuesta.datos
                : [];

        console.log(
            "Elementos cargados:",
            elementos.length
        );

        renderizarMapaCompleto();

        mostrarMensaje(
            elementos.length +
            " elementos cargados.",
            "exito"
        );

    } catch (error) {

        console.error(
            "Error cargando elementos:",
            error
        );

        mostrarMensaje(
            "Error al cargar los elementos.",
            "error"
        );

    }

}


//==================================================
// RENDERIZAR MAPA COMPLETO
//==================================================

function renderizarMapaCompleto() {

    renderizarMarcadores();

}


//==================================================
// RENDERIZAR MARCADORES
//==================================================

function renderizarMarcadores() {

    if (!capaMarcadores) {
        return;
    }

    capaMarcadores.clearLayers();


    const filtroElemento =
        document.getElementById(
            "filtroTipo"
        );

    const campoBuscar =
        document.getElementById(
            "buscar"
        );

    const filtroLocalidad =
        document.getElementById(
            "filtroLocalidad"
        );


    const filtroTipo =
        filtroElemento
            ? filtroElemento.value
            : "";


    const localidadSeleccionada =
        filtroLocalidad
            ? filtroLocalidad.value
            : "";


    const texto =
        normalizar(
            campoBuscar
                ? campoBuscar.value
                : ""
        );


    const mostrandoZona =
        normalizar(filtroTipo) ===
        normalizar(
            TIPO_ZONA_ESTACIONAMIENTO
        );


    const mostrandoCordon =
        normalizar(filtroTipo) ===
        normalizar(
            TIPO_CORDON_ROJO
        );


    // Cuando se selecciona una geometría especial, mostrar EXCLUSIVAMENTE
    // esa categoría. No continuar renderizando los elementos normales.
    if (mostrandoZona) {

        capaCordonesRojos.clearLayers();
        capaMarcadores.clearLayers();
        mostrarZonasEstacionamiento(true);
        actualizarContadorGeometrias();
        return;

    }

    if (mostrandoCordon) {

        capaZonasEstacionamiento.clearLayers();
        capaMarcadores.clearLayers();
        mostrarCordonesRojos(true);
        actualizarContadorGeometrias();
        return;

    }

    // Para cualquier categoría normal se ocultan las dos geometrías especiales.
    capaZonasEstacionamiento.clearLayers();
    capaCordonesRojos.clearLayers();


    const visibles =
        elementos.filter(
            function (elemento) {

                const lat =
                    coordenada(
                        elemento.latitud
                    );

                const lng =
                    coordenada(
                        elemento.longitud
                    );


                if (
                    lat === null ||
                    lng === null
                ) {

                    return false;

                }


                if (
                    filtroTipo &&
                    normalizar(
                        elemento.tipo
                    ) !==
                    normalizar(
                        filtroTipo
                    )
                ) {

                    return false;

                }


                if (
                    localidadSeleccionada
                ) {

                    const localidadElemento =
                        elemento.localidadNombre ||
                        elemento.localidad ||
                        elemento.nombreLocalidad ||
                        "";

                    if (
                        normalizar(
                            localidadElemento
                        ) !==
                        normalizar(
                            localidadSeleccionada
                        )
                    ) {

                        return false;

                    }

                }


                const cadena =
                    normalizar(
                        [
                            elemento.codigo,
                            elemento.nombre,
                            elemento.tipo,
                            elemento.direccion,
                            elemento.estado,
                            elemento.localidadNombre,
                            elemento.localidad
                        ].join(" ")
                    );


                return cadena.includes(
                    texto
                );

            }
        );


    visibles.forEach(
        function (elemento) {

            const lat =
                coordenada(
                    elemento.latitud
                );

            const lng =
                coordenada(
                    elemento.longitud
                );


            const marcador =
                L.marker(
                    [lat, lng],
                    {
                        icon:
                            crearIcono(
                                elemento.tipo
                            ),

                        keyboard:
                            true,

                        riseOnHover:
                            true
                    }
                );


            marcador.bindPopup(
                crearPopup(elemento),
                {
                    maxWidth:
                        320,

                    minWidth:
                        280,

                    autoPan:
                        true,

                    closeButton:
                        true
                }
            );


            marcador.addTo(
                capaMarcadores
            );

        }
    );


    if (!filtroTipo) {

        mostrarZonasEstacionamiento(
            false
        );

        mostrarCordonesRojos(
            false
        );

    }


    const contador =
        document.getElementById(
            "contadorResultados"
        );


    if (contador) {

        if (!filtroTipo) {

            contador.textContent =
                visibles.length +
                " elementos + " +
                contarZonasActivas() +
                " zonas + " +
                contarCordonesActivos() +
                " cordones";

        } else {

            contador.textContent =
                visibles.length +
                " elementos";

        }

    }

}


//==================================================
// CONTADOR GEOMETRIAS
//==================================================

function actualizarContadorGeometrias() {

    const contador =
        document.getElementById(
            "contadorResultados"
        );

    if (!contador) {
        return;
    }


    const filtro =
        document.getElementById(
            "filtroTipo"
        );

    const valor =
        filtro
            ? filtro.value
            : "";


    if (
        normalizar(valor) ===
        normalizar(
            TIPO_ZONA_ESTACIONAMIENTO
        )
    ) {

        contador.textContent =
            contarZonasActivas() +
            " zonas de estacionamiento";

        return;

    }


    if (
        normalizar(valor) ===
        normalizar(
            TIPO_CORDON_ROJO
        )
    ) {

        contador.textContent =
            contarCordonesActivos() +
            " cordones rojos";

    }

}


//==================================================
// CONTAR ZONAS
//==================================================

function contarZonasActivas() {

    return zonasEstacionamiento.filter(
        function (zona) {

            return String(
                zona.activo || ""
            ).toUpperCase() === "SI";

        }
    ).length;

}


//==================================================
// CONTAR CORDONES
//==================================================

function contarCordonesActivos() {

    return cordonesRojos.filter(
        function (cordon) {

            return String(
                cordon.activo || ""
            ).toUpperCase() === "SI";

        }
    ).length;

}


//==================================================
// CENTRAR LOCALIDAD
//==================================================

function centrarLocalidadSeleccionada() {

    if (!mapa) {
        return;
    }


    const filtroLocalidad =
        document.getElementById(
            "filtroLocalidad"
        );


    if (
        !filtroLocalidad ||
        !filtroLocalidad.value
    ) {

        return;

    }


    const localidadSeleccionada =
        normalizar(
            filtroLocalidad.value
        );


    const puntos = [];


    //==============================================
    // ELEMENTOS
    //==============================================

    elementos.forEach(
        function (elemento) {

            const localidad =
                elemento.localidadNombre ||
                elemento.localidad ||
                elemento.nombreLocalidad ||
                "";


            if (
                normalizar(localidad) !==
                localidadSeleccionada
            ) {

                return;

            }


            const lat =
                coordenada(
                    elemento.latitud
                );

            const lng =
                coordenada(
                    elemento.longitud
                );


            if (
                lat !== null &&
                lng !== null
            ) {

                puntos.push([
                    lat,
                    lng
                ]);

            }

        }
    );


    //==============================================
    // ZONAS
    //==============================================

    zonasEstacionamiento.forEach(
        function (zona) {

            if (
                String(
                    zona.activo || ""
                ).toUpperCase() !== "SI"
            ) {

                return;

            }


            const localidad =
                zona.localidadNombre ||
                zona.localidad ||
                "";


            if (
                normalizar(localidad) !==
                localidadSeleccionada
            ) {

                return;

            }


            const coordenadas =
                leerCoordenadas(
                    zona.coordenadas
                );


            coordenadas.forEach(
                function (punto) {

                    puntos.push(
                        punto
                    );

                }
            );

        }
    );


    //==============================================
    // CORDONES
    //==============================================

    cordonesRojos.forEach(
        function (cordon) {

            if (
                String(
                    cordon.activo || ""
                ).toUpperCase() !== "SI"
            ) {

                return;

            }


            const localidad =
                cordon.localidadNombre ||
                cordon.localidad ||
                "";


            if (
                normalizar(localidad) !==
                localidadSeleccionada
            ) {

                return;

            }


            const coordenadas =
                leerCoordenadas(
                    cordon.coordenadas
                );


            coordenadas.forEach(
                function (punto) {

                    puntos.push(
                        punto
                    );

                }
            );

        }
    );


    if (puntos.length) {

        const limites =
            L.latLngBounds(
                puntos
            );


        mapa.fitBounds(
            limites,
            {
                padding: [
                    80,
                    80
                ],

                maxZoom:
                    15,

                animate:
                    true,

                duration:
                    0.8
            }
        );

        return;

    }


    mostrarMensaje(
        "No hay elementos registrados en esta localidad.",
        "error"
    );

}


//==================================================
// LEER COORDENADAS
//==================================================

function leerCoordenadas(valor) {

    if (Array.isArray(valor)) {

        return normalizarPuntos(
            valor
        );

    }


    if (
        typeof valor !== "string" ||
        !valor.trim()
    ) {

        return [];

    }


    try {

        const datos =
            JSON.parse(valor);

        return normalizarPuntos(
            datos
        );

    } catch (error) {

        console.warn(
            "Coordenadas inválidas:",
            valor
        );

        return [];

    }

}


//==================================================
// NORMALIZAR PUNTOS
//==================================================

function normalizarPuntos(datos) {

    if (!Array.isArray(datos)) {
        return [];
    }


    const resultado = [];


    datos.forEach(
        function (punto) {

            if (
                !Array.isArray(punto) ||
                punto.length < 2
            ) {

                return;

            }


            const lat =
                Number(
                    punto[0]
                );

            const lng =
                Number(
                    punto[1]
                );


            if (
                Number.isFinite(lat) &&
                Number.isFinite(lng)
            ) {

                resultado.push([
                    lat,
                    lng
                ]);

            }

        }
    );


    return resultado;

}


//==================================================
// ICONO POI
//==================================================

function crearIcono(tipo) {

    const categoria =
        obtenerCategoria(tipo);


    const iconos = {

        "traffic-light":
            "fa-solid fa-traffic-light",

        "camera":
            "fa-solid fa-camera",

        "person-walking":
            "fa-solid fa-person-walking",

        "road":
            "fa-solid fa-road",

        "signs-post":
            "fa-solid fa-signs-post",

        "location-dot":
            "fa-solid fa-location-dot",

        "parking":
            "fa-solid fa-square-parking",

        "bi-taxi":
            "fa-solid fa-taxi",

        "disc. parking":
            "fa-solid fa-wheelchair",

        "bus":
            "fa-solid fa-bus",

        "bus-stop":
            "fa-solid fa-bus",

        "parada bus":
            "fa-solid fa-bus",

        "parada de bus":
            "fa-solid fa-bus",

        "parada de omnibus":
            "fa-solid fa-bus",

        "parada de ómnibus":
            "fa-solid fa-bus",

        "speed":
            "fa-solid fa-gauge-high",

        "speed-sensor":
            "fa-solid fa-gauge-high",

        "sonda":
            "fa-solid fa-gauge-high",

        "sonda de velocidad":
            "fa-solid fa-gauge-high",

        "radar":
            "fa-solid fa-camera",

        "otros":
            "fa-solid fa-location-dot"

    };


    let claseIcono =
        "fa-solid fa-location-dot";

    let color =
        "gris";


    if (categoria) {

        const iconoOriginal =
            String(
                categoria.icono || ""
            ).trim();


        const iconoNormalizado =
            normalizar(
                iconoOriginal
            );


        const nombreNormalizado =
            normalizar(
                categoria.nombre
            );


        if (
            iconos[iconoNormalizado]
        ) {

            claseIcono =
                iconos[
                    iconoNormalizado
                ];

        } else if (
            nombreNormalizado.includes(
                "parada"
            ) &&
            (
                nombreNormalizado.includes(
                    "bus"
                ) ||
                nombreNormalizado.includes(
                    "omnibus"
                )
            )
        ) {

            claseIcono =
                "fa-solid fa-bus";

        } else if (
            nombreNormalizado.includes(
                "sonda"
            ) &&
            nombreNormalizado.includes(
                "velocidad"
            )
        ) {

            claseIcono =
                "fa-solid fa-gauge-high";

        } else if (
            nombreNormalizado.includes(
                "radar"
            )
        ) {

            claseIcono =
                "fa-solid fa-camera";

        }


        color =
            String(
                categoria.color || "gris"
            )
            .trim()
            .toLowerCase();

    }


    return L.divIcon({

        className:
            "poi-elemento " +
            color,

        html:
            '<div class="poi-pin">' +
                '<div class="poi-icono">' +
                    '<i class="' +
                        escaparAtributoHTML(
                            claseIcono
                        ) +
                    '"></i>' +
                '</div>' +
            '</div>',

        iconSize: [
            44,
            52
        ],

        iconAnchor: [
            22,
            52
        ],

        popupAnchor: [
            0,
            -52
        ]

    });

}


//==================================================
// ICONO NUEVO
//==================================================

function crearIconoNuevo() {

    return L.divIcon({

        className:
            "poi-elemento nuevo",

        html:
            '<div class="poi-pin">' +
                '<div class="poi-icono">' +
                    '<i class="fa-solid fa-crosshairs"></i>' +
                '</div>' +
            '</div>',

        iconSize: [
            44,
            52
        ],

        iconAnchor: [
            22,
            52
        ],

        popupAnchor: [
            0,
            -52
        ]

    });

}


//==================================================
//==================================================
// MOSTRAR PANEL NUEVO ELEMENTO
//==================================================

function mostrarPanelNuevoElemento() {

    const panel =
        document.querySelector(
            ".panel"
        );

    if (panel) {

        panel.style.display =
            "";

    }

    const selector =
        document.getElementById(
            "tipo"
        );

    if (selector) {

        selector.disabled =
            false;

    }

}


//==================================================
// POPUP ELEMENTO
//==================================================

function crearPopup(elemento) {

    const id =
        escaparAtributo(
            elemento.id
        );


    return (
        '<div class="popup-card">' +

            '<h2>' +
                escapar(
                    elemento.codigo
                ) +
            '</h2>' +

            '<div class="popup-linea">' +
                '<strong>Tipo</strong><br>' +
                escapar(
                    elemento.tipo
                ) +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Nombre</strong><br>' +
                escapar(
                    elemento.nombre
                ) +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Localidad</strong><br>' +
                escapar(
                    elemento.localidadNombre ||
                    elemento.localidad ||
                    "-"
                ) +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Estado</strong><br>' +
                '<span class="estado-popup">' +
                    escapar(
                        elemento.estado
                    ) +
                '</span>' +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Dirección</strong><br>' +
                escapar(
                    elemento.direccion
                ) +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Descripción</strong><br>' +
                escapar(
                    elemento.descripcion ||
                    "-"
                ) +
            '</div>' +

            '<div class="popup-linea">' +
                '<strong>Características</strong><br>' +
                escapar(
                    elemento.caracteristicas ||
                    "-"
                ) +
            '</div>' +

            '<hr>' +

            '<div class="popup-botones">' +

                '<button ' +
                    'type="button" ' +
                    'class="btn-inspeccion" ' +
                    'onclick="abrirInspecciones(\'' +
                        id +
                    '\')">' +

                    '📝 Inspecciones' +

                '</button>' +

                '<button ' +
                    'type="button" ' +
                    'class="btn-eliminar" ' +
                    'onclick="eliminarElemento(\'' +
                        id +
                    '\')">' +

                    '🗑 Eliminar' +

                '</button>' +

            '</div>' +

        '</div>'
    );

}


//==================================================
// ABRIR INSPECCIONES
//==================================================

function abrirInspecciones(id) {

    location.href =
        "inspeccion.html?elemento=" +
        encodeURIComponent(id);

}


//==================================================
// ELIMINAR ELEMENTO
//==================================================

async function eliminarElemento(id) {

    if (
        !confirm(
            "¿Eliminar este elemento?"
        )
    ) {

        return;

    }


    try {

        // Detectar zona/cordon por prefijo de ID
        const idStr =
            String(
                id || ""
            );


        if (
            idStr.indexOf("ET") === 0
        ) {

            const respuesta =
                await apiEliminarZonaEstacionamiento(
                    id
                );


            if (
                respuesta &&
                respuesta.ok
            ) {

                await cargarZonasEstacionamiento();

            } else {

                mostrarMensaje(
                    respuesta?.mensaje ||
                    "No fue posible eliminar la zona.",
                    "error"
                );

            }

            return;

        }


        if (
            idStr.indexOf("CR") === 0
        ) {

            const respuesta =
                await apiEliminarCordonRojo(
                    id
                );


            if (
                respuesta &&
                respuesta.ok
            ) {

                await cargarCordonesRojos();

            } else {

                mostrarMensaje(
                    respuesta?.mensaje ||
                    "No fue posible eliminar el cordón.",
                    "error"
                );

            }

            return;

        }


        // Elemento normal
        const respuesta =
            await apiEliminarElemento(
                id
            );


        if (
            respuesta &&
            respuesta.ok
        ) {

            await cargarElementos();

        } else {

            mostrarMensaje(
                respuesta?.mensaje ||
                "No fue posible eliminar el elemento.",
                "error"
            );

        }

    } catch (error) {

        console.error(
            "Error eliminando elemento:",
            error
        );

        mostrarMensaje(
            "No fue posible eliminar el elemento.",
            "error"
        );

    }

}


//==================================================
// GUARDAR ELEMENTO
//==================================================

async function guardarElemento(e) {

    e.preventDefault();


    const tipo =
        document.getElementById(
            "tipo"
        )?.value || "";


    if (
        normalizar(tipo) ===
        normalizar(
            TIPO_ZONA_ESTACIONAMIENTO
        )
    ) {

        const coordenadas =
            document.getElementById(
                "coordenadas"
            )?.value || "";


        if (!coordenadas) {

            mostrarMensaje(
                "Primero dibuje el tramo sobre el mapa.",
                "error"
            );

            return;

        }


        const datosZona = {

            tipo:
                tipo,

            nombre:
                document.getElementById(
                    "nombre"
                )?.value || "",

            descripcion:
                document.getElementById(
                    "descripcion"
                )?.value || "",

            direccion:
                document.getElementById(
                    "direccion"
                )?.value || "",

            estado:
                document.getElementById(
                    "estado"
                )?.value || "Activo",

            caracteristicas:
                document.getElementById(
                    "caracteristicas"
                )?.value || "",

            coordenadas:
                coordenadas,

            localidad:
                document.getElementById(
                    "filtroLocalidad"
                )?.value || ""

        };


        await guardarZonaEnServidor(
            datosZona
        );

        return;

    }


    if (
        normalizar(tipo) ===
        normalizar(
            TIPO_CORDON_ROJO
        )
    ) {

        const coordenadas =
            document.getElementById(
                "coordenadas"
            )?.value || "";


        if (!coordenadas) {

            mostrarMensaje(
                "Primero dibuje el cordón sobre el mapa.",
                "error"
            );

            return;

        }


        const datosCordon = {

            tipo:
                tipo,

            nombre:
                document.getElementById(
                    "nombre"
                )?.value || "",

            descripcion:
                document.getElementById(
                    "descripcion"
                )?.value || "",

            direccion:
                document.getElementById(
                    "direccion"
                )?.value || "",

            estado:
                document.getElementById(
                    "estado"
                )?.value || "Activo",

            caracteristicas:
                document.getElementById(
                    "caracteristicas"
                )?.value || "",

            coordenadas:
                coordenadas,

            localidad:
                document.getElementById(
                    "filtroLocalidad"
                )?.value || ""

        };


        await guardarCordonRojoEnServidor(
            datosCordon
        );

        return;

    }


    const categoria =
        obtenerCategoria(tipo);


    const datos = {

        tipo:
            tipo,

        icono:
            categoria
                ? categoria.icono
                : "",

        color:
            categoria
                ? categoria.color
                : "",

        nombre:
            document.getElementById(
                "nombre"
            )?.value || "",

        descripcion:
            document.getElementById(
                "descripcion"
            )?.value || "",

        direccion:
            document.getElementById(
                "direccion"
            )?.value || "",

        estado:
            document.getElementById(
                "estado"
            )?.value || "Activo",

        caracteristicas:
            document.getElementById(
                "caracteristicas"
            )?.value || "",

        latitud:
            document.getElementById(
                "lat"
            )?.value || "",

        longitud:
            document.getElementById(
                "lng"
            )?.value || ""

    };


    if (
        !datos.latitud ||
        !datos.longitud
    ) {

        mostrarMensaje(
            "Seleccione una ubicación en el mapa.",
            "error"
        );

        return;

    }


    mostrarMensaje(
        "Guardando elemento...",
        ""
    );


    try {

        const respuesta =
            await apiGuardarElemento(
                datos
            );


        console.log(
            "Respuesta guardar:",
            respuesta
        );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            mostrarMensaje(
                respuesta?.mensaje ||
                "No fue posible guardar.",
                "error"
            );

            return;

        }


        mostrarMensaje(
            "Elemento guardado correctamente.",
            "exito"
        );


        const form =
            document.getElementById(
                "formElemento"
            );


        if (form) {

            form.reset();

        }


        if (marcadorNuevo) {

            mapa.removeLayer(
                marcadorNuevo
            );

            marcadorNuevo = null;

        }


        actualizarTextoAyuda(
            "Seleccione un punto del mapa para registrar un nuevo elemento."
        );


        await cargarElementos();

    } catch (error) {

        console.error(
            "Error guardando elemento:",
            error
        );

        mostrarMensaje(
            "No fue posible guardar el elemento.",
            "error"
        );

    }

}


//==================================================
// ZONAS DE ESTACIONAMIENTO
//==================================================


//--------------------------------------------------
// INICIAR DIBUJO ZONA
//--------------------------------------------------

function iniciarDibujoZona() {

    if (!mapa) {
        return;
    }


    if (dibujandoZona) {
        return;
    }


    if (dibujandoCordon) {

        cancelarDibujoCordon();

    }


    dibujandoZona = true;
    puntosZona = [];


    if (lineaZona) {

        mapa.removeLayer(
            lineaZona
        );

        lineaZona = null;

    }


    if (poligonoZonaTemporal) {

        mapa.removeLayer(
            poligonoZonaTemporal
        );

        poligonoZonaTemporal = null;

    }


    const selectorTipo =
        document.getElementById(
            "tipo"
        );


    if (selectorTipo) {

        selectorTipo.value =
            TIPO_ZONA_ESTACIONAMIENTO;

    }


    actualizarTextoAyuda(
        "Marque exactamente 2 puntos para definir el tramo de estacionamiento tarifado. El segundo punto cierra automáticamente."
    );


    const btnNuevaZona =
        document.getElementById(
            "btnNuevaZona"
        );

    const btnCancelarZona =
        document.getElementById(
            "btnCancelarZona"
        );

    const estadoZona =
        document.getElementById(
            "estadoZona"
        );


    if (btnNuevaZona) {

        btnNuevaZona.style.display =
            "none";

    }

    if (btnCancelarZona) {

        btnCancelarZona.style.display =
            "inline-block";

    }

    if (estadoZona) {

        estadoZona.textContent =
            "Marque 2 puntos. El segundo punto finaliza automáticamente.";

        estadoZona.className =
            "dibujando";

    }


    mapa.getContainer().style.cursor =
        "crosshair";


    mostrarMensaje(
        "Dibujando zona de estacionamiento tarifado...",
        ""
    );

}


//--------------------------------------------------
// AGREGAR PUNTO ZONA
//--------------------------------------------------

function agregarPuntoZona(e) {

    if (!dibujandoZona) {
        return;
    }


    if (puntosZona.length >= 2) {
        return;
    }

    puntosZona.push([
        e.latlng.lat,
        e.latlng.lng
    ]);


    if (puntosZona.length >= 2) {

        if (lineaZona) {

            mapa.removeLayer(
                lineaZona
            );

        }


        lineaZona =
            L.polyline(
                puntosZona,
                {
                    color:
                        "#4fc3f7",

                    weight:
                        4,

                    dashArray:
                        "8,6"
                }
            )
            .addTo(mapa);

    }


    const estadoZona =
        document.getElementById(
            "estadoZona"
        );


    if (estadoZona) {

        estadoZona.textContent =
            "Puntos marcados: " +
            puntosZona.length +
            ".";

    }


    // Auto-finalizar al llegar a 2 puntos
    if (puntosZona.length >= 2) {

        finalizarZona();

    }

}


//--------------------------------------------------
// FINALIZAR ZONA
//--------------------------------------------------

async function finalizarZona() {

    if (!dibujandoZona) {
        return;
    }


    if (puntosZona.length < 2) {

        mostrarMensaje(
            "Un tramo necesita al menos 2 puntos.",
            "error"
        );

        return;

    }


    // Poblar formulario con coordenadas y tipo
    document.getElementById("coordenadas").value =
        JSON.stringify(puntosZona);

    document.getElementById("tipo").value =
        TIPO_ZONA_ESTACIONAMIENTO;

    mostrarPanelNuevoElemento();

    actualizarTextoAyuda(
        "Complete los datos del tramo de estacionamiento tarifado y guarde."
    );


    const estadoZona =
        document.getElementById(
            "estadoZona"
        );

    if (estadoZona) {

        estadoZona.textContent =
            "Tramo definido. Complete el formulario.";

    }

}


//--------------------------------------------------
// GUARDAR ZONA
//--------------------------------------------------

async function guardarZonaEnServidor(
    datos
) {

    try {

        const estadoZona =
            document.getElementById(
                "estadoZona"
            );


        if (estadoZona) {

            estadoZona.textContent =
                "Guardando zona...";

        }


        const usuarioActual =
            obtenerUsuarioActual();


        datos.usuario =
            usuarioActual.nombre ||
            usuarioActual.usuario ||
            "admin";


        console.log(
            "Guardando zona:",
            datos
        );


        const respuesta =
            await apiGuardarZonaEstacionamiento(
                datos
            );


        console.log(
            "Respuesta guardar zona:",
            respuesta
        );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            throw new Error(
                respuesta?.mensaje ||
                "No fue posible guardar la zona."
            );

        }


        mostrarMensaje(
            "Estacionamiento tarifado guardado correctamente.",
            "exito"
        );


        const form =
            document.getElementById(
                "formElemento"
            );

        if (form) {

            form.reset();

        }


        limpiarDibujoZona();

        await cargarZonasEstacionamiento();

    } catch (error) {

        console.error(
            "Error guardando zona:",
            error
        );


        mostrarMensaje(
            error.message ||
            "Error al guardar la zona.",
            "error"
        );

    }

}

//--------------------------------------------------
// GUARDAR CORDON EN SERVIDOR
//--------------------------------------------------

async function guardarCordonRojoEnServidor(
    datos
) {

    try {

        const estadoZona =
            document.getElementById(
                "estadoZona"
            );


        if (estadoZona) {

            estadoZona.textContent =
                "Guardando cordón...";

        }


        const usuarioActual =
            obtenerUsuarioActual();


        datos.usuario =
            usuarioActual.nombre ||
            usuarioActual.usuario ||
            "admin";


        console.log(
            "Guardando cordón:",
            datos
        );


        const respuesta =
            await apiGuardarCordonRojo(
                datos
            );


        console.log(
            "Respuesta guardar cordón:",
            respuesta
        );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            throw new Error(
                respuesta?.mensaje ||
                "No fue posible guardar el cordón."
            );

        }


        mostrarMensaje(
            "Cordón rojo guardado correctamente.",
            "exito"
        );


        const form =
            document.getElementById(
                "formElemento"
            );

        if (form) {

            form.reset();

        }


        limpiarDibujoCordon();

        await cargarCordonesRojos();

    } catch (error) {

        console.error(
            "Error guardando cordón:",
            error
        );


        mostrarMensaje(
            error.message ||
            "Error al guardar el cordón.",
            "error"
        );

    }

}
//--------------------------------------------------
// CARGAR ZONAS
//--------------------------------------------------

async function cargarZonasEstacionamiento() {

    if (!capaZonasEstacionamiento) {
        return;
    }

    try {

        console.log(
            "===================================="
        );

        console.log(
            "CARGANDO ZONAS DE ESTACIONAMIENTO"
        );

        const respuesta =
            await apiObtenerZonasEstacionamiento();

        console.log(
            "Respuesta zonas estacionamiento:",
            respuesta
        );

        if (
            !respuesta ||
            !respuesta.ok
        ) {

            console.error(
                "Error cargando zonas:",
                respuesta?.mensaje
            );

            zonasEstacionamiento = [];

            mostrarZonasEstacionamiento();

            return;
        }

        zonasEstacionamiento =
            Array.isArray(respuesta.datos)
                ? respuesta.datos
                : [];

        console.log(
            "===================================="
        );

        console.log(
            "ZONAS ESTACIONAMIENTO RECIBIDAS"
        );

        console.log(
            "Cantidad:",
            zonasEstacionamiento.length
        );

        console.table(
            zonasEstacionamiento
        );

        if (
            zonasEstacionamiento.length > 0
        ) {

            console.log(
                "PRIMERA ZONA:",
                zonasEstacionamiento[0]
            );

            console.log(
                "ID:",
                zonasEstacionamiento[0].id
            );

            console.log(
                "Código:",
                zonasEstacionamiento[0].codigo
            );

            console.log(
                "Nombre:",
                zonasEstacionamiento[0].nombre
            );

            console.log(
                "Activo:",
                zonasEstacionamiento[0].activo
            );

            console.log(
                "Localidad:",
                zonasEstacionamiento[0].localidad
            );

            console.log(
                "Coordenadas:",
                zonasEstacionamiento[0].coordenadas
            );

            console.log(
                "Coordenadas interpretadas:",
                leerCoordenadas(
                    zonasEstacionamiento[0].coordenadas
                )
            );

        }

        console.log(
            "===================================="
        );

        mostrarZonasEstacionamiento();

        actualizarContadorGeometrias();

        console.log(
            "Zonas cargadas:",
            zonasEstacionamiento.length
        );

    } catch (error) {

        console.error(
            "ERROR CARGANDO ZONAS DE ESTACIONAMIENTO:",
            error
        );

        zonasEstacionamiento = [];

        mostrarZonasEstacionamiento();

    }

}

//--------------------------------------------------
// MOSTRAR ZONAS
//--------------------------------------------------

function mostrarZonasEstacionamiento() {

    if (!capaZonasEstacionamiento) {
        return;
    }


    capaZonasEstacionamiento.clearLayers();


    zonasEstacionamiento.forEach(
        function (zona) {

            if (
                String(
                    zona.activo || ""
                ).toUpperCase() !== "SI"
            ) {

                return;

            }


            const puntos =
                leerCoordenadas(
                    zona.coordenadas
                );


            if (puntos.length < 2) {

                console.warn(
                    "Zona sin suficientes coordenadas:",
                    zona
                );

                return;

            }


            const filtroLocalidad =
                document.getElementById(
                    "filtroLocalidad"
                );


            const localidadSeleccionada =
                filtroLocalidad
                    ? filtroLocalidad.value
                    : "";


            if (
                localidadSeleccionada
            ) {

                const localidadZona =
                    zona.localidadNombre ||
                    zona.localidad ||
                    "";


                if (
                    normalizar(
                        localidadZona
                    ) !==
                    normalizar(
                        localidadSeleccionada
                    )
                ) {

                    return;

                }

            }


            const linea =
                L.polyline(
                    puntos,
                    {
                        color:
                            "#4fc3f7",

                        weight:
                            6,

                        opacity:
                            0.95,

                        lineCap:
                            "round",

                        lineJoin:
                            "round",

                        interactive:
                            true
                    }
                );


            const elementoPopup = {
                id: zona.id,
                codigo: zona.codigo || "ET",
                tipo: "Estacionamiento Tarifado",
                nombre: zona.nombre || "",
                localidadNombre:
                    zona.localidadNombre ||
                    zona.localidad ||
                    "",
                estado: zona.estado || "Activo",
                direccion: zona.direccion || "",
                descripcion: zona.descripcion || "",
                caracteristicas:
                    zona.caracteristicas || ""
            };


            linea.bindPopup(
                crearPopup(
                    elementoPopup
                )
            );


            linea.addTo(
                capaZonasEstacionamiento
            );

        }
    );

}


//--------------------------------------------------
// ELIMINAR ZONA
//--------------------------------------------------

async function eliminarZonaEstacionamiento(
    id
) {

    if (
        !confirm(
            "¿Está seguro de eliminar esta zona de estacionamiento?"
        )
    ) {

        return;

    }


    try {

        const respuesta =
            await apiEliminarZonaEstacionamiento(
                id
            );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            throw new Error(
                respuesta?.mensaje ||
                "No fue posible eliminar la zona."
            );

        }


        mostrarMensaje(
            "Zona eliminada correctamente.",
            "exito"
        );


        await cargarZonasEstacionamiento();

    } catch (error) {

        console.error(
            "Error eliminando zona:",
            error
        );


        mostrarMensaje(
            error.message ||
            "No fue posible eliminar la zona.",
            "error"
        );

    }

}


//--------------------------------------------------
// CANCELAR ZONA
//--------------------------------------------------

function cancelarDibujoZona() {

    limpiarDibujoZona();


    actualizarTextoAyuda(
        "Seleccione un punto del mapa para registrar un nuevo elemento."
    );


    const estadoZona =
        document.getElementById(
            "estadoZona"
        );


    if (estadoZona) {

        estadoZona.textContent =
            "Dibujo cancelado.";

        estadoZona.className =
            "";

    }


    mostrarMensaje(
        "Dibujo de zona cancelado.",
        ""
    );

}


//--------------------------------------------------
// LIMPIAR ZONA
//--------------------------------------------------

function limpiarDibujoZona() {

    dibujandoZona = false;
    puntosZona = [];


    if (lineaZona) {

        if (mapa) {

            mapa.removeLayer(
                lineaZona
            );

        }

        lineaZona = null;

    }


    if (poligonoZonaTemporal) {

        if (mapa) {

            mapa.removeLayer(
                poligonoZonaTemporal
            );

        }

        poligonoZonaTemporal = null;

    }


    if (mapa) {

        mapa.getContainer().style.cursor =
            "";

    }


    const btnNuevaZona =
        document.getElementById(
            "btnNuevaZona"
        );

    const btnCancelarZona =
        document.getElementById(
            "btnCancelarZona"
        );


    if (btnNuevaZona) {

        btnNuevaZona.style.display =
            "inline-block";

    }

    if (btnCancelarZona) {

        btnCancelarZona.style.display =
            "none";

    }

}


//==================================================
// ESC
//==================================================

document.addEventListener(
    "keydown",
    function (e) {

        if (
            e.key === "Escape" &&
            dibujandoZona
        ) {

            cancelarDibujoZona();

        }


        if (
            e.key === "Escape" &&
            dibujandoCordon
        ) {

            cancelarDibujoCordon();

        }

    }
);


//==================================================
// FINALIZAR DIBUJO GEOMETRICO
//==================================================

function finalizarDibujoGeometrico(e) {

    if (
        e &&
        e.originalEvent
    ) {

        e.originalEvent.preventDefault();

    }


    if (dibujandoZona) {

        finalizarZona();

        return;

    }


    if (dibujandoCordon) {

        finalizarCordon();

        return;

    }

}


//==================================================
// CORDONES ROJOS
//==================================================


//--------------------------------------------------
// INICIAR CORDON
//--------------------------------------------------

function iniciarDibujoCordon() {

    if (
        !mapa ||
        dibujandoZona ||
        dibujandoCordon
    ) {

        return;

    }


    dibujandoCordon = true;
    puntosCordon = [];


    if (lineaCordonTemporal) {

        mapa.removeLayer(
            lineaCordonTemporal
        );

        lineaCordonTemporal = null;

    }


    const selectorTipo =
        document.getElementById(
            "tipo"
        );


    if (selectorTipo) {

        selectorTipo.value =
            TIPO_CORDON_ROJO;

    }


    actualizarTextoAyuda(
        "Dibuje el cordón rojo sobre el mapa. Haga clic siguiendo el borde y clic derecho para finalizar."
    );


    const btnNuevo =
        document.getElementById(
            "btnNuevoCordon"
        );

    const btnCancelar =
        document.getElementById(
            "btnCancelarCordon"
        );

    const estado =
        document.getElementById(
            "estadoCordon"
        );


    if (btnNuevo) {

        btnNuevo.style.display =
            "none";

    }

    if (btnCancelar) {

        btnCancelar.style.display =
            "inline-block";

    }

    if (estado) {

        estado.textContent =
            "Marque 2 puntos sobre el borde. El segundo punto finaliza automáticamente.";

        estado.className =
            "dibujando";

    }


    mapa.getContainer().style.cursor =
        "crosshair";


    mostrarMensaje(
        "Dibujando cordón rojo...",
        ""
    );

}


//--------------------------------------------------
// AGREGAR PUNTO CORDON
//--------------------------------------------------

function agregarPuntoCordon(e) {

    if (!dibujandoCordon) {
        return;
    }

    // El tramo se define exclusivamente con dos puntos.
    if (puntosCordon.length >= 2) {
        return;
    }

    puntosCordon.push([
        e.latlng.lat,
        e.latlng.lng
    ]);


    if (lineaCordonTemporal) {

        mapa.removeLayer(
            lineaCordonTemporal
        );

    }


    lineaCordonTemporal =
        L.polyline(
            puntosCordon,
            {
                color:
                    "#d50000",

                weight:
                    4,

                opacity:
                    0.9,

                lineCap:
                    "round",

                lineJoin:
                    "round",

                interactive:
                    false
            }
        )
        .addTo(mapa);


    const estado =
        document.getElementById(
            "estadoCordon"
        );


    if (estado) {

        estado.textContent =
            "Puntos marcados: " +
            puntosCordon.length +
            ".";

    }

    if (puntosCordon.length === 2) {
        finalizarCordon();
    }

}


//--------------------------------------------------
// FINALIZAR CORDON
//--------------------------------------------------

async function finalizarCordon() {

    if (!dibujandoCordon) {
        return;
    }


    if (puntosCordon.length < 2) {

        mostrarMensaje(
            "El cordón rojo necesita al menos 2 puntos.",
            "error"
        );

        return;

    }


    // Poblar formulario con coordenadas y tipo
    document.getElementById("coordenadas").value =
        JSON.stringify(puntosCordon.slice(0, 2));

    document.getElementById("tipo").value =
        TIPO_CORDON_ROJO;

    mostrarPanelNuevoElemento();

    actualizarTextoAyuda(
        "Complete los datos del cordón rojo y guarde."
    );


    const estadoZona =
        document.getElementById(
            "estadoZona"
        );

    if (estadoZona) {

        estadoZona.textContent =
            "Cordón definido. Complete el formulario.";

    }

}


//--------------------------------------------------
// CARGAR CORDONES
//--------------------------------------------------

async function cargarCordonesRojos() {

    if (!capaCordonesRojos) {
        return;
    }


    try {

        const respuesta =
            await apiObtenerCordonesRojos();


        console.log(
            "Respuesta cordones:",
            respuesta
        );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            console.error(
                "Error cargando cordones rojos:",
                respuesta?.mensaje
            );

            return;

        }


        cordonesRojos =
            Array.isArray(
                respuesta.datos
            )
                ? respuesta.datos
                : [];


        mostrarCordonesRojos();

    } catch (error) {

        console.error(
            "Error cargando cordones rojos:",
            error
        );

    }

}


//--------------------------------------------------
// MOSTRAR CORDONES
//--------------------------------------------------

function mostrarCordonesRojos() {

    if (!capaCordonesRojos) {
        return;
    }


    capaCordonesRojos.clearLayers();


    cordonesRojos.forEach(
        function (cordon) {

            if (
                String(
                    cordon.activo || ""
                ).toUpperCase() !== "SI"
            ) {

                return;

            }


            const puntos =
                leerCoordenadas(
                    cordon.coordenadas
                );


            if (puntos.length < 2) {

                return;

            }


            const filtroLocalidad =
                document.getElementById(
                    "filtroLocalidad"
                );


            const localidadSeleccionada =
                filtroLocalidad
                    ? filtroLocalidad.value
                    : "";


            if (
                localidadSeleccionada
            ) {

                const localidadCordon =
                    cordon.localidadNombre ||
                    cordon.localidad ||
                    "";


                if (
                    normalizar(
                        localidadCordon
                    ) !==
                    normalizar(
                        localidadSeleccionada
                    )
                ) {

                    return;

                }

            }


            const linea =
                L.polyline(
                    puntos,
                    {
                        color:
                            "#d50000",

                        weight:
                            5,

                        opacity:
                            0.95,

                        lineCap:
                            "round",

                        lineJoin:
                            "round",

                        interactive:
                            true
                    }
                );


            const elementoPopup = {
                id:
                    cordon.id,
                codigo:
                    cordon.codigo ||
                    "CR",
                tipo:
                    "Cordón rojo",
                nombre:
                    cordon.nombre,
                localidadNombre:
                    cordon.localidadNombre ||
                    cordon.localidad ||
                    "Sin localidad",
                estado:
                    cordon.estado ||
                    "Activo",
                direccion:
                    cordon.direccion ||
                    "-",
                descripcion:
                    cordon.descripcion ||
                    "-",
                caracteristicas:
                    cordon.caracteristicas ||
                    "-"
            };


            linea.bindPopup(
                crearPopup(
                    elementoPopup
                )
            );


            linea.addTo(
                capaCordonesRojos
            );

        }
    );

}


//--------------------------------------------------
// ELIMINAR CORDON
//--------------------------------------------------

async function eliminarCordonRojo(
    id
) {

    if (
        !confirm(
            "¿Está seguro de desactivar este cordón rojo?"
        )
    ) {

        return;

    }


    try {

        const respuesta =
            await apiEliminarCordonRojo(
                id
            );


        if (
            !respuesta ||
            !respuesta.ok
        ) {

            throw new Error(
                respuesta?.mensaje ||
                "No fue posible eliminar el cordón rojo."
            );

        }


        await cargarCordonesRojos();


        mostrarMensaje(
            "Cordón rojo desactivado correctamente.",
            "exito"
        );

    } catch (error) {

        console.error(
            "Error eliminando cordón:",
            error
        );


        mostrarMensaje(
            error.message ||
            "No fue posible eliminar el cordón rojo.",
            "error"
        );

    }

}


//--------------------------------------------------
// CANCELAR CORDON
//--------------------------------------------------

function cancelarDibujoCordon() {

    limpiarDibujoCordon();


    actualizarTextoAyuda(
        "Seleccione un punto del mapa para registrar un nuevo elemento."
    );


    mostrarMensaje(
        "Dibujo de cordón cancelado.",
        ""
    );

}


//--------------------------------------------------
// LIMPIAR CORDON
//--------------------------------------------------

function limpiarDibujoCordon() {

    dibujandoCordon = false;
    puntosCordon = [];


    if (lineaCordonTemporal) {

        if (mapa) {

            mapa.removeLayer(
                lineaCordonTemporal
            );

        }

        lineaCordonTemporal = null;

    }


    if (mapa) {

        mapa.getContainer().style.cursor =
            "";

    }


    const btnNuevo =
        document.getElementById(
            "btnNuevoCordon"
        );

    const btnCancelar =
        document.getElementById(
            "btnCancelarCordon"
        );

    const estado =
        document.getElementById(
            "estadoCordon"
        );


    if (btnNuevo) {

        btnNuevo.style.display =
            "inline-block";

    }

    if (btnCancelar) {

        btnCancelar.style.display =
            "none";

    }

    if (estado) {

        estado.textContent =
            "";

        estado.className =
            "";

    }

}


//==================================================
// MENSAJES
//==================================================

function mostrarMensaje(
    texto,
    tipo = ""
) {

    const mensaje =
        document.getElementById(
            "mensajeMapa"
        );


    if (!mensaje) {
        return;
    }


    mensaje.textContent =
        texto;


    mensaje.className =
        "mensaje " +
        tipo;

}


//==================================================
// NORMALIZAR
//==================================================

function normalizar(texto) {

    return String(
        texto || ""
    )
    .normalize("NFD")
    .replace(
        /[\u0300-\u036f]/g,
        ""
    )
    .toLowerCase()
    .trim();

}


//==================================================
// ESCAPAR HTML
//==================================================

function escapar(valor) {

    return String(
        valor || ""
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


//==================================================
// ESCAPAR ATRIBUTO
//==================================================

function escaparAtributo(valor) {

    return String(
        valor || ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    );

}


//==================================================
// ESCAPAR ATRIBUTO HTML
//==================================================

function escaparAtributoHTML(valor) {

    return String(
        valor || ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    );

}


//==================================================
// COORDENADAS
//==================================================

function coordenada(valor) {

    const numero =
        parseFloat(
            String(
                valor || ""
            )
            .replace(
                ",",
                "."
            )
        );


    return Number.isNaN(numero)
        ? null
        : numero;

}


//==================================================
// USUARIO ACTUAL
//==================================================

function obtenerUsuarioActual() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "usuarioActual"
            ) || "{}"
        );

    } catch (error) {

        console.error(
            "Error leyendo usuario:",
            error
        );

        return {};

    }

}


//==================================================
// SALIR
//==================================================

function salir() {

    localStorage.removeItem(
        "usuarioActual"
    );


    location.href =
        "../../index.html";

}


//==================================================
// CENTRAR ELEMENTOS
//==================================================

function centrarEnElementos() {

    if (
        !capaMarcadores ||
        !mapa
    ) {

        return;

    }


    const capas =
        capaMarcadores.getLayers();


    if (!capas.length) {
        return;
    }


    const grupo =
        L.featureGroup(
            capas
        );


    mapa.fitBounds(
        grupo.getBounds(),
        {
            padding: [
                40,
                40
            ]
        }
    );

}


//==================================================
// ACTUALIZAR MAPA
//==================================================

async function actualizarMapa() {

    mostrarMensaje(
        "Actualizando mapa...",
        ""
    );


    try {

        await cargarCategorias();
        await cargarLocalidades();
        await cargarElementos();
        await cargarZonasEstacionamiento();
        await cargarCordonesRojos();


        mostrarMensaje(
            "Mapa actualizado correctamente.",
            "exito"
        );

    } catch (error) {

        console.error(
            "Error actualizando mapa:",
            error
        );


        mostrarMensaje(
            "No fue posible actualizar completamente el mapa.",
            "error"
        );

    }

}


//==================================================
// REFRESCO AUTOMATICO
//==================================================

setInterval(
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            cargarElementos();
            cargarZonasEstacionamiento();
            cargarCordonesRojos();

        }

    },
    60000
);


//==================================================
// DEBUG
//==================================================

window.debugMapa =
    function () {

        console.log(
            "Mapa:",
            mapa
        );

        console.log(
            "Categorías:",
            categorias
        );

        console.table(
            categorias
        );

        console.log(
            "Localidades:",
            localidades
        );

        console.table(
            localidades
        );

        console.log(
            "Elementos:",
            elementos
        );

        console.table(
            elementos
        );

        console.log(
            "Zonas estacionamiento:",
            zonasEstacionamiento
        );

        console.table(
            zonasEstacionamiento
        );

        console.log(
            "Cordones rojos:",
            cordonesRojos
        );

        console.table(
            cordonesRojos
        );

    };


//==================================================
// FIN mapa.js
//==================================================
