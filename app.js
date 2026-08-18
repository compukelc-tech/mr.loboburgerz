// ============================================================================
// SISTEMA ERP: MR. LOBO BURGERZ - FRONTEND (JAVASCRIPT)
// ============================================================================

// --- 1. CONFIGURACIÓN Y ESTADO GLOBAL ---
const API_URL = "https://script.google.com/macros/s/AKfycbwB41m6Dgxqg0ZGHdpNmtIfnO8vnu3xDk_TRMP6dJcVr_tbwz8JdjmVBaE_laWv3Nva7g/exec";

let sesionActual = null; // Guardará los datos del usuario logueado
let carrito = []; // Estado del carrito de compras

// Catálogo base de productos (Puede expandirse más adelante)
const CATALOGO = [
  { id: 'p1', nombre: 'La Lobo Clásica', desc: 'Carne 150g, queso cheddar, tocino.', precio: 25000 },
  { id: 'p2', nombre: 'Doble Aullido', desc: 'Doble carne, doble queso, aros de cebolla.', precio: 32000 },
  { id: 'p3', nombre: 'Lobo Salvaje', desc: 'Carne, pollo crujiente, tocineta, salsa BBQ.', precio: 28000 },
  { id: 'p4', nombre: 'Papas Cheddar', desc: 'Porción de papas con queso y tocino picado.', precio: 12000 }
];

// Utilidad para formatear moneda
const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// --- 2. INICIALIZACIÓN ---
window.onload = () => {
  // Intentar recuperar sesión del localStorage
  const savedSession = localStorage.getItem('lobo_session');
  if (savedSession) {
    sesionActual = JSON.parse(savedSession);
    configurarInterfazPorRol();
  } else {
    navegar('login');
  }
  renderCatalogo();
};

// --- 3. CONEXIÓN AL BACKEND (API) ---
// Envía los datos empaquetados en URLSearchParams para evitar problemas de CORS en Apps Script
async function apiCall(accion, datos = {}) {
  try {
    const payload = JSON.stringify({ accion, datos });
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: payload })
    });
    
    const result = await response.json();
    if (!result.exito) throw new Error(result.error);
    return result.data;
  } catch (error) {
    mostrarAlerta('Error: ' + error.message, 'error');
    throw error;
  }
}

// --- 4. NAVEGACIÓN Y SESIÓN ---
function navegar(vistaID) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${vistaID}`).classList.add('active');
  
  if (vistaID === 'admin') cargarEmpleados();
  if (vistaID === 'cartera') cargarPedidos('ESPERA DE PAGO', 'lista-cartera');
  if (vistaID === 'produccion') cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  if (vistaID === 'despachados') cargarPedidos('DESPACHADO', 'lista-despachados');
}

function cerrarSesion() {
  localStorage.removeItem('lobo_session');
  sesionActual = null;
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('user-greeting').textContent = 'Bienvenido al Sistema';
  navegar('login');
}

function configurarInterfazPorRol() {
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('user-greeting').textContent = `Hola, ${sesionActual.nombre} (${sesionActual.rol})`;
  
  // Ocultar todos los botones primero
  document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
  document.querySelector('.btn-outline').style.display = 'block'; // Cerrar sesión siempre visible

  // Lógica de permisos de Superadmin (sin restricciones)
  if (sesionActual.rol === 'Superadmin') {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'block');
    navegar('admin');
    return;
  }

  // Permisos por dependencia
  if (sesionActual.rol === 'Vitrina' || sesionActual.rol === 'Cliente') {
    document.getElementById('nav-vitrina').style.display = 'block';
    navegar('vitrina');
  } else if (sesionActual.rol === 'Cartera') {
    document.getElementById('nav-cartera').style.display = 'block';
    navegar('cartera');
  } else if (sesionActual.rol === 'Producción') {
    document.getElementById('nav-produccion').style.display = 'block';
    navegar('produccion');
  } else if (sesionActual.rol === 'Pedidos') {
    document.getElementById('nav-despachados').style.display = 'block';
    navegar('despachados');
  }
}

// --- 5. AUTENTICACIÓN Y REGISTRO ---
async function iniciarSesion() {
  const doc = document.getElementById('login-doc').value;
  const pass = document.getElementById('login-pass').value;
  
  if (!doc || !pass) return mostrarAlerta('Ingresa documento y contraseña');
  
  mostrarAlerta('Verificando credenciales...', 'info');
  const empleados = await apiCall('obtenerEmpleados');
  const usuario = empleados.find(e => e['Documento (Usuario)'] == doc && e['Contraseña'] == pass);
  
  if (!usuario) return mostrarAlerta('Credenciales incorrectas');
  if (usuario['Estado'] !== 'ACTIVO' && usuario['Rol Asignado'] !== 'Superadmin') {
    return mostrarAlerta('Tu cuenta aún no ha sido activada por el Superadmin');
  }

  sesionActual = {
    documento: doc,
    nombre: usuario['Nombre Completo'],
    rol: usuario['Rol Asignado']
  };
  localStorage.setItem('lobo_session', JSON.stringify(sesionActual));
  mostrarAlerta('Acceso concedido', 'success');
  configurarInterfazPorRol();
}

function entrarComoCliente() {
  sesionActual = { documento: 'Invitado', nombre: 'Cliente Presencial', rol: 'Cliente' };
  configurarInterfazPorRol();
}

async function registrarEmpleado() {
  const datos = {
    nombre: document.getElementById('reg-nombre').value,
    documento: document.getElementById('reg-doc').value,
    grado: document.getElementById('reg-grado').value,
    area: document.getElementById('reg-area').value,
    contrasena: document.getElementById('reg-pass').value,
    contrasena2: document.getElementById('reg-pass2').value
  };

  if (Object.values(datos).some(x => !x)) return mostrarAlerta('Todos los campos son obligatorios');
  if (datos.contrasena !== datos.contrasena2) return mostrarAlerta('Las contraseñas no coinciden');
  
  // Validación de seguridad de contraseña
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!regex.test(datos.contrasena)) {
    return mostrarAlerta('La contraseña debe tener mín. 8 caracteres, 1 mayúscula, 1 número y 1 símbolo.');
  }

  mostrarAlerta('Enviando solicitud...', 'info');
  await apiCall('registrarEmpleado', datos);
  mostrarAlerta('Registro exitoso. Espera la activación del Superadmin.', 'success');
  navegar('login');
}

// --- 6. UTILIDADES DE UI ---
function mostrarAlerta(msg, tipo = 'error') {
  const alertBox = document.getElementById('alert-box');
  alertBox.textContent = msg;
  alertBox.className = `alert ${tipo}`;
  setTimeout(() => alertBox.classList.add('hidden'), 3500);
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// --- 7. PANEL SUPERADMIN (GESTIÓN EMPLEADOS) ---
async function cargarEmpleados() {
  const tbody = document.getElementById('lista-empleados');
  tbody.innerHTML = '<tr><td colspan="6" class="center">Cargando personal...</td></tr>';
  
  const empleados = await apiCall('obtenerEmpleados');
  tbody.innerHTML = '';
  
  empleados.forEach(emp => {
    const isPending = emp['Estado'] === 'PENDIENTE';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp['Documento (Usuario)']}</td>
      <td>${emp['Nombre Completo']}</td>
      <td>${emp['Área Aspirada']}</td>
      <td><span class="badge ${emp['Estado'].toLowerCase()}">${emp['Estado']}</span></td>
      <td>
        <select id="rol-${emp['Documento (Usuario)']}" ${sesionActual.rol !== 'Superadmin' ? 'disabled' : ''}>
          <option value="Pendiente" ${emp['Rol Asignado'] === 'Ninguno' ? 'selected' : ''}>Sin Rol</option>
          <option value="Vitrina" ${emp['Rol Asignado'] === 'Vitrina' ? 'selected' : ''}>Vitrina</option>
          <option value="Cartera" ${emp['Rol Asignado'] === 'Cartera' ? 'selected' : ''}>Cartera</option>
          <option value="Producción" ${emp['Rol Asignado'] === 'Producción' ? 'selected' : ''}>Producción</option>
          <option value="Pedidos" ${emp['Rol Asignado'] === 'Pedidos' ? 'selected' : ''}>Pedidos</option>
          <option value="Superadmin" ${emp['Rol Asignado'] === 'Superadmin' ? 'selected' : ''}>Superadmin</option>
        </select>
      </td>
      <td>
        <button class="primary" style="padding: 5px 10px; font-size:12px;" 
          onclick="cambiarRol('${emp['Documento (Usuario)']}')">Guardar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function cambiarRol(documento) {
  const nuevoRol = document.getElementById(`rol-${documento}`).value;
  const nuevoEstado = nuevoRol === 'Pendiente' ? 'PENDIENTE' : 'ACTIVO';
  
  mostrarAlerta('Actualizando empleado...', 'info');
  await apiCall('actualizarRolEmpleado', { documento, nuevoRol, nuevoEstado });
  mostrarAlerta('Rol actualizado', 'success');
  cargarEmpleados();
}

// --- 8. VITRINA Y CARRITO ---
function renderCatalogo() {
  const container = document.getElementById('catalogo-productos');
  container.innerHTML = CATALOGO.map(prod => `
    <div class="product-card">
      <h3>${prod.nombre}</h3>
      <p>${prod.desc}</p>
      <span class="price">${money(prod.precio)}</span>
      <button class="primary full-width" onclick="agregarAlCarrito('${prod.id}')">+ Añadir a pedido</button>
    </div>
  `).join('');
}

function agregarAlCarrito(id) {
  const prod = CATALOGO.find(p => p.id === id);
  const item = carrito.find(i => i.id === id);
  if (item) item.cant++; else carrito.push({ ...prod, cant: 1 });
  renderCarrito();
}

function quitarDelCarrito(id) {
  carrito = carrito.filter(i => {
    if (i.id === id) i.cant--;
    return i.cant > 0;
  });
  renderCarrito();
}

function renderCarrito() {
  const container = document.getElementById('carrito-items');
  const btnProcesar = document.getElementById('btn-procesar');
  const displayTotal = document.getElementById('carrito-total-precio');
  
  if (carrito.length === 0) {
    container.innerHTML = '<p class="note">Carrito vacío</p>';
    displayTotal.textContent = '$0';
    btnProcesar.disabled = true;
    return;
  }
  
  btnProcesar.disabled = false;
  let total = 0;
  container.innerHTML = carrito.map(item => {
    total += item.precio * item.cant;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="qty">${item.cant}</span>
          <span>${item.nombre}</span>
        </div>
        <div>
          <span>${money(item.precio * item.cant)}</span>
          <button class="del-btn" onclick="quitarDelCarrito('${item.id}')">✕</button>
        </div>
      </div>
    `;
  }).join('');
  
  displayTotal.textContent = money(total);
}

// --- 9. CHECKOUT Y SUBIDA DE VOUCHERS ---
function abrirModalCheckout() {
  document.getElementById('modal-checkout').classList.add('active');
}
function cerrarModal(id) {
  document.getElementById(id).classList.remove('active');
}

function toggleCamposCliente() {
  const tipo = document.getElementById('co-tipo').value;
  document.getElementById('co-correo-field').classList.toggle('hidden', tipo === 'Ocasional');
}

function toggleVoucherInput() {
  const tipoPago = document.getElementById('co-tipo-pago').value;
  document.getElementById('co-monto-abono-field').classList.toggle('hidden', tipoPago === 'Completo');
}

// Compresor de imágenes usando Canvas API (Previene Timeouts en Apps Script)
function comprimirImagen(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.getElementById('canvas-compresion');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Calidad 60% para reducir peso drásticamente
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        // Quitar la cabecera (data:image/jpeg;base64,) para enviar limpio
        resolve(dataUrl.split(',')[1]); 
      };
    };
  });
}

async function enviarPedido() {
  const btn = document.getElementById('btn-enviar-pedido');
  const tipoCliente = document.getElementById('co-tipo').value;
  const documento = document.getElementById('co-doc').value;
  const nombre = document.getElementById('co-nombre').value;
  const celular = document.getElementById('co-celular').value;
  const correo = document.getElementById('co-correo').value;
  const tipoPago = document.getElementById('co-tipo-pago').value;
  const voucherInput = document.getElementById('co-voucher').files[0];
  
  if (!documento || !nombre || !celular) return mostrarAlerta('Llena los datos del cliente obligatorios');
  if (tipoCliente === 'Continuo' && !correo) return mostrarAlerta('Falta el correo para cliente continuo');
  if (!voucherInput) return mostrarAlerta('Es obligatorio subir el comprobante/voucher de pago');

  btn.disabled = true;
  btn.textContent = 'Procesando comprobante...';

  try {
    const idPedido = 'ORD-' + new Date().getTime().toString().slice(-6);
    const totalVenta = carrito.reduce((acc, i) => acc + (i.precio * i.cant), 0);
    const montoAbono = tipoPago === 'Completo' ? totalVenta : Number(document.getElementById('co-monto-abono').value);

    // 1. Comprimir imagen Base64
    const base64Voucher = await comprimirImagen(voucherInput);

    // 2. Subir Voucher al Drive mediante API
    btn.textContent = 'Guardando pago en la nube...';
    await apiCall('subirVoucher', {
      idPedido: idPedido,
      montoAbono: montoAbono,
      imagenBase64: base64Voucher,
      mimeType: 'image/jpeg'
    });

    // 3. Crear el Pedido en Sheets
    btn.textContent = 'Registrando orden...';
    await apiCall('crearPedido', {
      idPedido, documento, nombre, celular, tipoCliente, correo,
      carrito, total: totalVenta
    });

    mostrarAlerta('Pedido registrado con éxito', 'success');
    carrito = []; // Limpiar carrito
    renderCarrito();
    cerrarModal('modal-checkout');
    
  } catch (error) {
    console.error(error);
    mostrarAlerta('Hubo un error al procesar el pedido.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirmar y Enviar Pedido';
  }
}

// --- 10. VISTAS DE DEPENDENCIA (CARTERA, PRODUCCIÓN, DESPACHADOS) ---
async function cargarPedidos(estado, contenedorID) {
  const container = document.getElementById(contenedorID);
  container.innerHTML = '<p class="note">Cargando...</p>';
  
  const pedidos = await apiCall('obtenerPedidos');
  const filtrados = pedidos.filter(p => p['Estado'] === estado);
  
  if (filtrados.length === 0) {
    container.innerHTML = '<p class="note">No hay pedidos en este estado.</p>';
    return;
  }

  // Estructura dependiendo del contenedor (Tarjetas o Tabla)
  if (contenedorID === 'lista-despachados') {
    container.innerHTML = filtrados.map(p => `
      <tr>
        <td><b>${p['ID Pedido']}</b></td>
        <td>${p['Nombre']}</td>
        <td>${money(p['Total'])}</td>
        <td><span class="badge despachado">${p['Estado']}</span></td>
      </tr>
    `).join('');
  } else {
    container.innerHTML = filtrados.map(p => {
      const itemsCart = JSON.parse(p['Carrito (JSON)']);
      let listaHtml = itemsCart.map(i => `<li>${i.cant}x ${i.nombre}</li>`).join('');
      
      let botonAccion = '';
      if (estado === 'ESPERA DE PAGO') {
        botonAccion = `<button class="primary full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'EN PRODUCCIÓN')">Aprobar Pago -> Cocina</button>`;
      } else if (estado === 'EN PRODUCCIÓN') {
        botonAccion = `<button class="purple full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'DESPACHADO')">Marcar Despachado</button>`;
      }

      return `
        <div class="card product-card" style="text-align:left;">
          <h3 style="margin-bottom:0">${p['ID Pedido']}</h3>
          <p class="note" style="text-align:left; margin-bottom: 10px;">Cliente: ${p['Nombre']}</p>
          <ul style="font-size:14px; color:var(--muted); padding-left:15px; margin-bottom:15px;">
            ${listaHtml}
          </ul>
          <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
            <span>Total:</span>
            <span class="text-gold">${money(p['Total'])}</span>
          </div>
          ${botonAccion}
        </div>
      `;
    }).join('');
  }
}

async function cambiarEstadoPedido(idPedido, nuevoEstado) {
  mostrarAlerta(`Moviendo pedido a ${nuevoEstado}...`, 'info');
  await apiCall('cambiarEstadoPedido', { idPedido, nuevoEstado });
  
  // Recargar la vista actual para reflejar los cambios
  if (sesionActual.rol === 'Cartera') cargarPedidos('ESPERA DE PAGO', 'lista-cartera');
  if (sesionActual.rol === 'Producción') cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  if (sesionActual.rol === 'Superadmin') {
    cargarPedidos('ESPERA DE PAGO', 'lista-cartera');
    cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  }
  mostrarAlerta('Pedido actualizado', 'success');
}
