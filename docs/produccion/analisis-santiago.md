# Fase 1: Analizar y proponer

## 1.1. Análisis de la infraestructura Docker actual

Al analizar los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile` actuales, se identificaron los siguientes problemas y vulnerabilidades respecto a las buenas prácticas de producción:

| Problema                         | ¿Dónde ocurre? | Impacto | Solución propuesta |
| :---                             | :---           | :---    | :---               |
| **1. Credenciales hardcodeadas** | `docker-compose.yml` | **Alto** | Las credenciales de la base de datos están expuestas. Extraer a un archivo `.env` y usar secrets/variables inyectadas. |

| **2. Ejecución de contenedores como `root`** | `packages/api/Dockerfile` y `packages/web/Dockerfile` | **Alto** | Por defecto corren como root. Agregar la instrucción `USER node` (o `appuser`) en la etapa de runtime. |

| **3. Servidor de desarrollo en el frontend** | `packages/web/Dockerfile` (CMD `npm run dev`) | **Alto** | Vite dev server no está diseñado para tráfico de producción. Compilar estáticos e implementar servidor Nginx (`nginx:stable-alpine`). |

| **4. Montaje de volúmenes locales (Bind Mounts)** | `docker-compose.yml` | **Alto** | Montar el código fuente sobreescribe el contenedor. Eliminar volúmenes locales en prod y copiar el código estático en la imagen. |

| **5. Herramientas de desarrollo en imagen final** | Ambos `Dockerfile` (`npm install` sin flags) | **Medio** | La imagen incluye linters, testing y compiladores. Usar multi-stage builds y `npm ci --omit=dev` en la etapa de dependencias productivas. |

---

## 1.2. Investigar OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?
OpenTelemetry es un estándar unificado y un conjunto de herramientas diseñado para instrumentar, generar, recolectar y exportar datos de telemetría (métricas, logs y trazas), **no es un sistema de almacenamiento**. Prometheus, por otro lado, es una base de datos y un sistema de monitoreo diseñado específicamente para almacenar y consultar esas métricas.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?
Los tres pilares son:
*   **Métricas:** Datos numéricos agregados a lo largo del tiempo.
*   **Logs:** Registros inmutables de eventos discretos.
*   **Trazas:** El recorrido detallado de una solicitud a través de sistemas distribuidos.

OpenTelemetry **aborda los tres pilares**, proporcionando un estándar unificado para todos ellos.

### Métricas RED (Rate, Errors, Duration)
*   **Rate (Tasa):** Representa el número de peticiones por segundo. Sirve para medir el volumen de tráfico y la carga actual del sistema.
*   **Errors (Errores):** Es la cantidad o porcentaje de peticiones que fallan (generalmente códigos HTTP 4xx y 5xx). Sirve para indicar la confiabilidad y la salud del servicio.
*   **Duration (Duración/Latencia):** Es el tiempo que toma procesar una petición. Es fundamental para medir el rendimiento y la experiencia del usuario.

### ¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?
OTLP es el protocolo de transmisión estándar de OpenTelemetry. Su principal ventaja es que es **agnóstico del proveedor** (evita el *vendor lock-in*). Si se exporta vía OTLP hacia un colector, mañana se puede cambiar el backend de almacenamiento (ej. de Prometheus a Datadog o New Relic) modificando solo la configuración del colector, sin necesidad de tocar ni recompilar el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?
OpenTelemetry se encarga de la instrumentación y recolección de los datos, enviándolos a un backend de almacenamiento (como Prometheus). Grafana actúa como la **capa de visualización**. Se conecta a ese backend (Prometheus) para consultar los datos originados en OpenTelemetry y construir dashboards interactivos que permiten interpretar visualmente la salud del sistema.