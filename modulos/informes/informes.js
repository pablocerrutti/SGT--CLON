//==================================================
// SGT - INFORMES
// Listado de elementos, zonas tarifadas y cordones
//==================================================

let elementos = [];
let elementosFiltrados = [];
let usuario = null;


//==================================================
// INICIO
//==================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


async function iniciar(){

    try{

        usuario = JSON.parse(
            localStorage.getItem("usuarioActual")
        );

    }
    catch(error){

        usuario = null;

    }

    if(!usuario){

        location.href = "../../index.html";

        return;

    }

    document.getElementById("usuarioNombre").textContent =
        usuario.nombre || usuario.usuario || "";

    document.getElementById("btnPDF").onclick = generarPDF;

    document.getElementById("btnVolver").onclick = function(){
        location.href = "../movilidad/mapa.html";
    };

    document.getElementById("btnActualizar").onclick = cargarElementos;

    ["buscar", "filtroTipo", "filtroEstado", "filtroLocalidad"]
        .forEach(function(id){

            const control = document.getElementById(id);

            if(control){

                control.addEventListener(
                    id === "buscar" ? "input" : "change",
                    renderizar
                );

            }

        });

    await cargarElementos();

}


//==================================================
// CARGAR DATOS
//==================================================

async function cargarElementos(){

    mensaje("Cargando elementos...", "");

    try{

        const respuestas = await Promise.all([
            apiObtenerElementos(),
            apiObtenerCatalogoElementosInformables()
        ]);

        const respuestaElementos = respuestas[0];
        const respuestaGeometrias = respuestas[1];

        if(!respuestaElementos || !respuestaElementos.ok){

            throw new Error(
                respuestaElementos?.mensaje ||
                "No se pudieron cargar los elementos."
            );

        }

        const elementosNormales =
            (respuestaElementos.datos || [])
            .map(normalizarElementoNormal);

        const elementosGeometricos =
            respuestaGeometrias && respuestaGeometrias.ok
            ? (respuestaGeometrias.datos || []).map(normalizarElementoGeometrico)
            : [];

        elementos = elementosNormales.concat(elementosGeometricos);

        cargarFiltros();

        renderizar();

    }
    catch(error){

        console.error("Error cargando informe:", error);

        mensaje(
            error.message || "No se pudieron cargar los elementos.",
            "error"
        );

    }

}


function normalizarElementoNormal(elemento){

    const localidad =
        elemento.localidadNombre ||
        elemento.localidad ||
        elemento.nombreLocalidad ||
        "";

    return {
        id: elemento.id || "",
        codigo: elemento.codigo || "",
        localidad: localidad,
        tipo: elemento.tipo || "Sin tipo",
        nombre: elemento.nombre || "",
        direccion: elemento.direccion || "",
        estado: elemento.estado || "Sin estado",
        coordenadas: coordenadasPunto(elemento)
    };

}


function normalizarElementoGeometrico(elemento){

    const esZona =
        elemento.tipoElemento === "ZONA_ESTACIONAMIENTO";

    return {
        id: elemento.id || "",
        codigo: elemento.codigo || "",
        localidad: elemento.localidad || "",
        tipo: esZona
            ? "Zona de estacionamiento tarifado"
            : "Cordón rojo",
        nombre: elemento.nombre || "",
        direccion: esZona
            ? "Línea"
            : "Línea",
        estado: "Activo",
        coordenadas: coordenadasGeometria(elemento.coordenadas)
    };

}


//==================================================
// FILTROS
//==================================================

function cargarFiltros(){

    const tipoActual = document.getElementById("filtroTipo").value;
    const estadoActual = document.getElementById("filtroEstado").value;
    const localidadActual = document.getElementById("filtroLocalidad").value;

    cargarOpciones(
        "filtroTipo",
        "Todos los tipos",
        elementos.map(function(elemento){ return elemento.tipo; }),
        tipoActual
    );

    cargarOpciones(
        "filtroEstado",
        "Todos los estados",
        elementos.map(function(elemento){ return elemento.estado; }),
        estadoActual
    );

    cargarOpciones(
        "filtroLocalidad",
        "Todas las localidades",
        elementos.map(function(elemento){ return elemento.localidad; }),
        localidadActual
    );

}


function cargarOpciones(id, etiquetaInicial, valores, valorSeleccionado){

    const select = document.getElementById(id);

    if(!select){
        return;
    }

    select.innerHTML = "";
    select.add(new Option(etiquetaInicial, ""));

    [...new Set(
        valores
            .map(function(valor){ return String(valor || "").trim(); })
            .filter(Boolean)
    )]
        .sort(function(a, b){
            return a.localeCompare(b, "es", { sensitivity: "base" });
        })
        .forEach(function(valor){
            select.add(new Option(valor, valor));
        });

    if([...select.options].some(function(opcion){
        return opcion.value === valorSeleccionado;
    })){
        select.value = valorSeleccionado;
    }

}


//==================================================
// TABLA
//==================================================

function renderizar(){

    const tabla = document.getElementById("tablaElementos");

    if(!tabla){
        return;
    }

    tabla.innerHTML = "";

    const texto = normalizar(document.getElementById("buscar").value);
    const tipo = document.getElementById("filtroTipo").value;
    const estado = document.getElementById("filtroEstado").value;
    const localidad = document.getElementById("filtroLocalidad").value;

    elementosFiltrados = elementos.filter(function(elemento){

        if(tipo && elemento.tipo !== tipo){
            return false;
        }

        if(estado && elemento.estado !== estado){
            return false;
        }

        if(localidad && normalizar(elemento.localidad) !== normalizar(localidad)){
            return false;
        }

        return normalizar([
            elemento.codigo,
            elemento.localidad,
            elemento.tipo,
            elemento.nombre,
            elemento.direccion,
            elemento.estado,
            elemento.coordenadas
        ].join(" ")).includes(texto);

    });

    elementosFiltrados.forEach(function(elemento){

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${esc(elemento.codigo)}</td>
            <td>${esc(elemento.localidad || "Sin localidad")}</td>
            <td>${esc(elemento.tipo)}</td>
            <td>${esc(elemento.nombre)}</td>
            <td>${esc(elemento.direccion || "-")}</td>
            <td>${esc(elemento.estado)}</td>
            <td>${esc(elemento.coordenadas || "-")}</td>
        `;

        tabla.appendChild(fila);

    });

    mensaje(
        elementosFiltrados.length + " elementos encontrados.",
        "exito"
    );

}


//==================================================
// PDF
//==================================================

function generarPDF(){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    const localidad = document.getElementById("filtroLocalidad").value || "Todas";
    const tipo = document.getElementById("filtroTipo").value || "Todos";

    doc.setFontSize(18);
    doc.text("SGT - Informe de elementos", 14, 20);

    doc.setFontSize(10);
    doc.text("Localidad: " + localidad, 14, 30);
    doc.text("Tipo: " + tipo, 14, 37);
    doc.text("Fecha: " + new Date().toLocaleDateString(), 14, 44);

    doc.autoTable({
        startY: 52,
        head: [[
            "Código",
            "Localidad",
            "Tipo",
            "Nombre",
            "Dirección",
            "Estado",
            "Coordenadas"
        ]],
        body: elementosFiltrados.map(function(elemento){
            return [
                elemento.codigo,
                elemento.localidad || "Sin localidad",
                elemento.tipo,
                elemento.nombre,
                elemento.direccion || "-",
                elemento.estado,
                elemento.coordenadas || "-"
            ];
        }),
        styles: {
            fontSize: 7
        }
    });

    doc.save("Informe_SGT_" + localidad + ".pdf");

}


//==================================================
// UTILIDADES
//==================================================

function coordenadasPunto(elemento){

    const lat = elemento.latitud || elemento.lat || "";
    const lng = elemento.longitud || elemento.lng || "";

    return lat !== "" && lng !== ""
        ? lat + ", " + lng
        : "";

}


function coordenadasGeometria(valor){

    try{

        const puntos = typeof valor === "string" ? JSON.parse(valor) : valor;

        return Array.isArray(puntos)
            ? puntos.length + " puntos"
            : "";

    }
    catch(error){

        return "";

    }

}


function normalizar(texto){

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function esc(valor){

    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function mensaje(texto, clase){

    const elemento = document.getElementById("mensaje");

    if(!elemento){
        return;
    }

    elemento.textContent = texto;
    elemento.className = clase || "";

}
