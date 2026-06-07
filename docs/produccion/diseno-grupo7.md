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

