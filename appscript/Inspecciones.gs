/********************************************************
 * SGT
 * MODULO FISCALIZACION
 * ACTUACIONES DE TRANSITO
 *
 * Esta versión mantiene compatibilidad con el formulario
 * actual de Fiscalización y con registros antiguos.
 ********************************************************/


//======================================================
// HOJA INSPECCIONES
//======================================================

function hojaInspecciones_(){

  const ss = bd();

  let sh = ss.getSheetByName("Inspecciones");

  if(!sh){

    sh = ss.insertSheet("Inspecciones");

    sh.appendRow([
      "ID",
      "Elemento ID",
      "Código elemento",
      "Inspector",
      "Beta",
      "Fecha",
      "Matrícula",
      "Tipo actuación",
      "Número boleta",
      "Nombre infractor",
      "Cédula",
      "Incidencia",
      "Video URL",
      "Foto/boleta URL",
      "Estado",
      "Activo"
    ]);

    return sh;
  }

  // Compatibilidad: agrega columnas que puedan faltar
  // sin destruir los datos existentes.
  asegurarColumnasInspecciones_(sh);

  return sh;
}


//======================================================
// ASEGURAR COLUMNAS
//======================================================

function asegurarColumnasInspecciones_(sh){

  const requeridas = [
    "ID",
    "Elemento ID",
    "Código elemento",
    "Inspector",
    "Beta",
    "Fecha",
    "Matrícula",
    "Tipo actuación",
    "Número boleta",
    "Nombre infractor",
    "Cédula",
    "Incidencia",
    "Video URL",
    "Foto/boleta URL",
    "Estado",
    "Activo"
  ];

  const ultima = Math.max(sh.getLastColumn(),1);

  const encabezados = sh
    .getRange(1,1,1,ultima)
    .getDisplayValues()[0]
    .map(function(v){
      return String(v || "").trim();
    });

  if(!encabezados[0]){
    sh.getRange(1,1,1,requeridas.length)
      .setValues([requeridas]);
    return;
  }

  requeridas.forEach(function(nombre){

    if(encabezados.indexOf(nombre) === -1){

      sh.getRange(1,encabezados.length + 1)
        .setValue(nombre);

      encabezados.push(nombre);
    }
  });
}


//======================================================
// OBTENER INSPECCIONES
//======================================================

function obtenerInspecciones(e){

  try{

    const p = (e && e.parameter) || {};

    const id = String(p.id || "").trim();

    const sh = hojaInspecciones_();

    const ultimaFila = sh.getLastRow();
    const ultimaColumna = sh.getLastColumn();

    if(ultimaFila < 2){
      return {
        ok:true,
        datos:[]
      };
    }

    const valores = sh
      .getRange(1,1,ultimaFila,ultimaColumna)
      .getDisplayValues();

    const encabezados = valores[0].map(function(v){
      return String(v || "").trim();
    });

    const mapa = {};

    encabezados.forEach(function(v,i){
      mapa[v] = i;
    });

    function valor(fila,nombres){

      for(let i=0;i<nombres.length;i++){

        const idx = mapa[nombres[i]];

        if(idx !== undefined){
          return String(fila[idx] || "").trim();
        }
      }

      return "";
    }

    const datos = [];

    for(let i=1;i<valores.length;i++){

      const f = valores[i];

      const idRegistro = valor(f,["ID","Id","id"]);

      if(!idRegistro){
        continue;
      }

      const elementoId = valor(f,["Elemento ID"]);

      if(id && elementoId !== id){
        continue;
      }

      const activo = valor(f,["Activo"]);

      // Los registros antiguos con Activo vacío se consideran
      // válidos. Solo se excluyen los marcados explícitamente NO.
      if(["NO","N","FALSE","FALSO","0","INACTIVO"]
        .indexOf(activo.toUpperCase()) !== -1){
        continue;
      }

      const incidencia = valor(f,[
        "Incidencia",
        "Detalle",
        "Descripción",
        "Descripcion"
      ]);

      datos.push({

        id: idRegistro,

        elementoId: elementoId,

        codigoElemento: valor(f,[
          "Código elemento",
          "Codigo elemento"
        ]),

        inspector: valor(f,["Inspector"]),

        beta: valor(f,["Beta"]),

        fecha: valor(f,["Fecha"]),

        matricula: valor(f,[
          "Matrícula",
          "Matricula"
        ]),

        tipoActuacion: valor(f,[
          "Tipo actuación",
          "Tipo de actuación"
        ]),

        numeroBoleta: valor(f,[
          "Número boleta",
          "Numero boleta"
        ]),

        nombreInfractor: valor(f,[
          "Nombre infractor"
        ]),

        cedula: valor(f,["Cédula","Cedula"]),

        incidencia: incidencia,

        detalle: incidencia,

        videoUrl: valor(f,["Video URL"]),

        documentoUrl: valor(f,[
          "Foto/boleta URL",
          "Documento URL"
        ]),

        estado: valor(f,["Estado"]),

        activo: activo || "SI"
      });
    }

    return {
      ok:true,
      datos:datos
    };

  }
  catch(error){

    console.error("Error obtenerInspecciones:",error);

    return {
      ok:false,
      mensaje:
        "No fue posible obtener inspecciones: " +
        (error.message || error)
    };
  }
}


//======================================================
// GUARDAR ACTUACIÓN
//======================================================

function guardarInspeccion(e){

  const p = (e && e.parameter) || {};

  try{

    // El formulario actual de Fiscalización no trabaja con
    // Elemento ID. La actuación está asociada a la matrícula.
    // Por eso elementoId ya NO es obligatorio.

    const inspector = String(
      p.inspector ||
      "Inspector"
    ).trim();

    const beta = String(
      p.beta || ""
    ).trim();

    const matricula = String(
      p.matricula ||
      p.matriculaVehiculo ||
      ""
    ).trim().toUpperCase();

    const tipoActuacion = String(
      p.tipoActuacion ||
      p.tipo ||
      ""
    ).trim();

    const numeroBoleta = String(
      p.numeroBoleta ||
      ""
    ).trim();

    const nombreInfractor = String(
      p.nombreInfractor ||
      ""
    ).trim();

    const cedula = String(
      p.cedula || ""
    ).trim();

    const incidencia = String(
      p.detalle ||
      p.incidencia ||
      ""
    ).trim();

    const elementoId = String(
      p.elementoId || ""
    ).trim();

    const codigoElemento = String(
      p.codigoElemento || ""
    ).trim();

    const videoUrl = String(
      p.videoUrl || ""
    ).trim();

    const documentoUrl = String(
      p.documentoUrl ||
      p.fotoUrl ||
      ""
    ).trim();

    const estado = String(
      p.estado ||
      "Registrada"
    ).trim();


    //==================================================
    // VALIDACIONES
    //==================================================

    if(!matricula){
      return {
        ok:false,
        mensaje:"Debe ingresar la matrícula."
      };
    }

    if(!tipoActuacion){
      return {
        ok:false,
        mensaje:"Debe seleccionar el tipo de actuación."
      };
    }

    if(!nombreInfractor){
      return {
        ok:false,
        mensaje:"Debe ingresar el nombre del infractor."
      };
    }

    if(!cedula){
      return {
        ok:false,
        mensaje:"Debe ingresar la cédula de identidad."
      };
    }

    if(!incidencia){
      return {
        ok:false,
        mensaje:"Debe ingresar el detalle de la actuación."
      };
    }


    //==================================================
    // GUARDAR
    //==================================================

    const sh = hojaInspecciones_();

    const mapa = mapaColumnasInspecciones_(sh);

    const fila = new Array(
      sh.getLastColumn()
    ).fill("");

    const valores = {

      "ID": generarID("INS"),
      "Elemento ID": elementoId,
      "Código elemento": codigoElemento,
      "Inspector": inspector,
      "Beta": beta,
      "Fecha": ahoraSeguro_(),
      "Matrícula": matricula,
      "Tipo actuación": tipoActuacion,
      "Número boleta": numeroBoleta,
      "Nombre infractor": nombreInfractor,
      "Cédula": cedula,
      "Incidencia": incidencia,
      "Video URL": videoUrl,
      "Foto/boleta URL": documentoUrl,
      "Estado": estado,
      "Activo": "SI"
    };

    Object.keys(valores).forEach(function(campo){

      if(mapa[campo]){
        fila[mapa[campo]-1] = valores[campo];
      }
    });

    sh.appendRow(fila);

    SpreadsheetApp.flush();

    return {
      ok:true,
      mensaje:"Actuación registrada correctamente.",
      id:valores["ID"],
      datos:{
        id:valores["ID"],
        matricula:matricula,
        tipoActuacion:tipoActuacion,
        inspector:inspector,
        beta:beta,
        videoUrl:videoUrl,
        documentoUrl:documentoUrl
      }
    };

  }
  catch(error){

    console.error("Error guardarInspeccion:",error);

    return {
      ok:false,
      mensaje:
        "No fue posible guardar la actuación: " +
        (error.message || error)
    };
  }
}


//======================================================
// SUBIR ARCHIVO A DRIVE
//======================================================

function subirArchivo(e){

  const p = (e && e.parameter) || {};

  try{

    const base64 = String(
      p.archivoBase64 || ""
    ).trim();

    const nombreOriginal = String(
      p.nombreArchivo || ""
    ).trim();

    if(!base64){
      return {
        ok:false,
        mensaje:"No se recibió el contenido del archivo."
      };
    }

    if(!nombreOriginal){
      return {
        ok:false,
        mensaje:"No se recibió el nombre del archivo."
      };
    }

    const nombre = nombreOriginal
      .replace(/[\\/:*?"<>|]/g,"_");

    const mime = String(
      p.mimeType ||
      "application/octet-stream"
    );

    const bytes = Utilities.base64Decode(base64);

    const blob = Utilities.newBlob(
      bytes,
      mime,
      nombre
    );

    const carpeta = carpetaFotos();

    if(!carpeta){
      throw new Error(
        "No se pudo acceder a la carpeta de Drive configurada."
      );
    }

    const archivo = carpeta.createFile(blob);

    return {
      ok:true,
      url:archivo.getUrl(),
      id:archivo.getId(),
      nombre:archivo.getName(),
      mimeType:archivo.getMimeType(),
      size:archivo.getSize()
    };

  }
  catch(error){

    console.error("Error subirArchivo:",error);

    return {
      ok:false,
      mensaje:
        "No fue posible subir el archivo a Drive: " +
        (error.message || error)
    };
  }
}


//======================================================
// MAPA DE COLUMNAS
//======================================================

function mapaColumnasInspecciones_(sh){

  const encabezados = sh
    .getRange(
      1,
      1,
      1,
      sh.getLastColumn()
    )
    .getDisplayValues()[0];

  const mapa = {};

  encabezados.forEach(function(v,i){

    const nombre = String(v || "").trim();

    if(nombre){
      mapa[nombre] = i + 1;
    }
  });

  return mapa;
}


//======================================================
// FECHA SEGURA
//======================================================

function ahoraSeguro_(){

  if(typeof ahora === "function"){
    return ahora();
  }

  if(typeof fecha === "function"){
    return fecha();
  }

  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm:ss"
  );
}
