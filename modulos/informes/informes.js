//==================================================
// SGT - INFORMES
// Fuente única: catálogo actual del servidor.
// Nunca usa datos antiguos de localStorage ni fusiona
// geometrías con registros históricos.
//==================================================

let elementos = [];
let elementosFiltrados = [];
let usuario = null;

document.addEventListener('DOMContentLoaded', iniciar);

async function iniciar() {
    try { usuario = JSON.parse(localStorage.getItem('usuarioActual')); }
    catch (_) { usuario = null; }

    if (!usuario) {
        location.href = '../../index.html';
        return;
    }

    const usuarioNombre = document.getElementById('usuarioNombre');
    if (usuarioNombre) usuarioNombre.textContent = usuario.nombre || usuario.usuario || '';

    const btnPDF = document.getElementById('btnPDF');
    const btnVolver = document.getElementById('btnVolver');
    const btnActualizar = document.getElementById('btnActualizar');

    if (btnPDF) btnPDF.onclick = generarPDF;
    if (btnVolver) btnVolver.onclick = function () { location.href = '../movilidad/mapa.html'; };
    if (btnActualizar) btnActualizar.onclick = cargarElementos;

    ['buscar', 'filtroTipo', 'filtroEstado', 'filtroLocalidad'].forEach(function (id) {
        const control = document.getElementById(id);
        if (control) control.addEventListener(id === 'buscar' ? 'input' : 'change', renderizar);
    });

    await cargarElementos();
}


//==================================================
// CARGA: SOLO DATOS ACTUALES DEL SERVIDOR
//==================================================

async function cargarElementos() {
    mensaje('Cargando elementos actuales...', '');

    try {
        const respuesta = await apiObtenerCatalogoElementosInformables();

        if (!respuesta || !respuesta.ok) {
            throw new Error(
                (respuesta && respuesta.mensaje) ||
                'No se pudieron cargar los elementos actuales.'
            );
        }

        elementos = (Array.isArray(respuesta.datos) ? respuesta.datos : [])
            .map(normalizarElemento)
            .filter(esElementoActual);

        cargarFiltros();
        renderizar();

    } catch (error) {
        console.error('Error cargando informe:', error);
        elementos = [];
        elementosFiltrados = [];
        renderizar();
        mensaje(error.message || 'No se pudieron cargar los elementos.', 'error');
    }
}


function normalizarElemento(elemento) {
    elemento = elemento || {};

    let coordenadas = elemento.coordenadas || '';

    if (elemento.tipoElemento === 'ELEMENTO' && !coordenadas) {
        const lat = elemento.latitud || elemento.lat || '';
        const lng = elemento.longitud || elemento.lng || '';
        if (lat !== '' && lng !== '') coordenadas = lat + ', ' + lng;
    }

    if (Array.isArray(coordenadas)) {
        coordenadas = coordenadasGeometria(coordenadas);
    }

    return {
        id: String(elemento.id || '').trim(),
        codigo: String(elemento.codigo || '').trim(),
        tipo: String(elemento.tipo || tipoDesdeElemento(elemento) || 'Sin tipo').trim(),
        nombre: String(elemento.nombre || '').trim(),
        descripcion: String(elemento.descripcion || '').trim(),
        direccion: String(elemento.direccion || '').trim(),
        estado: String(elemento.estado || '').trim(),
        caracteristicas: String(elemento.caracteristicas || '').trim(),
        localidad: String(
            elemento.localidad ||
            elemento.localidadNombre ||
            elemento.nombreLocalidad ||
            elemento.ciudad ||
            ''
        ).trim(),
        coordenadas: String(coordenadas || '').trim(),
        activo: String(elemento.activo || 'SI').trim(),
        tipoElemento: String(elemento.tipoElemento || '').trim()
    };
}

function tipoDesdeElemento(elemento) {
    const tipoElemento = String(elemento.tipoElemento || '').toUpperCase();
    if (tipoElemento === 'ZONA_ESTACIONAMIENTO') return 'Estacionamiento Tarifado';
    if (tipoElemento === 'CORDON_ROJO') return 'Cordón Rojo';
    return '';
}

function esElementoActual(elemento) {
    const activo = normalizar(elemento.activo || '');
    return ['si', 'sí', 'yes', 'true', 'verdadero', 'activo', '1'].indexOf(activo) !== -1;
}


//==================================================
// FILTROS
//==================================================

function cargarFiltros() {
    const tipoActual = valorSelect('filtroTipo');
    const estadoActual = valorSelect('filtroEstado');
    const localidadActual = valorSelect('filtroLocalidad');

    cargarOpciones('filtroTipo', 'Todos los tipos', elementos.map(e => e.tipo), tipoActual);
    cargarOpciones('filtroEstado', 'Todos los estados', elementos.map(e => e.estado), estadoActual);
    cargarOpciones('filtroLocalidad', 'Todas las localidades', elementos.map(e => e.localidad), localidadActual);
}

function valorSelect(id) {
    const elemento = document.getElementById(id);
    return elemento ? elemento.value : '';
}

function cargarOpciones(id, etiquetaInicial, valores, valorSeleccionado) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '';
    select.add(new Option(etiquetaInicial, ''));

    const mapa = {};

    (valores || []).forEach(function (valor) {
        const texto = String(valor || '').replace(/\s+/g, ' ').trim();
        if (!texto) return;
        const clave = normalizar(texto);
        if (!mapa[clave]) mapa[clave] = texto;
    });

    Object.keys(mapa)
        .map(function (clave) { return mapa[clave]; })
        .sort(function (a, b) { return a.localeCompare(b, 'es', { sensitivity: 'base' }); })
        .forEach(function (valor) {
            select.add(new Option(valor, valor));
        });

    const buscado = normalizar(valorSeleccionado || '');
    Array.from(select.options).some(function (opcion) {
        if (normalizar(opcion.value) === buscado) {
            select.value = opcion.value;
            return true;
        }
        return false;
    });
}


//==================================================
// TABLA
//==================================================

function renderizar() {
    const tabla = document.getElementById('tablaElementos');
    if (!tabla) return;

    tabla.innerHTML = '';

    const buscar = document.getElementById('buscar');
    const filtroTipo = document.getElementById('filtroTipo');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroLocalidad = document.getElementById('filtroLocalidad');

    const texto = normalizar(buscar ? buscar.value : '');
    const tipo = filtroTipo ? filtroTipo.value : '';
    const estado = filtroEstado ? filtroEstado.value : '';
    const localidad = filtroLocalidad ? filtroLocalidad.value : '';

    elementosFiltrados = elementos.filter(function (elemento) {
        if (!esElementoActual(elemento)) return false;
        if (tipo && normalizar(elemento.tipo) !== normalizar(tipo)) return false;
        if (estado && normalizar(elemento.estado) !== normalizar(estado)) return false;
        if (localidad && normalizar(elemento.localidad) !== normalizar(localidad)) return false;

        if (!texto) return true;

        return normalizar([
            elemento.codigo,
            elemento.localidad,
            elemento.tipo,
            elemento.nombre,
            elemento.descripcion,
            elemento.direccion,
            elemento.estado,
            elemento.caracteristicas,
            elemento.coordenadas
        ].join(' ')).includes(texto);
    });

    elementosFiltrados.forEach(function (elemento) {
        const fila = document.createElement('tr');

        fila.innerHTML =
            '<td>' + esc(elemento.codigo) + '</td>' +
            '<td>' + esc(elemento.localidad || 'Sin localidad') + '</td>' +
            '<td>' + esc(elemento.tipo || '-') + '</td>' +
            '<td>' + esc(elemento.nombre || '-') + '</td>' +
            '<td>' + esc(elemento.descripcion || '-') + '</td>' +
            '<td>' + esc(elemento.direccion || '-') + '</td>' +
            '<td>' + esc(elemento.caracteristicas || '-') + '</td>' +
            '<td>' + esc(elemento.estado || '-') + '</td>' +
            '<td>' + esc(elemento.coordenadas || '-') + '</td>';

        tabla.appendChild(fila);
    });

    mensaje(
        elementosFiltrados.length +
        ' elementos actuales encontrados.',
        'exito'
    );
}


//==================================================
// PDF
//==================================================

function generarPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        mensaje('No se pudo cargar el generador PDF.', 'error');
        return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({ orientation: 'landscape' });

    const localidad = valorSelect('filtroLocalidad') || 'Todas';
    const tipo = valorSelect('filtroTipo') || 'Todos';

    doc.setFontSize(18);
    doc.text('SGT - Informe de elementos actuales', 14, 20);

    doc.setFontSize(10);
    doc.text('Localidad: ' + localidad, 14, 30);
    doc.text('Tipo: ' + tipo, 14, 37);
    doc.text('Fecha: ' + new Date().toLocaleDateString(), 14, 44);

    doc.autoTable({
        startY: 52,
        head: [[
            'Código',
            'Localidad',
            'Tipo',
            'Nombre',
            'Descripción',
            'Dirección',
            'Características',
            'Estado',
            'Coordenadas'
        ]],
        body: elementosFiltrados.map(function (elemento) {
            return [
                elemento.codigo,
                elemento.localidad || 'Sin localidad',
                elemento.tipo,
                elemento.nombre,
                elemento.descripcion || '-',
                elemento.direccion || '-',
                elemento.caracteristicas || '-',
                elemento.estado || '-',
                elemento.coordenadas || '-'
            ];
        }),
        styles: { fontSize: 6 },
        headStyles: { fontSize: 6 }
    });

    doc.save('Informe_SGT_' + localidad + '.pdf');
}


//==================================================
// UTILIDADES
//==================================================

function coordenadasGeometria(valor) {
    try {
        const puntos = typeof valor === 'string' ? JSON.parse(valor) : valor;
        if (!Array.isArray(puntos) || !puntos.length) return '';

        return puntos.map(function (punto) {
            if (!Array.isArray(punto) || punto.length < 2) return '';
            const lat = Number(punto[0]);
            const lng = Number(punto[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
            return lat.toFixed(6) + ', ' + lng.toFixed(6);
        }).filter(Boolean).join(' → ');
    } catch (_) {
        return String(valor || '');
    }
}

function normalizar(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function esc(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function mensaje(texto, clase) {
    const elemento = document.getElementById('mensaje');
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = clase || '';
}
