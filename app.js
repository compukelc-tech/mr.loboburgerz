// ============================================================================
// [FUNCIÓN: CONFIGURACIÓN INICIAL Y API]
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzgDF60bd19VZ-L2zF9x-VJW9XRzo1I3XvNQLXrOiE1hOsMjQdfNFjMI64_8y-SY2aKhQ/exec";
let pedidos = [];
const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// ============================================================================
// [FUNCIÓN: LECTURA DE DATOS VÍA FETCH API]
// ============================================================================
window.onload = function() {
  document.getElementById('cloudStatus').textContent = '☁️ Conectando con Google Sheets...';
  
  fetch(API_URL)
    .then(respuesta => respuesta.json())
    .then(data => actualizarPantalla(data))
    .catch(err => {
      document.getElementById('cloudStatus').textContent = '⚠️ Error de conexión con Sheets';
      console.error('Error cargando pedidos:', err);
    });
};

function actualizarPantalla(data) {
  pedidos = data || [];
  document.getElementById('cloudStatus').textContent = '☁️ Conectado — ' + pedidos.length + ' pedidos en Sheets';
  renderPedidos();
  renderStats();
}

// ============================================================================
// [FUNCIÓN: ESCRITURA DE DATOS VÍA FETCH API (POST)]
// Solución CORS: Enviamos los datos empaquetados como formulario URL encoded
// ============================================================================
function enviarDatosASheets(payload) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ data: JSON.stringify(payload) })
  }).then(res => res.json());
}

// ============================================================================
// [FUNCIÓN: CREAR Y GUARDAR PEDIDO NUEVO]
// ============================================================================
function crearPedido() {
  const p = {
    codigo: nextCode(),
    nombre: document.getElementById('nombre').value.trim(),
    grado: document.getElementById('grado').value.trim(),
    producto: document.getElementById('producto').value.trim(),
    total: Number(document.getElementById('total').value),
    abonos: [{ monto: Number(document.getElementById('montoApartado').value || 0), fecha: new Date().toLocaleString('es-CO') }],
    fecha: new Date().toLocaleString('es-CO')
  };

  if(!p.nombre || !p.producto || !p.total) return alert('Faltan datos.');

  document.getElementById('cloudStatus').textContent = '⏳ Guardando en Sheets...';
  
  enviarDatosASheets({ accion: 'guardarPedido', datos: p })
    .then(data => {
      actualizarPantalla(data);
      abrirFactura(p);
      limpiarFormulario();
    })
    .catch(err => {
      document.getElementById('cloudStatus').textContent = '⚠️ Error al guardar';
      alert('Error de red al guardar el pedido. Intenta nuevamente.');
    });
}

function limpiarFormulario() {
  document.getElementById('nombre').value = '';
  document.getElementById('grado').value = '';
  document.getElementById('producto').value = '';
  document.getElementById('total').value = '';
}

// ============================================================================
// [FUNCIÓN: GESTIÓN DE MODAL - ABONOS]
// ============================================================================
function guardarAbono() {
  const codigo = window.current;
  const valor = Number(document.getElementById('nuevoAbono').value || 0);
  if(valor <= 0) return alert('Ingresa un valor.');

  document.getElementById('cloudStatus').textContent = '⏳ Guardando abono en Sheets...';
  
  const payload = {
    accion: 'guardarAbono',
    codigo: codigo,
    datos: { monto: valor, fecha: new Date().toLocaleString('es-CO') }
  };

  enviarDatosASheets(payload)
    .then(data => {
      actualizarPantalla(data);
      alert('Abono guardado exitosamente.');
      cerrarAbono();
      cerrarModal();
      document.getElementById('nuevoAbono').value = '';
    })
    .catch(err => {
      document.getElementById('cloudStatus').textContent = '⚠️ Error al abonar';
      alert('Error de red al guardar el abono. Intenta nuevamente.');
    });
}

// ============================================================================
// [FUNCIONES DE UI Y CALCULADORES]
// ============================================================================
function showTab(id) {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id === 'pedidos') renderPedidos();
  if(id === 'panel') renderStats();
}

function seleccionarDelMenu(prod, prec) {
  showTab('nuevo');
  document.getElementById('producto').value = prod;
  document.getElementById('total').value = prec;
  document.getElementById('nombre').focus();
}

const nextCode = () => {
  let max = 1013;
  pedidos.forEach(p => { let n = parseInt((p.codigo || '').replace('DOC-', '')); if(n > max) max = n; });
  return 'DOC-' + (max + 1);
};

const abonado = p => (p.abonos || []).reduce((s, a) => s + Number(a.monto), 0);
const estado = p => abonado(p) >= p.total ? 'PAGADO' : (abonado(p) > 0 ? 'ABONADO' : 'PENDIENTE');
const estadoClass = e => e === 'PAGADO' ? 'paid' : (e === 'ABONADO' ? 'abonado' : 'pending');

function abrirFactura(p) {
  document.getElementById('modal').classList.add('show');
  document.getElementById('invCode').textContent = 'FACTURA N.º ' + p.codigo;
  const a = abonado(p);
  const saldo = Math.max(0, p.total - a);

  document.getElementById('invData').innerHTML = `
    <div class="line"><span>Cliente</span><b>${p.nombre}</b></div>
    <div class="line"><span>Producto</span><b>${p.producto}</b></div>
    <div class="line"><span>Total</span><b>${money(p.total)}</b></div>
    <div class="line"><span>Abonado</span><b>${money(a)}</b></div>
    <div class="line"><span>Saldo</span><b>${money(saldo)}</b></div>
    <div class="line"><span>Estado</span><b class="status ${estadoClass(estado(p))}">${estado(p)}</b></div>
  `;

  document.getElementById('qrcode').innerHTML = '';
  new QRCode(document.getElementById('qrcode'), { text: p.codigo, width: 210, height: 210 });
  window.current = p.codigo;
}

function cerrarModal() { document.getElementById('modal').classList.remove('show'); cerrarAbono(); }

function renderPedidos() {
  const q = (document.getElementById('busqueda')?.value || '').toLowerCase();
  const arr = pedidos.filter(p => (p.nombre + ' ' + p.codigo).toLowerCase().includes(q)).slice().reverse();
  
  if(!arr.length) { document.getElementById('tabla').innerHTML = '<p class="note">No hay pedidos.</p>'; return; }
  
  document.getElementById('tabla').innerHTML = `<table>
    <thead><tr><th>Código</th><th>Cliente</th><th>Estado</th><th>Saldo</th><th></th></tr></thead>
    <tbody>
      ${arr.map(p => `<tr>
        <td>${p.codigo}</td><td>${p.nombre}</td>
        <td><span class="status ${estadoClass(estado(p))}">${estado(p)}</span></td>
        <td>${money(Math.max(0, p.total - abonado(p)))}</td>
        <td>
          <button class="small" onclick="abrirFactura(pedidos.find(x=>x.codigo==='${p.codigo}'))">Ver</button>
          ${estado(p) !== 'PAGADO' ? `<button class="small primary" onclick="window.current='${p.codigo}'; abrirAbono('${p.codigo}')">Abonar</button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

function renderStats() {
  const total = pedidos.reduce((s, p) => s + p.total, 0);
  const rec = pedidos.reduce((s, p) => s + abonado(p), 0);
  document.getElementById('stats').innerHTML = `
    <div class="stat"><small>Pedidos</small><b>${pedidos.length}</b></div>
    <div class="stat"><small>En Caja</small><b>${money(rec)}</b></div>
    <div class="stat"><small>Por cobrar</small><b>${money(total - rec)}</b></div>
  `;
}

function abrirAbono(codigo) {
  const p = pedidos.find(x => x.codigo === codigo);
  if(!p) return;
  document.getElementById('abonoCode').textContent = 'PEDIDO ' + p.codigo;
  document.getElementById('nuevoAbono').max = Math.max(0, p.total - abonado(p));
  window.current = p.codigo;
  document.getElementById('abonoModal').classList.add('show');
}

function cerrarAbono() { document.getElementById('abonoModal').classList.remove('show'); }
