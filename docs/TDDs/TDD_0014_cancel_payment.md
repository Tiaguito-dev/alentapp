---
id: 0014
estado: Propuesto
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Cancelación de Pagos
---
# TDD-0014: Cancelación de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Tesorero anular un pago que fue cargado por error o que ya no corresponde cobrar (ej: socio dado de baja antes del vencimiento), preservando el registro histórico para auditoría. 
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Anular un pago mal cargado o que ya no corresponde, sin perder el rastro de que existió. Necesita una confirmación visual antes de cancelar y necesita que el sistema impida la cancelación de pagos que ya fueron cobrados.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita en el frontend antes de proceder con la cancelación.
- El sistema debe rechazar la cancelación de un pago en estado `Paid` (un pago cobrado solo puede revertirse mediante un proceso de reembolso, fuera de alcance).
- El sistema debe permitir cancelar un pago tanto en estado `Pending` con vencimiento futuro como en estado `Pending` con vencimiento pasado (que al consultarse aparece como `Overdue`).
- La cancelación debe ser idempotente: cancelar un pago ya cancelado no debe arrojar error; debe responder éxito sin alterar el registro.
- No se permite borrar físicamente el registro bajo ninguna circunstancia.

## Diseño Técnico (RFC)
 
### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. Se reutilizan los mismos campos.

### Contrato de API (@alentapp/shared)

- Endpoint: `PATCH /api/v1/payments/:id/cancel`
- Request Body: ninguno.
- Response: 200 OK con el `PaymentResponse` actualizado (`status: 'Canceled'`).

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)` y `update(payment)`, ya definidos en TDD-0013).
2. **Caso de Uso**: `CancelPaymentUseCase` (recupera el pago vía `findById`; si `status === 'Paid'` lanza error; si `status === 'Canceled'` devuelve el pago sin cambios para mantener idempotencia; si `status === 'Pending'` transiciona el `status` a `Canceled` y delega la persistencia al repositorio).
3. **Adaptador de Salida**: `PostgresPaymentRepository` (actualización usando el método `update` de Prisma).
4. **Adaptador de Entrada**: `PaymentController` (Ruta `PATCH /api/v1/payments/:id/cancel` que extrae el `id` y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores
 
| Escenario                              | Resultado Esperado                                                   | Código HTTP               |
| -------------------------------------- | -------------------------------------------------------------------- | ------------------------- |
| Pago inexistente                       | Mensaje: "El pago no existe"                                         | 404 Not Found             |
| Pago en estado `Paid`                  | Mensaje: "No se puede cancelar un pago ya cobrado"                   | 409 Conflict              |
| Pago en estado `Pending`               | Devuelve el pago actualizado con `status: 'Canceled'`                | 200 OK                    |
| Pago `Pending` con vencimiento pasado (Overdue)| Devuelve el pago actualizado con `status: 'Canceled'`        | 200 OK                    |
| Pago ya en estado `Canceled`           | Devuelve el pago con mensaje: "El pago ya estaba cancelado"          | 200 OK                    |
| Error de conexión a la base de datos   | Mensaje: "Error interno, reintente más tarde"                        | 500 Internal Server Error |
 
## Plan de Implementación

1. Implementar el caso de uso `CancelPaymentUseCase`, que rechaza la operación si el pago está en estado `Paid` y es idempotente si ya está en `Canceled`.
2. Exponer la ruta `PATCH /api/v1/payments/:id/cancel` en el `PaymentController` y registrarla en la app de Fastify.
3. En el frontend, enlazar el botón "Cancelar" en la tabla de pagos con una confirmación previa que advierta que la operación no se puede deshacer.

## Observaciones Adicionales

### No se realiza borrado físico

La "baja" del pago corresponde a una transición del `status` a `Canceled`. Esta es la regla de inmutabilidad financiera del enunciado y este TDD reemplaza al "Eliminación" del ABM tradicional.

### Por qué no se permite cancelar un pago ya cobrado

Cancelar un pago `Paid` no es una operación de cancelación, sino un reembolso. Un reembolso requiere lógica adicional (devolución del dinero, contraasiento contable, comprobante de devolución) que está fuera del alcance de este TDD. 

### Por qué se usa `PATCH /canceled` en lugar de `DELETE`

Se utiliza un endpoint orientado a acción (`/canceled`) en lugar del verbo HTTP `DELETE`. `DELETE` en REST sugiere borrado físico del recurso, lo cual contradice la regla de inmutabilidad. Un endpoint dedicado deja explícito que se trata de una transición de estado y previene que un futuro desarrollador "complete" la semántica de `DELETE` eliminando el registro.