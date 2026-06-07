# Fase 1: Analizar y proponer

**Autor:** Tiago Solis
**Usuario Git:** Tiaguito-Dev
**Actividad:** TP Integrador - Actividad 4, Fase 1
**Version del archivo:** 1.0

---

## 1.1. Análisis de la infraestructura Docker actual

A continuación se identifican 5 problemas respecto a buenas prácticas de producción,
relevados de los archivos `docker-compose.yml`, `packages/api/Dockerfile` y
`packages/web/Dockerfile`.

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|----------------|---------|-------------------|
| 1 | **Credenciales hardcodeadas en el repositorio** — `POSTGRES_USER`, `POSTGRES_PASSWORD` y `DATABASE_URL` están escritas en texto plano en el docker-compose. Como este archivo se sube a git, cualquiera con acceso al repositorio tiene esas credenciales, y git conserva el historial aunque después se borren. | `docker-compose.yml` — bloques `environment` de `db` y `api` | Alto | Mover los valores sensibles a un archivo `.env` excluido del repositorio via `.gitignore`. |
| 2 | **Dependencia de `web` sobre `api` sin condición de salud** — `web` declara `depends_on: api` pero sin `condition: service_healthy`, lo que significa que Docker considera suficiente que el container de `api` haya arrancado, independientemente de si la aplicación dentro está lista. | `docker-compose.yml` — servicio `web` | Medio | Agregar un healthcheck al servicio `api` y cambiar la dependencia a `condition: service_healthy`, igual que la relación entre `api` y `db`. |
| 3 | **Proceso corre como root** — Ninguno de los Dockerfiles define un usuario no privilegiado con `USER` | `packages/api/Dockerfile` y `packages/web/Dockerfile` | Alto | Crear un usuario sin privilegios con `addgroup` / `adduser` y agregar `USER`. |
| 4 | **Sin límites de recursos** — Ningún servicio declara `resources.limits` para CPU ni memoria. Un bug como un bucle infinito puede consumir todos los recursos del host, afectando no solo ese container sino todos los servicios que corren en la misma máquina. | `docker-compose.yml` — servicios `api` y `web` | Medio | Agregar un bloque `deploy.resources.limits` con valores de CPU y memoria apropiados para cada servicio. |
| 5 | **Instalación de dependencias de desarrollo en la imagen** — Ambos Dockerfiles usan `npm install` sin el flag `--omit=dev`, lo que incluye todas las `devDependencies` (dependencias de desarrollo como `vitest`, etc...) en la imagen final. Además, `npm install` resuelve versiones en el momento del build, lo que puede producir imágenes distintas en builds diferentes. | `packages/api/Dockerfile` y `packages/web/Dockerfile` — instrucción `RUN npm install` | Medio | Reemplazar por `RUN npm ci --omit=dev`. `npm ci` lee el `package-lock.json` exacto garantizando reproducibilidad, y `--omit=dev` excluye las `devDependencies` de la imagen final. |

---

**Pendiente para investigar:**
- ¿Por qué el compose declara volúmenes anónimos para `node_modules` si el `.dockerignore` ya los excluye? Aparente redundancia o inconsistencia entre ambos archivos.
- ¿Por qué no se instala un paquete node_modules en la carpeta shared y sí en api y web, si al fin y al cabo en los tres tengo un package.json?

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

Según lo que entendí, OpenTelemetry es un framework que permite recopilar información del estado interno del sistema de una forma estructurada, sin importar el stack tecnológico que estemos utilizando.

OpenTelemetry recopila y exporta los datos pero no los presenta. La presentación la hacen otras herramientas como Grafana. OpenTelemetry es el intermediario entre tu aplicación y esas herramientas, no el destino final. Prometheus, por su parte, es una herramienta completa que también recopila datos, pero lo hace en su propia base de datos, y define su propio lenguaje para consultar esos datos, con el que Grafana puede interactuar para generar los gráficos. En esencia, OpenTelemetry es un estandar abierto, mientras que Prometheus es una herramienta con su propio ecosistema.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares fundamentales de la observabilidad son: las trazas, las métricas y los registros. OpenTelemetry aborda los tres pilares.

Los logs es un evento en particular que ocurrió en un momento dado. El mejor ejemplo que se me ocurre es un console.log('pasa algo'). Sin embargo, estos console.log en consola no son utilizables, o al menos, no de forma centralizada. Para hacer los logs utilizables se necesita una herramienta que los recopile y los presente de una forma estructurada.

Las métricas son la forma de medir el comportamiento del sistema en un período de tiempo. Por ejemplo, la cantidad de usuarios que ingresan al sistema por hora. Nos permiten cuantificar, en cierto sentido, distintos aspectos del estado interno del sistema.

Las trazas son la forma de seguir el rastro de una solicitud a través de los diferentes servicios que la componen. Por ejemplo, cuando un usuario hace clic en un botón, se genera una traza que recorre todos los servicios involucrados en la operación. OpenTelemetry lo hace automáticamente cada vez que hacemos una petición a algún servicio. Esto nos permite, por ejemplo, ver cuanto tiempo demora cada servicio en responder y detectar cuellos de botella.

### Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?

El concepto de métricas RED pude entenderlo como una forma estandarizada de medir el comportamiento de un servicio. Es decir, en esto que había dicho de las métricas, existe un esquema de tres tipos distintos de métricas con un propósito específico para medir el estado de un servicio desde la perspectiva del usuario: 

* **Rate (Tasa):** Cantidad de peticiones que recibe el servicio. Esta métrica nos permite saber si el servicio está siendo utilizado y si está respondiendo correctamente. Por ejemplo, si la tasa de peticiones disminuye drásticamente, puede indicar que algo está fallando.
* **Errors (Errores):** Cantidad de peticiones que fallan. Esta métrica nos permite saber si el servicio está fallando y si está respondiendo correctamente. Por ejemplo, si la tasa de errores aumenta drásticamente, puede indicar que algo está fallando.
* **Duration (Duración):** Tiempo que toma cada petición. Esta métrica nos permite saber si el servicio está respondiendo correctamente. Por ejemplo, si la duración de las peticiones aumenta drásticamente, puede indicar que algo está fallando.

Las tres métricas en conjunto nos permiten tener una visión general de la salud del servicio, y detectar problemas de forma temprana. Por ejemplo, si la tasa de errores aumenta, podemos investigar qué está pasando y solucionarlo antes de que afecte a más usuarios.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente
OTLP (OpenTelemetry Protocol) es el protocolo estándar de OpenTelemetry para transmitir datos de observabilidad — métricas, trazas y logs — desde la aplicación hacia un destino, típicamente el OpenTelemetry Collector. Define el formato y transporte de los mensajes (HTTP o gRPC).

Su ventaja frente a exportar directo a Prometheus es el desacoplamiento: la aplicación solo sabe que envía datos en formato OTLP al Collector, sin conocer qué herramienta los consume del otro lado. Si mañana querés agregar Datadog o cambiar de Prometheus a otro backend, solo cambiás la configuración del Collector — sin tocar el código de la app.

El ejemplo que le pedí a Claude es el siguiente:

// La app habla OTLP — no conoce el destino final
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http'
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces'
  })
})

El Collector recibe esos datos y los reenvía — sin almacenarlos — a Prometheus, Jaeger, Datadog, o varios a la vez vía configuración.

## ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es justamente la herramienta que se encarga de visualizar los datos que recopila OpenTelemetry. Lo más común es conectar Grafana a Prometheus, y que Prometheus recoja los datos de OpenTelemetry, y no que Grafana se conecte directamente al Collector, ya que éste no está diseñado para responder consultas, está diseñado para reenviar datos. Mientras que Prometheus tiene su propio lenguaje de consultas, PromQL, y está diseñado para almacenar y consultar datos de series temporales.