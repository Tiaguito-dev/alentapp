---
id: 0015
estado: Propuesto
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Consulta de Pagos
---
# TDD-0015: Consulta de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Tesorero consultar pagos del sistema con filtros relevantes para tareas de cobranza y auditoría: por socio, por período (mes/año), por estado (incluyendo el estado calculado `Vencido`). 
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Identificar rápidamente los pagos vencidos para llamar a los socios morosos, ver el historial de pagos de un socio puntual, y armar un listado de pagos pendientes del mes para coordinar cobranzas.

### Criterios de Aceptación

- El sistema debe permitir filtrar por: `socioId`, `mes`, `anio`, y `estado`.
- El campo `estado` debe poder valer: `Pendiente`, `Pagado`, `Cancelado` o `Vencido`.
- Filtrar por `estado = 'Pendiente'` debe excluir los pagos con vencimiento pasado (que ya cuentan como Vencido), traduciéndose a `estado = 'Pendiente' AND fechaVencimiento >= hoy`.
- El sistema debe permitir también recuperar un pago puntual.



## Observaciones Adicionales

**El estado vencido no se persiste**: El estado 'Vencido' debe traducirse internamente a la condición `estado = 'Pendiente' AND fechaVencimiento < hoy`.