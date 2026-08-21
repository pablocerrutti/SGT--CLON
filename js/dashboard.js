// =====================================================
// SGT
// DASHBOARD PRINCIPAL
// =====================================================

let usuario = null;


// =====================================================
// OBTENER USUARIO
// =====================================================

try {

    usuario = JSON.parse(
        localStorage.getItem("usuarioActual")
    );

} catch (e) {

    usuario = null;

}


// =====================================================
// VALIDAR SESIÓN
// =====================================================

if (!usuario) {

    window.location.href = "../index.html";

} else {

    iniciarDashboard();

}


// =====================================================
// INICIAR DASHBOARD
// =====================================================

function iniciarDashboard() {

    // -------------------------------------------------
    // MOSTRAR USUARIO
    // -------------------------------------------------

    const usuarioNombre =
        document.getElementById("usuarioNombre");

    const bienvenida =
        document.getElementById("bienvenida");


    if (usuarioNombre) {

        usuarioNombre.innerHTML =
            "<strong>" +
            esc(usuario.nombre || usuario.usuario || "") +
            "</strong>";

    }


    if (bienvenida) {

        bienvenida.textContent =
            "Rol: " +
            (usuario.rol || "");

    }


    // -------------------------------------------------
    // REFERENCIAS
    // -------------------------------------------------

    const cardUsuarios =
        document.getElementById("cardUsuarios");

    const cardMovilidad =
        document.getElementById("cardMovilidad");

    const cardFiscalizacion =
        document.getElementById("cardFiscalizacion");


    const menuUsuarios =
        document.getElementById("menuUsuarios");

    const menuMovilidad =
        document.getElementById("menuMovilidad");

    const menuFiscalizacion =
        document.getElementById("menuFiscalizacion");


    // -------------------------------------------------
    // NORMALIZAR ROL
    // -------------------------------------------------

    const rol =
        normalizarRol(usuario.rol);


    console.log(
        "Usuario:",
        usuario
    );

    console.log(
        "Rol:",
        rol
    );


    // -------------------------------------------------
    // OCULTAR TODO LO QUE NO CORRESPONDA
    // -------------------------------------------------

    ocultar(cardUsuarios);
    ocultar(cardMovilidad);
    ocultar(cardFiscalizacion);

    ocultar(menuUsuarios);
    ocultar(menuMovilidad);
    ocultar(menuFiscalizacion);


    // =================================================
    // SUPER ADMIN
    // =================================================

    if (rol === "super admin") {

        mostrar(cardUsuarios);
        mostrar(cardMovilidad);
        mostrar(cardFiscalizacion);

        mostrar(menuUsuarios);
        mostrar(menuMovilidad);
        mostrar(menuFiscalizacion);

    }


    // =================================================
    // SUPERVISOR
    // =================================================

    else if (rol === "supervisor") {

        mostrar(cardMovilidad);
        mostrar(cardFiscalizacion);

        mostrar(menuMovilidad);
        mostrar(menuFiscalizacion);

    }


    // =================================================
    // MOVILIDAD
    // =================================================

   else if (rol === "movilidad") {

    mostrar(cardMovilidad);
    mostrar(menuMovilidad);

    mostrar(cardFiscalizacion);
    mostrar(menuFiscalizacion);

}


    // =================================================
    // FISCALIZACION
    // =================================================

    else if (rol === "fiscalizacion") {

        mostrar(cardFiscalizacion);

        mostrar(menuFiscalizacion);

    }


    // =================================================
    // ROL DESCONOCIDO
    // =================================================

    else {

        console.error(
            "Rol no reconocido:",
            usuario.rol
        );

        cerrarSesion();

        return;

    }


    // =================================================
    // EVENTOS
    // =================================================

    if (cardUsuarios) {

        cardUsuarios.onclick =
            abrirUsuarios;

    }


    if (menuUsuarios) {

        menuUsuarios.onclick =
            abrirUsuarios;

    }


    if (cardMovilidad) {

        cardMovilidad.onclick =
            abrirMovilidad;

    }


    if (menuMovilidad) {

        menuMovilidad.onclick =
            abrirMovilidad;

    }


    if (cardFiscalizacion) {

        cardFiscalizacion.onclick =
            abrirFiscalizacion;

    }


    if (menuFiscalizacion) {

        menuFiscalizacion.onclick =
            abrirFiscalizacion;

    }


}


// =====================================================
// NAVEGACIÓN
// =====================================================

function abrirUsuarios() {

    window.location.href =
        "usuarios.html";

}


function abrirMovilidad() {

    window.location.href =
        "../modulos/movilidad/mapa.html";

}


function abrirFiscalizacion() {

    window.location.href =
        "../modulos/fiscalizacion/inspecciones.html";

}


// =====================================================
// MOSTRAR
// =====================================================

function mostrar(elemento) {

    if (elemento) {

        elemento.style.display = "";

    }

}


// =====================================================
// OCULTAR
// =====================================================

function ocultar(elemento) {

    if (elemento) {

        elemento.style.display = "none";

    }

}


// =====================================================
// NORMALIZAR ROL
// =====================================================

function normalizarRol(valor) {

    return String(valor || "")

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .toLowerCase()

        .trim();

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function esc(valor) {

    return String(valor || "")

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


// =====================================================
// CERRAR SESIÓN
// =====================================================

function cerrarSesion() {

    localStorage.removeItem(
        "usuarioActual"
    );


    window.location.href =
        "../index.html";

}


// =====================================================
// DEBUG
// =====================================================

window.debugDashboard =
    function() {

        console.log(
            "Usuario:",
            usuario
        );

        console.log(
            "Rol:",
            usuario
                ? usuario.rol
                : "sin usuario"
        );

    };