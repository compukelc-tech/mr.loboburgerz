// ============================================================================
// SISTEMA ERP: MR. LOBO BURGERZ - FRONTEND (JAVASCRIPT) V4.2
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbwKwtWBXjwaP9TJ9ucc-_2GCJUSRFIR5mxT1xnE99S8TjNqFn7AzWAZKwo33u4m2zJj0A/exec";

let sesionActual = null; 
let carrito = []; 
let CATALOGO = []; 
let FACTURAS_GLOBAL = []; 

const CATALOGO_BASE = [
  { id: 'p1', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Sangrienta', desc: 'Pan brioche, Carne, Tocineta, Jamón, Queso, Vegetales.', precio: 18000, agotado: false, urlImagen: '' },
  { id: 'p2', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Luna Llena', desc: 'Pan brioche negro, Pollo desmechado, Tocineta, Queso, Vegetales.', precio: 17000, agotado: false, urlImagen: '' },
  { id: 'p3', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Manada', desc: 'Pan brioche, Pollo, Carne, Tocineta, Chorizo, Jamón, Queso, Cebolla, Vegetales.', precio: 20000, agotado: false, urlImagen: '' },
  { id: 'p4', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'DoriLobo', desc: 'Doritos, Carne molida, Maicitos, Queso mozzarella, Guacamole, Pico de gallo.', precio: 15000, agotado: false, urlImagen: '' },
  { id: 'b1', categoria: '~BEBIDAS Y POSTRES~', nombre: 'Sangre De Alfa', desc: 'Sprite, Cereza, Limón, Gomita.', precio: 8000, agotado: false, urlImagen: '' }
];

const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

window.onload = async () => {
  const savedSession = localStorage.getItem('lobo_session');
  sesionActual = savedSession ? JSON.parse(savedSession) : { documento: 'Invitado', nombre: 'Cliente Presencial', rol: 'Cliente' };
  configurarInterfazPorRol();
  await cargarCatalogoGlobal();
};

async function apiCall(accion, datos = {}) {
  const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ accion, datos }) });
  const textResponse = await response.text();
  try {
    const result = JSON.parse(textResponse);
    if (!result.exito) throw new Error(result.error);
    return result.data;
  } catch (err) { throw new Error("Error de conexión. Verifica la URL de tu API."); }
}

function navegar(vistaID) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${vistaID}`).classList.add('active');
  
  if (vistaID === 'admin') { cargarEmpleados(); cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-admin'); }
  if (vistaID === 'marketing') cargarGestorMenu();
  if (vistaID === 'facturas') cargarFacturas();
  if (vistaID === 'cartera') cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera');
  if (vistaID === 'produccion') cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  if (vistaID === 'despachados') cargarPedidos('DESPACHADO', 'lista-despachados');
}

function cerrarSesion() {
  localStorage.removeItem('lobo_session');
  sesionActual = { documento: 'Invitado', nombre: 'Cliente Presencial', rol: 'Cliente' };
  configurarInterfazPorRol();
}
function entrarComoCliente() { cerrarSesion(); }

function configurarInterfazPorRol() {
  const isCliente = sesionActual.rol === 'Cliente';
  document.getElementById('main-nav').style.display = isCliente ? 'none' : 'flex';
  document.getElementById('btn-login-icon').style.display = isCliente ? 'block' : 'none';
  document.getElementById('user-greeting').textContent = isCliente ? 'Menú Principal' : `Hola, ${sesionActual.nombre} (${sesionActual.rol})`;

  if (isCliente) return navegar('vitrina');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
  document.querySelector('.btn-outline').style.display = 'block'; 

  const roles = { 'Superadmin': 'admin', 'Gerente': 'admin', 'Vitrina': 'vitrina', 'Cartera': 'cartera', 'Producción': 'produccion', 'Marketing': 'marketing', 'Pedidos': 'despachados' };
  if (roles[sesionActual.rol]) {
    if(sesionActual.rol === 'Superadmin' || sesionActual.rol === 'Gerente') document.querySelectorAll('.nav-btn').forEach(b => b.style.display = 'block');
    else document.getElementById(`nav-${roles[sesionActual.rol]}`).style.display = 'block';
    navegar(roles[sesionActual.rol]);
  }
}

async function iniciarSesion() {
  const doc = document.getElementById('login-doc').value;
  const pass = document.getElementById('login-pass').value;
  if (!doc || !pass) return mostrarAlerta('Ingresa credenciales');
  mostrarAlerta('Verificando...', 'info');
  try {
    const empleados = await apiCall('obtenerEmpleados');
    const usuario = empleados.find(e => e['Documento (Usuario)'] == doc && e['Contraseña'] == pass);
    if (!usuario) return mostrarAlerta('Credenciales incorrectas');
    if (usuario['Estado'] === 'BLOQUEADO') return mostrarAlerta('Cuenta bloqueada.');
    if (usuario['Estado'] !== 'ACTIVO' && !['Superadmin', 'Gerente'].includes(usuario['Rol Asignado'])) return mostrarAlerta('Cuenta pendiente de activación.');
    
    sesionActual = { documento: doc, nombre: usuario['Nombre Completo'], rol: usuario['Rol Asignado'] };
    localStorage.setItem('lobo_session', JSON.stringify(sesionActual));
    mostrarAlerta('Acceso concedido', 'success');
    configurarInterfazPorRol();
  } catch (e) { mostrarAlerta('Error de red.'); }
}

async function registrarEmpleado() {
  const d = { nombre: document.getElementById('reg-nombre').value, documento: document.getElementById('reg-doc').value, grado: document.getElementById('reg-grado').value, area: document.getElementById('reg-area').value, contrasena: document.getElementById('reg-pass').value };
  if (!d.nombre || !d.documento) return mostrarAlerta('Faltan campos');
  try { await apiCall('registrarEmpleado', d); mostrarAlerta('Registro exitoso', 'success'); navegar('login'); } catch (e) { mostrarAlerta(e.message); }
}

function mostrarAlerta(msg, tipo = 'error') {
  const box = document.getElementById('alert-box');
  if(box) { box.textContent = msg; box.className = `alert ${tipo}`; setTimeout(() => box.classList.add('hidden'), 5000); } else alert(msg);
}

function togglePassword(id, btn) { const i = document.getElementById(id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? '👁️' : '🙈'; }

async function cargarCatalogoGlobal() {
  try {
    const data = await apiCall('obtenerCatalogo');
    CATALOGO = [...CATALOGO_BASE];
    if (data && data.length) {
      data.forEach(n => {
        const p = { id: n['ID Producto'], categoria: n['Categoría'], nombre: n['Nombre'], desc: n['Descripción'], precio: Number(n['Precio']), agotado: n['Agotado (SI/NO)'] === 'SI', urlImagen: n['URL Imagen'] };
        const idx = CATALOGO.findIndex(b => b.id === p.id);
        idx !== -1 ? CATALOGO[idx] = p : CATALOGO.push(p);
      });
    }
  } catch (e) {}
  renderCatalogo();
}

function renderCatalogo() {
  const container = document.getElementById('catalogo-productos');
  if(!container) return;
  let html = '';
  [...new Set(CATALOGO.map(p => p.categoria))].forEach(cat => {
    html += `<h3 style="grid-column: 1 / -1; margin-top: 40px; color: var(--gold); border-bottom: 1px solid var(--border);">${cat}</h3>`;
    CATALOGO.filter(p => p.categoria === cat).forEach(prod => {
      html += `
        <div class="product-card" style="${prod.agotado ? 'opacity:0.5; filter:grayscale(1);' : ''}">
          ${prod.urlImagen ? `<div class="product-img-container"><img src="${prod.urlImagen}"></div>` : ''}
          <h3>${prod.nombre}</h3><p>${prod.desc}</p><span class="price">${money(prod.precio)}</span>
          <button class="primary full-width" ${prod.agotado ? 'disabled' : `onclick="agregarAlCarrito('${prod.id}')"`}>${prod.agotado ? 'Agotado' : '+ Añadir'}</button>
        </div>`;
    });
  });
  container.innerHTML = html;
}

// ----------------------------------------------------------------------------
// COMPRESOR Y CHECKOUT
// ----------------------------------------------------------------------------
function comprimirEnCanvas(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      const img = new Image(); img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        let w = img.width, h = img.height; if (w > 400) { h = Math.round((h * 400) / w); w = 400; }
        canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
    };
  });
}

function agregarAlCarrito(id) { 
  const p = CATALOGO.find(x => x.id === id); const i = carrito.find(x => x.id === id); 
  i ? i.cant++ : carrito.push({ ...p, cant: 1 }); renderCarrito(); 
}
function quitarDelCarrito(id) { carrito = carrito.filter(i => { if (i.id === id) i.cant--; return i.cant > 0; }); renderCarrito(); }

function renderCarrito() {
  const container = document.getElementById('carrito-items'); 
  const totalDisplay = document.getElementById('carrito-total-precio');
  const btn = document.getElementById('btn-procesar');
  if (!carrito.length) { container.innerHTML = '<p class="note">Carrito Vacío</p>'; totalDisplay.textContent = '$0'; btn.disabled = true; return; }
  let t = 0;
  container.innerHTML = carrito.map(i => { t += i.precio * i.cant; return `<div class="cart-item"><div><span class="qty">${i.cant}</span> ${i.nombre}</div><div>${money(i.precio * i.cant)} <button class="del-btn" onclick="quitarDelCarrito('${i.id}')">✕</button></div></div>`; }).join('');
  totalDisplay.textContent = money(t); btn.disabled = false;
}

function abrirModalCheckout() { document.getElementById('modal-checkout').classList.add('active'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleCamposCliente() { document.getElementById('co-correo-field').classList.toggle('hidden', document.getElementById('co-tipo').value === 'Ocasional'); }
function toggleVoucherInput() { document.getElementById('co-monto-abono-field').classList.toggle('hidden', document.getElementById('co-tipo-pago').value === 'Completo'); }

async function enviarPedido() {
  const btn = document.getElementById('btn-enviar-pedido');
  const d = { 
    tipoCliente: document.getElementById('co-tipo').value, documento: document.getElementById('co-doc').value, nombre: document.getElementById('co-nombre').value, celular: document.getElementById('co-celular').value,
    tipoPago: document.getElementById('co-tipo-pago').value, voucher: document.getElementById('co-voucher').files[0] 
  };
  
  if (!d.documento || !d.nombre || !d.celular) return mostrarAlerta('Faltan datos del cliente');
  if (!d.voucher) return mostrarAlerta('Debe adjuntar el primer comprobante de pago');

  btn.disabled = true; btn.textContent = 'Procesando...';
  try {
    const idPedido = 'ORD-' + new Date().getTime().toString().slice(-6);
    const total = carrito.reduce((a, i) => a + (i.precio * i.cant), 0);
    const montoAbono = d.tipoPago === 'Completo' ? total : Number(document.getElementById('co-monto-abono').value);

    const b64 = await comprimirEnCanvas(d.voucher);
    await apiCall('subirVoucher', { idPedido, montoAbono, imagenBase64: b64 });
    await apiCall('crearPedido', { idPedido, documento: d.documento, nombre: d.nombre, celular: d.celular, tipoCliente: d.tipoCliente, carrito, total });

    mostrarAlerta('Pedido en Espera de Verificación por Cartera', 'success');
    carrito = []; renderCarrito(); cerrarModal('modal-checkout');
  } catch (e) { mostrarAlerta(e.message); } finally { btn.disabled = false; btn.textContent = 'Confirmar Pedido'; }
}

// ----------------------------------------------------------------------------
// GESTIÓN DE EMPLEADOS Y ROLES
// ----------------------------------------------------------------------------
async function cargarEmpleados() {
  const tbody = document.getElementById('lista-empleados'); tbody.innerHTML = '<tr><td colspan="6" class="center">Cargando...</td></tr>';
  try {
    const empleados = await apiCall('obtenerEmpleados');
    let visibles = sesionActual.rol === 'Gerente' ? empleados.filter(e => e['Rol Asignado'] !== 'Superadmin') : empleados;
    tbody.innerHTML = visibles.map(emp => {
      let r = ['Ninguno', 'Vitrina', 'Cartera', 'Producción', 'Pedidos', 'Marketing'];
      if(sesionActual.rol === 'Superadmin') r.push('Gerente', 'Superadmin');
      const optRol = r.map(x => `<option value="${x}" ${emp['Rol Asignado'] === x ? 'selected' : ''}>${x}</option>`).join('');
      const optEst = ['ACTIVO', 'PENDIENTE', 'BLOQUEADO'].map(x => `<option value="${x}" ${emp['Estado'] === x ? 'selected' : ''}>${x}</option>`).join('');
      return `<tr>
        <td>${emp['Documento (Usuario)']}</td><td>${emp['Nombre Completo']}</td>
        <td><select id="rol-${emp['Documento (Usuario)']}">${optRol}</select></td>
        <td><select id="est-${emp['Documento (Usuario)']}">${optEst}</select></td>
        <td style="display:flex;gap:5px;">
          <button class="primary small" onclick="cambiarRol('${emp['Documento (Usuario)']}')">Guardar</button>
          <button class="small" style="background:var(--dark-red);" onclick="borrarEmpleado('${emp['Documento (Usuario)']}')">✕</button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) {}
}

async function cambiarRol(doc) {
  try { await apiCall('actualizarRolEmpleado', { documento: doc, nuevoRol: document.getElementById(`rol-${doc}`).value, nuevoEstado: document.getElementById(`est-${doc}`).value }); mostrarAlerta('Usuario actualizado', 'success'); } catch(e) {}
}
async function borrarEmpleado(doc) {
  if(!confirm('¿Eliminar permanente de la base de datos?')) return;
  try { await apiCall('eliminarEmpleado', { documento: doc }); cargarEmpleados(); mostrarAlerta('Usuario eliminado', 'success'); } catch(e) {}
}

// ----------------------------------------------------------------------------
// FLUJO: CARTERA, PRODUCCIÓN Y DESPACHOS
// ----------------------------------------------------------------------------
async function cargarPedidos(estadoFiltro, contenedorID) {
  const container = document.getElementById(contenedorID); container.innerHTML = '<p class="note">Cargando datos...</p>';
  try {
    const pedidos = await apiCall('obtenerPedidosConAbonos'); 
    
    // Calcular Banner Estadísticas
    if(contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') {
       let caja = 0, fiado = 0, total = 0;
       pedidos.forEach(p => { total += p['Total']; caja += p['Total Abonado']; fiado += Math.max(0, p['Total'] - p['Total Abonado']); });
       if(document.getElementById('stat-caja')) document.getElementById('stat-caja').textContent = money(caja);
       if(document.getElementById('stat-fiado')) document.getElementById('stat-fiado').textContent = money(fiado);
       if(document.getElementById('stat-total')) document.getElementById('stat-total').textContent = money(total);
    }

    const filtrados = pedidos.filter(p => p['Estado'] === estadoFiltro);
    if (!filtrados.length) return container.innerHTML = '<p class="note">No hay pedidos en esta etapa.</p>';
    
    // Vista Tabla (Despachados)
    if (contenedorID === 'lista-despachados') {
      container.innerHTML = filtrados.map(p => `<tr><td><b>${p['ID Pedido']}</b></td><td>${p['Nombre']}</td><td>${money(p['Total'])}</td><td><span class="badge despachado">${p['Estado']}</span></td></tr>`).join('');
      return;
    } 

    // Vista Tarjetas (Cartera / Producción)
    container.innerHTML = filtrados.map(p => {
      let items = []; try { items = JSON.parse(p['Carrito (JSON)']); } catch(e) {}
      let saldo = Math.max(0, p['Total'] - p['Total Abonado']);
      
      let badgeDinero = saldo === 0 ? `<span class="badge activo">TOTALMENTE PAGO</span>` : `<span class="badge pendiente">FIADO - SALDO: ${money(saldo)}</span>`;
      let infoCliente = `<p class="note" style="text-align:left; color:white; margin:10px 0;">Titular: <b>${p['Nombre']}</b><br>Doc: ${p['Documento']} | Tel: ${p['Celular']}</p>`;
      
      let botones = '';
      if (estadoFiltro === 'ESPERA DE VERIFICACIÓN') {
        if (saldo === 0) botones = `<button class="primary full-width" onclick="aprobarPagoTotal('${p['ID Pedido']}')">Validar en Banco y Enviar a Cocina</button>`;
        else botones = `<button class="btn-outline full-width" onclick="abrirModalAbono('${p['ID Pedido']}')">Registrar Nuevo Abono Subido</button>`;
      } else if (estadoFiltro === 'EN PRODUCCIÓN') {
        botones = `<button class="purple full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'DESPACHADO')">Marcar Pedido Despachado</button>`;
      }

      return `<div class="card product-card" style="text-align:left; padding: 20px;">
          <h3 style="margin-bottom:5px;">${p['ID Pedido']}</h3> ${badgeDinero} ${infoCliente}
          <ul style="font-size:14px; color:var(--muted); padding-left:15px; margin-bottom:15px;">${items.map(i => `<li>${i.cant}x ${i.nombre}</li>`).join('')}</ul>
          <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;"><span>Total:</span><span class="text-gold">${money(p['Total'])}</span></div>
          ${botones}
        </div>`;
    }).join('');
  } catch(e) { container.innerHTML = '<p class="note">Error al conectar con la base de datos.</p>'; }
}

async function aprobarPagoTotal(id) {
  if(!confirm('¿Confirmas que el dinero está en las cuentas bancarias? Al aceptar, la orden irá a cocina y se generará la Factura PDF.')) return;
  try { 
    mostrarAlerta('Generando Factura PDF y moviendo a cocina...', 'info');
    const res = await apiCall('aprobarPagoCompleto', { idPedido: id }); 
    mostrarAlerta('Aprobado con éxito. Factura creada.', 'success');
    if (res.urlFactura && res.urlFactura.includes('http')) window.open(res.urlFactura, '_blank');
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera');
  } catch(e) { mostrarAlerta(e.message); }
}

async function cambiarEstadoPedido(id, nuevoEstado) {
  try { await apiCall('cambiarEstadoPedido', { idPedido: id, nuevoEstado }); cargarPedidos('EN PRODUCCIÓN', 'lista-produccion'); } catch(e) {}
}

function abrirModalAbono(id) {
  document.getElementById('abono-id').value = id;
  document.getElementById('modal-abono').classList.add('active');
}

async function guardarAbono() {
  const btn = document.getElementById('btn-guardar-abono');
  const d = { idPedido: document.getElementById('abono-id').value, montoAbono: Number(document.getElementById('abono-monto').value), voucher: document.getElementById('abono-voucher').files[0] };
  if (!d.montoAbono || !d.voucher) return mostrarAlerta('Ingresa el monto y adjunta el comprobante');
  
  btn.disabled = true; btn.textContent = 'Subiendo voucher...';
  try {
    d.imagenBase64 = await comprimirEnCanvas(d.voucher);
    await apiCall('subirVoucher', d);
    mostrarAlerta('Abono registrado correctamente', 'success');
    cerrarModal('modal-abono');
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera');
  } catch(e) { mostrarAlerta('Error al subir el abono'); } finally { btn.disabled = false; btn.textContent = 'Guardar Abono'; }
}

// RESTO DE FUNCIONES SECUNDARIAS
async function cargarFacturas() {
  const tbody = document.getElementById('lista-facturas'); tbody.innerHTML = '<tr><td colspan="5" class="center">Cargando facturas...</td></tr>';
  try { FACTURAS_GLOBAL = await apiCall('obtenerFacturas'); filtrarFacturas(); } catch(e) { tbody.innerHTML = '<tr><td colspan="5">Error</td></tr>'; }
}
function filtrarFacturas() {
  const query = document.getElementById('buscador-facturas').value.toLowerCase(); const tbody = document.getElementById('lista-facturas'); 
  const filtradas = FACTURAS_GLOBAL.filter(f => f['Documento'].toString().includes(query) || f['ID Pedido'].toLowerCase().includes(query));
  if(!filtradas.length) return tbody.innerHTML = '<tr><td colspan="5" class="center">No hay facturas.</td></tr>';
  tbody.innerHTML = filtradas.map(f => `<tr><td>${f['ID Factura']}</td><td>${f['ID Pedido']}</td><td>${f['Documento']}</td><td>${f['Fecha']}</td><td><a href="${f['URL PDF']}" target="_blank" style="color:var(--gold);">Descargar PDF</a></td></tr>`).join('');
}
function cargarGestorMenu() {} // Mantenida vacía o con tu lógica original si se requiere gestionar desde Marketing
if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {})); }
