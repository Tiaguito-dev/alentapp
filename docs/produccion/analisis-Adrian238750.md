# Fase 1: Analizar y proponer

## 1.1. Análisis de la infraestructura Docker actual

Al analizar los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`, se identificaron los siguientes problemas respecto a las buenas prácticas para un entorno de producción:

|#| |Problema | Donde Ocurre | | Impacto | | Solucion Propuesta |
|1| |**Variables de entorno sensibles expuestas**| | `docker-compose.yml`:7,18 | Alto | Extraer  credenciales como `POSTGRES_PASSWORD` y `DATABASE_URL` a un archivo `.env` excluido del control de versiones, en lugar de dejarlas hardcodeadas.|
|2| |**Ejecución de contenedores como usuario `root`**| | `packages/api/Dockerfile`:1<br>`packages/web/Dockerfile`:1| | Alto | |Crear y utilizar un usuario sin privilegios (ej. `node` o `appuser`) en los Dockerfile mediante la instrucción `USER` para minimizar el impacto ante una vulnerabilidad.|
|3| |**Uso de comandos de desarrollo en producción**| | `docker-compose.yml`:27,45<br>`packages/api/Dockerfile`:18| | Alto | Reemplazar comandos como `npm run dev` o `tsx watch` por comandos de ejecución de código compilado, e implementar *multi-stage builds* para separar la construcción del entorno de ejecución final.|
|4| | **Montaje de volúmenes locales (Bind mounts) con código fuente**| |`docker-compose.yml`:21,41| | Medio| Eliminar los montajes de directorios locales (`.:/app`) en producción; el código debe estar empaquetado de forma inmutable dentro de la imagen Docker.| 
|5| | **Ausencia de límites de recursos (CPU/Memoria)**| | `docker-compose.yml` (servicios `api` y `web`) | | Medio | Definir `deploy.resources.limits` en cada servicio para evitar que un contenedor acapare todos los recursos del host y afecte a otros servicios.|
