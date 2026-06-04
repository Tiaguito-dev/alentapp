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

