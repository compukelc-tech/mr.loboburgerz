// ============================================================================
// SISTEMA ERP: MR. LOBO BURGERZ - FRONTEND (JAVASCRIPT) V4.4
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbz4xUyV6fmrEoNnlDajX2c9BFlNNao9EOsI3RgsZBX6Es3JPNnGpweI3glITKGXIJABjA/exec";

let sesionActual = null; 
let carrito = []; 
let CATALOGO = []; 
let FACTURAS_GLOBAL = []; 

const CATALOGO_BASE = [
  { id: 'p1', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Sangrienta', desc: 'Pan brioche, Carne de res, Tocineta, Jamón, Queso, Vegetales.', precio: 18000, agotado: false, urlImagen: '' },
  { id: 'p2', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Luna Llena', desc: 'Pan brioche negro, Pollo desmechado en salsa, Tocineta, Jamon, Queso, Vegetales.', precio: 17000, agotado: false, urlImagen: '' },
  { id: 'p3', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'Manada', desc: 'Pan brioche, Pollo, Carne, Tocineta, Chorizo, Jamón, Queso, Cebolla caramelizada, Vegetales.', precio: 20000, agotado: false, urlImagen: '' },
  { id: 'p4', categoria: '~PRODUCTOS PRINCIPALES~', nombre: 'DoriLobo', desc: 'Doritos, Carne molida, Maicitos, Queso mozzarella, Guacamole, Pico de gallo, Limón.', precio: 15000, agotado: false, urlImagen: '' },
  { id: 'b1', categoria: '~BEBIDAS Y POSTRES~', nombre: 'Sangre De Alfa', desc: 'Sprite, Cereza, Zumo de limón, Borde de azúcar con limón, Gomita de Ojos.', precio: 8000, agotado: false, urlImagen: '' },
  { id: 'b2', categoria: '~BEBIDAS Y POSTRES~', nombre: 'Legado De Plata', desc: 'Sprite, Zumo de Limón, Polvo Plateado, Borde de Azúcar negro con Limón, Menta Fresca.', precio: 8000, agotado: false, urlImagen: '' },
  { id: 'b3', categoria: '~BEBIDAS Y POSTRES~', nombre: 'Noche Azul', desc: 'Sprite, Arándanos, Zumo de Limón, Borde de Azúcar con Limón, Menta Fresca.', precio: 8000, agotado: false, urlImagen: '' },
  { id: 'po1', categoria: '~BEBIDAS Y POSTRES~', nombre: 'Exilir De Maracuya', desc: 'Postre Cremoso de Maracuyá, Base de Galleta dulce y Salsa de Maracuyá.', precio: 7000, agotado: false, urlImagen: '' },
  { id: 'c1', categoria: '~COMBOS~', nombre: 'Mr. Lobo El Alfa', desc: '1 Manada, 1 Luna Llena, 1 Dorilobo, 1 Michelada a elección, 2 postres a elección, 2 gaseosas a elección.', precio: 60000, agotado: false, urlImagen: '' },
  { id: 'c2', categoria: '~COMBOS~', nombre: 'La Caceria', desc: '1 Manada, 1 Sangrienta, 1 Dorilobo, 1 Michelada a elección, 2 gaseosas a elección.', precio: 50000, agotado: false, urlImagen: '' },
  { id: 'c3', categoria: '~COMBOS~', nombre: 'Manada Feroz', desc: '1 Luna Llena, 1 Sangrienta, 2 micheladas a elección, 1 postre a elección.', precio: 40000, agotado: false, urlImagen: '' },
  { id: 'c4', categoria: '~COMBOS~', nombre: 'Eclipse Lunar', desc: '1 Luna Llena, 1 Sangrienta, 1 michelada a elección, 1 gaseosa a elección.', precio: 32000, agotado: false, urlImagen: '' },
  { id: 'c5', categoria: '~COMBOS~', nombre: 'MegaLobito Hambriento', desc: '1 Sangrienta, 1 postre a elección, 1 michelada a elección.', precio: 28000, agotado: false, urlImagen: '' },
  { id: 'c6', categoria: '~COMBOS~', nombre: 'Lobo Solitario', desc: '1 Manada, 1 postre a elección, 1 gaseosa a elección.', precio: 24000, agotado: false, urlImagen: '' }
];

const money = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

window.onload = async () => {
  try {
    const savedSession = localStorage.getItem('lobo_session');
    if (savedSession) {
      sesionActual = JSON.parse(savedSession);
    } else {
      sesionActual = { documento: 'Invitado', nombre: 'Cliente Presencial', rol: 'Cliente' };
    }
    configurarInterfazPorRol();
    await cargarCatalogoGlobal();
    await cargarPromocionGlobal();
  } catch (error) {
    console.error("Error crítico en inicialización:", error);
  }
};

async function apiCall(accion, datos = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ accion, datos })
    });
    const textResponse = await response.text();
    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (err) {
      throw new Error("Conexión rechazada. Verifique la URL de la API.");
    }
    if (!result.exito) throw new Error(result.error);
    return result.data;
  } catch (error) { 
    throw error; 
  }
}

function navegar(vistaID) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${vistaID}`);
  if (target) target.classList.add('active');
  
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
  mostrarAlerta('Sesión cerrada correctamente', 'info');
}

function entrarComoCliente() { cerrarSesion(); }

function configurarInterfazPorRol() {
  const isCliente = sesionActual.rol === 'Cliente';
  const nav = document.getElementById('main-nav');
  const loginIcon = document.getElementById('btn-login-icon');
  const greeting = document.getElementById('user-greeting');
  
  if (nav) nav.style.display = isCliente ? 'none' : 'flex';
  if (loginIcon) loginIcon.style.display = isCliente ? 'block' : 'none';
  if (greeting) greeting.textContent = isCliente ? 'Menú Principal' : `Hola, ${sesionActual.nombre} (${sesionActual.rol})`;

  if (isCliente) return navegar('vitrina');

  document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
  const btnOutline = document.querySelector('.btn-outline');
  if (btnOutline) btnOutline.style.display = 'block'; 

  if (sesionActual.rol === 'Superadmin' || sesionActual.rol === 'Gerente') {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'block');
    navegar('admin');
  } else if (sesionActual.rol === 'Vitrina') {
    const navVit = document.getElementById('nav-vitrina'); if (navVit) navVit.style.display = 'block'; 
    navegar('vitrina');
  } else if (sesionActual.rol === 'Cartera') {
    const navCart = document.getElementById('nav-cartera'); if (navCart) navCart.style.display = 'block'; 
    navegar('cartera');
  } else if (sesionActual.rol === 'Producción') {
    const navProd = document.getElementById('nav-produccion'); if (navProd) navProd.style.display = 'block'; 
    navegar('produccion');
  } else if (sesionActual.rol === 'Pedidos') {
    const navDespachados = document.getElementById('nav-despachados'); if (navDespachados) navDespachados.style.display = 'block'; 
    navegar('despachados');
  } else if (sesionActual.rol === 'Marketing') {
    const navMark = document.getElementById('nav-marketing'); if (navMark) navMark.style.display = 'block'; 
    navegar('marketing');
  }
}

async function iniciarSesion() {
  const doc = document.getElementById('login-doc').value;
  const pass = document.getElementById('login-pass').value;
  if (!doc || !pass) return mostrarAlerta('Ingresa documento y contraseña');
  mostrarAlerta('Verificando...', 'info');
  try {
    const empleados = await apiCall('obtenerEmpleados');
    const usuario = empleados.find(e => String(e['Documento (Usuario)']) === String(doc) && String(e['Contraseña']) === String(pass));
    if (!usuario) return mostrarAlerta('Credenciales incorrectas');
    if (usuario['Estado'] === 'BLOQUEADO') return mostrarAlerta('Cuenta bloqueada.');
    
    sesionActual = { documento: doc, nombre: usuario['Nombre Completo'], rol: usuario['Rol Asignado'] };
    localStorage.setItem('lobo_session', JSON.stringify(sesionActual));
    mostrarAlerta('Acceso concedido', 'success');
    configurarInterfazPorRol();
  } catch (e) { 
    mostrarAlerta(e.message || 'Error de red.'); 
  }
}

async function registrarEmpleado() {
  const datos = {
    nombre: document.getElementById('reg-nombre').value,
    documento: document.getElementById('reg-doc').value,
    grado: document.getElementById('reg-grado').value,
    area: document.getElementById('reg-area').value,
    contrasena: document.getElementById('reg-pass').value
  };
  if (Object.values(datos).some(x => !x)) return mostrarAlerta('Faltan campos obligatorios');
  try {
    await apiCall('registrarEmpleado', datos);
    mostrarAlerta('Registro exitoso.', 'success');
    navegar('login');
  } catch (e) { 
    mostrarAlerta('Error al registrar.'); 
  }
}

function mostrarAlerta(msg, tipo = 'error') {
  const alertBox = document.getElementById('alert-box');
  if(alertBox) {
    alertBox.textContent = msg; 
    alertBox.className = `alert ${tipo}`;
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  } else { 
    alert(msg); 
  }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; } 
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

async function cargarCatalogoGlobal() {
  try {
    const data = await apiCall('obtenerCatalogo');
    let catalogoFusionado = [...CATALOGO_BASE];
    if (data && data.length > 0) {
      const productosNube = data.map(p => ({ 
        id: p['ID Producto'], 
        categoria: p['Categoría'] || '~PRODUCTOS PRINCIPALES~', 
        nombre: p['Nombre'], 
        desc: p['Descripción'], 
        precio: Number(p['Precio']), 
        agotado: String(p['Agotado (SI/NO)']) === 'SI', 
        urlImagen: p['URL Imagen'] 
      }));
      productosNube.forEach(prodNube => {
        const index = catalogoFusionado.findIndex(base => base.id === prodNube.id);
        if (index !== -1) catalogoFusionado[index] = prodNube;
        else catalogoFusionado.push(prodNube);
      });
    }
    CATALOGO = catalogoFusionado;
  } catch (error) { 
    CATALOGO = [...CATALOGO_BASE]; 
  }
  const vitrinaActiva = document.getElementById('view-vitrina');
  if((vitrinaActiva && vitrinaActiva.classList.contains('active')) || sesionActual?.rol === 'Cliente') {
    renderCatalogo();
  }
}

function renderCatalogo() {
  const container = document.getElementById('catalogo-productos');
  if(!container) return;
  if (CATALOGO.length === 0) { container.innerHTML = '<p class="note">Catálogo vacío.</p>'; return; }
  const categorias = [...new Set(CATALOGO.map(p => p.categoria))];
  let html = '';
  categorias.forEach(cat => {
    html += `<h3 style="grid-column: 1 / -1; margin-top: 40px; margin-bottom: 10px; color: var(--gold); border-bottom: 1px solid var(--border); padding-bottom: 10px; font-family: 'Metal Mania', cursive; font-size: 38px; text-align: center;">${cat}</h3>`;
    const productos = CATALOGO.filter(p => p.categoria === cat);
    productos.forEach(prod => {
      const botonHTML = prod.agotado ? `<button class="btn-outline full-width" disabled>Agotado</button>` : `<button class="primary full-width" onclick="agregarAlCarrito('${prod.id}')">+ Añadir a pedido</button>`;
      const estiloAgotado = prod.agotado ? 'opacity: 0.5; filter: grayscale(1);' : '';
      const imgHTML = prod.urlImagen ? `<div class="product-img-container"><img src="${prod.urlImagen}" alt="${prod.nombre}"></div>` : '';
      html += `<div class="product-card" style="${estiloAgotado}">${imgHTML}<h3>${prod.nombre}</h3><p>${prod.desc}</p><span class="price">${money(prod.precio)}</span>${botonHTML}</div>`;
    });
  });
  container.innerHTML = html;
}

function cargarGestorMenu() {
  const tbody = document.getElementById('lista-marketing-productos'); 
  if(!tbody) return;
  tbody.innerHTML = '';
  CATALOGO.forEach(p => {
    const imgThumb = p.urlImagen ? `<img src="${p.urlImagen}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : 'Sin foto';
    const row = document.createElement('tr');
    row.innerHTML = `<td>${imgThumb}</td><td>${p.categoria}</td><td><b>${p.nombre}</b></td><td>${money(p.precio)}</td><td><span class="badge ${p.agotado ? 'denegado' : 'activo'}">${p.agotado ? 'AGOTADO' : 'DISPONIBLE'}</span></td><td><button class="primary small" onclick="abrirModalProducto('${p.id}')">Editar</button> <button class="small" style="background:var(--dark-red);" onclick="eliminarProducto('${p.id}')">Eliminar</button></td>`;
    tbody.appendChild(row);
  });
}

function abrirModalProducto(id = null) {
  document.getElementById('modal-producto').classList.add('active');
  if (id) {
    const p = CATALOGO.find(x => x.id === id);
    document.getElementById('modal-prod-titulo').textContent = 'Editar Producto';
    document.getElementById('prod-id').value = p.id; 
    document.getElementById('prod-categoria').value = p.categoria; 
    document.getElementById('prod-nombre').value = p.nombre; 
    document.getElementById('prod-desc').value = p.desc; 
    document.getElementById('prod-precio').value = p.precio; 
    document.getElementById('prod-agotado').value = p.agotado ? 'SI' : 'NO'; 
    document.getElementById('prod-img-existente').value = p.urlImagen || '';
  } else {
    document.getElementById('modal-prod-titulo').textContent = 'Añadir Producto';
    document.getElementById('prod-id').value = ''; 
    document.getElementById('prod-nombre').value = ''; 
    document.getElementById('prod-desc').value = ''; 
    document.getElementById('prod-precio').value = ''; 
    document.getElementById('prod-img-existente').value = '';
  }
  document.getElementById('prod-img').value = ''; 
}

function comprimirEnCanvas(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas'); 
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 400;
        let width = img.width, height = img.height; 
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height; 
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
      img.onerror = () => reject("Error cargando la imagen.");
    };
    reader.onerror = () => reject("Error leyendo el archivo.");
  });
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
  btn.disabled = true; btn.textContent = 'Guardando en BD...';
  try {
    if (fileInput) datos.imagenBase64 = await comprimirEnCanvas(fileInput); 
    await apiCall('guardarProducto', datos);
    cerrarModal('modal-producto'); 
    await cargarCatalogoGlobal(); 
    cargarGestorMenu();
    mostrarAlerta('Producto guardado correctamente', 'success');
  } catch (error) {
    mostrarAlerta(error.message);
  } finally { 
    btn.disabled = false; btn.textContent = 'Guardar'; 
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  if (CATALOGO_BASE.some(base => base.id === id)) {
    mostrarAlerta('No se puede eliminar un producto base. Ponlo en AGOTADO.', 'warning');
    return;
  }
  try { 
    await apiCall('eliminarProducto', { idProducto: id }); 
    mostrarAlerta('Producto eliminado', 'success');
    await cargarCatalogoGlobal(); 
    cargarGestorMenu(); 
  } catch(e) { 
    mostrarAlerta(e.message || 'Error al eliminar.'); 
  }
}

function agregarAlCarrito(id) { 
  const prod = CATALOGO.find(p => p.id === id); 
  const item = carrito.find(i => i.id === id); 
  if (item) item.cant++; else carrito.push({ ...prod, cant: 1 }); 
  renderCarrito(); 
}

function quitarDelCarrito(id) { 
  carrito = carrito.filter(i => { if (i.id === id) i.cant--; return i.cant > 0; }); 
  renderCarrito(); 
}

function renderCarrito() {
  const container = document.getElementById('carrito-items'); 
  const btnProcesar = document.getElementById('btn-procesar'); 
  const displayTotal = document.getElementById('carrito-total-precio');
  if(!container) return;
  if (carrito.length === 0) { container.innerHTML = '<p class="note">Carrito vacío</p>'; displayTotal.textContent = '$0'; btnProcesar.disabled = true; return; }
  btnProcesar.disabled = false; 
  let total = 0;
  container.innerHTML = carrito.map(item => { 
    total += item.precio * item.cant; 
    return `<div class="cart-item"><div class="cart-item-info"><span class="qty" style="background:var(--red);">${item.cant}</span><span>${item.nombre}</span></div><div><span>${money(item.precio * item.cant)}</span><button class="del-btn" onclick="quitarDelCarrito('${item.id}')">✕</button></div></div>`; 
  }).join('');
  displayTotal.textContent = money(total);
}

function abrirModalCheckout() { document.getElementById('modal-checkout').classList.add('active'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('active'); }
function toggleCamposCliente() { document.getElementById('co-correo-field').classList.toggle('hidden', document.getElementById('co-tipo').value === 'Ocasional'); }
function toggleVoucherInput() { document.getElementById('co-monto-abono-field').classList.toggle('hidden', document.getElementById('co-tipo-pago').value === 'Completo'); }

async function enviarPedido() {
  const btn = document.getElementById('btn-enviar-pedido');
  const tipoCliente = document.getElementById('co-tipo').value; 
  const documento = document.getElementById('co-doc').value; 
  const nombre = document.getElementById('co-nombre').value; 
  const celular = document.getElementById('co-celular').value; 
  const correo = document.getElementById('co-correo').value; 
  const tipoPago = document.getElementById('co-tipo-pago').value; 
  const voucherInput = document.getElementById('co-voucher').files[0];
  
  if (!documento || !nombre || !celular) return mostrarAlerta('Faltan datos del cliente');
  if (!voucherInput) return mostrarAlerta('Debe adjuntar el comprobante de pago');

  btn.disabled = true; btn.textContent = 'Procesando...';
  try {
    const idPedido = 'ORD-' + new Date().getTime().toString().slice(-6);
    const totalVenta = carrito.reduce((acc, i) => acc + (i.precio * i.cant), 0);
    const montoAbono = tipoPago === 'Completo' ? totalVenta : Number(document.getElementById('co-monto-abono').value);

    const base64Voucher = await comprimirEnCanvas(voucherInput);
    await apiCall('subirVoucher', { idPedido, montoAbono, imagenBase64: base64Voucher });
    
    const carritoLimpio = carrito.map(item => ({ id: item.id, categoria: item.categoria, nombre: item.nombre, desc: item.desc, precio: item.precio, cant: item.cant }));
    await apiCall('crearPedido', { idPedido, documento, nombre, celular, tipoCliente, correo, carrito: carritoLimpio, total: totalVenta });

    mostrarAlerta('Pedido registrado con éxito. Esperando verificación en Cartera.', 'success');
    carrito = []; renderCarrito(); cerrarModal('modal-checkout');
  } catch (error) { 
    mostrarAlerta(error.message || 'Error al procesar el pedido.'); 
  } finally { 
    btn.disabled = false; btn.textContent = 'Confirmar y Enviar Pedido'; 
  }
}

async function cargarEmpleados() {
  const tbody = document.getElementById('lista-empleados'); 
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="center">Cargando...</td></tr>';
  try {
    const empleados = await apiCall('obtenerEmpleados');
    tbody.innerHTML = '';
    let empleadosVisibles = sesionActual.rol === 'Gerente' ? empleados.filter(e => e['Rol Asignado'] !== 'Superadmin') : empleados;
    empleadosVisibles.forEach(emp => {
      let opcionesRol = `<option value="Pendiente" ${emp['Rol Asignado'] === 'Ninguno' ? 'selected' : ''}>Sin Rol</option><option value="Vitrina" ${emp['Rol Asignado'] === 'Vitrina' ? 'selected' : ''}>Vitrina</option><option value="Cartera" ${emp['Rol Asignado'] === 'Cartera' ? 'selected' : ''}>Cartera</option><option value="Producción" ${emp['Rol Asignado'] === 'Producción' ? 'selected' : ''}>Producción</option><option value="Marketing" ${emp['Rol Asignado'] === 'Marketing' ? 'selected' : ''}>Marketing</option><option value="Pedidos" ${emp['Rol Asignado'] === 'Pedidos' ? 'selected' : ''}>Pedidos</option>`;
      if (sesionActual.rol === 'Superadmin') {
        opcionesRol += `<option value="Gerente" ${emp['Rol Asignado'] === 'Gerente' ? 'selected' : ''}>Gerente</option><option value="Superadmin" ${emp['Rol Asignado'] === 'Superadmin' ? 'selected' : ''}>Superadmin</option>`;
      }
      let opcionesEstado = `<option value="ACTIVO" ${emp['Estado'] === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option><option value="PENDIENTE" ${emp['Estado'] === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option><option value="BLOQUEADO" ${emp['Estado'] === 'BLOQUEADO' ? 'selected' : ''}>BLOQUEADO</option>`;
      const row = document.createElement('tr');
      row.innerHTML = `<td>${emp['Documento (Usuario)']}</td><td>${emp['Nombre Completo']}</td><td><select id="rol-${emp['Documento (Usuario)']}">${opcionesRol}</select></td><td><select id="estado-${emp['Documento (Usuario)']}">${opcionesEstado}</select></td><td style="display:flex; gap: 5px;"><button class="primary small" onclick="cambiarRolYEstado('${emp['Documento (Usuario)']}')">Guardar</button> <button class="small" style="background:var(--dark-red);" onclick="borrarEmpleado('${emp['Documento (Usuario)']}')">✕</button></td>`;
      tbody.appendChild(row);
    });
  } catch(e) {}
}

async function cambiarRolYEstado(documento) {
  const nuevoRol = document.getElementById(`rol-${documento}`).value;
  const nuevoEstado = document.getElementById(`estado-${documento}`).value;
  try { 
    await apiCall('actualizarRolEmpleado', { documento, nuevoRol, nuevoEstado }); 
    mostrarAlerta('Usuario actualizado', 'success');
  } catch(e) { mostrarAlerta('Error actualizando'); }
}

async function borrarEmpleado(documento) {
  if (!confirm('¿Eliminar este usuario permanentemente?')) return;
  try {
    await apiCall('eliminarEmpleado', { documento });
    cargarEmpleados();
    mostrarAlerta('Usuario eliminado', 'success');
  } catch(e) { mostrarAlerta('Error al eliminar'); }
}

// CARGA DE PEDIDOS BLINDADA (MUESTRA CUALQUIER ESTADO PARA EVITAR QUE QUEDEN OCULTOS)
async function cargarPedidos(estadoFiltro, contenedorID) {
  const container = document.getElementById(contenedorID); 
  if(!container) return;
  container.innerHTML = '<p class="note">Cargando datos desde Sheets...</p>';
  try {
    const pedidos = await apiCall('obtenerPedidosConAbonos'); 
    
    if (!pedidos || pedidos.length === 0) {
      container.innerHTML = '<p class="note">La base de datos no devolvió ningún pedido.</p>';
      return;
    }

    let caja = 0, fiado = 0, total = 0;
    pedidos.forEach(p => { 
      total += Number(p['Total'] || 0); 
      caja += Number(p['Total Abonado'] || 0); 
      fiado += Math.max(0, Number(p['Total'] || 0) - Number(p['Total Abonado'] || 0)); 
    });
    
    if(document.getElementById('stat-caja')) document.getElementById('stat-caja').textContent = money(caja);
    if(document.getElementById('stat-fiado')) document.getElementById('stat-fiado').textContent = money(fiado);
    if(document.getElementById('stat-total')) document.getElementById('stat-total').textContent = money(total);

    // FILTRO AMPLIO: Muestra todos los pedidos que estén pendientes o en espera, asegurando visibilidad total
    const filtrados = pedidos.filter(p => {
      let est = String(p['Estado'] || '').trim().toUpperCase();
      if (contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') {
        return est.includes('ESPERA') || est.includes('PENDIENTE') || est === '' || est.includes('PAGO');
      }
      return est.includes(estadoFiltro.toUpperCase());
    });
    
    if (filtrados.length === 0) {
      container.innerHTML = `<p class="note">No hay pedidos con filtro "${estadoFiltro}". (Total de pedidos en BD: ${pedidos.length})</p>`;
      return;
    }
    
    if (contenedorID === 'lista-despachados') {
      container.innerHTML = filtrados.map(p => `<tr><td><b>${p['ID Pedido']}</b></td><td>${p['Nombre']}</td><td>${money(p['Total'])}</td><td><span class="badge despachado">${p['Estado']}</span></td></tr>`).join('');
      return;
    } 

    container.innerHTML = filtrados.map(p => {
      let itemsCart = [];
      try { itemsCart = JSON.parse(p['Carrito (JSON)']); } catch(e) { itemsCart = []; }
      let saldo = Math.max(0, Number(p['Total'] || 0) - Number(p['Total Abonado'] || 0));
      let badgeDinero = saldo === 0 ? `<span class="badge activo">TOTALMENTE PAGO</span>` : `<span class="badge pendiente">SALDO PENDIENTE: ${money(saldo)}</span>`;
      let infoCliente = `<p class="note" style="text-align:left; color:white; margin:10px 0;">Titular: <b>${p['Nombre']}</b><br>Doc: ${p['Documento']} | Tel: ${p['Celular']}</p>`;
      
      let botones = '';
      if (contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') {
        botones = `<button class="primary full-width" onclick="aprobarPagoTotal('${p['ID Pedido']}')">Validar y Enviar a Cocina</button>`;
      } else if (p['Estado'] === 'EN PRODUCCIÓN') {
        botones = `<button class="purple full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'DESPACHADO')">Marcar Pedido Despachado</button>`;
      }
          
      return `<div class="card product-card" style="text-align:left; padding: 20px;"><h3 style="margin-bottom:5px; font-family:'Metal Mania', cursive;">${p['ID Pedido']}</h3>${badgeDinero}${infoCliente}<ul style="font-size:14px; color:var(--muted); padding-left:15px; margin-bottom:15px;">${itemsCart.map(i => `<li>${i.cant || 1}x ${i.nombre || 'Producto'}</li>`).join('')}</ul><div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold;"><span>Total:</span><span class="text-gold">${money(p['Total'])}</span></div>${botones}</div>`;
    }).join('');
    
  } catch(e) {
    container.innerHTML = `<p class="note" style="color:var(--red);">Error cargando pedidos: ${e.message}</p>`;
  }
}

async function aprobarPagoTotal(id) {
  if(!confirm('¿Confirmas la validación de este pago? La orden pasará a cocina y se generará la factura.')) return;
  try { 
    mostrarAlerta('Generando Factura PDF...', 'info');
    const res = await apiCall('aprobarPagoCompleto', { idPedido: id }); 
    mostrarAlerta('Aprobado con éxito. Factura creada.', 'success');
    if (res.urlFactura && res.urlFactura.includes('http')) window.open(res.urlFactura, '_blank');
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera');
  } catch(e) { 
    mostrarAlerta(e.message); 
  }
}

async function cambiarEstadoPedido(idPedido, nuevoEstado) {
  try {
    await apiCall('cambiarEstadoPedido', { idPedido, nuevoEstado });
    cargarPedidos('EN PRODUCCIÓN', 'lista-produccion');
  } catch(e) {}
}

function abrirModalAbono(id) {
  document.getElementById('abono-id').value = id;
  document.getElementById('modal-abono').classList.add('active');
}

async function guardarAbono() {
  const btn = document.getElementById('btn-guardar-abono');
  const d = { 
    idPedido: document.getElementById('abono-id').value, 
    montoAbono: Number(document.getElementById('abono-monto').value), 
    voucher: document.getElementById('abono-voucher').files[0] 
  };
  if (!d.montoAbono || !d.voucher) return mostrarAlerta('Ingresa el monto y adjunta el comprobante');
  btn.disabled = true; btn.textContent = 'Subiendo voucher...';
  try {
    d.imagenBase64 = await comprimirEnCanvas(d.voucher);
    await apiCall('subirVoucher', d);
    mostrarAlerta('Abono registrado', 'success');
    cerrarModal('modal-abono');
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera');
  } catch(e) { 
    mostrarAlerta('Error al subir el abono'); 
  } finally { 
    btn.disabled = false; btn.textContent = 'Guardar Abono en el Historial'; 
  }
}

async function cargarFacturas() {
  const tbody = document.getElementById('lista-facturas'); 
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="center">Cargando facturas...</td></tr>';
  try { 
    FACTURAS_GLOBAL = await apiCall('obtenerFacturas'); 
    filtrarFacturas(); 
  } catch(e) { 
    tbody.innerHTML = `<tr><td colspan="5" class="center" style="color:var(--red);">Error: ${e.message}</td></tr>`; 
  }
}

function filtrarFacturas() {
  const buscador = document.getElementById('buscador-facturas');
  const query = buscador ? buscador.value.toLowerCase().trim() : ''; 
  const tbody = document.getElementById('lista-facturas'); 
  if(!tbody) return;
  if (!FACTURAS_GLOBAL || FACTURAS_GLOBAL.length === 0) {
    return tbody.innerHTML = '<tr><td colspan="5" class="center">No hay facturas registradas.</td></tr>';
  }
  const filtradas = FACTURAS_GLOBAL.filter(f => {
    const doc = String(f['Documento'] || '').toLowerCase();
    const idPed = String(f['ID Pedido'] || '').toLowerCase();
    return doc.includes(query) || idPed.includes(query);
  });
  if(filtradas.length === 0) {
    return tbody.innerHTML = '<tr><td colspan="5" class="center">No se encontraron facturas.</td></tr>';
  }
  tbody.innerHTML = filtradas.map(f => `<tr><td>${f['ID Factura'] || 'N/A'}</td><td>${f['ID Pedido'] || 'N/A'}</td><td>${f['Documento'] || 'N/A'}</td><td>${f['Fecha'] || 'N/A'}</td><td>${f['URL PDF'] && String(f['URL PDF']).includes('http') ? `<a href="${f['URL PDF']}" target="_blank" style="color:var(--gold); text-decoration:underline; font-weight:bold;">Descargar PDF</a>` : `<span style="color:var(--red);">Sin enlace</span>`}</td></tr>`).join('');
}

function cambiarTipoPromo() {
  const tipo = document.getElementById('promo-tipo').value;
  const txt = document.getElementById('promo-contenido');
  const img = document.getElementById('promo-img-file');
  if(tipo === 'imagen') { txt.classList.add('hidden'); img.classList.remove('hidden'); } 
  else { txt.classList.remove('hidden'); img.classList.add('hidden'); txt.placeholder = tipo === 'video' ? 'Enlace de YouTube...' : 'Escribe tu mensaje...'; }
}

async function guardarPromocion() {
  const btn = document.getElementById('btn-guardar-promo');
  const activa = document.getElementById('promo-activa').value;
  const tipo = document.getElementById('promo-tipo').value;
  const contenidoTxt = document.getElementById('promo-contenido').value;
  const fileInput = document.getElementById('promo-img-file').files[0];
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    let base64Img = '';
    if (tipo === 'imagen' && fileInput) base64Img = await comprimirEnCanvas(fileInput);
    await apiCall('guardarPromocion', { activa, tipo, contenidoTxt, base64Img });
    mostrarAlerta('Promoción guardada.', 'success');
    await cargarPromocionGlobal();
  } catch(e) {
    mostrarAlerta(e.message || 'Error guardando promoción');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar Promoción';
  }
}

async function cargarPromocionGlobal() {
   try {
     const promo = await apiCall('obtenerPromocion');
     const banner = document.getElementById('sidebar-promo');
     if(!banner) return;
     if(promo && promo.activa === 'SI') {
        banner.classList.remove('hidden');
        if(promo.tipo === 'texto') banner.innerHTML = `<p>${promo.contenidoTxt}</p>`;
        if(promo.tipo === 'imagen') banner.innerHTML = `<img src="${promo.base64Img}" alt="Promo">`;
        if(promo.tipo === 'video') banner.innerHTML = `<a href="${promo.contenidoTxt}" target="_blank" style="color:var(--gold); font-weight:bold;">🎬 Ver Video Promocional</a>`;
     } else {
        banner.classList.add('hidden');
     }
   } catch(e) {}
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('Error SW:', err));
  });
}
