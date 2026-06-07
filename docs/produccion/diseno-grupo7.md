# Diseño de Infraestructura para Producción
 
**Grupo:** 7  
**Actividad:** TP Integrador - Actividad 4, Fase 2
 
---

## Diseño de Docker Compose

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
Voy a implementar u nhealthcheck para cada servicio excepto para db, que ya tiene uno. Debería quedar como algo como esto:
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
                max-size: "30m"
                max-file: "3"
```

### Red
Voy a definir las siguientes redes:

```
networks:
  app-network:
    driver: overlay
    internal: true
  web-network:
    driver: overlay
    internal: true
```
La red de app-network estará conectada a la api y db. Mientras que a la de web solo estará conectada el servicio web y la api.

Overlay hace que los contenedores se vean entre sí a pesar de estar en distintos nodos físicos o virtuales como podría pasar si utilizamos Swarm.


### Secrets
Voy a declarar los secretos de la siguiente forma:

```
secrets:
    db-password:
        external: true
  api_key:
        external: true
```
En el back voy a darle permisos para leer db_password y api_key. Y en la db voy a declarar:

```
POSTGRES_USER=appuser
POSTGRES_DB=appdb
POSTGRES_PASSWORD_FILE=/run/secrets/db_password
```

### Preview del docker compose

services:
    db:
        image: postgres:16-alpine
        container_name: alentapp-db
        environment:
            - POSTGRES_USER=appuser
            - POSTGRES_DB=appdb
            - POSTGRES_PASSWORD_FILE=/run/secrets/db-password
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
        secrets:
            - db-password
        deploy:
            resources:
                limits:
                    cpus: '1'
                    memory: 1G
        logging:
            driver: json-file
            options:
                max-size: "30m"
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
            dockerfile: packages/api/Dockerfile
        container_name: alentapp-api
        environment:
            - DATABASE_URL=postgres://appuser@db:5432/appdb
            - DB_PASSWORD_FILE=/run/secrets/db-password
            - CHOKIDAR_USEPOLLING=true
            - WATCHPACK_POLLING=true
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
        secrets:
            - db-password
            - api-key
        deploy:
            resources:
                limits:
                    cpus: '0.5'
                    memory: 512M
        logging:
            driver: json-file
            options:
                max-size: "30m"
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
            dockerfile: packages/web/Dockerfile
        container_name: alentapp-web
        environment:
            - CHOKIDAR_USEPOLLING=true
            - WATCHPACK_POLLING=true
        ports:
            - '${WEB_PORT}:${WEB_PORT}'
        networks:
            - web-network
        deploy:
            resources:
                limits:
                    cpus: '0.5'
                    memory: 512M
        logging:
            driver: json-file
            options:
                max-size: "30m"
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

secrets:
    db-password:
        external: true
    api-key:
        external: true

networks:
    app-network:
        driver: bridge
        internal: true
    web-network:
        driver: bridge
        internal: true

volumes:
    pgdata: