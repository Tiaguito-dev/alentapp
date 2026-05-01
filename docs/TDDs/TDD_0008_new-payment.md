---
id: 0008
estado: Propuesto
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Alta de Pagos
---
# TDD-0008: Alta de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Tesorero registrar de forma digital la obligación de pago de un socio (ejemplo, cuota mensual del club), generando un registro auditable que servirá como base para el seguimiento de cobranzas.  
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Generar las cuotas del mes para los socios sin riesgo de cobrar dos veces el mismo período ni saltearse a un socio. Por ejemplo, evitar cobrarle la cuota dos veces del mismo periodo a un mismo socio. 

### Criterios de Aceptación

- El sistema debe crear el pago siempre en estado `Pendiente` por defecto. Cualquier intento del cliente de fijar otro estado en el alta debe ser ignorado o rechazado.
- El sistema debe rechazar el alta si ya existe un pago **no cancelado** para la misma combinación (socio, mes, año). Esto permite re-emitir un pago cancelado pero impide duplicados activos.
- El sistema debe validar que el monto sea estrictamente mayor a cero.
- El sistema debe validar que el mes esté entre 1 y 12, y que el año esté en un rango razonable (entre el año actual menos 1 y el año actual más 1).
- El sistema debe validar que el socio referenciado exista.
- El campo `fechaPago` debe quedar nulo en el alta; solo se completa al marcar el pago como pagado.