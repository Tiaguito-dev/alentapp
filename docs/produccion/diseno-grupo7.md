# Diseño de Infraestructura para Producción
 
**Grupo:** 7  
**Actividad:** TP Integrador - Actividad 4, Fase 2
 
---
## 2.1. Diseño de la infraestructura Docker: Frontend (Web)

### Archivo: `packages/web/Dockerfile.prod` 

**Propósito:**
El propósito de este archivo es empaquetar y servir la aplicación frontend de manera óptima y segura para un entorno de producción. Es estrictamente necesario implementar esto porque el servidor de desarrollo de Node.js (Vite) no está diseñado para manejar tráfico productivo. Al compilar el código y servirlo mediante un servidor web dedicado, se reduce drásticamente la superficie de ataque y el consumo de recursos.

**Estructura:**
Se implementa un *multi-stage build* compuesto por 3 etapas secuenciales para garantizar que el entorno de ejecución final quede completamente limpio de herramientas de construcción:

| Etapa | Nombre | Base | Propósito |
| :--- | :--- | :--- | :--- |
| Stage 1 | `deps` | `node:22-alpine` | Instalar dependencias necesarias para el proyecto. |
| Stage 2 | `build` | `node:22-alpine` | Build de Vite (`vite build`) para generar los estáticos optimizados. |
| Stage 3 | `runtime` | `nginx:stable-alpine` | Servir archivos estáticos con nginx, descartando todo el ecosistema Node.js. |

**Requisitos no funcionales:**
* **Tamaño máximo de imagen:** Se espera una reducción drástica (meta de ~170MB), ya que la etapa `runtime` solo contiene Nginx y archivos HTML/JS/CSS estáticos.
* **Tiempo de startup:** Arranque casi instantáneo al levantar el contenedor, dado que Nginx no requiere compilar ni transpilar código en tiempo de ejecución.
* **Servidor Web Productivo:** Uso exclusivo de Nginx para servir el frontend; Node.js queda completamente excluido de la imagen final de producción.
* **Optimizaciones y Seguridad:** La imagen debe incluir un archivo de configuración de Nginx que implemente explícitamente compresión `gzip`, políticas de caché para optimizar la carga de *assets*, y *security headers* (cabeceras de seguridad HTTP).
* **Monitoreo (Healthcheck):** Implementación de una directiva `HEALTHCHECK` nativa contra `localhost:80` para que el orquestador verifique continuamente la disponibilidad del servidor web.
---

