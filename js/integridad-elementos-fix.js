// SGT - INTEGRIDAD DE ELEMENTOS
// Valida geometrías especiales ANTES de renderizar mapa/informes.
(function(){
'use strict';
function clave(v){return String(v||'').trim().toUpperCase();}
function tipo(v){return String(v||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
function especial(e){let t=tipo(e&&e.tipo);return t==='CORDON ROJO'||t==='ESTACIONAMIENTO TARIFADO';}
async function actuales(){
 let r={cordones:new Set(),zonas:new Set(),cordonesOK:false,zonasOK:false};
 try{if(typeof window.apiObtenerCordonesRojos==='function'){let x=await window.apiObtenerCordonesRojos();if(x&&x.ok&&Array.isArray(x.datos)){r.cordonesOK=true;x.datos.forEach(e=>{let i=clave(e.id),c=clave(e.codigo);if(i)r.cordones.add('ID:'+i);if(c)r.cordones.add('CODIGO:'+c);});}}}catch(e){console.warn('Integridad cordones:',e);}
 try{if(typeof window.apiObtenerZonasEstacionamiento==='function'){let x=await window.apiObtenerZonasEstacionamiento();if(x&&x.ok&&Array.isArray(x.datos)){r.zonasOK=true;x.datos.forEach(e=>{let i=clave(e.id),c=clave(e.codigo);if(i)r.zonas.add('ID:'+i);if(c)r.zonas.add('CODIGO:'+c);});}}}catch(e){console.warn('Integridad estacionamiento:',e);}
 return r;
}
async function filtrar(lista){
 if(!Array.isArray(lista)||!lista.length)return lista||[];
 let r=await actuales();
 return lista.filter(function(e){
  if(!especial(e))return true;
  let t=tipo(e.tipo), id=clave(e.id), c=clave(e.codigo);
  if(t==='CORDON ROJO'){
   if(!r.cordonesOK)return true;
   return !!((id&&r.cordones.has('ID:'+id))||(c&&r.cordones.has('CODIGO:'+c)));
  }
  if(!r.zonasOK)return true;
  return !!((id&&r.zonas.has('ID:'+id))||(c&&r.zonas.has('CODIGO:'+c)));
 });
}
window.SGTFiltrarElementosActuales=filtrar;
function instalarMapa(){
 if(typeof window.renderizarMapaCompleto!=='function')return false;
 if(window.__sgtMapaIntegridad)return true;
 let original=window.renderizarMapaCompleto;
 window.renderizarMapaCompleto=async function(){
  try{if(typeof elementos!=='undefined')elementos=await filtrar(elementos);}catch(e){console.warn('Integridad mapa:',e);}
  return original.apply(this,arguments);
 };
 window.__sgtMapaIntegridad=true;
 return true;
}
function instalarInformes(){
 if(typeof window.renderizar!=='function')return false;
 if(window.__sgtInformesIntegridad)return true;
 let original=window.renderizar;
 window.renderizar=async function(){
  try{if(typeof elementos!=='undefined')elementos=await filtrar(elementos);}catch(e){console.warn('Integridad informes:',e);}
  return original.apply(this,arguments);
 };
 window.__sgtInformesIntegridad=true;
 return true;
}
function instalar(){
 let m=instalarMapa(), i=instalarInformes();
 if(!m&&!i)setTimeout(instalar,50);
}
instalar();
})();
