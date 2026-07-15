"use strict";

/* =========================================================
   COMIDAS ORIGINALES
========================================================= */

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

/* =========================================================
   DÍAS
========================================================= */

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

/* =========================================================
   LOCALSTORAGE
========================================================= */

const CLAVE_COMIDAS = "queComemos_comidas_v2";
const CLAVE_MENU = "queComemos_menu_v2";

/* =========================================================
   ESTADO GENERAL
========================================================= */

let tipoActual = "almuerzo";
let resultadoActual = null;

let comidas = cargarComidas();
let menuSemanal = cargarMenu();

/* Estado de la ruleta */

let rotacionActual = 0;
let girando = false;
let arrastrando = false;

let anguloAnteriorDedo = 0;
let tiempoAnteriorDedo = 0;
let velocidadAngular = 0;

let ultimoIndiceVibrado = null;
let animacionRuletaId = null;

/* =========================================================
   ELEMENTOS HTML
========================================================= */

const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");

const ruletaInteractiva = document.getElementById("ruleta-interactiva");

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
const resultadoComida = document.getElementById("resultado-comida");
const resultadoIcono = document.getElementById("resultado-icono");

const resultadoFoto = document.getElementById("resultado-foto");
const fotoNoDisponible = document.getElementById("foto-no-disponible");

const listaSemana = document.getElementById("lista-semana");
const listaComidas = document.getElementById("lista-comidas");

const mensajeAyuda = document.getElementById("mensaje-ayuda");
const centroRuletaIcono = document.getElementById("centro-ruleta-icono");

/* Sonidos */

const audioRuleta = document.getElementById("audio-ruleta");
const audioResultado = document.getElementById("audio-resultado");
const audioPorotos = document.getElementById("audio-porotos");

/* =========================================================
   CARGA Y GUARDADO
========================================================= */

function cargarComidas() {
  try {
    const versionNueva = JSON.parse(localStorage.getItem(CLAVE_COMIDAS));

    if (
      versionNueva &&
      Array.isArray(versionNueva.almuerzo) &&
      Array.isArray(versionNueva.once)
    ) {
      return versionNueva;
    }

    /*
      Recupera datos de la primera versión,
      si la persona ya tenía comidas personalizadas.
    */
    const versionAnterior = JSON.parse(
      localStorage.getItem("queComemos_comidas_v1")
    );

    if (
      versionAnterior &&
      Array.isArray(versionAnterior.almuerzo) &&
      Array.isArray(versionAnterior.once)
    ) {
      return versionAnterior;
    }
  } catch (error) {
    console.error("No se pudieron cargar las comidas:", error);
  }

  return JSON.parse(JSON.stringify(COMIDAS_ORIGINALES));
}

function cargarMenu() {
  try {
    const versionNueva = JSON.parse(localStorage.getItem(CLAVE_MENU));

    if (versionNueva && typeof versionNueva === "object") {
      return versionNueva;
    }

    const versionAnterior = JSON.parse(
      localStorage.getItem("queComemos_menu_v1")
    );

    if (versionAnterior && typeof versionAnterior === "object") {
      return versionAnterior;
    }
  } catch (error) {
    console.error("No se pudo cargar el menú semanal:", error);
  }

  return {};
}

function guardarComidas() {
  localStorage.setItem(CLAVE_COMIDAS, JSON.stringify(comidas));
}

function guardarMenu() {
  localStorage.setItem(CLAVE_MENU, JSON.stringify(menuSemanal));
}

/* =========================================================
   UTILIDADES
========================================================= */

function normalizarAngulo(angulo) {
  return ((angulo % 360) + 360) % 360;
}

function convertirRadianesAGrados(radianes) {
  return radianes * (180 / Math.PI);
}

function obtenerAnguloDelPuntero(evento) {
  const rect = ruletaInteractiva.getBoundingClientRect();

  const centroX = rect.left + rect.width / 2;
  const centroY = rect.top + rect.height / 2;

  const x = evento.clientX - centroX;
  const y = evento.clientY - centroY;

  return convertirRadianesAGrados(Math.atan2(y, x));
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

function truncarTexto(texto, maximo = 18) {
  if (texto.length <= maximo) {
    return texto;
  }

  return `${texto.slice(0, maximo - 1)}…`;
}

function convertirNombreAArchivo(nombre) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function obtenerRutaImagen(nombreComida) {
  const archivo = convertirNombreAArchivo(nombreComida);

  return `imagenes/${archivo}.jpg`;
}

function esComidaEspecial(nombreComida) {
  const nombre = nombreComida.toLowerCase();

  return (
    nombre.includes("lenteja") ||
    nombre.includes("poroto")
  );
}

function vibrar(duracion) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duracion);
  }
}

/* =========================================================
   OPCIONES PERMITIDAS
========================================================= */

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

  const permitidas = lista.filter((comida) => {
    return !excluidas.has(comida);
  });

  return permitidas.length > 0 ? permitidas : lista;
}

function seleccionarComidaAleatoria(lista) {
  if (!lista.length) {
    return null;
  }

  const indice = Math.floor(Math.random() * lista.length);

  return lista[indice];
}

/* =========================================================
   DIBUJAR RULETA
========================================================= */

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
    const inicio =
      indice * anguloPorSegmento -
      Math.PI / 2;

    const fin = inicio + anguloPorSegmento;

    ctx.beginPath();
    ctx.moveTo(centro, centro);
    ctx.arc(centro, centro, radio, inicio, fin);
    ctx.closePath();

    ctx.fillStyle =
      indice % 2 === 0
        ? "#007639"
        : "#e4b600";

    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();

    ctx.translate(centro, centro);
    ctx.rotate(inicio + anguloPorSegmento / 2);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.fillStyle =
      indice % 2 === 0
        ? "#ffffff"
        : "#17221c";

    const cantidad = opciones.length;

    const tamanoFuente =
      cantidad > 18
        ? 15
        : cantidad > 14
          ? 17
          : cantidad > 10
            ? 20
            : 24;

    ctx.font = `bold ${tamanoFuente}px Arial`;

    ctx.fillText(
      truncarTexto(
        comida,
        cantidad > 16 ? 15 : 20
      ),
      radio - 28,
      0
    );

    ctx.restore();
  });

  aplicarRotacion();
}

function aplicarRotacion() {
  canvas.style.transform =
    `rotate(${rotacionActual}deg)`;

  controlarVibracionPorSegmento();
}

/* =========================================================
   VIBRACIÓN POR SEGMENTO
========================================================= */

function obtenerIndiceBajoPuntero() {
  const opciones = comidas[tipoActual];

  if (!opciones.length) {
    return 0;
  }

  const anguloSegmento = 360 / opciones.length;

  /*
    La ruleta comienza en -90 grados.
    El puntero también está arriba.
  */
  const anguloLocal = normalizarAngulo(-rotacionActual);

  return Math.floor(anguloLocal / anguloSegmento);
}

function controlarVibracionPorSegmento() {
  if (!girando && !arrastrando) {
    ultimoIndiceVibrado = null;
    return;
  }

  const indice = obtenerIndiceBajoPuntero();

  if (indice !== ultimoIndiceVibrado) {
    ultimoIndiceVibrado = indice;

    /*
      Vibración corta simulando el clásico:
      clac, clac, clac...
    */
    vibrar(8);
  }
}

/* =========================================================
   SONIDOS
========================================================= */

function prepararSonidos() {
  /*
    Algunos teléfonos bloquean el audio hasta que
    el usuario interactúa con la pantalla.
  */

  [audioRuleta, audioResultado, audioPorotos].forEach((audio) => {
    if (!audio) {
      return;
    }

    audio.volume = 0;

    const promesa = audio.play();

    if (promesa) {
      promesa
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        })
        .catch(() => {
          audio.volume = 1;
        });
    }
  });
}

function iniciarSonidoRuleta() {
  if (!audioRuleta) {
    return;
  }

  audioRuleta.pause();
  audioRuleta.currentTime = 0;
  audioRuleta.volume = 0.82;

  audioRuleta.play().catch(() => {
    console.warn("El sonido de ruleta no pudo reproducirse.");
  });
}

function detenerSonidoRuleta() {
  if (!audioRuleta) {
    return;
  }

  const volumenInicial = audioRuleta.volume;
  const pasos = 10;
  let paso = 0;

  const desvanecer = window.setInterval(() => {
    paso += 1;

    audioRuleta.volume =
      Math.max(
        0,
        volumenInicial * (1 - paso / pasos)
      );

    if (paso >= pasos) {
      window.clearInterval(desvanecer);

      audioRuleta.pause();
      audioRuleta.currentTime = 0;
      audioRuleta.volume = 0.82;
    }
  }, 45);
}

function reproducirSonidoResultado(nombreComida) {
  const especial = esComidaEspecial(nombreComida);

  if (especial && audioPorotos) {
    audioPorotos.pause();
    audioPorotos.currentTime = 0;
    audioPorotos.volume = 1;

    audioPorotos.play().catch(() => {
      console.warn(
        "El sonido especial de porotos no pudo reproducirse."
      );
    });

    return;
  }

  if (audioResultado) {
    audioResultado.pause();
    audioResultado.currentTime = 0;
    audioResultado.volume = 1;

    audioResultado.play().catch(() => {
      console.warn(
        "El sonido del resultado no pudo reproducirse."
      );
    });
  }
}

/* =========================================================
   CAMBIO DE CATEGORÍA
========================================================= */

function cambiarTipo(tipo) {
  if (girando || arrastrando) {
    return;
  }

  tipoActual = tipo;
  resultadoActual = null;

  btnAlmuerzo.classList.toggle(
    "activo",
    tipo === "almuerzo"
  );

  btnOnce.classList.toggle(
    "activo",
    tipo === "once"
  );

  centroRuletaIcono.textContent =
    tipo === "almuerzo"
      ? "🍲"
      : "🥪";

  resultado.classList.add("oculto");
  resultado.classList.remove(
    "mostrando",
    "especial-porotos"
  );

  mensajeAyuda.textContent =
    tipo === "almuerzo"
      ? "Arrastra la ruleta para elegir el almuerzo."
      : "Arrastra la ruleta para elegir la once.";

  dibujarRuleta();
}

/* =========================================================
   ARRASTRE CON EL DEDO O MOUSE
========================================================= */

function iniciarArrastre(evento) {
  if (girando) {
    return;
  }

  prepararSonidos();

  arrastrando = true;
  velocidadAngular = 0;

  anguloAnteriorDedo =
    obtenerAnguloDelPuntero(evento);

  tiempoAnteriorDedo = performance.now();

  ruletaInteractiva.classList.add("arrastrando");
  document.body.classList.add("ruleta-activa");

  resultado.classList.add("oculto");
  resultado.classList.remove(
    "mostrando",
    "especial-porotos"
  );

  mensajeAyuda.textContent =
    "Suéltala para que siga girando...";

  ruletaInteractiva.setPointerCapture(
    evento.pointerId
  );

  evento.preventDefault();
}

function moverArrastre(evento) {
  if (!arrastrando || girando) {
    return;
  }

  const ahora = performance.now();
  const anguloActual =
    obtenerAnguloDelPuntero(evento);

  let diferencia =
    anguloActual - anguloAnteriorDedo;

  /*
    Evita saltos cuando el ángulo cruza
    desde 179° hacia -179° o al revés.
  */

  if (diferencia > 180) {
    diferencia -= 360;
  }

  if (diferencia < -180) {
    diferencia += 360;
  }

  const tiempoTranscurrido =
    Math.max(1, ahora - tiempoAnteriorDedo);

  const velocidadInstantanea =
    diferencia / tiempoTranscurrido;

  /*
    Suaviza la velocidad para evitar movimientos bruscos.
  */

  velocidadAngular =
    velocidadAngular * 0.72 +
    velocidadInstantanea * 0.28;

  rotacionActual += diferencia;

  aplicarRotacion();

  anguloAnteriorDedo = anguloActual;
  tiempoAnteriorDedo = ahora;

  evento.preventDefault();
}

function finalizarArrastre(evento) {
  if (!arrastrando) {
    return;
  }

  arrastrando = false;

  ruletaInteractiva.classList.remove("arrastrando");
  document.body.classList.remove("ruleta-activa");

  try {
    ruletaInteractiva.releasePointerCapture(
      evento.pointerId
    );
  } catch (error) {
    /*
      Algunos navegadores ya liberan el puntero
      antes de llegar aquí.
    */
  }

  const velocidadMinima = 0.055;

  if (Math.abs(velocidadAngular) < velocidadMinima) {
    mensajeAyuda.textContent =
      "¡Más fuerte po! 😂";

    vibrar([30, 40, 30]);

    return;
  }

  iniciarGiroConInercia(velocidadAngular);
}

/* =========================================================
   GIRO CON INERCIA
========================================================= */

function iniciarGiroConInercia(velocidadInicial = 0.5) {
  if (girando) {
    return;
  }

  const dia = obtenerDiaSeleccionado();

  const opcionesPermitidas =
    obtenerOpcionesPermitidas(
      tipoActual,
      dia
    );

  if (!opcionesPermitidas.length) {
    alert(
      "No hay comidas disponibles en esta categoría."
    );

    return;
  }

  const comidaElegida =
    seleccionarComidaAleatoria(
      opcionesPermitidas
    );

  const indiceComida =
    comidas[tipoActual].indexOf(
      comidaElegida
    );

  if (indiceComida === -1) {
    return;
  }

  resultadoActual = {
    dia,
    tipo: tipoActual,
    comida: comidaElegida
  };

  const direccion =
    velocidadInicial >= 0 ? 1 : -1;

  const intensidad =
    Math.min(
      1.8,
      Math.max(0.25, Math.abs(velocidadInicial))
    );

  const vueltasExtra =
    Math.round(
      4 + intensidad * 4
    );

  const anguloSegmento =
    360 / comidas[tipoActual].length;

  /*
    Coloca el centro del segmento seleccionado
    justo debajo del puntero superior.
  */

  const anguloObjetivoNormalizado =
    normalizarAngulo(
      -(indiceComida + 0.5) * anguloSegmento
    );

  const inicio = rotacionActual;

  let final;

  if (direccion > 0) {
    const posicionActualNormalizada =
      normalizarAngulo(inicio);

    let diferencia =
      anguloObjetivoNormalizado -
      posicionActualNormalizada;

    if (diferencia <= 0) {
      diferencia += 360;
    }

    final =
      inicio +
      diferencia +
      vueltasExtra * 360;
  } else {
    const posicionActualNormalizada =
      normalizarAngulo(inicio);

    let diferencia =
      posicionActualNormalizada -
      anguloObjetivoNormalizado;

    if (diferencia <= 0) {
      diferencia += 360;
    }

    final =
      inicio -
      diferencia -
      vueltasExtra * 360;
  }

  const duracion =
    Math.round(
      2800 + intensidad * 1500
    );

  animarRuleta(
    inicio,
    final,
    duracion
  );
}

function animarRuleta(inicio, final, duracion) {
  if (animacionRuletaId) {
    cancelAnimationFrame(animacionRuletaId);
  }

  girando = true;
  btnGirar.disabled = true;

  ruletaInteractiva.classList.add("girando");
  document.body.classList.add("ruleta-activa");

  resultado.classList.add("oculto");
  resultado.classList.remove(
    "mostrando",
    "especial-porotos"
  );

  mensajeAyuda.textContent =
    "Girando... que la suerte decida 😄";

  iniciarSonidoRuleta();

  const inicioTiempo = performance.now();

  function cuadro(tiempoActual) {
    const transcurrido =
      tiempoActual - inicioTiempo;

    const progreso =
      Math.min(
        transcurrido / duracion,
        1
      );

    /*
      Curva de desaceleración.
      Sale rápido y se detiene suavemente.
    */

    const suavizado =
      1 - Math.pow(1 - progreso, 5);

    rotacionActual =
      inicio +
      (final - inicio) * suavizado;

    aplicarRotacion();

    /*
      El sonido va bajando al final.
    */

    if (audioRuleta && progreso > 0.72) {
      const restante =
        1 - progreso;

      audioRuleta.volume =
        Math.max(
          0.12,
          restante * 2.5
        );
    }

    if (progreso < 1) {
      animacionRuletaId =
        requestAnimationFrame(cuadro);

      return;
    }

    rotacionActual = final;
    aplicarRotacion();

    terminarGiro();
  }

  animacionRuletaId =
    requestAnimationFrame(cuadro);
}

function terminarGiro() {
  girando = false;
  btnGirar.disabled = false;

  animacionRuletaId = null;

  ruletaInteractiva.classList.remove("girando");
  document.body.classList.remove("ruleta-activa");

  detenerSonidoRuleta();

  vibrar([70, 45, 120]);

  window.setTimeout(() => {
    mostrarResultado();
  }, 300);
}

/* =========================================================
   BOTÓN DE RESPALDO
========================================================= */

function girarConBoton() {
  if (girando || arrastrando) {
    return;
  }

  prepararSonidos();

  /*
    Velocidad aleatoria para que cada giro
    tenga una duración levemente diferente.
  */

  const direccion =
    Math.random() > 0.2 ? 1 : -1;

  const velocidad =
    direccion *
    (
      0.75 +
      Math.random() * 0.75
    );

  iniciarGiroConInercia(velocidad);
}

/* =========================================================
   MOSTRAR RESULTADO
========================================================= */

function mostrarResultado() {
  if (!resultadoActual) {
    return;
  }

  const textoTemporal =
    obtenerTextoTemporal();

  const textoTipo =
    resultadoActual.tipo === "almuerzo"
      ? "para el almuerzo"
      : "para la once";

  resultadoDia.textContent =
    `${textoTemporal} ${textoTipo} toca`;

  resultadoComida.textContent =
    resultadoActual.comida;

  resultadoIcono.textContent =
    resultadoActual.tipo === "almuerzo"
      ? "🍲"
      : "🥪";

  resultado.classList.remove(
    "oculto",
    "mostrando",
    "especial-porotos"
  );

  cargarFotoResultado(
    resultadoActual.comida
  );

  /*
    Fuerza al navegador a reiniciar
    las animaciones CSS.
  */

  void resultado.offsetWidth;

  resultado.classList.add("mostrando");

  if (
    esComidaEspecial(
      resultadoActual.comida
    )
  ) {
    resultado.classList.add(
      "especial-porotos"
    );
  }

  reproducirSonidoResultado(
    resultadoActual.comida
  );

  mensajeAyuda.textContent =
    "Guarda el resultado o vuelve a girar si alguien reclama 😂";

  window.setTimeout(() => {
    resultado.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 450);
}

/* =========================================================
   FOTOGRAFÍA DEL RESULTADO
========================================================= */

function cargarFotoResultado(nombreComida) {
  const ruta = obtenerRutaImagen(nombreComida);

  resultadoFoto.classList.remove("oculto");
  fotoNoDisponible.classList.add("oculto");

  resultadoFoto.src = ruta;
  resultadoFoto.alt =
    `Fotografía de ${nombreComida}`;

  resultadoFoto.onload = () => {
    resultadoFoto.classList.remove("oculto");
    fotoNoDisponible.classList.add("oculto");
  };

  resultadoFoto.onerror = () => {
    resultadoFoto.removeAttribute("src");
    resultadoFoto.alt = "";

    resultadoFoto.classList.add("oculto");
    fotoNoDisponible.classList.remove("oculto");
  };
}

/* =========================================================
   GUARDAR RESULTADO
========================================================= */

function guardarResultado() {
  if (!resultadoActual) {
    return;
  }

  const {
    dia,
    tipo,
    comida
  } = resultadoActual;

  if (!menuSemanal[dia]) {
    menuSemanal[dia] = {};
  }

  menuSemanal[dia][tipo] = comida;

  guardarMenu();
  renderizarSemana();

  btnAceptar.textContent =
    "✅ Menú guardado";

  vibrar(60);

  window.setTimeout(() => {
    btnAceptar.textContent =
      "✅ Guardar menú";
  }, 1300);
}

/* =========================================================
   MENÚ SEMANAL
========================================================= */

function renderizarSemana() {
  listaSemana.innerHTML = "";

  const hoy =
    normalizarDiaSemana(
      new Date().getDay()
    );

  DIAS.forEach((dia) => {
    const tarjeta =
      document.createElement("article");

    tarjeta.className = "tarjeta-dia";

    if (dia === hoy) {
      tarjeta.classList.add("dia-actual");
    }

    const titulo =
      document.createElement("h3");

    titulo.textContent =
      dia === hoy
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

function crearFilaMenu(
  dia,
  tipo,
  etiqueta,
  comida
) {
  const fila =
    document.createElement("div");

  fila.className = "comida-fila";

  const tipoElemento =
    document.createElement("span");

  tipoElemento.className = "comida-tipo";
  tipoElemento.textContent = etiqueta;

  const nombre =
    document.createElement("span");

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
    const borrar =
      document.createElement("button");

    borrar.className = "btn-borrar-item";
    borrar.type = "button";
    borrar.textContent = "×";
    borrar.title = "Eliminar menú";

    borrar.addEventListener("click", () => {
      borrarMenuDia(dia, tipo);
    });

    fila.appendChild(borrar);
  } else {
    fila.appendChild(
      document.createElement("span")
    );
  }

  return fila;
}

function borrarMenuDia(dia, tipo) {
  if (!menuSemanal[dia]) {
    return;
  }

  delete menuSemanal[dia][tipo];

  if (
    Object.keys(menuSemanal[dia]).length === 0
  ) {
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
  resultado.classList.remove(
    "mostrando",
    "especial-porotos"
  );

  resultadoActual = null;
}

/* =========================================================
   ADMINISTRAR COMIDAS
========================================================= */

function agregarComida() {
  const tipo = selectorNuevoTipo.value;
  const nombre = inputNuevaComida.value.trim();

  if (!nombre) {
    inputNuevaComida.focus();
    return;
  }

  const yaExiste =
    comidas[tipo].some((comida) => {
      return (
        comida.toLowerCase() ===
        nombre.toLowerCase()
      );
    });

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
    alert(
      "Debes mantener al menos dos comidas en cada categoría."
    );

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

  comidas[tipo].forEach(
    (comida, indice) => {
      const item =
        document.createElement("div");

      item.className = "item-comida";

      const nombre =
        document.createElement("span");

      nombre.textContent = comida;

      const eliminar =
        document.createElement("button");

      eliminar.type = "button";
      eliminar.textContent = "×";
      eliminar.title = "Eliminar comida";

      eliminar.addEventListener("click", () => {
        eliminarComida(tipo, indice);
      });

      item.appendChild(nombre);
      item.appendChild(eliminar);

      listaComidas.appendChild(item);
    }
  );
}

function restaurarComidas() {
  const confirmar = window.confirm(
    "¿Deseas restaurar la lista original de comidas?"
  );

  if (!confirmar) {
    return;
  }

  comidas = JSON.parse(
    JSON.stringify(COMIDAS_ORIGINALES)
  );

  guardarComidas();
  renderizarListaComidas();
  dibujarRuleta();
}

/* =========================================================
   EVENTOS
========================================================= */

btnAlmuerzo.addEventListener(
  "click",
  () => cambiarTipo("almuerzo")
);

btnOnce.addEventListener(
  "click",
  () => cambiarTipo("once")
);

btnGirar.addEventListener(
  "click",
  girarConBoton
);

btnRepetir.addEventListener(
  "click",
  girarConBoton
);

btnAceptar.addEventListener(
  "click",
  guardarResultado
);

btnLimpiarSemana.addEventListener(
  "click",
  limpiarSemana
);

btnAgregar.addEventListener(
  "click",
  agregarComida
);

btnRestaurar.addEventListener(
  "click",
  restaurarComidas
);

selectorNuevoTipo.addEventListener(
  "change",
  renderizarListaComidas
);

inputNuevaComida.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key === "Enter") {
      agregarComida();
    }
  }
);

/* Eventos táctiles y mouse unificados */

ruletaInteractiva.addEventListener(
  "pointerdown",
  iniciarArrastre
);

ruletaInteractiva.addEventListener(
  "pointermove",
  moverArrastre
);

ruletaInteractiva.addEventListener(
  "pointerup",
  finalizarArrastre
);

ruletaInteractiva.addEventListener(
  "pointercancel",
  finalizarArrastre
);

ruletaInteractiva.addEventListener(
  "lostpointercapture",
  () => {
    if (arrastrando) {
      arrastrando = false;

      ruletaInteractiva.classList.remove(
        "arrastrando"
      );

      document.body.classList.remove(
        "ruleta-activa"
      );
    }
  }
);

/* Permite usar Enter o espacio desde computador */

ruletaInteractiva.addEventListener(
  "keydown",
  (evento) => {
    if (
      evento.key === "Enter" ||
      evento.key === " "
    ) {
      evento.preventDefault();
      girarConBoton();
    }
  }
);

/* =========================================================
   INICIO
========================================================= */

window.addEventListener(
  "DOMContentLoaded",
  () => {
    dibujarRuleta();
    renderizarSemana();
    renderizarListaComidas();

    /*
      Actualiza el icono central según categoría.
    */

    centroRuletaIcono.textContent = "🍲";

    /*
      Registra la PWA.
    */

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("service-worker.js")
        .catch((error) => {
          console.error(
            "Error al registrar el Service Worker:",
            error
          );
        });
    }
  }
);
