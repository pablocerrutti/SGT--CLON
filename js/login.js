//======================================================
// SGT
// LOGIN
//======================================================

const formulario = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

//======================================================

formulario.addEventListener("submit", async function (e) {

    e.preventDefault();

    mensaje.style.color = "#17375e";
    mensaje.innerHTML = "Validando credenciales...";

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value.trim();

    if (usuario === "" || password === "") {

        mensaje.style.color = "#ef4444";
        mensaje.innerHTML = "Complete usuario y contraseña.";

        return;

    }

    try {

        const respuesta = await apiLogin(usuario, password);

        if (!respuesta.ok) {

            mensaje.style.color = "#ef4444";
            mensaje.innerHTML = respuesta.mensaje;

            return;

        }

        localStorage.setItem(

            "usuarioActual",

            JSON.stringify(respuesta.usuario)

        );

        mensaje.style.color = "#22c55e";
        mensaje.innerHTML = "Acceso concedido...";

        setTimeout(function () {

            window.location.href = "pages/dashboard.html";

        }, 700);

    }

    catch (error) {

        console.error(error);

        mensaje.style.color = "#ef4444";
        mensaje.innerHTML = "No fue posible conectar con el servidor.";

    }

});

//======================================================

// No redirigir por una sesión local previa: sólo después del login validado.
