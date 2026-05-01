---
id: 0013
estado: Propuesto
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Modificación de Pagos
---
# TDD-0013: Modificación de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Tesorero modificar un pago existente en dos escenarios distintos pero relacionados: (a) corregir datos del pago (monto y/o fecha de vencimiento) cuando todavía no fue cobrado; (b) registrar el cobro de un pago pendiente (transición a `Pagado`). 
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Corregir un monto mal cargado o postergar una fecha de vencimiento mientras el pago sigue Pendiente, y registrar el cobro cuando el socio paga (ya sea en caja o por transferencia). Necesita que el sistema impida modificaciones sobre pagos ya cobrados o cancelados, para no alterar registros financieros consolidados.

### Criterios de Aceptación

**Edición de campos:**
- El sistema debe permitir editar `monto` y/o `fechaVencimiento` solo cuando el pago esté en estado `Pendiente`.
- Si el pago está en estado `Pagado` o `Cancelado`, la edición debe rechazarse para preservar la inmutabilidad financiera.
- No se permite editar `socioId`, `mes`, `anio` ni `estado` por esta vía: cambiarlos sería re-emitir el pago, no modificarlo.
- Al menos un campo modificable debe estar presente en el body; un PATCH vacío debe rechazarse.
**Marcado como pagado:**
- Solo se puede marcar como pagado un pago en estado `Pendiente`. Marcar uno ya `Pagado` o `Cancelado` debe rechazarse.
- La operación debe completar `fechaPago` con la fecha y hora provistas; si no se provee, se usa `now()`.
- La operación debe transicionar el `estado` a `Pagado`.



## Observaciones Adicionales

### Por qué solo se permiten editar `monto` y `fechaVencimiento`

La modificación está acotada a estos dos campos porque son los únicos que pueden cambiar sin alterar la identidad ni el ciclo de vida del pago. Cambiar cualquier otro atributo no es "modificar el pago", sino una operación distinta que merece su propio caso de uso. A continuación se detalla el motivo de exclusión de cada campo:

- **`socioId`**: identifica a quién se le cobra. Reasignar un pago a otro socio no es una corrección de datos, es transferir una obligación financiera de una persona a otra, lo que en términos contables equivale a anular el pago original y emitir uno nuevo al socio correcto. Si se permitiera editarlo, se podrían encubrir errores graves de carga sin dejar rastro.

- **`mes` y `anio`**: definen a qué período corresponde la cuota. Cambiarlos significaría que el pago dejó de cubrir el mes original y pasó a cubrir otro, alterando los reportes históricos de cobranza. Además, podrían colisionar con el índice único parcial sobre (`socioId`, `mes`, `anio`) si ya existe un pago activo para el período de destino. Si se necesita cambiar el período, lo correcto es cancelar el pago actual y emitir uno nuevo.

- **`estado`**: cada transición de estado tiene reglas de negocio propias y debe quedar registrada como una acción explícita y auditable:
  - `Pendiente → Pagado`: se realiza vía `PATCH /api/v1/pagos/:id/pagar` (definido en este mismo TDD), que requiere completar `fechaPago`.
  - `Pendiente → Cancelado`: se realiza vía `PATCH /api/v1/pagos/:id/cancelar` (definido en TDD-0014).
  - Cualquier otra transición (ej: `Pagado → Pendiente`, `Cancelado → Pendiente`) está prohibida por la regla de inmutabilidad financiera del enunciado.
  
  Permitir editar `estado` desde un endpoint genérico abriría la puerta a saltearse estas reglas y a transiciones accidentales. 

- **`fechaPago`**: solo tiene sentido cuando el pago está en estado `Pagado`, y en ese caso se completa automáticamente al ejecutar la acción de marcar como pagado. Editarla por separado podría dejar el sistema en un estado inconsistente (por ejemplo, un pago `Pendiente` con `fechaPago` completa, o un pago `Pagado` con `fechaPago` adelantada respecto a la realidad). Si se necesita corregir una fecha de pago mal cargada, la operación correcta es cancelar el pago e ingresarlo nuevamente con la fecha correcta.

