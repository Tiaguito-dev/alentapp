---
id: 0010
estado: Aprobado
autor: Federico Alvarez Pieroni
fecha: 2026-05-01
titulo: Baja de Certificados Médicos
---

# TDD-0010: Baja de Certificados Médicos

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos dar de baja un certificado médico de manera lógica, ocultándolo de la interfaz y de las consultas de la API sin eliminarlo físicamente de la base de datos.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Dar de baja certificados que no deben seguir visibles en la operación diaria (por ejemplo, certificados cargados por error), sin perder rastro para auditoría. Necesita una advertencia explícita antes de confirmar la baja.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con la baja.
- La baja se implementa marcando el campo `deleted_at` con la fecha y hora actual del servidor; **no se realiza borrado físico** del registro.
- Una vez dado de baja, el certificado deja de aparecer en todas las consultas (listado, detalle por ID, filtros).
- Si el certificado dado de baja es el único activo del socio (`is_validated = true`), la operación debe proceder igualmente; queda bajo responsabilidad del administrativo recargar uno nuevo.
- Si la baja es exitosa, la tabla debe actualizarse automáticamente reflejando la ausencia del registro.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. Se reutiliza el campo
`deleted_at` para implementar baja lógica.

### Contrato de API (@alentapp/shared)

Al tratarse de una operación que solo requiere conocer el identificador, no se envía
cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/medical-certificates/:id`
- Request Body: ninguno.
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `findById(id)` y `update(certificate)` ya definidos en TDD-0009).
2. **Caso de Uso**: `DeleteMedicalCertificateUseCase` (recupera el certificado vía `findById`; si no existe, lanza error 404; en cualquier otro caso setea `deleted_at = now()` y delega la persistencia al método `update`).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (la operación se traduce a un `update` de Prisma sobre el campo `deleted_at`; los métodos de consulta filtran `deleted_at IS NULL` por defecto).
4. **Adaptador de Entrada**: `MedicalCertificateController` (ruta HTTP `DELETE /api/v1/medical-certificates/:id` que extrae el `id`, mapea excepciones a códigos HTTP y retorna status 204).

## Casos de Borde y Errores

| Escenario                                                       | Resultado Esperado                                                     | Código HTTP               |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente                                         | Mensaje: "El certificado no existe"                                    | 404 Not Found             |
| Certificado ya dado de baja (`deleted_at` no nulo)             | Mensaje: "El certificado no existe"                                    | 404 Not Found             |
| Certificado activo (único del socio, `is_validated = true`)     | Se setea `deleted_at = now()` y deja de aparecer en consultas          | 204 No Content            |
| Certificado invalidado (`is_validated = false`)                | Se setea `deleted_at = now()` y deja de aparecer en consultas          | 204 No Content            |
| Error de conexión a la base de datos                            | Mensaje: "Error interno, reintente más tarde"                          | 500 Internal Server Error |

## Plan de Implementación

1. Implementar el caso de uso `DeleteMedicalCertificateUseCase` reutilizando `findById` y `update` del `MedicalCertificateRepository` para aplicar baja lógica.
2. Asegurar que `findById` y `findMany` filtren `deleted_at IS NULL` por defecto.
3. Exponer la ruta `DELETE /api/v1/medical-certificates/:id` en el `MedicalCertificateController` y registrarla en `app.ts`.
4. Añadir el método `deleteMedicalCertificate(id)` al servicio frontend (`medicalCertificates.ts`).
5. Enlazar el botón de eliminación en la vista de certificados médicos agregando una confirmación explícita del usuario (modal o `window.confirm`) antes de hacer la llamada HTTP.

## Observaciones Adicionales

### Distinción entre baja lógica e invalidación

La baja lógica y la invalidación son operaciones diferentes:

- **Invalidación (`PATCH /:id/invalidar`)**: el certificado sigue visible en consultas históricas, pero con `is_validated = false`.
- **Baja lógica (`DELETE /:id`)**: se setea `deleted_at` y el certificado deja de ser visible desde la API.

Ambas operaciones no deben confundirse ni intercambiarse.

### Impacto de eliminar el único certificado activo

Si se elimina el único certificado activo del socio (`is_validated = true`), el sistema queda sin cobertura médica registrada para ese socio. Esta condición es permitida por el sistema pero el frontend debe mostrar una advertencia explícita cuando el certificado a eliminar sea activo, para que el administrativo sea consciente de las consecuencias de la acción irreversible. El administrativo retiene la responsabilidad final de proceder.

### No se realiza borrado físico

Aunque la API usa `DELETE`, internamente la operación es una baja lógica (`update`
de `deleted_at`). Esto preserva trazabilidad y evita pérdida irreversible de datos.

### Por qué se usa `DELETE` y no `PATCH /:id/delete`

Desde la perspectiva del cliente, el recurso deja de existir para la API, por lo
que `DELETE` es el verbo HTTP más natural y consistente con convenciones REST.

