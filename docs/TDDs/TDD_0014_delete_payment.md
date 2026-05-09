---
id: 0014
estado: Aprobado
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Eliminación de Pagos Existentes
---
# TDD-0014: Eliminación de Pagos Existentes

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Administrativo dar de baja un pago de manera lógica, ocultándolo de la interfaz pero sin eliminarlo físicamente de la base de datos. 
 
### User Persona

- Nombre: Lautaro (Administrativo).
- Necesidad: Lautaro necesita poder eliminar un pago mal cargado o que ya no corresponde, sin perder el rastro de que existió. 

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita en el frontend antes de proceder con la baja.
- La baja se implementa marcando el campo `deleted_at` con la fecha y hora actual del servidor; **no se realiza borrado físico** del registro bajo ninguna circunstancia.
- Una vez dado de baja, el pago deja de aparecer en todas las consultas (listado, detalle por ID, filtros).
- El sistema debe rechazar la baja de un pago en estado `Paid` (un pago cobrado solo puede revertirse mediante un proceso de reembolso, fuera de alcance).
- Una vez aplicada, la baja libera la combinación `(member_id, month, year)` para una nueva alta. 

## Diseño Técnico (RFC)
 
### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. Se reutilizan los mismos campos.

### Contrato de API (@alentapp/shared)

- Endpoint: `DELETE /api/v1/payments/:id`
- Request Body: ninguno.
- Response: 204 No Content.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)` y `update(payment)` ya definidos en TDD-0013).
2. **Caso de Uso**: `DeletePaymentUseCase` (recupera el pago vía `findById` — que filtra `deleted_at IS NULL` por defecto; si `status === 'Paid'` lanza error de conflicto; en cualquier otro caso, setea `deleted_at = now()` sobre el objeto y delega la persistencia al método `update` del repositorio).
3. **Adaptador de Salida**: `PostgresPaymentRepository` (la operación se traduce a un `update` de Prisma sobre el campo `deleted_at`; el método `findById` y demás métodos de consulta filtran `deleted_at IS NULL` por defecto).
4. **Adaptador de Entrada**: `PaymentController` (Ruta `DELETE /api/v1/payments/:id` que extrae el `id` y mapea excepciones a códigos HTTP).


## Casos de Borde y Errores
 
| Escenario                                          | Resultado Esperado                                                   | Código HTTP               |
| -------------------------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| Pago inexistente                                   | Mensaje: "El pago no existe"                                         | 404 Not Found             |
| Pago ya dado de baja (`deleted_at` no nulo)        | Mensaje: "El pago no existe"                                         | 404 Not Found             |
| Pago en estado `Paid`                              | Mensaje: "No se puede dar de baja un pago ya cobrado"                | 409 Conflict              |
| Pago en estado `Pending`                           | Se setea `deleted_at = now()`; el pago deja de aparecer en consultas | 204 No Content            |
| Pago `Pending` con vencimiento pasado (Overdue)    | Se setea `deleted_at = now()`; el pago deja de aparecer en consultas | 204 No Content            |
| Pago en estado `Canceled`                          | Se setea `deleted_at = now()`; el pago deja de aparecer en consultas | 204 No Content            |
| Error de conexión a la base de datos               | Mensaje: "Error interno, reintente más tarde"                        | 500 Internal Server Error |
 
## Plan de Implementación

1. Implementar el caso de uso `DeletePaymentUseCase` reutilizando los métodos `findById` y `update` del `PaymentRepository` definidos en TDD-0013.
2. Exponer la ruta `DELETE /api/v1/payments/:id` en el `PaymentController` y registrarla en la app de Fastify.
4. En el frontend, agregar la opción para eliminar en la tabla de pagos con una confirmación previa.

## Observaciones Adicionales

### No se realiza borrado físico

La "baja" del pago corresponde a setear el campo `deleted_at` para marcarlo como oculto. Cualquier reporte de auditoría puede acceder a los pagos dados de baja consultando directamente la base de datos.

### Por qué no se permite dar de baja un pago ya cobrado

Un pago en estado `Paid` representa una transacción financiera consolidada (el socio efectivamente pagó). Ocultarlo de la interfaz haría desaparecer el ingreso de los reportes operativos y abriría la puerta a manipulaciones contables. Si un pago fue marcado como pagado por error, el camino correcto es realizar un reembolso (proceso fuera de alcance de este TDD).

### Por qué se usa `DELETE` y no `PATCH /:id/delete`
 
Aunque la implementación es una baja lógica (un `update` que setea `deleted_at`), desde la perspectiva del cliente la semántica es exactamente la de `DELETE`: el recurso deja de existir y deja de ser accesible vía la API. Usar el verbo HTTP `DELETE` resulta más natural y consistente con las convenciones REST. La aclaración de que el borrado es lógico es un detalle de implementación interno que no afecta el contrato de la API.

