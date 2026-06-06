# Fase 1: Analizar y proponer

**Autor:** Alvarez Pieroni Federico
**Fecha:** 04/06/2026

---


# 1.1 Analizar la infraestructura Docker actual

## Archivos revisados

* `docker-compose.yml`
* `packages/api/Dockerfile`
* `packages/web/Dockerfile`

---

## 5 problemas o vulnerabilidades detectadas

 ### Problema 1

 **Problema:**  
 Credenciales hardcodeadas en variables de entorno (usuario, contraseña y cadena de conexión de PostgreSQL).

 **¿Dónde ocurre?**  
 `docker-compose.yml`

 **Impacto:**  
 Alto

 **Solución propuesta:**  
 Utilizar variables de entorno externas mediante archivos `.env` para desarrollo y mecanismos seguros de gestión de secretos en producción. Evitar almacenar credenciales directamente en el repositorio.

 ---

 ### Problema 2

 **Problema:**  
 Exposición innecesaria de la base de datos al host mediante el puerto 5432.

 **¿Dónde ocurre?**  
 `docker-compose.yml`

 **Impacto:**  
 Alto

 **Solución propuesta:**  
 Eliminar el mapeo de puertos en producción y permitir el acceso únicamente desde la red interna de Docker. Exponer únicamente los servicios que deban ser accesibles externamente.

 ---

 ### Problema 3

 **Problema:**  
 Los contenedores se ejecutan como usuario root por defecto.

 **¿Dónde ocurre?**  
 `packages/api/Dockerfile` y `packages/web/Dockerfile`

 **Impacto:**  
 Alto

 **Solución propuesta:**  
 Crear un usuario sin privilegios dentro de la imagen y ejecutar la aplicación mediante la instrucción `USER`. Esto reduce el impacto de posibles vulnerabilidades.

 ---

 ### Problema 4

 **Problema:**  
 Dockerfiles sin estrategia Multi-Stage Build.

 **¿Dónde ocurre?**  
 `packages/api/Dockerfile` y `packages/web/Dockerfile`

 **Impacto:**  
 Alto

 **Solución propuesta:**  
 Implementar múltiples etapas de construcción para separar dependencias de compilación y ejecución. Esto reduce significativamente el tamaño final de la imagen y disminuye la superficie de ataque.

 ---

 ### Problema 5

 **Problema:**  
 Ejecución automática de migraciones de base de datos al iniciar el contenedor mediante el comando `prisma migrate dev`.

 **¿Dónde ocurre?**  
 `docker-compose.yml`

 **Impacto:**  
 Alto

 **Solución propuesta:**  
 Ejecutar las migraciones como parte del pipeline de despliegue o mediante un job específico. Evitar migraciones automáticas cada vez que el contenedor se inicia.


 ---

## Observaciones adicionales

### Uso de `npm install` en lugar de `npm ci`

Los Dockerfiles utilizan `npm install` para instalar dependencias.

**Impacto:** Medio.

**Problema:** La instalación puede variar dependiendo de cambios en las dependencias y genera builds menos reproducibles.

**Recomendación:** Utilizar `npm ci`, especialmente en entornos de integración continua y producción.

---

### Configuración orientada a desarrollo

Se detectan características propias de un entorno de desarrollo:

* Uso de `npx tsx watch`.
* Uso de `npm run dev`.
* Variables `CHOKIDAR_USEPOLLING=true` y `WATCHPACK_POLLING=true`.
* Montaje del proyecto completo mediante volúmenes (`.:/app`).

**Impacto:** Medio.

**Recomendación:** Mantener configuraciones separadas para desarrollo y producción utilizando archivos Compose independientes o perfiles específicos.

---

### Healthcheck únicamente en la base de datos

La base de datos posee un `healthcheck`, pero los servicios API y Web no cuentan con verificaciones de estado.

**Impacto:** Medio.

**Problema:** Docker no puede determinar fácilmente si la aplicación se encuentra funcionando correctamente o requiere reinicio.

**Recomendación:** Incorporar directivas `healthcheck` para los servicios de aplicación.

---

# 1.2 Investigar OpenTelemetry

## ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry (OTel) es un estándar abierto que proporciona APIs, SDKs y herramientas para instrumentar aplicaciones y recolectar información de observabilidad de forma uniforme.

Prometheus, en cambio, es una plataforma orientada principalmente a la recopilación, almacenamiento y consulta de métricas.

### Diferencias principales

| OpenTelemetry                            | Prometheus                           |
|------------------------------------------|--------------------------------------|
| Estándar de instrumentación              | Sistema de monitoreo                 |
| Recolecta métricas, trazas y logs        | Recolecta principalmente métricas    |
| Exporta información a múltiples backends | Almacena y consulta métricas         |
| Utiliza OTLP para transmitir datos       | Utiliza principalmente scraping HTTP |

---

## ¿Cuáles son los tres pilares de la observabilidad? ¿Cuál aborda OpenTelemetry?

Los tres pilares de la observabilidad son:

### Métricas

Valores numéricos que describen el comportamiento del sistema a lo largo del tiempo.

Ejemplos:

* Uso de CPU.
* Cantidad de solicitudes.
* Consumo de memoria.

### Trazas

Permiten seguir el recorrido completo de una solicitud a través de distintos servicios.

Ejemplo:

* Cliente → API → Base de datos → Respuesta.

### Logs

Registros de eventos generados por las aplicaciones y la infraestructura.

Ejemplos:

* Errores.
* Advertencias.
* Eventos de auditoría.

### Relación con OpenTelemetry

OpenTelemetry permite recolectar métricas, trazas y logs mediante una interfaz estandarizada, facilitando la integración con distintas herramientas de observabilidad.

---

## ¿Qué son las métricas RED?

RED es una metodología para monitorear servicios basada en tres métricas fundamentales:

### Rate (Tasa)

Cantidad de solicitudes procesadas por unidad de tiempo.

Permite medir la carga del sistema.

### Errors (Errores)

Cantidad o porcentaje de solicitudes que finalizan con error.

Permite detectar problemas de funcionamiento.

### Duration (Duración)

Tiempo requerido para procesar una solicitud.

Normalmente se analiza mediante percentiles como:

* p50
* p95
* p99

Permite identificar problemas de rendimiento y latencia.

---

## ¿Qué es OTLP y qué ventajas tiene frente a exportar directamente a Prometheus?

OTLP (OpenTelemetry Protocol) es el protocolo estándar utilizado por OpenTelemetry para transmitir métricas, trazas y logs entre aplicaciones instrumentadas y un OpenTelemetry Collector.

Puede utilizar:

* gRPC
* HTTP

### Ventajas de OTLP

* Independencia respecto del backend utilizado.
* Posibilidad de enviar datos a múltiples destinos simultáneamente.
* Centralización del procesamiento de telemetría.
* Permite aplicar filtros, transformaciones y muestreo.
* Facilita cambios futuros de herramientas sin modificar el código de la aplicación.

---

## ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es una plataforma de visualización y análisis de datos de observabilidad.

Un flujo típico es:

```text
Aplicación
    ↓
OpenTelemetry SDK
    ↓
OTLP
    ↓
OpenTelemetry Collector
    ↓
Prometheus (métricas)
Tempo (trazas)
    ↓
Grafana
```

En esta arquitectura:

* OpenTelemetry genera y transporta la telemetría.
* Prometheus almacena métricas.
* Tempo almacena trazas.
* Grafana centraliza la visualización mediante dashboards y alertas.

---

# Conclusión

La infraestructura actual se encuentra orientada principalmente al desarrollo y presenta varias oportunidades de mejora para un entorno productivo. Las principales recomendaciones incluyen eliminar credenciales hardcodeadas, reducir la exposición de servicios internos, ejecutar contenedores con usuarios no privilegiados, implementar imágenes optimizadas mediante Multi-Stage Builds y separar claramente las configuraciones de desarrollo y producción.

Además, la incorporación de OpenTelemetry permitirá implementar observabilidad moderna basada en métricas RED, facilitando la integración futura con Prometheus, Tempo y Grafana.
