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
- Necesidad: Anular un pago mal cargado o que ya no corresponde, sin perder el rastro de que existió. Necesita una confirmación visual antes de cancelar y necesita que el sistema impida la cancelación de pagos ya cobrados.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita en el frontend antes de proceder con la cancelación.
- El sistema debe rechazar la cancelación de un pago en estado `Pagado` (un pago cobrado solo puede revertirse mediante un proceso de reembolso, fuera de alcance).
- El sistema debe permitir cancelar un pago tanto en estado `Pendiente` como cuando su `estadoEfectivo` calculado es `Vencido` (es decir, sigue siendo `Pendiente` en BD pero su fecha de vencimiento ya pasó).
- La cancelación debe ser idempotente: cancelar un pago ya `Cancelado` no debe arrojar error; debe responder éxito sin alterar el registro.
- No se permite borrar físicamente el registro bajo ninguna circunstancia.

## Observaciones Adicionales

**No se realiza borrado físico**: la "baja" del pago corresponde a una transición del `estado` a `Cancelado`. Esta es la regla de inmutabilidad financiera del enunciado y este TDD reemplaza al "Eliminación" del ABM tradicional.

**No se puede cancelar un cobro ya pagado**. Eso sería un reembolso, un proceso aparte que está fuera de alcance. 