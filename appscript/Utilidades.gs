/********************************************************
 SGT
 FUNCIONES GENERALES
********************************************************/

function bd() {

  return SpreadsheetApp.openById(CONFIG.SHEET_ID);

}

/************************************************/

function hoja(nombre) {

  return bd().getSheetByName(nombre);

}

/************************************************/

function carpetaPrincipal() {

  return DriveApp.getFolderById(CONFIG.DRIVE_ID);

}

/************************************************/

function ahora() {

  return Utilities.formatDate(

    new Date(),

    Session.getScriptTimeZone(),

    "yyyy-MM-dd HH:mm:ss"

  );

}

/************************************************/

function generarID(prefijo) {

  return prefijo +

         Utilities.formatDate(

           new Date(),

           Session.getScriptTimeZone(),

           "yyyyMMddHHmmss"

         ) +

         "-" +

         Math.floor(Math.random()*900+100);

}

/************************************************/

function ok(datos) {

  return {

    ok:true,

    datos:datos

  };

}

/************************************************/

function error(mensaje) {

  return {

    ok:false,

    mensaje:mensaje

  };

}

/************************************************/

function buscarFila(hoja,id){

  const datos=hoja.getDataRange().getValues();

  for(let i=1;i<datos.length;i++){

      if(String(datos[i][0])===String(id)){

          return i+1;

      }

  }

  return -1;

}
