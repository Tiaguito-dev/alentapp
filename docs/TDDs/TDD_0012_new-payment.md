---
id: 0012
estado: Implementado
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Registro de Nuevos Pagos
---
# TDD-0012: Registro de Nuevos Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Administrativo registrar de forma digital la obligación de pago de un socio (ejemplo, cuota mensual del club), generando un registro auditable que servirá como base para el seguimiento de cobranzas.  
 
### User Persona

- Nombre: Lautaro (Administrativo).
- Necesidad: Generar las cuotas del mes para los socios sin riesgo de cobrar dos veces el mismo período ni saltearse a un socio. Por ejemplo, si Lautaro carga las cuotas de mayo y un compañero ya las había cargado a la mitad, el sistema debe avisarle en lugar de duplicar pagos. 

### Criterios de Aceptación

- El sistema debe crear el pago siempre en estado `Pending` por defecto. Cualquier intento del cliente de fijar otro estado en el alta debe ser ignorado y reemplazado por `Pending`.
- El sistema debe rechazar el alta si ya existe un pago activo (no cancelado y no dado de baja) para la misma combinación (socio, mes, año). Esto permite re-emitir un pago previamente cancelado o dado de baja, pero impide duplicados activos.
- El sistema debe validar que el monto sea estrictamente mayor a cero.
- El sistema debe validar que el mes esté entre 1 y 12, y que el año esté en un rango razonable (ejemplo, entre el año actual menos 1 y el año actual más 1).
- El sistema debe validar que el socio referenciado exista.
- El campo `payment_date` debe quedar nulo en el alta; solo se completa al marcar el pago como pagado.
- El campo `deleted_at` debe quedar nulo en el alta; solo se completa cuando se da de baja el pago (ver TDD-0014).


## Diseño Técnico (RFC)
 
### Modelo de Datos

Se definirá el modelo `Payment` con las siguientes propiedades y restricciones:

- `id`: identificador único universal (UUID).
- `amount`: número de punto flotante, mayor a cero. 
- `month`: entero entre 1 y 12.
- `year`: entero. 
- `status`: enumeración (`Pending`, `Paid`, `Canceled`). 
- `due_date`: fecha (sin hora).
- `payment_date`: fecha y hora, nullable. 
- `deleted_at`: fecha y hora, nullable. 
- `member_id`: UUID, FK a `Member`.
 
### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización entre frontend y backend.

- Endpoint: `POST /api/v1/payments`
- Request Body (CreatePaymentRequest):

```ts
{
    member_id: string;          // UUID del socio
    amount: number;            // > 0 (mapea a float en BD según ER)
    month: number;    // entero 1-12 (validado en runtime)
    year: number;   // entero, año razonable (validado en runtime)
    due_date: string; // ISO Date YYYY-MM-DD
}
```
- Response (PaymentResponse, 201 Created):
```ts
{
    id: string;
    member_id: string;
    amount: number;
    month: number;
    year: number;
    status: 'Pending';      // siempre Pendiente al crear
    due_date: string; // ISO Date
    payment_date: null;
}
```
 
### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository`(métodos `create(payment)` y `existsActiveForPeriod(member_id, month, year)`). También se reutiliza `MemberRepository` (método `findById`) para validar la existencia del socio.
2. **Servicio de Dominio**: `PaymentValidator` (centraliza las validaciones de campos: `validateAmount(amount)` verifica que sea mayor a cero; `validatePeriod(month, year)` verifica que el mes esté entre 1 y 12 y el año en rango razonable; `validateDueDate(due_date)` verifica que la fecha tenga formato ISO válido `YYYY-MM-DD`).
3. **Caso de Uso**: `CreatePaymentUseCase` (delega las validaciones de campos en `PaymentValidator`; verifica existencia del socio vía `MemberRepository`; verifica que no haya un pago activo para el mismo período vía `existsActiveForPeriod`; construye el objeto `Payment` con `status = Pending`, `payment_date = null` y `deleted_at = null`; delega la persistencia al repositorio).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (creación usando el método `create` de Prisma; implementa `existsActiveForPeriod` con una consulta filtrada por `status != 'Canceled' AND deleted_at IS NULL`).
5. **Adaptador de Entrada**: `PaymentController` (Ruta `POST /api/v1/payments` que valida el payload y devuelve el pago creado con status 201).

## Casos de Borde y Errores
 
| Escenario                                              | Resultado Esperado                                                              | Código HTTP               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------- |
| Falta un campo requerido                               | Mensaje: "El campo {campo} es obligatorio"                                      | 400 Bad Request           |
| Monto ≤ 0                                              | Mensaje: "El monto debe ser mayor a cero"                                       | 400 Bad Request           |
| Mes fuera de rango (no entre 1 y 12)                   | Mensaje: "El mes debe estar entre 1 y 12"                                       | 400 Bad Request           |
| Año fuera de rango razonable                           | Mensaje: "El año debe estar entre {min} y {max}"                                | 400 Bad Request           |
| Fecha de vencimiento inválida o en formato incorrecto  | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                      | 400 Bad Request           |
| Socio inexistente                                      | Mensaje: "El socio especificado no existe"                                      | 404 Not Found             |
| Pago activo duplicado para (socio, mes, año)           | Mensaje: "Ya existe un pago activo para este socio en {mes}/{año}"              | 409 Conflict              |
| Cliente envía un estado distinto de `Pending`          | Se ignora ; se persiste con `status = Pending`                                  | 201 Created               |
| Error de conexión a la base de datos                   | Mensaje: "Error interno, reintente más tarde"                                   | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `CreatePaymentRequest` y el tipo `PaymentResponse` en el paquete `@alentapp/shared`.
2. Agregar el modelo `Payment` al schema de Prisma (incluyendo el campo `deleted_at`) y ejecutar la migración.
3. Crear el puerto `PaymentRepository` en el dominio.
4. Implementar el `PaymentValidator` con los métodos `validateAmount`, `validatePeriod` y `validateDueDate`.
5. Implementar el `PostgresPaymentRepository` y el caso de uso `CreatePaymentUseCase` , delegando las validaciones de campos en `PaymentValidator`.
6. Exponer la ruta `POST /api/v1/payments` en el `PaymentController` y registrarla en la app de Fastify.
7. Crear el formulario de alta en el frontend y conectarlo al endpoint.

## Observaciones Adicionales

### Cómo se evita la duplicación de pagos

**No pueden existir dos pagos activos para el mismo (socio, mes, año)**, pero **sí debe permitirse re-emitir un pago si el anterior fue cancelado o dado de baja**. Por ejemplo: si se cargó la cuota de mayo de un socio por error, se cancela (o se da de baja) y se vuelve a cargar correctamente. 

La validación se hace a nivel aplicación, en el `CreatePaymentUseCase`, usando el método `existsActiveForPeriod(member_id, month, year)` del repositorio. Internamente ese método consulta los pagos con `status != 'Canceled' AND deleted_at IS NULL` para esa combinación; si encuentra alguno, el use case rechaza el alta con un 409 Conflict.

### Otras observaciones

- Se considera que el socio paga una membresía anual, y se le cargan en el sistema las 12 cuotas del año. El socio paga un monto en base a los deportes que practica. Entonces, si hace 3 deportes, el monto de cada cuota aumenta con respecto a si practicara 1 o 2 deportes. Esto puede cambiar según las reglas de negocio. 

- El rango considerado **razonable** para el año puede cambiar. 

- Se puede considerar no permitir al usuario que cargue el estado desde el frontend, ya que por defecto `status` = `Pending`. 

- Cuando el campo `deleted_at` es no nulo, el pago se considera dado de baja y queda excluido de todas las consultas (ver TDD-0014).

- El campo `deleted_at` es un detalle interno del modelo de datos y no se expone en el contrato de la API. Los pagos dados de baja simplemente no aparecen en las consultas (ver TDD-0015).
