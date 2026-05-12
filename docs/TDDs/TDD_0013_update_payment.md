---
id: 0013
estado: Aprobado
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Actualización de Pagos Existentes
---
# TDD-0013: Actualización de Pagos Existentes

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Administrativo modificar un pago existente en tres escenarios distintos: (a) corregir datos del pago (monto y/o fecha de vencimiento) cuando todavía no fue cobrado; (b) registrar el cobro de un pago pendiente (transición a `Paid`); (c) cancelar un pago pendiente cuando ya no corresponde cobrarlo (transición a `Canceled`). 
 
### User Persona

- Nombre: Lautaro (Administrativo).
- Necesidad: Corregir un monto mal cargado o postergar una fecha de vencimiento mientras el pago sigue pendiente, registrar el cobro cuando el socio paga, y anular el pago cuando ya no corresponde cobrarlo (por ejemplo, el socio se dio de baja antes del vencimiento). Necesita que el sistema impida modificaciones sobre pagos ya cobrados, para no alterar registros financieros consolidados.

### Criterios de Aceptación

**Edición de campos:**
- El sistema debe permitir editar `amount` y/o `due_date` solo cuando el pago esté en estado `Pending`.
- Si el pago está en estado `Paid` o `Canceled`, la edición debe rechazarse para preservar la inmutabilidad financiera.
- No se permite editar `member_id`, `month`, `year` ni `status` por esta vía: cambiarlos sería re-emitir el pago, no modificarlo.

**Marcado como pagado:**
- Solo se puede marcar como pagado un pago en estado `Pending`. Marcar uno ya pagado o cancelado debe rechazarse.
- La operación debe completar `payment_date` con la fecha y hora provistas; si no se provee, se usa `now()`.
- La operación debe transicionar el estado a `Paid`.


**Cancelación:**
- El sistema debe pedir una confirmación explícita en el frontend antes de proceder con la cancelación.
- Solo se puede cancelar un pago en estado `Pending`. Un pago ya cobrado (`Paid`) no puede revertirse por esta vía: requiere un proceso de reembolso, fuera de alcance.
- Cancelar un pago ya `Canceled` devuelve el pago sin cambios.
- El sistema debe permitir cancelar tanto un pago `Pending` con vencimiento futuro como uno con vencimiento pasado (que al consultarse aparece como `Overdue`).

## Diseño Técnico (RFC)
 
### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. Se reutilizan los mismos campos.
 
### Contrato de API (@alentapp/shared)

Se exponen tres endpoints diferenciados:
 
#### 1 Edición de campos
- Endpoint: `PATCH /api/v1/payments/:id`
- Request Body (UpdatePaymentRequest):
```ts
{
    amount?: number;            // > 0
    due_date?: string; // ISO Date YYYY-MM-DD
}
```
- Response: 200 OK con el PaymentResponse actualizado.

#### 2 Marcado como pagado
- Endpoint: `PATCH /api/v1/payments/:id/pay`
- Request Body (MarkPaymentAsPaidRequest):
```ts
{
    payment_date?: string; // ISO DateTime, opcional. Si no se envía, se usa now() del servidor.
}
```
- Response: 200 OK con el PaymentResponse actualizado (`status: 'Paid'`, `payment_date` completo).


#### 3 Cancelación
- Endpoint: `PATCH /api/v1/payments/:id/cancel`
- Request Body: ninguno.
- Response: 200 OK con el PaymentResponse actualizado (`status: 'Canceled'`).
 
### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)` y `update(payment)`).
2. **Servicio de Dominio**: `PaymentValidator` (reutilizado desde TDD-0012; `validateAmount(amount)` verifica que el monto sea mayor a cero; `validateDueDate(dueDate)` verifica el formato ISO `YYYY-MM-DD`; `validatePaymentDate(paymentDate)` verifica el formato ISO DateTime cuando se provee una fecha de pago).
3. **Caso de Uso**: `UpdatePaymentUseCase` (recupera el pago vía `findById`; si `status != 'Pending'` lanza error; delega las validaciones de `amount` y/o `due_date` en `PaymentValidator`; aplica los cambios y delega la persistencia al repositorio).
4. **Caso de Uso**: `MarkPaymentAsPaidUseCase` (recupera el pago vía `findById`; si `status != 'Pending'` lanza error; delega la validación de `payment_date` en `PaymentValidator` cuando se provee; transiciona el `status` a `Paid` y completa `payment_date` con la fecha provista o `now()`; delega la persistencia al repositorio).
5. **Caso de Uso**: `CancelPaymentUseCase` (recupera el pago vía `findById`; si `status === 'Paid'` lanza error; si `status === 'Canceled'` devuelve el pago sin cambios; si `status === 'Pending'` transiciona el `status` a `Canceled` y delega la persistencia al repositorio).
6. **Adaptador de Salida**: `PostgresPaymentRepository` (actualización usando el método `update` de Prisma).
7. **Adaptador de Entrada**: `PaymentController` (rutas `PATCH /api/v1/payments/:id`, `PATCH /api/v1/payments/:id/pay` y `PATCH /api/v1/payments/:id/cancel`, que extraen el `id` y mapean excepciones a códigos HTTP).

## Casos de Borde y Errores
 
### Edición de campos (`PATCH /api/v1/payments/:id`)
 
| Escenario                                  | Resultado Esperado                                            | Código HTTP               |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------- |
| Pago inexistente o dado de baja            | Mensaje: "El pago no existe"                                  | 404 Not Found             |
| Pago en estado `Paid` o `Canceled`         | Mensaje: "No se puede modificar un pago en estado {status}"   | 409 Conflict              |
| Body vacío (ningún campo enviado)          | Mensaje: "Debe proveer al menos un campo a modificar"         | 400 Bad Request           |
| Monto enviado ≤ 0                          | Mensaje: "El monto debe ser mayor a cero"                     | 400 Bad Request           |
| Fecha de vencimiento con formato inválido  | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"    | 400 Bad Request           |
| Error de conexión a la base de datos       | Mensaje: "Error interno, reintente más tarde"                 | 500 Internal Server Error |
 
### Marcado como pagado (`PATCH /api/v1/payments/:id/pay`)
 
| Escenario                              | Resultado Esperado                                              | Código HTTP               |
| -------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| Pago inexistente o dado de baja        | Mensaje: "El pago no existe"                                    | 404 Not Found             |
| Pago ya está en estado `Paid`          | Mensaje: "El pago ya fue marcado como pagado"                   | 409 Conflict              |
| Pago en estado `Canceled`              | Mensaje: "No se puede marcar como pagado un pago cancelado"     | 409 Conflict              |
| `payment_date` con formato inválido    | Mensaje: "Formato de fecha y hora inválido"                     | 400 Bad Request           |
| Operación exitosa                      | Devuelve el pago actualizado con `status: 'Paid'`               | 200 OK                    |
| Error de conexión a la base de datos   | Mensaje: "Error interno, reintente más tarde"                   | 500 Internal Server Error |

### Cancelación (`PATCH /api/v1/payments/:id/cancel`)
 
| Escenario                                       | Resultado Esperado                                       | Código HTTP               |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------- |
| Pago inexistente o dado de baja                 | Mensaje: "El pago no existe"                             | 404 Not Found             |
| Pago en estado `Paid`                           | Mensaje: "No se puede cancelar un pago ya cobrado"       | 409 Conflict              |
| Pago en estado `Pending`                        | Devuelve el pago actualizado con `status: 'Canceled'`    | 200 OK                    |
| Pago `Pending` con vencimiento pasado (Overdue) | Devuelve el pago actualizado con `status: 'Canceled'`    | 200 OK                    |
| Pago en estado `Canceled` (ya cancelado)        | Devuelve el pago sin cambios                             | 200 OK                    |
| Error de conexión a la base de datos            | Mensaje: "Error interno, reintente más tarde"            | 500 Internal Server Error |
 

## Plan de Implementación

1. Definir los tipos `UpdatePaymentRequest` y `MarkPaymentAsPaidRequest` en el paquete `@alentapp/shared`.
2. Ampliar el puerto `PaymentRepository` con el método `update` y su implementación en `PostgresPaymentRepository`.
3. Agregar el método `validatePaymentDate(paymentDate)` al `PaymentValidator` definido en TDD-0012.
4. Implementar los casos de uso `UpdatePaymentUseCase`, `MarkPaymentAsPaidUseCase` y `CancelPaymentUseCase`, delegando las validaciones de campos en `PaymentValidator` y manejando el chequeo del estado directamente en cada caso de uso.
5. Exponer las rutas `PATCH /api/v1/payments/:id`, `PATCH /api/v1/payments/:id/pay` y `PATCH /api/v1/payments/:id/cancel` en el `PaymentController` y registrarlas en la app de Fastify.
6. En el frontend, agregar las acciones para editar, marcar como pagado y cancelar en la tabla de pagos.

## Observaciones Adicionales

### Justificación de la separación en el contrato de API

Usar un único `PATCH /api/v1/payments/:id` con un campo `status` opcional permitiría que un usuario cambie el estado mediante el mismo verbo que edita otros campos. Eso aumenta el riesgo de transiciones accidentales. Endpoints orientados a acción (`/pay`, `/cancel`) hacen explícita la transición de estado.

### Por qué solo se permiten editar `amount` y `due_date`

La modificación está acotada a estos dos campos porque son los únicos que pueden cambiar sin alterar la identidad ni el ciclo de vida del pago. Cambiar cualquier otro atributo no es "modificar el pago", sino una operación distinta que merece su propio caso de uso. A continuación se detalla el motivo de exclusión de cada campo:

- **`member_id`**: identifica a quién se le cobra. Reasignar un pago a otro socio no es una corrección de datos, es transferir una obligación financiera de una persona a otra, lo que en términos contables equivale a anular el pago original y emitir uno nuevo al socio correcto. Si se permitiera editarlo, se podrían encubrir errores graves de carga sin dejar rastro.

- **`month` y `year`**: definen a qué período corresponde la cuota. Cambiarlos significaría que el pago dejó de cubrir el mes original y pasó a cubrir otro, alterando los reportes históricos de cobranza. Además, podrían colisionar con el índice único parcial sobre (`member_id`, `month`, `year`) si ya existe un pago activo para el período de destino. Si se necesita cambiar el período, lo correcto es cancelar el pago actual y emitir uno nuevo.

- **`status`**: cada transición de estado tiene reglas de negocio propias y debe quedar registrada como una acción explícita y auditable:
  - `Pending → Paid`: se realiza vía `PATCH /api/v1/payments/:id/pay` (definido en este mismo TDD), que requiere completar `payment_date`.
  - `Pending → Canceled`: se realiza vía `PATCH /api/v1/payments/:id/cancel` (definido en TDD-0014).
  - Cualquier otra transición (ej: `Paid → Pending`, `Canceled → Pending`) está prohibida por la regla de inmutabilidad financiera del enunciado.
  
  Permitir editar `status` desde un endpoint genérico abriría la puerta a saltearse estas reglas y a transiciones accidentales. 

- **`payment_date`**: solo tiene sentido cuando el pago está en estado `Paid`, y en ese caso se completa automáticamente al ejecutar la acción de marcar como pagado. Editarla por separado podría dejar el sistema en un estado inconsistente (por ejemplo, un pago `Pending` con `payment_date` completa, o un pago `Paid` con `payment_date` adelantada respecto a la realidad). Si se necesita corregir una fecha de pago mal cargada, la operación correcta es cancelar el pago e ingresarlo nuevamente con la fecha correcta.

- **`deleted_at`**: gestionado exclusivamente por la operación de baja lógica (TDD-0014). No se modifica vía esta API.

- Se considera que la fecha de pago se carga todos los meses cuando el socio paga su cuota. No se establece por adelantado cuándo se debe pagar la cuota. Para ver si hay cuotas vencidas o socios en estado moroso, el sistema mostrará automáticamente el estado Overdue en la tabla general de pagos para aquellas cuotas cuya fecha ya pasó.

