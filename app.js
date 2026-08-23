// ============================================================================
// SISTEMA ERP: MR. LOBO BURGERZ - FRONTEND (JAVASCRIPT) V10.0 DEFINITIVO
// CÓDIGO COMPLETO Y SIN COMPRIMIR - ESTRUCTURA ORIGINAL RESTAURADA
// ============================================================================

const API_URL = "https://script.google.com/macros/s/AKfycbz6med-rYVxbAgfUgxGDstg4zEfXrJ6Sd5kRbjsuYd1LZn56XIAEeVMfUue3Ck9JbxWug/exec";

let sesionActual = null; 
let clienteFidelizado = null; 
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
    
    const savedFidelidad = localStorage.getItem('lobo_cliente');
    
    if (savedFidelidad) {
      clienteFidelizado = JSON.parse(savedFidelidad);
    }

    configurarInterfazPorRol();
    await cargarCatalogoGlobal();
    await cargarPromocionGlobal();
  } catch (error) { 
    console.error(error); 
  }
};

async function apiCall(accion, datos = {}) {
  try {
    const response = await fetch(API_URL, { 
      method: 'POST', 
      body: JSON.stringify({ accion, datos }) 
    });
    
    const textResponse = await response.text();
    let result = JSON.parse(textResponse);
    
    if (!result.exito) {
      throw new Error(result.error);
    }
    
    return result.data;
  } catch (error) { 
    throw error; 
  }
}

function forzarUpdatePWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let r of registrations) { 
        r.unregister(); 
      }
      caches.keys().then(keys => {
        Promise.all(keys.map(key => caches.delete(key))).then(() => {
          mostrarAlerta('Sistema actualizado exitosamente. Recargando...', 'success');
          setTimeout(() => window.location.reload(true), 1500);
        });
      });
    });
  } else { 
    window.location.reload(true); 
  }
}

function navegar(vistaID) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  
  const target = document.getElementById(`view-${vistaID}`);
  if (target) { 
    target.classList.add('active'); 
  }
  
  if (vistaID === 'admin') { 
    cargarEmpleados(); 
    cargarRankingReferidos(); 
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-admin'); 
  }
  if (vistaID === 'marketing') { 
    cargarGestorMenu(); 
  }
  if (vistaID === 'facturas') { 
    cargarFacturas(); 
  }
  if (vistaID === 'cartera') { 
    cargarPedidos('ESPERA DE VERIFICACIÓN', 'lista-cartera'); 
  }
  if (vistaID === 'produccion') { 
    cargarPedidos('EN PRODUCCIÓN', 'lista-produccion'); 
  }
  if (vistaID === 'despachados') { 
    cargarPedidos('DESPACHADO', 'lista-despachados'); 
  }
}

function cerrarSesion() {
  localStorage.removeItem('lobo_session');
  sesionActual = { documento: 'Invitado', nombre: 'Cliente Presencial', rol: 'Cliente' };
  configurarInterfazPorRol();
  mostrarAlerta('Sesión cerrada correctamente', 'info');
}

function entrarComoCliente() { 
  cerrarSesion(); 
}

function configurarInterfazPorRol() {
  const rolSeguro = String(sesionActual.rol || '').toLowerCase();
  const isCliente = rolSeguro === 'cliente';
  
  const nav = document.getElementById('main-nav');
  const loginIcon = document.getElementById('btn-login-icon');
  const greeting = document.getElementById('user-greeting');
  
  if (nav) {
    nav.style.display = isCliente ? 'none' : 'flex';
  }
  
  if (loginIcon) {
    loginIcon.style.display = isCliente ? 'block' : 'none';
  }
  
  if (greeting) {
    greeting.textContent = isCliente ? 'Menú Principal' : `Hola, ${sesionActual.nombre} (${sesionActual.rol})`;
  }

  if (isCliente) {
    return navegar('vitrina');
  }

  document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'none');
  
  const btnOutline = document.querySelector('.btn-outline');
  const btnUpdate = document.getElementById('btn-update-pwa');
  
  if (btnOutline) {
    btnOutline.style.display = 'block'; 
  }
  
  if (btnUpdate) {
    btnUpdate.style.display = (rolSeguro === 'superadmin' || rolSeguro === 'superadministrador' || rolSeguro === 'gerente') ? 'block' : 'none';
  }

  if (rolSeguro === 'superadmin' || rolSeguro === 'superadministrador' || rolSeguro === 'gerente') {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.style.display = 'block');
    navegar('admin');
  } else if (rolSeguro === 'vitrina') {
    const navVit = document.getElementById('nav-vitrina'); 
    if (navVit) {
      navVit.style.display = 'block'; 
    }
    navegar('vitrina');
  } else if (rolSeguro === 'cartera') {
    const navCart = document.getElementById('nav-cartera'); 
    if (navCart) {
      navCart.style.display = 'block'; 
    }
    navegar('cartera');
  } else if (rolSeguro === 'producción' || rolSeguro === 'produccion') {
    const navProd = document.getElementById('nav-produccion'); 
    if (navProd) {
      navProd.style.display = 'block'; 
    }
    navegar('produccion');
  } else if (rolSeguro === 'pedidos' || rolSeguro === 'despachos') {
    const navDespachados = document.getElementById('nav-despachados'); 
    if (navDespachados) {
      navDespachados.style.display = 'block'; 
    }
    navegar('despachados');
  } else if (rolSeguro === 'marketing') {
    const navMark = document.getElementById('nav-marketing'); 
    if (navMark) {
      navMark.style.display = 'block'; 
    }
    navegar('marketing');
  }
}

async function iniciarSesion() {
  const doc = document.getElementById('login-doc').value;
  const pass = document.getElementById('login-pass').value;
  
  if (!doc || !pass) {
    return mostrarAlerta('Ingresa documento y contraseña');
  }
  
  mostrarAlerta('Verificando...', 'info');
  
  try {
    const empleados = await apiCall('obtenerEmpleados', { rolSolicitante: 'Login' });
    const usuario = empleados.find(e => String(e['Documento (Usuario)']) === String(doc) && String(e['Contraseña']) === String(pass));
    
    if (!usuario) {
      return mostrarAlerta('Credenciales incorrectas');
    }
    
    if (String(usuario['Estado']).toUpperCase() === 'BLOQUEADO') {
      return mostrarAlerta('Cuenta bloqueada.');
    }
    
    sesionActual = { 
      documento: doc, 
      nombre: usuario['Nombre Completo'], 
      rol: usuario['Rol Asignado'] 
    };
    
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
  
  if (Object.values(datos).some(x => !x)) {
    return mostrarAlerta('Faltan campos obligatorios');
  }
  
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
  
  if (alertBox) {
    alertBox.textContent = msg; 
    alertBox.className = `alert ${tipo}`;
    setTimeout(() => alertBox.classList.add('hidden'), 5000);
  } else { 
    alert(msg); 
  }
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

// ----------------------------------------------------------------------------
// SISTEMA DE FIDELIZACIÓN
// ----------------------------------------------------------------------------

function abrirModalFidelidad() {
  if (clienteFidelizado) {
    if (confirm(`Ya tienes sesión como ${clienteFidelizado.nombre}. ¿Deseas cerrar sesión?`)) {
      clienteFidelizado = null; 
      localStorage.removeItem('lobo_cliente'); 
      mostrarAlerta('Sesión de cliente cerrada', 'info');
    }
  } else { 
    document.getElementById('modal-fidelidad').classList.add('active'); 
  }
}

function toggleFidForms() {
  document.getElementById('fid-login-section').classList.toggle('hidden');
  document.getElementById('fid-reg-section').classList.toggle('hidden');
}

async function registrarFidelidad() {
  const datos = {
    documento: document.getElementById('fid-reg-doc').value,
    nombre: document.getElementById('fid-reg-nombre').value,
    celular: document.getElementById('fid-reg-celular').value,
    correo: document.getElementById('fid-reg-correo').value,
    referido: document.getElementById('fid-reg-referido').value,
    clave: document.getElementById('fid-reg-pass').value
  };
  
  if (!datos.documento || !datos.nombre || !datos.celular || !datos.clave) {
    return mostrarAlerta('Faltan campos requeridos.');
  }
  
  try {
    mostrarAlerta('Registrando...', 'info');
    clienteFidelizado = await apiCall('registrarClienteFidelizado', datos);
    localStorage.setItem('lobo_cliente', JSON.stringify(clienteFidelizado));
    cerrarModal('modal-fidelidad');
    mostrarAlerta('Membresía creada exitosamente.', 'success');
  } catch (e) { 
    mostrarAlerta(e.message); 
  }
}

async function loginFidelidad() {
  const doc = document.getElementById('fid-log-doc').value;
  const clave = document.getElementById('fid-log-pass').value;
  
  if (!doc || !clave) {
    return mostrarAlerta('Ingresa tus credenciales');
  }
  
  try {
    mostrarAlerta('Validando...', 'info');
    clienteFidelizado = await apiCall('loginClienteFidelizado', { documento: doc, clave: clave });
    localStorage.setItem('lobo_cliente', JSON.stringify(clienteFidelizado));
    cerrarModal('modal-fidelidad');
    mostrarAlerta(`Bienvenido de nuevo, ${clienteFidelizado.nombre}`, 'success');
  } catch (e) { 
    mostrarAlerta(e.message); 
  }
}

// ----------------------------------------------------------------------------
// CARGA Y GESTIÓN DE CATÁLOGO
// ----------------------------------------------------------------------------

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
        if (index !== -1) {
          catalogoFusionado[index] = prodNube;
        } else {
          catalogoFusionado.push(prodNube);
        }
      });
    }
    CATALOGO = catalogoFusionado;
  } catch (error) { 
    CATALOGO = [...CATALOGO_BASE]; 
  }
  
  if (document.getElementById('view-vitrina')?.classList.contains('active') || String(sesionActual?.rol).toLowerCase() === 'cliente') {
    renderCatalogo();
  }
}

function renderCatalogo() {
  const container = document.getElementById('catalogo-productos');
  
  if (!container) return;
  
  if (CATALOGO.length === 0) { 
    container.innerHTML = '<p class="note">Catálogo vacío.</p>'; 
    return; 
  }
  
  const categorias = [...new Set(CATALOGO.map(p => p.categoria))];
  let html = '';
  
  categorias.forEach(cat => {
    html += `<h3 style="grid-column: 1 / -1; margin-top: 40px; margin-bottom: 10px; color: var(--gold); border-bottom: 1px solid var(--border); padding-bottom: 10px; font-family: 'Metal Mania', cursive; font-size: 38px; text-align: center;">${cat}</h3>`;
    
    CATALOGO.filter(p => p.categoria === cat).forEach(prod => {
      const botonHTML = prod.agotado ? `<button class="btn-outline full-width" disabled>Agotado</button>` : `<button class="primary full-width" onclick="agregarAlCarrito('${prod.id}')">+ Añadir a pedido</button>`;
      
      html += `
        <div class="product-card" style="${prod.agotado ? 'opacity: 0.5; filter: grayscale(1);' : ''}">
          ${prod.urlImagen ? `<div class="product-img-container"><img src="${prod.urlImagen}" alt="${prod.nombre}"></div>` : ''}
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
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  CATALOGO.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.urlImagen ? `<img src="${p.urlImagen}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">` : 'Sin foto'}</td>
        <td>${p.categoria}</td>
        <td><b>${p.nombre}</b></td>
        <td>${money(p.precio)}</td>
        <td><span class="badge ${p.agotado ? 'denegado' : 'activo'}">${p.agotado ? 'AGOTADO' : 'DISPONIBLE'}</span></td>
        <td>
          <button class="primary small" onclick="abrirModalProducto('${p.id}')">Editar</button> 
          <button class="small" style="background:var(--dark-red);" onclick="eliminarProducto('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `;
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
        
        if (width > MAX_WIDTH) { 
          height = Math.round((height * MAX_WIDTH) / width); 
          width = MAX_WIDTH; 
        }
        
        canvas.width = width; 
        canvas.height = height; 
        ctx.fillStyle = "#ffffff"; 
        ctx.fillRect(0, 0, width, height); 
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
  
  if (!datos.nombre || !datos.descripcion || !datos.precio) {
    return mostrarAlerta('Faltan campos obligatorios');
  }
  
  btn.disabled = true; 
  btn.textContent = 'Guardando...';
  
  try {
    if (fileInput) {
      datos.imagenBase64 = await comprimirEnCanvas(fileInput); 
    }
    
    await apiCall('guardarProducto', datos);
    cerrarModal('modal-producto'); 
    await cargarCatalogoGlobal(); 
    cargarGestorMenu();
    mostrarAlerta('Producto guardado correctamente', 'success');
  } catch (error) { 
    mostrarAlerta(error.message); 
  } finally { 
    btn.disabled = false; 
    btn.textContent = 'Guardar'; 
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  
  if (CATALOGO_BASE.some(base => base.id === id)) {
    return mostrarAlerta('No se puede eliminar un producto base.', 'warning');
  }
  
  try { 
    await apiCall('eliminarProducto', { idProducto: id }); 
    mostrarAlerta('Producto eliminado', 'success'); 
    await cargarCatalogoGlobal(); 
    cargarGestorMenu(); 
  } catch(e) { 
    mostrarAlerta(e.message); 
  }
}

// ----------------------------------------------------------------------------
// CARRITO DE COMPRAS
// ----------------------------------------------------------------------------

function agregarAlCarrito(id) { 
  const prod = CATALOGO.find(p => p.id === id); 
  const item = carrito.find(i => i.id === id); 
  
  if (item) {
    item.cant++; 
  } else {
    carrito.push({ ...prod, cant: 1 }); 
  }
  
  renderCarrito(); 
}

function quitarDelCarrito(id) { 
  carrito = carrito.filter(i => { 
    if (i.id === id) {
      i.cant--; 
    }
    return i.cant > 0; 
  }); 
  
  renderCarrito(); 
}

function renderCarrito() {
  const container = document.getElementById('carrito-items'); 
  const btnProcesar = document.getElementById('btn-procesar'); 
  const displayTotal = document.getElementById('carrito-total-precio');
  
  if(!container) return;
  
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

function abrirModalCheckout() { 
  document.getElementById('modal-checkout').classList.add('active'); 
  
  if(clienteFidelizado) {
    document.getElementById('co-tipo').value = 'Continuo'; 
    document.getElementById('co-doc').value = clienteFidelizado.documento;
    document.getElementById('co-nombre').value = clienteFidelizado.nombre; 
    document.getElementById('co-celular').value = clienteFidelizado.celular;
    
    if(clienteFidelizado.correo) {
      document.getElementById('co-correo').value = clienteFidelizado.correo;
    }
    
    toggleCamposCliente();
  }
}

function cerrarModal(id) { 
  document.getElementById(id).classList.remove('active'); 
}

function toggleCamposCliente() { 
  document.getElementById('co-correo-field').classList.toggle('hidden', document.getElementById('co-tipo').value === 'Ocasional'); 
}

function toggleVoucherInput() { 
  document.getElementById('co-monto-abono-field').classList.toggle('hidden', document.getElementById('co-tipo-pago').value === 'Completo'); 
}

async function enviarPedido() {
  const btn = document.getElementById('btn-enviar-pedido');
  const tipoCliente = document.getElementById('co-tipo').value; 
  const documento = document.getElementById('co-doc').value; 
  const nombre = document.getElementById('co-nombre').value; 
  const apellidos = document.getElementById('co-apellidos').value; 
  const jornada = document.getElementById('co-jornada').value; 
  const grado = document.getElementById('co-grado').value; 
  const celular = document.getElementById('co-celular').value; 
  const correo = document.getElementById('co-correo').value; 
  const referido = document.getElementById('co-referido').value; 
  const tipoPago = document.getElementById('co-tipo-pago').value; 
  const voucherInput = document.getElementById('co-voucher').files[0];
  
  if (!documento || !nombre || !apellidos || !jornada || !grado || !celular) {
    return mostrarAlerta('Faltan datos obligatorios del cliente');
  }
  
  if (!voucherInput) {
    return mostrarAlerta('Debe adjuntar el comprobante');
  }

  btn.disabled = true; 
  btn.textContent = 'Procesando...';
  
  try {
    const idPedido = 'ORD-' + new Date().getTime().toString().slice(-6);
    const totalVenta = carrito.reduce((acc, i) => acc + (i.precio * i.cant), 0);
    const montoAbono = tipoPago === 'Completo' ? totalVenta : Number(document.getElementById('co-monto-abono').value);

    const base64Voucher = await comprimirEnCanvas(voucherInput);
    await apiCall('subirVoucher', { idPedido, montoAbono, imagenBase64: base64Voucher });
    
    const carritoLimpio = carrito.map(item => ({ 
      id: item.id, 
      categoria: item.categoria, 
      nombre: item.nombre, 
      desc: item.desc, 
      precio: item.precio, 
      cant: item.cant 
    }));
    
    await apiCall('crearPedido', { 
      idPedido, 
      documento, 
      nombre, 
      apellidos, 
      jornada, 
      grado, 
      celular, 
      tipoCliente, 
      correo, 
      referido, 
      carrito: carritoLimpio, 
      total: totalVenta 
    });
    
    mostrarAlerta('Pedido registrado con éxito.', 'success');
    carrito = []; 
    renderCarrito(); 
    cerrarModal('modal-checkout');
    
    document.getElementById('co-apellidos').value = '';
    document.getElementById('co-jornada').value = '';
    document.getElementById('co-grado').value = '';
    document.getElementById('co-referido').value = '';
    
  } catch (error) { 
    mostrarAlerta(error.message || 'Error al procesar.'); 
  } finally { 
    btn.disabled = false; 
    btn.textContent = 'Confirmar y Enviar Pedido'; 
  }
}

// ----------------------------------------------------------------------------
// GESTIÓN DE PERSONAL Y REFERIDOS
// ----------------------------------------------------------------------------

async function cargarEmpleados() {
  const tbody = document.getElementById('lista-empleados'); 
  
  if(!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5" class="center">Cargando...</td></tr>';
  
  try {
    const empleados = await apiCall('obtenerEmpleados', { rolSolicitante: sesionActual.rol });
    tbody.innerHTML = '';
    
    const rolSeguro = String(sesionActual.rol || '').toLowerCase();
    const rolesPosibles = (rolSeguro === 'superadmin' || rolSeguro === 'superadministrador') ? ['Superadmin', 'Gerente', 'Vitrina', 'Cartera', 'Producción', 'Pedidos', 'Marketing'] : ['Vitrina', 'Cartera', 'Producción', 'Pedidos', 'Marketing'];

    empleados.forEach(emp => {
      const doc = emp['Documento (Usuario)'];
      const rolSelect = rolesPosibles.map(r => `<option value="${r}" ${emp['Rol Asignado'] === r ? 'selected' : ''}>${r}</option>`).join('');
      
      tbody.innerHTML += `
        <tr>
          <td>${doc}</td>
          <td>${emp['Nombre Completo']}</td>
          <td><select id="rol-${doc}">${rolSelect}</select></td>
          <td>
            <select id="estado-${doc}">
              <option value="ACTIVO" ${emp['Estado'] === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
              <option value="PENDIENTE" ${emp['Estado'] === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
              <option value="BLOQUEADO" ${emp['Estado'] === 'BLOQUEADO' ? 'selected' : ''}>BLOQUEADO</option>
            </select>
          </td>
          <td>
            <button class="primary small" onclick="cambiarRolYEstado('${doc}')">Guardar</button> 
            <button class="small" style="background:var(--dark-red); color: white;" onclick="eliminarEmpleado('${doc}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  } catch(e) { 
    console.error(e); 
  }
}

async function cargarRankingReferidos() {
  const tbody = document.getElementById('lista-referidos');
  
  if(!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="2" class="center note">Calculando ranking...</td></tr>';
  
  try {
    const ranking = await apiCall('obtenerRankingReferidos');
    
    if (!ranking || ranking.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" class="center note">No hay referidos registrados aún.</td></tr>';
      return;
    }
    
    tbody.innerHTML = ranking.map(r => `
      <tr>
        <td><b>${r.nombre}</b></td>
        <td style="text-align:center;"><span class="badge activo">${r.cantidad} referidos</span></td>
      </tr>
    `).join('');
    
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="2" class="center note" style="color:var(--red);">Error al cargar ranking.</td></tr>';
  }
}

async function cambiarRolYEstado(documento) {
  const nuevoRol = document.getElementById(`rol-${documento}`).value; 
  const nuevoEstado = document.getElementById(`estado-${documento}`).value;
  
  try { 
    await apiCall('actualizarRolEmpleado', { documento, nuevoRol, nuevoEstado }); 
    mostrarAlerta('Actualizado', 'success'); 
  } catch(e) { 
    mostrarAlerta('Error al actualizar empleado'); 
  }
}

async function eliminarEmpleado(documento) {
  if(!confirm('¿Seguro que deseas eliminar definitivamente a este empleado?')) return;
  
  try { 
    await apiCall('eliminarEmpleado', { documento }); 
    mostrarAlerta('Empleado eliminado exitosamente', 'success'); 
    cargarEmpleados(); 
  } catch(e) { 
    mostrarAlerta('Error eliminando empleado'); 
  }
}

function togglePedido(id) {
  document.querySelectorAll('[id^="detalles-"]').forEach(el => {
    if (el.id !== 'detalles-' + id && !el.classList.contains('hidden')) {
      el.classList.add('hidden');
      const iconId = el.id.replace('detalles-', 'icon-');
      
      if (document.getElementById(iconId)) {
        document.getElementById(iconId).textContent = '▼';
      }
    }
  });

  const detalles = document.getElementById('detalles-' + id);
  const icon = document.getElementById('icon-' + id);
  
  if (detalles && icon) {
    if (detalles.classList.contains('hidden')) {
      detalles.classList.remove('hidden');
      icon.textContent = '▲';
    } else {
      detalles.classList.add('hidden');
      icon.textContent = '▼';
    }
  }
}

function verVoucherLocal(base64Data) {
  const w = window.open("");
  w.document.write(`
    <title>Comprobante de Pago</title>
    <div style="text-align:center; background:#000; height:100vh; display:flex; justify-content:center; align-items:center; margin:0;">
      <img src="${base64Data}" style="max-width:100%; max-height:100vh; object-fit:contain;">
    </div>
  `);
}

async function cargarPedidos(estadoFiltro, contenedorID) {
  const container = document.getElementById(contenedorID); 
  
  if(!container) return;
  
  container.innerHTML = '<p class="note">Cargando pedidos...</p>';
  
  try {
    const pedidos = await apiCall('obtenerPedidosConAbonos'); 
    const pedidosValidos = (pedidos || []).filter(p => p && p['ID Pedido'] && String(p['ID Pedido']).trim() !== '');

    let caja = 0, fiado = 0, total = 0;
    
    pedidosValidos.forEach(p => { 
      total += Number(p['Total'] || 0); 
      caja += Number(p['Total Abonado'] || 0); 
      fiado += Math.max(0, Number(p['Total'] || 0) - Number(p['Total Abonado'] || 0)); 
    });
    
    if(document.getElementById('stat-caja')) {
      document.getElementById('stat-caja').textContent = money(caja);
    }
    if(document.getElementById('stat-fiado')) {
      document.getElementById('stat-fiado').textContent = money(fiado);
    }
    if(document.getElementById('stat-total')) {
      document.getElementById('stat-total').textContent = money(total);
    }

    const filtrados = pedidosValidos.filter(p => {
      let est = String(p['Estado'] || '').trim().toUpperCase();
      if (contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') {
        return est.includes('ESPERA') || est.includes('PENDIENTE') || est === '' || est.includes('PAGO');
      }
      return est.includes(estadoFiltro.toUpperCase());
    });
    
    if (filtrados.length === 0) { 
      container.innerHTML = `<p class="note">No hay pedidos en esta etapa.</p>`; 
      return; 
    }
    
    if (contenedorID === 'lista-despachados') {
      container.innerHTML = filtrados.map(p => `
        <tr>
          <td><b>${p['ID Pedido']}</b></td>
          <td>${p['Nombre'] || ''}</td>
          <td>${money(p['Total'])}</td>
          <td><span class="badge despachado">${p['Estado']}</span></td>
        </tr>
      `).join('');
      return;
    } 

    container.innerHTML = filtrados.map(p => {
      let itemsCart = []; 
      try { 
        itemsCart = JSON.parse(p['Carrito (JSON)'] || '[]'); 
      } catch(e) { 
        itemsCart = []; 
      }
      
      let saldo = Math.max(0, Number(p['Total'] || 0) - Number(p['Total Abonado'] || 0));
      let badgeDinero = saldo === 0 ? `<span class="badge activo">TOTALMENTE PAGO</span>` : `<span class="badge pendiente">SALDO PENDIENTE: ${money(saldo)}</span>`;
      
      let abonosHtml = '';
      if (p['Historial Abonos'] && p['Historial Abonos'].length > 0) {
        abonosHtml = '<div style="margin-top:10px; padding-top:10px; border-top:1px solid #333;"><strong>Comprobantes de pago guardados:</strong><br>';
        
        p['Historial Abonos'].forEach((abono, index) => {
          let vURL = abono['URL Voucher'] || '';
          let action = vURL.startsWith('data:image') 
            ? `href="javascript:void(0)" onclick="verVoucherLocal('${vURL}')"` 
            : `href="${vURL}" target="_blank"`;
          
          abonosHtml += `<a ${action} style="color:var(--gold); text-decoration:underline; font-size: 13px; font-weight:bold; margin-right: 10px; display:inline-block; margin-top:8px;">📄 Ver Voucher ${index + 1} (${money(abono['Monto'])})</a>`;
        });
        
        abonosHtml += '</div>';
      }
      
      let mostrarAbonos = (contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') ? abonosHtml : '';
      let botones = '';
      
      if (contenedorID === 'lista-cartera' || contenedorID === 'lista-admin') { 
        botones = `<button class="primary full-width" onclick="aprobarPagoTotal('${p['ID Pedido']}')">Validar y Enviar a Cocina</button>`; 
      } else if (p['Estado'] === 'EN PRODUCCIÓN') { 
        botones = `<button class="purple full-width" onclick="cambiarEstadoPedido('${p['ID Pedido']}', 'DESPACHADO')">Marcar Pedido Despachado</button>`; 
      }
          
      return `
        <div class="card product-card" style="text-align:left; padding: 15px;">
          <div onclick="togglePedido('${p['ID Pedido']}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h3 style="margin:0; font-family:'Metal Mania', cursive; font-size:22px; color:var(--gold); text-align:left;">${p['ID Pedido']}</h3>
              <p style="margin:5px 0 0 0; font-size:14px; color:white; text-align:left;">Titular: <b>${p['Nombre'] || ''}</b></p>
            </div>
            <div id="icon-${p['ID Pedido']}" style="font-size:18px; color:var(--gold); font-weight:bold; padding: 10px;">▼</div>
          </div>

          <div id="detalles-${p['ID Pedido']}" class="hidden" style="margin-top:15px; border-top:1px dashed var(--border); padding-top:15px;">
            <div style="margin-bottom:15px;">${badgeDinero}</div>
            <p class="note" style="text-align:left; color:var(--muted); margin:0 0 10px 0;">
              Doc: ${p['Documento'] || ''} <br> Tel: ${p['Celular'] || ''}
            </p>
            <ul style="font-size:14px; color:var(--muted); padding-left:15px; margin-bottom:15px;">
              ${itemsCart.map(i => `<li>${i.cant || 1}x ${i.nombre || ''}</li>`).join('')}
            </ul>
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold; border-bottom:1px solid #333; padding-bottom:10px;">
              <span>Total de la compra:</span>
              <span class="text-gold" style="font-size:18px;">${money(p['Total'])}</span>
            </div>
            ${mostrarAbonos}
            <div style="margin-top: 20px;">${botones}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch(e) { 
    container.innerHTML = `<p class="note" style="color:var(--red);">Error cargando pedidos.</p>`; 
  }
}

function descargarPDFLocal(base64Data, fileName) {
  try {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) { 
      byteNumbers[i] = byteCharacters.charCodeAt(i); 
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'application/pdf'});
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl; 
    link.download = fileName; 
    document.body.appendChild(link); 
    link.click();
    
    setTimeout(() => { 
      document.body.removeChild(link); 
      window.URL.revokeObjectURL(blobUrl); 
    }, 250);
  } catch (err) { 
    mostrarAlerta('Error interno al generar el archivo.', 'error'); 
  }
}

async function aprobarPagoTotal(id) {
  if(!confirm('¿Confirmas la validación de este pago? La orden pasará a cocina y se generará la factura.')) return;
  
  try { 
    mostrarAlerta('Validando pago y guardando PDF en Drive...', 'info');
    const res = await apiCall('aprobarPagoCompleto', { idPedido: id }); 
    mostrarAlerta('Aprobado con éxito. Descargando copia local...', 'success');
    
    if (res.pdfBase64) {
      descargarPDFLocal(res.pdfBase64, `Factura_${id}.pdf`);
    }
    
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

async function cargarFacturas() {
  const tbody = document.getElementById('lista-facturas'); 
  
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5" class="center">Cargando facturas...</td></tr>';
  
  try { 
    FACTURAS_GLOBAL = await apiCall('obtenerFacturas'); 
    filtrarFacturas(); 
  } catch(e) { 
    tbody.innerHTML = `<tr><td colspan="5" class="center" style="color:var(--red);">Error al cargar historial</td></tr>`; 
  }
}

function filtrarFacturas() {
  const buscador = document.getElementById('buscador-facturas');
  const query = buscador ? buscador.value.toLowerCase().trim() : ''; 
  const tbody = document.getElementById('lista-facturas'); 
  
  if(!tbody) return;
  
  const filtradas = (FACTURAS_GLOBAL || []).filter(f => f && (String(f['Documento'] || '').toLowerCase().includes(query) || String(f['ID Pedido'] || '').toLowerCase().includes(query)));
  
  if(filtradas.length === 0) { 
    tbody.innerHTML = '<tr><td colspan="5" class="center">No hay facturas.</td></tr>'; 
    return; 
  }
  
  tbody.innerHTML = filtradas.map(f => {
    let url = String(f['URL PDF'] || '').trim();
    let badge = '';
    
    if(url.startsWith('http')) {
      badge = `<a href="${url}" target="_blank" style="color:var(--gold); text-decoration:underline;">Descargar PDF (Drive)</a>`;
    } else if (url.startsWith('ERROR')) {
      badge = `<span style="color:var(--red); font-size: 12px;" title="${url}">Error en Drive</span>`;
    } else {
      badge = `<span style="color:var(--muted); font-size: 12px;">Descargada Localmente en Caja</span>`;
    }
    
    return `
      <tr>
        <td>${f['ID Factura'] || ''}</td>
        <td>${f['ID Pedido'] || ''}</td>
        <td>${f['Documento'] || ''}</td>
        <td>${f['Fecha'] || ''}</td>
        <td>${badge}</td>
      </tr>
    `;
  }).join('');
}

async function guardarPromocion() {
  const btn = document.getElementById('btn-guardar-promo');
  const activa = document.getElementById('promo-activa').value;
  const tipo = document.getElementById('promo-tipo').value;
  const contenidoTxt = document.getElementById('promo-contenido').value;
  const fileInput = document.getElementById('promo-img-file').files[0];
  
  try {
    let base64Img = '';
    
    if (tipo === 'imagen' && fileInput) {
      base64Img = await comprimirEnCanvas(fileInput);
    }
    
    await apiCall('guardarPromocion', { activa, tipo, contenidoTxt, base64Img });
    mostrarAlerta('Promoción guardada.', 'success');
  } catch(e) { 
    mostrarAlerta('Error guardando la promoción.'); 
  }
}

async function cargarPromocionGlobal() {
   try {
     const promo = await apiCall('obtenerPromocion');
     const banner = document.getElementById('sidebar-promo');
     
     if(!banner) return;
     
     if(promo && promo.activa === 'SI') {
        banner.classList.remove('hidden');
        if(promo.tipo === 'texto') {
          banner.innerHTML = `<p>${promo.contenidoTxt}</p>`;
        }
        if(promo.tipo === 'imagen') {
          banner.innerHTML = `<img src="${promo.base64Img}" alt="Promo">`;
        }
     } else { 
       banner.classList.add('hidden'); 
     }
   } catch(e) { 
     console.error('Error cargando promoción', e); 
   }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { 
    navigator.serviceWorker.register('./sw.js').catch(err => { 
      console.log('Error', err); 
    }); 
  });
}
