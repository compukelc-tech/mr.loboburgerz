// ============================================================================
// SISTEMA ERP: MR. LOBO BURGERZ - FRONTEND (JAVASCRIPT)
// Módulo: Conexión dinámica con Google Sheets (Catálogo, Pedidos, Usuarios)
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbwB41m6Dgxqg0ZGHdpNmtIfnO8vnu3xDk_TRMP6dJcVr_tbwz8JdjmVBaE_laWv3Nva7g/exec";

let sesionActual = null; 
let carrito = []; 
let CATALOGO = []; // Ahora el catálogo se llena dinámicamente desde Sheets

const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

// --- 1. INICIALIZACIÓN ---
window.onload = async () => {
  const savedSession = localStorage.getItem('lobo_session');
  if (savedSession) {
    sesionActual = JSON.parse(savedSession);
    configurarInterfazPorRol();
  } else {
    navegar('login');
  }
  await cargarCatalogoGlobal();
};

// --- 2. CONEXIÓN AL BACKEND (API) ---
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

// --- 3. NAVEGACIÓN Y SESIÓN ---
function navegar(vistaID) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${vistaID}`).classList.add('active');
  
  if (vistaID === 'admin') cargarEmpleados();
  if (vistaID === 'marketing') cargarGestorMenu();
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
  
  document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
  document.querySelector('.btn-outline').style.display = 'block'; 

  if (sesionActual.rol === 'Superadmin') {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'block');
    navegar('admin');
    return;
  }

  if (sesionActual.rol === 'Vitrina' || sesionActual.rol === 'Cliente') {
    document.getElementById('nav-vitrina').style.display = 'block';
    navegar('vitrina');
  } else if (sesionActual.rol === 'Cartera') {
    document.getElementById('nav-cartera').style.display = 'block';
    navegar('cartera');
  } else if (sesionActual.rol === 'Producción') {
    document.getElementById('nav-produccion').style.display = 'block';
    navegar('produccion');
  } else if (sesionActual.rol === 'Marketing') {
    document.getElementById('nav-marketing').style.display = 'block';
    navegar('marketing');
  } else if (sesionActual.rol === 'Pedidos') {
    document.getElementById('nav-despachados').style.display = 'block';
    navegar('despachados');
  }
}

// --- 4. AUTENTICACIÓN ---
async function iniciarSesion() {
  const doc = document.getElementById('login-doc').value;
  const pass = document.getElementById('login-pass').value;
  if (!doc || !pass) return mostrarAlerta('Ingresa documento y contraseña');
  
  mostrarAlerta('Verificando credenciales...', 'info');
  const empleados = await apiCall('obtenerEmpleados');
  const usuario = empleados.find(e => e['Documento (Usuario)'] == doc && e['Contraseña'] == pass);
  
  if (!usuario) return mostrarAlerta('Credenciales incorrectas');
  if (usuario['Estado'] !== 'ACTIVO' && usuario['Rol Asignado'] !== 'Superadmin') {
    return mostrarAlerta('Tu cuenta aún no ha sido activada.');
  }

  sesionActual = { documento: doc, nombre: usuario['Nombre Completo'], rol: usuario['Rol Asignado'] };
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
  
  mostrarAlerta('Enviando solicitud...', 'info');
  await apiCall('registrarEmpleado', datos);
  mostrarAlerta('Registro exitoso. Espera activación.', 'success');
  navegar('login');
}

// --- 5. UTILIDADES UI ---
function mostrarAlerta(msg, tipo = 'error') {
  const alertBox = document.getElementById('alert-box');
  alertBox.textContent = msg;
  alertBox.className = `alert ${tipo}`;
  setTimeout(() => alertBox.classList.add('hidden'), 3500);
}
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; } 
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

// --- 6. GESTIÓN CATÁLOGO (MARKETING) ---
async function cargarCatalogoGlobal() {
  try {
    const data = await apiCall('obtenerCatalogo');
    CATALOGO = data.map(p => ({
      id: p['ID Producto'],
      categoria: p['Categoría'],
      nombre: p['Nombre'],
      desc: p['Descripción'],
      precio: Number(p['Precio']),
      agotado: p['Agotado (SI/NO)'] === 'SI',
      urlImagen: p['URL Imagen']
    }));
    if(document.getElementById('view-vitrina').classList.contains('active') || sesionActual?.rol === 'Cliente') {
      renderCatalogo();
    }
  } catch (error) {
    document.getElementById('catalogo-productos').innerHTML = '<p class="note">Error al cargar el menú.</p>';
  }
}

function renderCatalogo() {
  const container = document.getElementById('catalogo-productos');
  if (CATALOGO.length === 0) {
    container.innerHTML = '<p class="note">El menú está vacío. Marketing debe agregar productos.</p>';
    return;
  }

  const categorias = [...new Set(CATALOGO.map(p => p.categoria))];
  let html = '';
  
  categorias.forEach(cat => {
    html += `<h3 style="grid-column: 1 / -1; margin-top: 20px; color: var(--gold); border-bottom: 1px solid var(--border); padding-bottom: 5px; font-family: 'Creepster', cursive; font-size: 28px;">${cat}</h3>`;
    
    const productos = CATALOGO.filter(p => p.categoria === cat);
    productos.forEach(prod => {
      const botonHTML = prod.agotado 
        ? `<button class="btn-outline full-width" disabled>Agotado</button>`
        : `<button class="primary full-width" onclick="agregarAlCarrito('${prod.id}')">+ Añadir a pedido</button>`;
        
      const estiloAgotado = prod.agotado ? 'opacity: 0.5; filter: grayscale(1);' : '';
      const imgHTML = prod.urlImagen 
        ? `<div class="product-img-container"><img src="${prod.urlImagen}" alt="${prod.nombre}"></div>` 
        : '';

      html += `
        <div class="product-card" style="${estiloAgotado}">
          ${imgHTML}
          <h3>${prod.nombre}</h3>
          <p>${prod.desc}</p>
          <span class="price">${money(prod.precio)}</span>
          ${botonHTML}
        </div>
      `;
    });
  });
  container.innerHTML = html;
}

function cargarGestorMenu() {
  const tbody = document.getElementById('lista-marketing-productos');
  tbody.innerHTML = '';
  
  CATALOGO.forEach(p => {
    const imgThumb = p.urlImagen ? `<img src="${p.urlImagen}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : 'Sin foto';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${imgThumb}</td>
      <td>${p.categoria}</td>
      <td><b>${p.nombre}</b></td>
      <td>${money(p.precio)}</td>
      <td><span class="badge ${p.agotado ? 'denegado' : 'activo'}">${p.agotado ? 'AGOTADO' : 'DISPONIBLE'}</span></td>
      <td>
        <button class="primary small" onclick="abrirModalProducto('${p.id}')">Editar</button>
        <button class="small" style="background:var(--dark-red);" onclick="eliminarProducto('${p.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function abrirModalProducto(id = null) {
  document.getElementById('modal-producto').classList.add('active');
  const titulo = document.getElementById('modal-prod-titulo');
  
  if (id) {
    const p = CATALOGO.find(x => x.id === id);
    titulo.textContent = 'Editar Producto';
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-nombre').value = p.nombre;
    document.getElementById('prod-desc').value = p.desc;
    document.getElementById('prod-precio').value = p.precio;
    document.getElementById('prod-agotado').value = p.agotado ? 'SI' : 'NO';
    document.getElementById('prod-img-existente').value = p.urlImagen || '';
  } else {
    titulo.textContent = 'Añadir Producto';
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-precio').value = '';
    document.getElementById('prod-img-existente').value = '';
  }
  document.getElementById('prod-img').value = ''; // Limpiar input file
}

async function guardarProductoBackend() {
  const btn = document.getElementById('btn-guardar-prod');
  const fileInput = document.getElementById('prod-img').files[0];
  
  const datos = {
    idProducto: document.getElementById('prod-id').value,
    categoria: document.getElementById('prod-categoria').value,
    nombre: document.getElementById('prod-nombre').value,
    descripcion: document.getElementById('prod-desc').value,
    precio: document.getElementById('prod-precio').value,
    agotado: document.getElementById('prod-agotado').value === 'SI',
    urlImagenExistente: document.getElementById('prod-img-existente').value
  };

  if (!datos.nombre || !datos.descripcion || !datos.precio) return mostrarAlerta('Faltan campos obligatorios');

  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    if (fileInput) {
      btn.textContent = 'Comprimiendo y subiendo foto...';
      datos.imagenBase64 = await comprimirImagen(fileInput);
    }
    
    await apiCall('guardarProducto', datos);
    mostrarAlerta('Catálogo actualizado', 'success');
    cerrarModal('modal-producto');
    await cargarCatalogoGlobal();
    cargarGestorMenu();
  } catch (error) {
    mostrarAlerta('Error al guardar el producto');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar Producto';
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
  mostrarAlerta('Eliminando...', 'info');
  await apiCall('eliminarProducto', { idProducto: id });
  mostrarAlerta('Producto eliminado', 'success');
  await cargarCatalogoGlobal();
  cargarGestorMenu();
}

// --- 7. CARRITO DE COMPRAS ---
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
          <span class="qty" style="background:var(--red);">${item.cant}</span>
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

// --- 8. CHECKOUT Y COMPRESIÓN DE VOUCHERS ---
function abrirModalCheckout() { document.getElementById('modal-checkout').classList.add('active'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleCamposCliente() { document.getElementById('co-correo-field').classList.toggle('hidden', document.getElementById('co-tipo').value === 'Ocasional'); }
function toggleVoucherInput() { document.getElementById('co-monto-abono-field').classList.toggle('hidden', document.getElementById('co-tipo-pago').value === 'Completo'); }

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
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]); 
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
  
  if (!documento || !nombre || !celular) return mostrarAlerta('Llena los datos del cliente');
  if (tipoCliente === 'Continuo' && !correo) return mostrarAlerta('Falta el correo');
  if (!voucherInput) return mostrarAlerta('Sube el comprobante/voucher de pago');

  btn.disabled = true;
  btn.textContent = 'Procesando comprobante...';

  try {
    const idPedido = 'ORD-' + new Date().getTime().toString().slice(-6);
    const totalVenta = carrito.reduce((acc, i) => acc + (i.precio * i.cant), 0);
    const montoAbono = tipoPago === 'Completo' ? totalVenta : Number(document.getElementById('co-monto-abono').value);

    const base64Voucher = await comprimirImagen(voucherInput);

    btn.textContent = 'Guardando pago en la nube...';
    await apiCall('subirVoucher', { idPedido, montoAbono, imagenBase64: base64Voucher, mimeType: 'image/jpeg' });

    btn.textContent = 'Registrando orden...';
    await apiCall('crearPedido', { idPedido, documento, nombre, celular, tipoCliente, correo, carrito, total: totalVenta });

    mostrarAlerta('Pedido registrado', 'success');
    carrito = []; renderCarrito(); cerrarModal('modal-checkout');
  } catch (error) {
    mostrarAlerta('Error al procesar el pedido.');
  } finally {
    btn.disabled = false; btn.textContent = 'Confirmar y Enviar Pedido';
  }
}

// --- 9. GESTIÓN SUPERADMIN (EMPLEADOS Y PEDIDOS) ---
async function cargarEmpleados() {
  const tbody = document.getElementById('lista-empleados');
  tbody.innerHTML = '<tr><td colspan="6" class="center">Cargando personal...</td></tr>';
  const empleados = await apiCall('obtenerEmpleados');
  tbody.innerHTML = '';
  
  empleados.forEach(emp => {
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
          <option value="Marketing" ${emp['Rol Asignado'] === 'Marketing' ? 'selected' : ''}>Marketing</option>
          <option value="Pedidos" ${emp['Rol Asignado'] === 'Pedidos' ? 'selected' : ''}>Pedidos</option>
          <option value="Superadmin" ${emp['Rol Asignado'] === 'Superadmin' ? 'selected' : ''}>Superadmin</option>
        </select>
      </td>
      <td><button class="primary small" onclick="cambiarRol('${emp['Documento (Usuario)']}')">Guardar</button></td>
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

async function cargarPedidos(estado, contenedorID) {
  const container = document.getElementById(contenedorID);
  container.innerHTML = '<p class="note">Cargando...</p>';
  const pedidos = await apiCall('obtenerPedidos');
  const filtrados = pedidos.filter(p => p['Estado'] === estado);
  
  if (filtrados.length === 0) {
    container.innerHTML = '<p class="note">No hay pedidos en este estado.</p>';
    return;
  }

  if (contenedorID === 'lista-despachados') {
    container.innerHTML = filtrados.map(p => `<tr><td><b>${p['ID Pedido']}</b></td><td>${p['Nombre']}</td><td>${money(p['Total'])}</td><td><span class="badge despachado">${p['Estado']}</span></td></tr>`).join('');
  } else {
    container.innerHTML = filtrados.map(p => {
      const itemsCart = JSON.parse(p['Carrito (JSON)']);
      let botonAccion = estado === 'ESPERA DE PAGO' 
        ? `<button class="primary full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'EN PRODUCCIÓN')">Aprobar Pago -> Cocina</button>`
        : `<button class="purple full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'DESPACHADO')">Marcar Despachado</button>`;

      return `
        <div class="card product-card" style="text-align:left;">
          <h3 style="margin-bottom:0; font-family:'Montserrat', sans-serif;">${p['ID Pedido']}</h3>
          <p class="note" style="text-align:left; margin-bottom: 10px;">Cliente: ${p['Nombre']}</p>
          <ul style="font-size:14px; color:var(--muted); padding-left:15px; margin-bottom:15px;">
            ${itemsCart.map(i => `<li>${i.cant}x ${i.nombre}</li>`).join('')}
          </ul>
          <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;">
            <span>Total:</span><span class="text-gold">${money(p['Total'])}</span>
          </div>
          ${botonAccion}
        </div>
      `;
    }).join('');
  }
}

async function cambiarEstadoPedido(idPedido, nuevoEstado) {
  mostrarAlerta(`Moviendo pedido...`, 'info');
  await apiCall('cambiarEstadoPedido', { idPedido, nuevoEstado });
  if (sesionActual.rol === 'Cartera' || sesionActual.rol === 'Superadmin') cargarPedidos('ESPERA DE PAGO', 'lista-cartera');
  if (sesionActual.rol === 'Producción' || sesionActual.rol === 'Superadmin') cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  mostrarAlerta('Pedido actualizado', 'success');
}
