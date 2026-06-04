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

