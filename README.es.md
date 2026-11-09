# Ritual — planificador de hábitos para e-ink

Aplicación de una sola página, local y sin conexión, para tabletas e-ink de 6".
Tarjetas grandes sin desplazamiento, marcado con un toque, los pendientes siguen
visibles hasta cerrarlos. Sin red, sin cuentas, sin analítica: los datos viven en
el navegador del dispositivo.

**En vivo:** https://danilka88.github.io/eink-planner/

![Tablero](design/screens/eink-536-day.png)

## Qué hace

- **Tablero del día.** 1–4 columnas, las tarjetas llenan la pantalla y se leen
  desde 1–2 m.
- **Hábito en su franja.** Aparece a las `06:30`, tras las `09:30` pasa a
  «vencido · hasta 09:30» y se queda hasta que lo marques (se puede desactivar).
- **Un toque** — hecho: la tarjeta se invierte y desaparece en 5–60 minutos.
- **Repetición:** cada día, días de la semana, día del mes, fecha única.
- **Historial y archivo.** Todas las marcas por día, deshacer y restaurar; los
  hábitos desactivados conservan su historial.
- **Duplicar** un hábito con un toque.
- **Pendientes** de días anteriores, se cierran con retraso.
- **8 idiomas**, tema claro/oscuro/auto, exportación e importación JSON.
- **Sin conexión:** service worker, manifiesto PWA, cero peticiones de red.

## Inicio rápido

```bash
git clone https://github.com/Danilka88/eink-planner.git
cd eink-planner
python3 -m http.server 8080
```

Abre `http://127.0.0.1:8080`.

> Abrir `index.html` con doble clic no funciona: la app usa módulos ES y el
> navegador los bloquea en `file://`.

### Instalar en la tableta

1. Abre el sitio por **https** (o `localhost`): la caché offline solo funciona ahí.
2. Menú del navegador → «Añadir a pantalla de inicio».
3. Activa el modo avión y abre el acceso: funciona sin red.

El `http://192.168.x.x` normal no tiene modo offline: es una restricción del
navegador, no un fallo de la app. Ajustes → Acerca de muestra el estado.

## Controles

| Acción | Qué hace |
|---|---|
| Tocar una tarjeta | marcar / desmarcar |
| Pulsación larga | editor del hábito |
| Pulsación larga en vencida | registrar omisión |
| «Todos» → «Hábitos» | activar, duplicar, editar, añadir |
| «Todos» → «Historial» | marcas por día: quitar, marcar, omitir |
| «Todos» → «Archivo» | restaurar o borrar para siempre |
| «Actualizar» | destello de pantalla (limpieza de fantasmas) |
| «Ajustes» | tema, idioma, formato de hora, temporizadores, demo, exportar |

## Estructura

```
index.html            marcado, SEO, plantillas, CSP
styles.css            tema 1 bit, rejilla, reglas e-ink
js/app.js             DOM, eventos, render, editor, ajustes
js/core/schedule.js   franjas, repetición, pendientes (puro)
js/core/state.js      modelo, migraciones, localStorage
js/core/i18n.js       8 idiomas, plurales Intl, fechas, 12/24 h
js/core/dict/*.js     diccionarios de interfaz
js/core/icons.js      sprite Phosphor Bold
sw.js                 caché offline
tests/                pruebas unitarias (node --test)
docs/                 arquitectura, modelo de datos, i18n, despliegue
```

## Pruebas

```bash
npm test
```

22 pruebas: horario, migraciones, plurales en los 8 idiomas, formato de hora.
Ver `docs/TESTING.md`.

## Privacidad

Ninguna petición de red: `connect-src 'self'` en la CSP las bloquea en el
navegador, y la app no hace ninguna. Los datos están en `localStorage` y no
salen del dispositivo. Ver `PRIVACY.md`.

## Licencia

Código — MIT (`LICENSE`). Iconos — Phosphor Icons, MIT (`THIRD-PARTY.md`).

## Otros idiomas

[Русский](README.md) · [English](README.en.md) · [Português](README.pt.md) ·
[Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) ·
[العربية](README.ar.md)
