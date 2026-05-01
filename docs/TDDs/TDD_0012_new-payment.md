---
id: 0012
estado: Propuesto
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Alta de Pagos
---
# TDD-0012: Alta de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Tesorero registrar de forma digital la obligación de pago de un socio (ejemplo, cuota mensual del club), generando un registro auditable que servirá como base para el seguimiento de cobranzas.  
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Generar las cuotas del mes para los socios sin riesgo de cobrar dos veces el mismo período ni saltearse a un socio. Por ejemplo, si Lautaro carga las cuotas de mayo y un compañero ya las había cargado a la mitad, el sistema debe avisarle en lugar de duplicar pagos. 

### Criterios de Aceptación

- El sistema debe crear el pago siempre en estado `Pendiente` por defecto. Cualquier intento del cliente de fijar otro estado en el alta debe ser ignorado o rechazado.
- El sistema debe rechazar el alta si ya existe un pago **no cancelado** para la misma combinación (socio, mes, año). Esto permite re-emitir un pago cancelado pero impide duplicados activos.
- El sistema debe validar que el monto sea estrictamente mayor a cero.
- El sistema debe validar que el mes esté entre 1 y 12, y que el año esté en un rango razonable (entre el año actual menos 1 y el año actual más 1).
- El sistema debe validar que el socio referenciado exista.
- El campo `fechaPago` debe quedar nulo en el alta; solo se completa al marcar el pago como pagado.


## Diseño Técnico (RFC)
 
### Modelo de Datos

Se definirá la entidad `Payment` con las siguientes propiedades y restricciones:

- `id`: identificador único universal (UUID).
- `monto`: número de punto flotante, mayor a cero. 
- `mes`: entero entre 1 y 12.
- `anio`: entero. 
- `estado`: enumeración (`Pendiente`, `Pagado`, `Cancelado`). El estado `Vencido` se agrega pero no se persiste: se calcula al leer cuando `estado = Pendiente` y `fechaVencimiento < hoy`. 
- `fechaVencimiento`: fecha (sin hora).
- `fechaPago`: fecha y hora, nullable. Nulo en el alta.
- `socioId`: UUID, FK a `Member`.
 
### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización entre frontend y backend.

- Endpoint: `POST /api/v1/pagos`
- Request Body (CreatePaymentRequest):

```ts
{
    socioId: string;          // UUID del socio
    monto: number;            // > 0 (mapea a float en BD según ER)
    mes: number;    // entero 1-12 (validado en runtime)
    anio: number;   // entero, año razonable (validado en runtime)
    fechaVencimiento: string; // ISO Date YYYY-MM-DD
}
```
- Response (PaymentResponse, 201 Created):
```ts
{
    id: string;
    socioId: string;
    monto: number;
    mes: number;
    anio: number;
    estado: 'Pendiente';      // siempre Pendiente al crear
    fechaVencimiento: string; // ISO Date
    fechaPago: null;
}
```
 
### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository`(métodos `create(payment)` y `existsActiveForPeriod(socioId, mes, anio)`). También se reutiliza `MemberRepository` (método `findById`) para validar la existencia del socio.
2. **Caso de Uso**: `CreatePaymentUseCase` (verifica existencia del socio, verifica que no haya un pago activo para el mismo período, construye la entidad `Payment` con estado `Pendiente`).
3. **Adaptador de Salida**: `PostgresPaymentRepository` (creación usando el método `create` de Prisma; la unicidad de pagos activos por (socio, mes, año) se garantiza con un índice único parcial en la base de datos).
4. **Adaptador de Entrada**: `PaymentController` (Ruta `POST /api/v1/pagos` que valida el payload y devuelve el pago creado con status 201).

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
| Cliente envía un `estado` distinto de `Pendiente`      | Se ignora ; se persiste con `estado = Pendiente`                                | 201 Created               |
| Error de conexión a la base de datos                   | Mensaje: "Error interno, reintente más tarde"                                   | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `CreatePaymentRequest` y el tipo `Payment` en el paquete `@alentapp/shared`.
2. Agregar el modelo `Payment` al schema de Prisma con su índice único parcial y ejecutar la migración.
3. Crear el puerto `PaymentRepository` y la entidad `Payment` en el dominio (el estado al crear debe ser siempre `Pendiente`).
4. Implementar el `PostgresPaymentRepository` y el caso de uso `CreatePaymentUseCase`.
5. Exponer la ruta `POST /api/v1/pagos` en el `PaymentController` y registrarla en la app de Fastify.
6. Crear el formulario de alta en el frontend y conectarlo al endpoint.

## Observaciones Adicionales

### Riesgo conocido: precisión del tipo `float` en montos
Se decidió respetar el tipo `float` del ER del enunciado para `monto`. Este tipo
puede introducir errores de redondeo en operaciones aritméticas (ej: sumas de
saldos, agregaciones por socio o por mes), inherentes a la representación binaria
de los números de punto flotante.

La mitigación es migrar el tipo de `monto` a `Decimal(10, 2)` mediante una
migración de Prisma. La migración es sencilla porque:
- El tipo del DTO de la API (`number`) no cambia.
- Solo cambia el tipo en el schema de Prisma (`Float` → `Decimal`) y la
  representación en memoria del backend.
- El frontend no se ve afectado.

