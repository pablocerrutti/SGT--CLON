//==================================================
// SGT - INFORMES
// Solo elementos actuales (activos) de la hoja Elementos.
// Las hojas de geometrías solo completan información de
// elementos que ya existen actualmente en Elementos.
//==================================================

let elementos = [];
let elementosFiltrados = [];
let usuario = null;

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar(){
    try { usuario = JSON.parse(localStorage.getItem("usuarioActual")); }
    catch(error) { usuario = null; }
    if(!usuario){ location.href = "../../index.html"; return; }

    const usuarioNombre = document.getElementById("usuarioNombre");
    if(usuarioNombre) usuarioNombre.textContent = usuario.nombre || usuario.usuario || "";

    document.getElementById("btnPDF").onclick = generarPDF;
    document.getElementById("btnVolver").onclick = function(){ location.href = "../movilidad/mapa.html"; };
    document.getElementById("btnActualizar").onclick = cargarElementos;

    ["buscar", "filtroTipo", "filtroEstado", "filtroLocalidad"].forEach(function(id){
        const control = document.getElementById(id);
        if(control) control.addEventListener(id === "buscar" ? "input" : "change", renderizar);
    });

    await cargarElementos();
}

async function cargarElementos(){
    mensaje("Cargando elementos actuales...", "");
    try{
        // NO utilizar obtenerCatalogoElementosInformables:
        // esa acción no está publicada en la implementación actual
        // de Apps Script y provocaba el error HTTP 404.
        // Consultamos directamente las tres fuentes existentes.
        const respuestas = await Promise.all([
            apiObtenerElementos(),
            apiObtenerCordonesRojos(),
            apiObtenerZonasEstacionamiento()
        ]);

        const respuestaElementos = respuestas[0];
        const respuestaCordones = respuestas[1];
        const respuestaZonas = respuestas[2];

        if(!respuestaElementos || !respuestaElementos.ok){
            throw new Error(respuestaElementos?.mensaje || "No se pudieron cargar los elementos.");
        }

        const normales = (respuestaElementos.datos || [])
            .map(normalizarElementoNormal)
            .filter(esElementoActual);

        // Las geometrías se consultan directamente. Si una hoja no responde,
        // no impedimos que se muestren los elementos normales.
        const geometricos = [];

        if(respuestaCordones && respuestaCordones.ok && Array.isArray(respuestaCordones.datos)){
            respuestaCordones.datos.forEach(function(e){
                geometricos.push(normalizarElementoGeometrico(Object.assign({}, e, {
                    tipo: "Cordón Rojo",
                    tipoElemento: "CORDON_ROJO"
                })));
            });
        }

        if(respuestaZonas && respuestaZonas.ok && Array.isArray(respuestaZonas.datos)){
            respuestaZonas.datos.forEach(function(e){
                geometricos.push(normalizarElementoGeometrico(Object.assign({}, e, {
                    tipo: "Estacionamiento Tarifado",
                    tipoElemento: "ZONA_ESTACIONAMIENTO"
                })));
            });
        }

        elementos = fusionarElementosInformables(normales, geometricos);
        cargarFiltros();
        renderizar();
    }
    catch(error){
        console.error("Error cargando informe:", error);
        mensaje(error.message || "No se pudieron cargar los elementos.", "error");
    }
}

function esElementoActual(elemento){
    const activo = normalizar(elemento.activo || "");
    return activo === "si" || activo === "sí" || activo === "yes" ||
           activo === "true" || activo === "verdadero" ||
           activo === "activo" || activo === "1";
}

function normalizarElementoNormal(elemento){
    const localidad = elemento.localidadNombre || elemento.localidad || elemento.nombreLocalidad || elemento.ciudad || "";
    return {
        id: elemento.id || "",
        codigo: elemento.codigo || "",
        localidad: localidad,
        ciudad: elemento.ciudad || localidad,
        zona: elemento.zona || "",
        tipo: elemento.tipo || "Sin tipo",
        nombre: elemento.nombre || "",
        descripcion: elemento.descripcion || "",
        direccion: elemento.direccion || "",
        estado: elemento.estado || "Sin estado",
        caracteristicas: elemento.caracteristicas || "",
        activo: elemento.activo || "",
        coordenadas: coordenadasPunto(elemento)
    };
}

function normalizarElementoGeometrico(elemento){
    const tipoNormalizado = normalizar(elemento.tipo || elemento.tipoElemento || "");
    const esZona = elemento.tipoElemento === "ZONA_ESTACIONAMIENTO" ||
        tipoNormalizado === "estacionamiento tarifado" ||
        tipoNormalizado === "zona de estacionamiento tarifado";

    return {
        id: elemento.id || "",
        codigo: elemento.codigo || "",
        localidad: elemento.localidad || elemento.localidadNombre || "",
        ciudad: elemento.ciudad || elemento.localidad || "",
        zona: elemento.zona || "",
        tipo: esZona ? "Estacionamiento Tarifado" : "Cordón Rojo",
        nombre: elemento.nombre || "",
        descripcion: elemento.descripcion || "",
        direccion: elemento.direccion || "",
        estado: elemento.estado || "Activo",
        caracteristicas: elemento.caracteristicas || "",
        activo: elemento.activo || "SI",
        coordenadas: coordenadasGeometria(elemento.coordenadas)
    };
}

function fusionarElementosInformables(normales, geometricos){
    const resultado = [];
    const porClave = new Map();

    normales.forEach(function(elemento){
        const id = String(elemento.id || "").trim();
        const codigo = String(elemento.codigo || "").trim().toUpperCase();
        const copia = Object.assign({}, elemento);
        resultado.push(copia);
        if(id) porClave.set("ID:" + id, copia);
        if(codigo) porClave.set("CODIGO:" + codigo, copia);
    });

    geometricos.forEach(function(geometria){
        const id = String(geometria.id || "").trim();
        const codigo = String(geometria.codigo || "").trim().toUpperCase();
        const existente = (id && porClave.get("ID:" + id)) || (codigo && porClave.get("CODIGO:" + codigo));

        // Una geometría sin correspondencia en Elementos NO es un elemento actual.
        if(!existente) return;

        if(geometria.coordenadas) existente.coordenadas = geometria.coordenadas;
        ["localidad", "ciudad", "zona", "descripcion", "direccion", "caracteristicas", "estado"].forEach(function(campo){
            if(!existente[campo] && geometria[campo]) existente[campo] = geometria[campo];
        });
    });

    return resultado;
}

function cargarFiltros(){
    const tipoActual = document.getElementById("filtroTipo").value;
    const estadoActual = document.getElementById("filtroEstado").value;
    const localidadActual = document.getElementById("filtroLocalidad").value;
    cargarOpciones("filtroTipo", "Todos los tipos", elementos.map(e => e.tipo), tipoActual);
    cargarOpciones("filtroEstado", "Todos los estados", elementos.map(e => e.estado), estadoActual);
    cargarOpciones("filtroLocalidad", "Todas las localidades", elementos.map(e => e.localidad), localidadActual);
}

function cargarOpciones(id, etiquetaInicial, valores, valorSeleccionado){
    const select = document.getElementById(id);
    if(!select) return;
    select.innerHTML = "";
    select.add(new Option(etiquetaInicial, ""));
    [...new Set(valores.map(v => String(v || "").trim()).filter(Boolean))]
        .sort((a,b) => a.localeCompare(b, "es", {sensitivity:"base"}))
        .forEach(valor => select.add(new Option(valor, valor)));
    if([...select.options].some(opcion => opcion.value === valorSeleccionado)) select.value = valorSeleccionado;
}

function renderizar(){
    const tabla = document.getElementById("tablaElementos");
    if(!tabla) return;
    tabla.innerHTML = "";
    const texto = normalizar(document.getElementById("buscar").value);
    const tipo = document.getElementById("filtroTipo").value;
    const estado = document.getElementById("filtroEstado").value;
    const localidad = document.getElementById("filtroLocalidad").value;

    elementosFiltrados = elementos.filter(function(elemento){
        if(!esElementoActual(elemento)) return false;
        if(tipo && normalizar(elemento.tipo) !== normalizar(tipo)) return false;
        if(estado && normalizar(elemento.estado) !== normalizar(estado)) return false;
        if(localidad && normalizar(elemento.localidad) !== normalizar(localidad)) return false;
        return normalizar([
            elemento.codigo, elemento.localidad, elemento.ciudad, elemento.zona,
            elemento.tipo, elemento.nombre, elemento.descripcion, elemento.direccion,
            elemento.estado, elemento.caracteristicas, elemento.coordenadas
        ].join(" ")).includes(texto);
    });

    elementosFiltrados.forEach(function(elemento){
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${esc(elemento.codigo)}</td>
            <td>${esc(elemento.localidad || "Sin localidad")}</td>
            <td>${esc(elemento.tipo)}</td>
            <td>${esc(elemento.nombre)}</td>
            <td>${esc(elemento.descripcion || "-")}</td>
            <td>${esc(elemento.direccion || "-")}</td>
            <td>${esc(elemento.caracteristicas || "-")}</td>
            <td>${esc(elemento.estado)}</td>
            <td>${esc(elemento.coordenadas || "-")}</td>
        `;
        tabla.appendChild(fila);
    });
    mensaje(elementosFiltrados.length + " elementos actuales encontrados.", "exito");
}

function generarPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({orientation:"landscape"});
    const localidad = document.getElementById("filtroLocalidad").value || "Todas";
    const tipo = document.getElementById("filtroTipo").value || "Todos";
    doc.setFontSize(18);
    doc.text("SGT - Informe de elementos", 14, 20);
    doc.setFontSize(10);
    doc.text("Localidad: " + localidad, 14, 30);
    doc.text("Tipo: " + tipo, 14, 37);
    doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 44);
    doc.autoTable({
        startY:52,
        head:[["Código","Localidad","Tipo","Nombre","Descripción","Dirección","Características","Estado","Coordenadas"]],
        body:elementosFiltrados.map(function(elemento){
            return [elemento.codigo, elemento.localidad || "Sin localidad", elemento.tipo,
                elemento.nombre, elemento.descripcion || "-", elemento.direccion || "-",
                elemento.caracteristicas || "-", elemento.estado, elemento.coordenadas || "-"];
        }),
        styles:{fontSize:6},
        headStyles:{fontSize:6}
    });
    doc.save("Informe_SGT_" + localidad + ".pdf");
}

function coordenadasPunto(elemento){
    const lat = elemento.latitud || elemento.lat || "";
    const lng = elemento.longitud || elemento.lng || "";
    return lat !== "" && lng !== "" ? lat + ", " + lng : "";
}

function coordenadasGeometria(valor){
    try{
        const puntos = typeof valor === "string" ? JSON.parse(valor) : valor;
        if(!Array.isArray(puntos) || !puntos.length) return "";
        return puntos.map(function(punto){
            if(!Array.isArray(punto) || punto.length < 2) return "";
            return Number(punto[0]).toFixed(6) + ", " + Number(punto[1]).toFixed(6);
        }).filter(Boolean).join(" → ");
    }catch(error){ return ""; }
}

function normalizar(texto){
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function esc(valor){
    return String(valor || "")
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function mensaje(texto, clase){
    const elemento = document.getElementById("mensaje");
    if(!elemento) return;
    elemento.textContent = texto;
    elemento.className = clase || "";
}
