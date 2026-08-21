/*******************************************************
 SGT
 CONFIGURACIÓN GENERAL
********************************************************/

const CONFIG = {

  NOMBRE_SISTEMA: "SGT",

  VERSION: "1.0",

  SHEET_ID: "1DX0h1qcETpRUL_dwiEq6k6i0VS43YLrfK3ei5YXTuwU",

  DRIVE_ID: "1sUXE34S_Vnt2c55HmkB3M9l18tPXfZJP"

};

//======================================================
// ABRIR BASE DE DATOS
//======================================================

function bd(){

  return SpreadsheetApp.openById(CONFIG.SHEET_ID);

}

//======================================================
// CARPETA DE FOTOS
//======================================================

function carpetaFotos(){

  return DriveApp.getFolderById(CONFIG.DRIVE_ID);

}

//======================================================
// GENERADOR DE ID
//======================================================

function generarID(prefijo){

  return prefijo + "-" + new Date().getTime();

}

//======================================================
// FECHA
//======================================================

function fecha(){

  return Utilities.formatDate(

    new Date(),

    Session.getScriptTimeZone(),

    "dd/MM/yyyy HH:mm:ss"

  );

}