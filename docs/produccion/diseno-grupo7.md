# Diseño de Infraestructura para Producción
 
**Grupo:** 7  
**Actividad:** TP Integrador - Actividad 4, Fase 2
 

---

## 2.1. Diseño de la infraestructura Docker

Este documento describe el diseño propuesto para `packages/api/Dockerfile.prod`, destinado al despliegue de la API en entornos de producción.

### a) packages/api/Dockerfile.prod

#### Propósito

Definir una imagen de producción del servicio API que sea:

- Pequeña, para reducir tiempos de build, push y pull.
- Segura, ejecutando el proceso con un usuario no-root.
- Reproducible, con instalación determinística de dependencias.
- Lista para orquestación, incluyendo healthcheck para monitoreo.

Este archivo es necesario para separar el entorno de desarrollo (hot reload, herramientas dev) del entorno de producción (solo runtime y artefactos mínimos).

Se utiliza una estrategia multi-stage build para separar las responsabilidades de instalación, compilación y ejecución. Esto permite reducir el tamaño de la imagen final, evitar la inclusión de herramientas de compilación en producción y mejorar la seguridad del contenedor.

#### Estructura (multi-stage build con 3 etapas)

|   Etapa | Nombre  | Base           | Propósito                                                                                         |
|--------:|---------|----------------|---------------------------------------------------------------------------------------------------|
| Stage 1 | deps    | node:22-alpine | Instalar dependencias necesarias para compilación y ejecución mediante una instalación reproducible basada en `npm ci`. |
| Stage 2 | build   | node:22-alpine | Compilar TypeScript y generar artefactos JavaScript de ejecución.                                 |
| Stage 3 | runtime | node:22-alpine | Contener únicamente runtime: JS compilado + node_modules de prod + usuario no-root + healthcheck. |

#### Estructura interna del Dockerfile

1. Definición de base por etapa (`deps`, `build`, `runtime`).
2. Configuración de directorio de trabajo.
3. Copia temprana de manifests (`package.json`, `package-lock.json` y archivos de configuración de los workspaces) para maximizar el uso de caché durante el build.
4. Instalación de dependencias según etapa.
5. Copia del código fuente y compilación en etapa `build`.
6. Copia selectiva de artefactos a `runtime` (sin código fuente innecesario).
7. Definición de usuario no-root (`appuser` o `node`).
8. Configuración de variables de entorno de runtime, incluyendo `ENV NODE_ENV=production` y `ENV PORT=3000`.
9. Configuración de `EXPOSE`, `HEALTHCHECK` y `CMD` final.

#### Requisitos no funcionales

- Minimizar el tamaño final de la imagen mediante el uso de multi-stage build y la inclusión exclusiva de artefactos necesarios en runtime.
- Reducir el tiempo de inicio eliminando dependencias y archivos innecesarios en la imagen final.
- Seguridad:
	- Ejecución con usuario no-root.
	- Exclusión de herramientas de compilación en la imagen final.
	- Inclusión únicamente de dependencias necesarias para producción.
- Observabilidad mínima:
	- `HEALTHCHECK` HTTP contra el endpoint principal de la API o un endpoint específico de salud.
- Reproducibilidad:
	- Uso de `npm ci` y lockfile versionado.
- Portabilidad:
	- Imagen basada en `node:22-alpine`, priorizando compatibilidad con el entorno Node.js requerido y reducción del tamaño de la imagen.
- Consistencia de configuración:
	- Se recomienda definir `ENV PORT=3000` como configuración operativa del puerto de escucha de la aplicación en runtime.
	- `EXPOSE 3000` resulta suficiente como declaración explícita del puerto esperado por la imagen.
	- Aunque `EXPOSE $PORT` puede utilizarse, en este caso no aporta una ventaja práctica clara y agrega una indirección innecesaria en la documentación del Dockerfile.

#### Consideraciones complementarias

- Agregar un `.dockerignore` específico del monorepo para excluir al menos:
	- `node_modules`
	- `.git`
	- `dist`
	- `coverage`
	- `playwright-report`
	- `test-results`
	- `.env`
	- `.env.*`
	- `README.md`
	- `docs/`
	- archivos temporales y logs
- Evitar copiar todo el monorepo en la etapa final; copiar solo lo necesario del paquete API y dependencias compartidas requeridas en runtime.

#### Criterios de aceptación de esta sección

- Se documentan claramente las 3 etapas (`deps`, `build`, `runtime`).
- Se justifica el uso de multi-stage build para producción.
- Se incluyen requisitos de seguridad (no-root), salud (`HEALTHCHECK`) y optimización de tamaño.
- La documentación queda alineada al contexto del repositorio monorepo actual.

#### Conclusión

La estrategia propuesta permite obtener una imagen optimizada para producción, manteniendo una separación clara entre compilación y ejecución, reduciendo el tamaño final del contenedor y aplicando prácticas de seguridad recomendadas para entornos Docker.

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
## 2.1. Diseño de Docker Compose

Tengo que detallar y controlar seis aspectos:
- Resource limits
- Healthchecks
- Seguridad
- Loggin
- Red
- Secrets

### Resource limits
En el archivo de docker actual no hay un limite de recursos definido para ninguno de los servicios para CPU ni memoria.
Voy a definir algo como esto:
```
resources:
        limits:
          cpus: '1'
          memory: 1G
```
para cada uno de los servicios.

Los valores se definirán en base a métricas reales de consumo que me proporciona el comando `docker status` al correr el sistema sin límites.

### Healthcheck
Voy a implementar un healthcheck para el servicio del back y db. Debería quedar como algo como esto:
```
 test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Teniendo que especificar el puerto como variable de entorno para cada caso. 
Además, en la definición del servicio web tengo que poner algo como esto:
```
        depends_on:
            api:
                condition: service_healthy
```
tal como lo detallé en el análisis.

### Seguridad
Voy a definir las restricciones sobre el sistema de archivos de cada contenedor donde se está corriendo cada servicio con las siguientes directivas:
```
read_only: true
cap_drop: ALL
cap_add: NET_BIND_SERVICE
no-new-privileges
```
Le estoy diciendo: el contenedor no puede modificar nada de lo que está en disco, a menos que sea específicamente necesario para su funcionamiento. 

Los cap_drop me permiten quitarle permisos (capacidades) sobre casi todas las operaciones posibles, quedando solo con los necesarios para su funcionamiento. En este caso, le estoy dando permiso para que pueda recibir paquetes de la red.

Las capacidades son privilegios que tiene un usuario sobre el sistema. Por ejemplo hay una capacidad para modificar el reloj del sistema, otra para montar filesystems, otra para definir puertos, etc.

Con no-new-privileges se evita que el proceso pueda escalar privilegios dentro del contenedor, como por ejemplo, un proceso que se ejecuta como usuario no privilegiado, que no tenga la capacidad de aumentar sus privilegios a root.

### Logging
Voy a agregar un logging para cada servicio en archivos separados dentro de un volumen llamado logging. Debería quedar como algo como esto:
```
        logging:
            driver: json-file
            options:
                max-size: "10m"
                max-file: "3"
```

### Red
Voy a definir las siguientes redes:

```
networks:
  app-network:
    driver: bridge
    internal: true
  web-network:
    driver: bridge
    internal: true
```
La red de app-network estará conectada a la api y db. Mientras que a la de web solo estará conectada el servicio web y la api.


### Secrets
Voy a declarar los secretos utilizando variables sensibles desde archivo .env (no hardcodeadas).

```
POSTGRES_USER=appuser
POSTGRES_DB=appdb
POSTGRES_PASSWORD=${DB_PASSWORD}
```

### Preview del docker compose

services:
    db:
        image: postgres:16-alpine
        container_name: alentapp-db
        environment:
            - POSTGRES_USER=appuser
            - POSTGRES_DB=appdb
            - POSTGRES_PASSWORD=${DB_PASSWORD}
        ports:
            - '${DB_PORT}:5432'
        volumes:
            - pgdata:/var/lib/postgresql/data
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U appuser -d appdb']
            interval: 5s
            timeout: 5s
            retries: 5
        networks:
            - app-network
        deploy:
            resources:
                limits:
                    cpus: '1'
                    memory: 1G
        logging:
            driver: json-file
            options:
                max-size: "10m"
                max-file: "3"
        security_opt:
            - no-new-privileges: true
        read_only: true
        cap_drop:
            - ALL
        cap_add:
            - NET_BIND_SERVICE

    api:
        build:
            context: .
            dockerfile: packages/api/Dockerfile.prod
        container_name: alentapp-api
        environment:
            - DATABASE_URL=postgres://appuser:${DB_PASSWORD}@db:5432/appdb
            - PORT=${API_PORT}
        ports:
            - '${API_PORT}:${API_PORT}'
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:${API_PORT}/health"]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 40s
        networks:
            - app-network
            - web-network
        deploy:
            resources:
                limits:
                    cpus: '0.5'
                    memory: 512M
        logging:
            driver: json-file
            options:
                max-size: "10m"
                max-file: "3"
        security_opt:
            - no-new-privileges: true
        read_only: true
        cap_drop:
            - ALL
        cap_add:
            - NET_BIND_SERVICE
        depends_on:
            db:
                condition: service_healthy

    web:
        build:
            context: .
            dockerfile: packages/web/Dockerfile.prod
        container_name: alentapp-web
        ports:
            - '${WEB_PORT}:${WEB_PORT}'
        networks:
            - web-network
        environment:
            - PORT=${WEB_PORT}
        deploy:
            resources:
                limits:
                    cpus: '0.5'
                    memory: 512M
        logging:
            driver: json-file
            options:
                max-size: "10m"
                max-file: "3"
        security_opt:
            - no-new-privileges: true
        read_only: true
        cap_drop:
            - ALL
        cap_add:
            - NET_BIND_SERVICE
        depends_on:
            api:
                condition: service_healthy

networks:
    app-network:
        driver: bridge
        internal: true
    web-network:
        driver: bridge
        internal: true

volumes:
    pgdata: