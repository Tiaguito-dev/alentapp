---
id: 0015
estado: Aprobado
autor: Felipe Pianelli
fecha: 2026-05-01
titulo: Consulta de Pagos
---
# TDD-0015: Consulta de Pagos

## Contexto de Negocio (PRD)
 
### Objetivo

Permitir al Administrativo consultar un listado general de todos los pagos registrados en el sistema, así como acceder al detalle de un pago puntual, para facilitar tareas de seguimiento y auditoría.
 
### User Persona

- Nombre: Lautaro (Administrativo).
- Necesidad: Visualizar rápidamente el historial completo de pagos del club para verificar qué socios están al día y quiénes tienen cuotas vencidas.

### Criterios de Aceptación

- El sistema debe devolver una lista con todos los pagos activos.
- El campo estado que devuelve la consulta puede valer `Pending`, `Paid`, `Canceled` o `Overdue`. El estado `Overdue` no se persiste: se calcula a partir de la fecha de vencimiento (ver Observaciones Adicionales).
- El sistema debe permitir recuperar un pago puntual.
- Todas las consultas deben excluir los pagos dados de baja (`deleted_at IS NOT NULL`). Un pago dado de baja se trata como inexistente desde la API: la consulta por ID devuelve `404 Not Found` y los listados nunca lo incluyen.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. La consulta opera sobre los mismos campos persistidos.

### Contrato de API (@alentapp/shared)

#### 1 Listado General
- Endpoint: `GET /api/v1/payments`
- Request: Sin parámetros.
- Response: 200 OK con la lista completa de pagos. Cada pago se devuelve con su `status` ya resuelto (los pagos `Pending` con `due_date < hoy` se devuelven como `Overdue`).
```ts
PaymentResponse[]
```

#### 2 Detalle por ID
- Endpoint: `GET /api/v1/payments/:id`
- Response: 200 OK con el pago, con su `status` ya resuelto.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)` y `findAll()`; ambos aplican implícitamente el filtro `deleted_at IS NULL` para excluir pagos dados de baja).
2. **Caso de Uso**: `ListPaymentsUseCase` (recupera todos los pagos y resuelve el `status` de cada uno antes de devolverlo, transformando los `Pending` vencidos a `Overdue`).
3. **Caso de Uso**: `GetPaymentByIdUseCase` (recupera un pago por ID y resuelve su `status` antes de devolverlo).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (consulta usando el método `findMany` de Prisma; todas las consultas incluyen siempre la condición `deleted_at IS NULL`).
5. **Adaptador de Entrada**: `PaymentController` (Rutas `GET /api/v1/payments` y `GET /api/v1/payments/:id` que validan los query params y devuelven status 200).

## Casos de Borde y Errores

| Escenario                                | Resultado Esperado                                              | Código HTTP     |
| ---------------------------------------- | --------------------------------------------------------------- | --------------- |
| Pago inexistente (consulta por ID)       | Mensaje: "El pago no existe"                                    | 404 Not Found   |
| Pago dado de baja (consulta por ID)      | Mensaje: "El pago no existe"                                    | 404 Not Found   |
| Pagos dados de baja (en cualquier listado) | No se incluyen en el resultado                                  | 200 OK                    |
| Sin resultados                           | Devuelve un array vacío `[]`                                    | 200 OK          |
| Error de conexión a la base de datos     | Mensaje: "Error interno, reintente más tarde"                   | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos del response en el paquete `@alentapp/shared`.
2. Ampliar el puerto `PaymentRepository` con los métodos `findById` y `findAll`, junto con su implementación en `PostgresPaymentRepository`. Asegurar que ambos métodos apliquen el filtro `deleted_at IS NULL` por defecto.
3. Implementar los casos de uso `ListPaymentsUseCase` y `GetPaymentByIdUseCase`, incluyendo la resolución del `status` antes de devolver cada pago.
4. Exponer las rutas `GET /api/v1/payments` y `GET /api/v1/payments/:id` en el `PaymentController` y registrarlas en la app de Fastify.
5. En el frontend, agregar la tabla para visualizar los pagos.

## Observaciones Adicionales

### El estado `Overdue` no se persiste
 
El estado `Overdue` no es un valor que la base de datos almacene. Se calcula al leer cuando un pago está persistido como `Pending` y su `due_date` ya pasó. 

### "`status` resuelto"
 
Cuando los endpoints de consulta devuelven un pago, el campo `status` ya viene **calculado** por el backend. 
 
Por ejemplo, un pago con `status = Pending` y `due_date = 2026-04-01` (ya pasada) se persiste como `Pending` en la base de datos, pero al consultarse aparece en el response como `status = Overdue`. La traducción la hace el caso de uso antes de devolver el pago.




