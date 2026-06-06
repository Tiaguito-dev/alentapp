# Análisis de Infraestructura para Producción

**Autor:** fpianelli (Felipe Pianelli)
**Actividad:** TP Integrador - Actividad 4, Fase 1

---

## 1. Análisis de la infraestructura Docker actual

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