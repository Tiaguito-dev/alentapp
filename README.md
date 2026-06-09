# Alentapp

Alentapp es una plataforma moderna para la gestión de socios y administración de clubes. Está construida como un monorepo utilizando Typescript, React (Vite + Chakra UI) en el frontend, y Fastify con Prisma (PostgreSQL) en el backend, siguiendo los principios de la Arquitectura Hexagonal.

<!-- Comentario: Esta rama incluye la funcionalidad de borrado (delete) para entidades como socios, lockers, pagos, disciplinas, deportes y certificados médicos. Este comentario es exclusivo para identificar la rama delete y no afecta ninguna funcionalidad. -->

Para conocer en detalle las decisiones de arquitectura del proyecto, puedes consultar la [Documentación de Arquitectura](./docs/ARCHITECTURE.md).

---

## Requisitos Previos

- **Node.js** (v18 o superior recomendado)
- **npm** (gestor de paquetes)
- **Docker** y **Docker Compose**

---

## Guía de Instalación y Ejecución

La forma más rápida y recomendada de levantar el entorno de desarrollo es utilizando **Docker Compose**. Este método configurará la base de datos PostgreSQL, ejecutará las migraciones de Prisma, y levantará tanto el frontend como el backend automáticamente con hot-reloading.

### Opción A: Usando Docker Compose (Recomendado)

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd alentapp
   ```
> Si es la primera vez que clonás el repo, o después de hacer pull de esta rama,
> corré `npm install` para instalar las dependencias y activar los hooks de Git.

2. **Levantar los servicios**:
   ```bash
   docker compose up --build
   ```
   *¡Eso es todo!* Docker se encargará de instalar las dependencias, aplicar la base de datos y correr los entornos.
   - La **API** estará disponible en `http://localhost:3000`
   - El **Frontend** estará disponible en `http://localhost:5173`

*(Nota: Si deseas detener los contenedores, simplemente presiona `Ctrl+C` y ejecuta `docker compose down`)*.

---

## 🚀 Entorno de Producción

El proyecto cuenta con un compose de producción endurecido (`docker-compose.prod.yml`) que incorpora buenas prácticas de seguridad, eficiencia y observabilidad.

### Levantar el entorno productivo

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Luego aplicar las migraciones:

```bash
DATABASE_URL=postgres://appuser:<password>@localhost:5432/appdb \
  npx prisma migrate deploy --config packages/api/prisma.config.ts
```

### Multi-stage Builds

Tanto el frontend como la API utilizan builds multi-stage en sus `Dockerfile`, lo que separa la etapa de compilación de la imagen final de ejecución. Esto produce imágenes más pequeñas, seguras y reproducibles:

| Servicio | Imagen dev | Imagen prod | Reducción |
|----------|-----------|-------------|-----------|
| Frontend | ~882 MB   | ~93.7 MB    | 90%       |

En el frontend, la etapa de build compila los assets con Node.js y Vite; la imagen final es solo Nginx sirviendo estáticos. En la API, el contenedor final no incluye código fuente TypeScript ni dependencias de desarrollo.

### Segmentación de redes

Se definen dos redes privadas bridge para aislar el tráfico:

- `web-network`: conecta el frontend con la API.
- `app-network`: conecta la API con la base de datos.

Esto impide que el frontend tenga visibilidad directa sobre la base de datos, reduciendo la superficie de ataque.

### Docker Secrets

Las credenciales sensibles (como `DB_PASSWORD`) se gestionan mediante Docker Secrets en lugar de variables de entorno estándar, evitando su exposición en logs o via `docker inspect`.

---

## 📊 Observabilidad

El entorno de producción incorpora un stack completo de observabilidad basado en los tres pilares: métricas, trazas y logs.

### Stack

- **OpenTelemetry (OTLP):** La API está instrumentada con el SDK de OpenTelemetry. Usar OTLP como protocolo de telemetría desacopla la aplicación del backend de destino, lo que permite migrar a Datadog, Jaeger u otra herramienta sin reescribir el código de instrumentación.
- **Prometheus:** Recolecta métricas expuestas por la API a través de un exportador compatible con OTLP. Corre en la red interna y no está expuesto públicamente.
- **Grafana:** Visualiza las métricas de Prometheus a través de dashboards. Disponible en `http://localhost:3003`.

### Dashboard RED (Rate, Errors, Duration)

El dashboard principal de Grafana monitorea las métricas RED de la API:

1. **Requests por segundo** — tasa de solicitudes entrantes.
2. **Tasa de error (%)** — porcentaje de respuestas con error.
3. **Latencia p95 / p99** — percentiles de tiempo de respuesta.
4. **Por status code** — desglose HTTP 200 / 400 / 404.
5. **Memoria del proceso** — uso de memoria del proceso Node.js.
6. **Endpoints más lentos (Top 5)** — identificación de cuellos de botella.

---

## Comandos Útiles de Base de Datos

Si necesitas visualizar la base de datos gráficamente a través del navegador, puedes usar Prisma Studio:
```bash
cd packages/api
npx prisma studio
```

---

## 🧪 Testing

El proyecto cuenta con una suite completa de tests (Unitarios, Integración y E2E Full-Stack). Para aprender a ejecutarlos y ver los diferentes modos disponibles (UI, Headed, Docker), consulta la **[Guía de Testing](./docs/TESTING.md)**.

## 🤝 Contribuir

Si deseas colaborar con el proyecto, por favor lee primero nuestra **[Guía de Contribución](./docs/CONTRIBUTING.md)** para entender el flujo de trabajo con feature branches y los estándares de código.

---

## 📂 Documentación Adicional

En la carpeta `/docs` encontrarás información detallada sobre:
- **[Arquitectura](./docs/ARCHITECTURE.md)**: Decisiones técnicas y estructura del monorepo.
- **[Testing](./docs/TESTING.md)**: Todo sobre la infraestructura de pruebas.
- **[Contribución](./docs/CONTRIBUTING.md)**: Cómo empezar a desarrollar en el proyecto.
- **TDDs**: Diseños técnicos y pruebas de cada funcionalidad implementada.