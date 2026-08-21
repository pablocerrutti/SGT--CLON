/********************************************************
 SGT
 SISTEMA DE GESTIÓN DE TRÁNSITO
 USUARIOS
********************************************************/

//======================================================
// LOGIN
//======================================================

function login(e) {

  const usuario = String(e.parameter.usuario || "").trim();
  const password = String(e.parameter.password || "").trim();

  const sh = hoja("Usuarios");
  const datos = sh.getDataRange().getValues();

  for (let i = 1; i < datos.length; i++) {

    const activo = String(datos[i][5]).trim().toUpperCase();

    if (
      String(datos[i][1]).trim() === usuario &&
      String(datos[i][2]).trim() === password &&
      activo === "SI"
    ) {

      return {

        ok: true,

        usuario: {

          id: datos[i][0],
          usuario: datos[i][1],
          nombre: datos[i][3],
          rol: datos[i][4]

        }

      };

    }

  }

  return {

    ok: false,

    mensaje: "Usuario o contraseña incorrectos."

  };

}

//======================================================
// OBTENER USUARIOS
//======================================================

function obtenerUsuarios() {

  const sh = hoja("Usuarios");

  const datos = sh.getDataRange().getValues();

  let lista = [];

  for (let i = 1; i < datos.length; i++) {

    lista.push({

      id: datos[i][0],
      usuario: datos[i][1],
      nombre: datos[i][3],
      rol: datos[i][4],
      activo: datos[i][5]

    });

  }

  return {

    ok: true,

    datos: lista

  };

}

//======================================================
// GUARDAR USUARIO
//======================================================

function guardarUsuario(e) {

  const d = (e && e.parameter) || {};

  if (!String(d.usuario || '').trim() || !String(d.password || '').trim() || !String(d.nombre || '').trim() || !String(d.rol || '').trim()) {
    return { ok:false, mensaje:'Complete todos los datos del usuario.' };
  }

  const sh = hoja("Usuarios");

  const id = generarID("USR");

  const existentes = sh.getDataRange().getValues();
  for (let i = 1; i < existentes.length; i++) {
    if (String(existentes[i][1]).trim().toLowerCase() === String(d.usuario).trim().toLowerCase()) return { ok:false, mensaje:'El nombre de usuario ya existe.' };
  }

  sh.appendRow([

    id,
    d.usuario,
    d.password,
    d.nombre,
    d.rol,
    "SI",
    ahora()

  ]);

  return {

    ok: true,

    mensaje: "Usuario creado correctamente."

  };

}

//======================================================
// ELIMINAR USUARIO
//======================================================

function eliminarUsuario(e) {

  const id = e.parameter.id;

  const sh = hoja("Usuarios");

  const datos = sh.getDataRange().getValues();

  for (let i = 1; i < datos.length; i++) {

    if (String(datos[i][0]) === String(id)) {

      sh.deleteRow(i + 1);

      return {

        ok: true,

        mensaje: "Usuario eliminado."

      };

    }

  }

  return {

    ok: false,

    mensaje: "Usuario no encontrado."

  };

}
