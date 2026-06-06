# Fase 1: Analizar y proponer

## 1.1. Análisis de la infraestructura Docker actual

Al analizar los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`, se identificaron los siguientes problemas respecto a las buenas prácticas para un entorno de producción:

|#| |Problema | Donde Ocurre | | Impacto | | Solucion Propuesta |
|1| |**Variables de entorno sensibles expuestas**| | `docker-compose.yml`:7,18 | Alto | Extraer  credenciales como `POSTGRES_PASSWORD` y `DATABASE_URL` a un archivo `.env` excluido del control de versiones, en lugar de dejarlas hardcodeadas.|
|2| |**Ejecución de contenedores como usuario `root`**| | `packages/api/Dockerfile`:1<br>`packages/web/Dockerfile`:1| | Alto | |Crear y utilizar un usuario sin privilegios (ej. `node` o `appuser`) en los Dockerfile mediante la instrucción `USER` para minimizar el impacto ante una vulnerabilidad.|
|3| |**Uso de comandos de desarrollo en producción**| | `docker-compose.yml`:27,45<br>`packages/api/Dockerfile`:18| | Alto | Reemplazar comandos como `npm run dev` o `tsx watch` por comandos de ejecución de código compilado, e implementar *multi-stage builds* para separar la construcción del entorno de ejecución final.|
|4| | **Montaje de volúmenes locales (Bind mounts) con código fuente**| |`docker-compose.yml`:21,41| | Medio| Eliminar los montajes de directorios locales (`.:/app`) en producción; el código debe estar empaquetado de forma inmutable dentro de la imagen Docker.| 
|5| | **Ausencia de límites de recursos (CPU/Memoria)**| | `docker-compose.yml` (servicios `api` y `web`) | | Medio | Definir `deploy.resources.limits` en cada servicio para evitar que un contenedor acapare todos los recursos del host y afecte a otros servicios.|


## 1.2. Investigación sobre OpenTelemetry

* **¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?**
  OpenTelemetry es un marco de observabilidad y un conjunto de herramientas diseñado para crear y administrar datos de telemetría, como trazas, métricas y registros. Se diferencia de Prometheus porque OpenTelemetry no es un backend de observabilidad, sino que estandariza la forma en que se exportan los datos a backends como Prometheus, el cual sí se encarga de almacenar y consultar dicha información.

* **¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?**
  Los tres pilares de la observabilidad son las trazas, las métricas y los registros (logs). OpenTelemetry aborda los tres pilares.

* **Expliquen el concepto de métricas RED (Rate, Errors, Duration). ¿Para qué sirve cada una?**
  El método RED define tres métricas clave para instrumentar microservicios de manera estandarizada.
  * **Rate (Tasa):** Es la cantidad de solicitudes por segundo.
  * **Errors (Errores):** Es la cantidad de esas solicitudes que están fallando.
  * **Duration (Duración):** Es la cantidad de tiempo que toman esas solicitudes.
  Estas métricas sirven en conjunto para medir de manera predecible la experiencia del usuario y la salud del servicio.

* **¿Qué es el OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?**
  El OTLP (OpenTelemetry Protocol) es un protocolo de entrega de datos de telemetría de propósito general diseñado por el proyecto OpenTelemetry. La ventaja frente a exportar directamente es que permite enviar datos a un OpenTelemetry Collector, el cual puede enrutar la información a múltiples backends sin necesidad de cambiar la instrumentación de la aplicación, evitando así el "vendor lock-in" (dependencia de un solo proveedor).

* **¿Cómo se relaciona OpenTelemetry con Grafana?**
  OpenTelemetry actúa como el estándar para generar y exportar datos de telemetría, mientras que Grafana actúa como la capa de visualización y análisis. Grafana tiene soporte completo para OpenTelemetry, permitiendo ingerir datos OTLP directamente y visualizar métricas, registros y trazas en sus paneles.