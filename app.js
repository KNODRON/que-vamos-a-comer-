"use strict";

const COMIDAS_ORIGINALES = {
  almuerzo: [
    "Charquicán",
    "Arroz con pollo",
    "Tallarines con salsa y albóndigas",
    "Pastel de papas",
    "Lentejas",
    "Porotos con riendas",
    "Cazuela de vacuno",
    "Cazuela de pollo",
    "Pollo al horno con papas",
    "Carne al jugo con arroz",
    "Arroz primavera con carne",
    "Puré con bistec",
    "Puré con pollo",
    "Carbonada",
    "Chapsui de pollo",
    "Tallarines con pollo",
    "Papas doradas con carne",
    "Hamburguesas con arroz",
    "Pescado con ensalada",
    "Arroz con huevo y ensalada"
  ],

  once: [
    "Palta con huevo",
    "Aliado",
    "Palta con queso blanco",
    "Huevo con queso",
    "Jamón con tomate",
    "Atún con palta",
    "Quesillo con tomate",
    "Pan con pollo",
    "Jamón y queso",
    "Palta con tomate",
    "Huevos revueltos",
    "Pan con carne",
    "Ave palta",
    "Ave mayo",
    "Quesillo con palta",
    "Tostadas con huevo",
    "Pan con atún",
    "Sándwich de pollo",
    "Tomate con huevo",
    "Pan amasado con queso"
  ]
};

const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo"
];

const NOMBRES_DIAS = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo"
};

const CLAVE_COMIDAS = "queComemos_comidas_v1";
const CLAVE_MENU = "queComemos_menu_v1";

let tipoActual = "almuerzo";
let resultadoActual = null;
let girando = false;
let rotacionActual = 0;

let comidas = cargarComidas();
let menuSemanal = cargarMenu();

const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");

const btnAlmuerzo = document.getElementById("btn-almuerzo");
const btnOnce = document.getElementById("btn-once");
const btnGirar = document.getElementById("btn-girar");
const btnAceptar = document.getElementById("btn-aceptar");
const btnRepetir = document.getElementById("btn-repetir");
const btnLimpiarSemana = document.getElementById("btn-limpiar-semana");
const btnAgregar = document.getElementById("btn-agregar");
const btnRestaurar = document.getElementById("btn-restaurar");

const selectorDia = document.getElementById("dia");
const selectorNuevoTipo = document.getElementById("nuevo-tipo");
const inputNuevaComida = document.getElementById("nueva-comida");

const resultado = document.getElementById("resultado");
const resultadoDia = document.getElementById("resultado-dia");
const resultadoIcono = document.getElementById("resultado-icono");
const resultadoComida = document.getElementById("resultado-comida");
const listaSemana = document.getElementById("lista-semana");
const listaComidas = document.getElementById("lista-comidas");
const mensajeAyuda = document.getElementById("mensaje-ayuda");

function cargarComidas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_COMIDAS));

    if (
      guardadas &&
      Array.isArray(guardadas.almuerzo) &&
      Array.isArray(guardadas.once)
    ) {
      return guardadas;
    }
  } catch (error) {
    console.error("No se pudieron cargar las comidas:", error);
  }

  return JSON.parse(JSON.stringify(COMIDAS_ORIGINALES));
}

function cargarMenu() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_MENU));

    if (guardado && typeof guardado === "object") {
      return guardado;
    }
  } catch (error) {
    console.error("No se pudo cargar el menú:", error);
  }

  return {};
}

function guardarComidas() {
  localStorage.setItem(CLAVE_COMIDAS, JSON.stringify(comidas));
}

function guardarMenu() {
  localStorage.setItem(CLAVE_MENU, JSON.stringify(menuSemanal));
}

function normalizarDiaSemana(numeroDiaJS) {
  const mapa = {
    0: "domingo",
    1: "lunes",
    2: "martes",
    3: "miercoles",
    4: "jueves",
    5: "viernes",
    6: "sabado"
  };

  return mapa[numeroDiaJS];
}

function obtenerDiaSeleccionado() {
  const valor = selectorDia.value;
  const hoy = new Date();

  if (valor === "hoy") {
    return normalizarDiaSemana(hoy.getDay());
  }

  if (valor === "manana") {
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    return normalizarDiaSemana(manana.getDay());
  }

  return valor;
}

function obtenerTextoTemporal() {
  const valor = selectorDia.value;

  if (valor === "hoy") {
    return "Hoy";
  }

  if (valor === "manana") {
    return "Mañana";
  }

  return NOMBRES_DIAS[valor];
}

function obtenerDiaAnterior(dia) {
  const indice = DIAS.indexOf(dia);

  if (indice === -1) {
    return null;
  }

  return DIAS[(indice - 1 + DIAS.length) % DIAS.length];
}

function obtenerDiaSiguiente(dia) {
  const indice = DIAS.indexOf(dia);

  if (indice === -1) {
    return null;
  }

  return DIAS[(indice + 1) % DIAS.length];
}

function obtenerOpcionesPermitidas(tipo, dia) {
  const lista = [...comidas[tipo]];

  if (lista.length === 0) {
    return [];
  }

  const excluidas = new Set();

  const diaAnterior = obtenerDiaAnterior(dia);
  const diaSiguiente = obtenerDiaSiguiente(dia);

  const comidaAnterior = menuSemanal[diaAnterior]?.[tipo];
  const comidaSiguiente = menuSemanal[diaSiguiente]?.[tipo];
  const comidaActualGuardada = menuSemanal[dia]?.[tipo];

  if (comidaAnterior) {
    excluidas.add(comidaAnterior);
  }

  if (comidaSiguiente) {
    excluidas.add(comidaSiguiente);
  }

  if (comidaActualGuardada) {
    excluidas.add(comidaActualGuardada);
  }

  const permitidas = lista.filter((comida) => !excluidas.has(comida));

  return permitidas.length > 0 ? permitidas : lista;
}

function seleccionarComidaAleatoria(lista) {
  if (!lista.length) {
    return null;
  }

  const indice = Math.floor(Math.random() * lista.length);
  return lista[indice];
}

function truncarTexto(texto, maximo = 18) {
  if (texto.length <= maximo) {
    return texto;
  }

  return `${texto.slice(0, maximo - 1)}…`;
}

function dibujarRuleta() {
  const opciones = comidas[tipoActual];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!opciones.length) {
    ctx.fillStyle = "#f1f4f2";
    ctx.beginPath();
    ctx.arc(350, 350, 335, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#47544d";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Agrega comidas", 350, 350);

    return;
  }

  const centro = canvas.width / 2;
  const radio = centro - 10;
  const anguloPorSegmento = (Math.PI * 2) / opciones.length;

  opciones.forEach((comida, indice) => {
    const inicio = indice * anguloPorSegmento - Math.PI / 2;
    const fin = inicio + anguloPorSegmento;

    ctx.beginPath();
    ctx.moveTo(centro, centro);
    ctx.arc(centro, centro, radio, inicio, fin);
    ctx.closePath();

    ctx.fillStyle = indice % 2 === 0 ? "#007639" : "#e4b600";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();

    ctx.translate(centro, centro);
    ctx.rotate(inicio + anguloPorSegmento / 2);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = indice % 2 === 0 ? "#ffffff" : "#17221c";

    const cantidad = opciones.length;
    const tamanoFuente =
      cantidad > 18 ? 15 :
      cantidad > 14 ? 17 :
      cantidad > 10 ? 20 : 24;

    ctx.font = `bold ${tamanoFuente}px Arial`;

    ctx.fillText(
      truncarTexto(comida, cantidad > 16 ? 15 : 20),
      radio - 28,
      0
    );

    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(centro, centro, 72, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.strokeStyle = "#004f27";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.fillStyle = "#007639";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tipoActual === "almuerzo" ? "ALMUERZO" : "ONCE", centro, centro);
}

function cambiarTipo(tipo) {
  if (girando) {
    return;
  }

  tipoActual = tipo;
  resultadoActual = null;

  btnAlmuerzo.classList.toggle("activo", tipo === "almuerzo");
  btnOnce.classList.toggle("activo", tipo === "once");

  resultado.classList.add("oculto");
  mensajeAyuda.textContent =
    tipo === "almuerzo"
      ? "La ruleta elegirá el almuerzo."
      : "La ruleta elegirá la once.";

  dibujarRuleta();
}

function girarRuleta() {
  if (girando) {
    return;
  }

  const dia = obtenerDiaSeleccionado();
  const opciones = obtenerOpcionesPermitidas(tipoActual, dia);

  if (opciones.length === 0) {
    alert("No hay comidas disponibles en esta categoría.");
    return;
  }

  girando = true;
  btnGirar.disabled = true;
  resultado.classList.add("oculto");

  const comidaElegida = seleccionarComidaAleatoria(opciones);

  resultadoActual = {
    dia,
    tipo: tipoActual,
    comida: comidaElegida
  };

  const vueltas = 5 + Math.floor(Math.random() * 3);
  const anguloExtra = Math.floor(Math.random() * 360);

  rotacionActual += vueltas * 360 + anguloExtra;

  canvas.style.transform = `rotate(${rotacionActual}deg)`;

  mensajeAyuda.textContent = "Girando... que la suerte decida 😄";

  window.setTimeout(() => {
    mostrarResultado();
    girando = false;
    btnGirar.disabled = false;
  }, 4900);
}

function mostrarResultado() {
  if (!resultadoActual) {
    return;
  }

  const textoTemporal = obtenerTextoTemporal();
  const textoTipo =
    resultadoActual.tipo === "almuerzo"
      ? "para el almuerzo"
      : "para la once";

  resultadoDia.textContent = `${textoTemporal} ${textoTipo} toca`;
  resultadoIcono.textContent =
    resultadoActual.tipo === "almuerzo" ? "🍲" : "🥪";

  resultadoComida.textContent = resultadoActual.comida;
  resultado.classList.remove("oculto");

  mensajeAyuda.textContent =
    "Guarda el resultado o vuelve a girar si alguien reclama 😂";

  resultado.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function guardarResultado() {
  if (!resultadoActual) {
    return;
  }

  const { dia, tipo, comida } = resultadoActual;

  if (!menuSemanal[dia]) {
    menuSemanal[dia] = {};
  }

  menuSemanal[dia][tipo] = comida;

  guardarMenu();
  renderizarSemana();

  btnAceptar.textContent = "✅ Menú guardado";

  window.setTimeout(() => {
    btnAceptar.textContent = "✅ Guardar menú";
  }, 1300);
}

function renderizarSemana() {
  listaSemana.innerHTML = "";

  const hoy = normalizarDiaSemana(new Date().getDay());

  DIAS.forEach((dia) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-dia";

    if (dia === hoy) {
      tarjeta.classList.add("dia-actual");
    }

    const titulo = document.createElement("h3");
    titulo.textContent = dia === hoy
      ? `${NOMBRES_DIAS[dia]} · Hoy`
      : NOMBRES_DIAS[dia];

    tarjeta.appendChild(titulo);

    tarjeta.appendChild(
      crearFilaMenu(
        dia,
        "almuerzo",
        "🍲 Almuerzo",
        menuSemanal[dia]?.almuerzo
      )
    );

    tarjeta.appendChild(
      crearFilaMenu(
        dia,
        "once",
        "🥪 Once",
        menuSemanal[dia]?.once
      )
    );

    listaSemana.appendChild(tarjeta);
  });
}

function crearFilaMenu(dia, tipo, etiqueta, comida) {
  const fila = document.createElement("div");
  fila.className = "comida-fila";

  const tipoElemento = document.createElement("span");
  tipoElemento.className = "comida-tipo";
  tipoElemento.textContent = etiqueta;

  const nombre = document.createElement("span");
  nombre.className = "comida-nombre";

  if (comida) {
    nombre.textContent = comida;
  } else {
    nombre.textContent = "Sin definir";
    nombre.classList.add("comida-vacia");
  }

  fila.appendChild(tipoElemento);
  fila.appendChild(nombre);

  if (comida) {
    const borrar = document.createElement("button");
    borrar.className = "btn-borrar-item";
    borrar.type = "button";
    borrar.textContent = "×";
    borrar.title = "Eliminar menú";

    borrar.addEventListener("click", () => {
      borrarMenuDia(dia, tipo);
    });

    fila.appendChild(borrar);
  } else {
    const espacio = document.createElement("span");
    fila.appendChild(espacio);
  }

  return fila;
}

function borrarMenuDia(dia, tipo) {
  if (!menuSemanal[dia]) {
    return;
  }

  delete menuSemanal[dia][tipo];

  if (Object.keys(menuSemanal[dia]).length === 0) {
    delete menuSemanal[dia];
  }

  guardarMenu();
  renderizarSemana();
}

function limpiarSemana() {
  const confirmar = window.confirm(
    "¿Deseas borrar todos los almuerzos y once guardados?"
  );

  if (!confirmar) {
    return;
  }

  menuSemanal = {};
  guardarMenu();
  renderizarSemana();

  resultado.classList.add("oculto");
  resultadoActual = null;
}

function agregarComida() {
  const tipo = selectorNuevoTipo.value;
  const nombre = inputNuevaComida.value.trim();

  if (!nombre) {
    inputNuevaComida.focus();
    return;
  }

  const yaExiste = comidas[tipo].some(
    (comida) => comida.toLowerCase() === nombre.toLowerCase()
  );

  if (yaExiste) {
    alert("Esa comida ya está registrada.");
    return;
  }

  comidas[tipo].push(nombre);
  guardarComidas();

  inputNuevaComida.value = "";

  renderizarListaComidas();

  if (tipoActual === tipo) {
    dibujarRuleta();
  }
}

function eliminarComida(tipo, indice) {
  if (comidas[tipo].length <= 2) {
    alert("Debes mantener al menos dos comidas en cada categoría.");
    return;
  }

  const comida = comidas[tipo][indice];

  const confirmar = window.confirm(
    `¿Eliminar "${comida}" de la ruleta?`
  );

  if (!confirmar) {
    return;
  }

  comidas[tipo].splice(indice, 1);
  guardarComidas();

  renderizarListaComidas();

  if (tipoActual === tipo) {
    dibujarRuleta();
  }
}

function renderizarListaComidas() {
  listaComidas.innerHTML = "";

  const tipo = selectorNuevoTipo.value;

  comidas[tipo].forEach((comida, indice) => {
    const item = document.createElement("div");
    item.className = "item-comida";

    const nombre = document.createElement("span");
    nombre.textContent = comida;

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.textContent = "×";
    eliminar.title = "Eliminar comida";

    eliminar.addEventListener("click", () => {
      eliminarComida(tipo, indice);
    });

    item.appendChild(nombre);
    item.appendChild(eliminar);

    listaComidas.appendChild(item);
  });
}

function restaurarComidas() {
  const confirmar = window.confirm(
    "¿Deseas restaurar la lista original de comidas?"
  );

  if (!confirmar) {
    return;
  }

  comidas = JSON.parse(JSON.stringify(COMIDAS_ORIGINALES));
  guardarComidas();

  renderizarListaComidas();
  dibujarRuleta();
}

btnAlmuerzo.addEventListener("click", () => cambiarTipo("almuerzo"));
btnOnce.addEventListener("click", () => cambiarTipo("once"));

btnGirar.addEventListener("click", girarRuleta);
btnRepetir.addEventListener("click", girarRuleta);
btnAceptar.addEventListener("click", guardarResultado);

btnLimpiarSemana.addEventListener("click", limpiarSemana);
btnAgregar.addEventListener("click", agregarComida);
btnRestaurar.addEventListener("click", restaurarComidas);

selectorNuevoTipo.addEventListener("change", renderizarListaComidas);

inputNuevaComida.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") {
    agregarComida();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  dibujarRuleta();
  renderizarSemana();
  renderizarListaComidas();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js")
      .catch((error) => {
        console.error("Error al registrar el Service Worker:", error);
      });
  }
});
