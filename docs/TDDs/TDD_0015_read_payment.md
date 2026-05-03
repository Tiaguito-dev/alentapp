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

Permitir al Tesorero consultar pagos del sistema con filtros relevantes para tareas de cobranza y auditoría: por socio, por período (mes/año), por estado (incluyendo el estado calculado `Overdue`). 
 
### User Persona

- Nombre: Lautaro (Tesorero).
- Necesidad: Identificar rápidamente los pagos vencidos para llamar a los socios morosos, ver el historial de pagos de un socio puntual, y armar un listado de pagos pendientes del mes para coordinar cobranzas.

### Criterios de Aceptación

- El sistema debe permitir filtrar por: `member_id`, `month`, `year`, y `status`.
- El campo estado que devuelve la consulta puede valer `Pending`, `Paid`, `Canceled` o `Overdue`. El estado `Overdue` no se persiste: se calcula a partir de la fecha de vencimiento (ver Observaciones Adicionales).
- Filtrar por `status = 'Pending'` debe excluir los pagos con vencimiento pasado (que ya cuentan como `Overdue`), traduciéndose a `status = 'Pending' AND due_date >= hoy`.
- El sistema debe permitir también recuperar un pago puntual.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. La consulta opera sobre los mismos campos persistidos.

### Contrato de API (@alentapp/shared)

#### 1 Listado 
- Endpoint: `GET /api/v1/payments`
- Query Params:
```ts
{
    member_id?: string;          // UUID
    month?: number;              // entero 1-12 (validado en runtime)
    year?: number;             // entero (validado en runtime)
    status?: 'Pending' | 'Paid' | 'Canceled' | 'Overdue';
}
```
- Response: 200 OK con la lista de pagos. Cada pago se devuelve con su `status` ya resuelto (los pagos `Pending` con `due_date < hoy` se devuelven como `Overdue`).
```ts
PaymentResponse[]
```

#### 2 Detalle por ID
- Endpoint: `GET /api/v1/payments/:id`
- Response: 200 OK con el pago, con su `status` ya resuelto (los pagos `Pending` con `due_date < hoy` se devuelven como `Overdue`).

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)` y `findMany(filters)`).
2. **Caso de Uso**: `ListPaymentsUseCase` (traduce el filtro virtual `status = 'Overdue'` a `status = 'Pending' AND due_date < hoy` y el filtro `status = 'Pending'` a `status = 'Pending' AND due_date >= hoy`; ejecuta la consulta y resuelve el `status` de cada pago antes de devolverlo).
3. **Caso de Uso**: `GetPaymentByIdUseCase` (recupera un pago por ID y resuelve su `status` antes de devolverlo).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (consulta usando el método `findMany` de Prisma).
5. **Adaptador de Entrada**: `PaymentController` (Rutas `GET /api/v1/payments` y `GET /api/v1/payments/:id` que validan los query params y devuelven status 200).

## Casos de Borde y Errores

| Escenario                                | Resultado Esperado                                              | Código HTTP     |
| ---------------------------------------- | --------------------------------------------------------------- | --------------- |
| Pago inexistente (consulta por ID)       | Mensaje: "El pago no existe"                                    | 404 Not Found   |
| `month` fuera de rango (no entre 1 y 12) | Mensaje: "El mes debe estar entre 1 y 12"                       | 400 Bad Request |
| `status` con valor no reconocido         | Mensaje: "Estado inválido"                                      | 400 Bad Request |
| Filtro `status = 'Overdue'`              | Devuelve solo pagos `Pending` con `due_date < hoy`              | 200 OK          |
| Filtro `status = 'Pending'`              | Devuelve solo pagos `Pending` con `due_date >= hoy`             | 200 OK          |
| Sin resultados                           | Devuelve un array vacío `[]`                                    | 200 OK          |
| Error de conexión a la base de datos     | Mensaje: "Error interno, reintente más tarde"                   | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos del query params y del response en el paquete `@alentapp/shared`.
2. Ampliar el puerto `PaymentRepository` con los métodos `findById` y `findMany`, junto con su implementación en `PostgresPaymentRepository`.
3. Implementar los casos de uso `ListPaymentsUseCase` y `GetPaymentByIdUseCase`, incluyendo la traducción del filtro `Overdue` a condiciones sobre la base de datos y la resolución del `status` antes de devolver cada pago.
4. Exponer las rutas `GET /api/v1/payments` y `GET /api/v1/payments/:id` en el `PaymentController` y registrarlas en la app de Fastify.
5. En el frontend, agregar la vista de listado con filtros (socio, mes/año, estado).

## Observaciones Adicionales

### El estado `Overdue` no se persiste
 
El estado `Overdue` no es un valor que la base de datos almacene. Se calcula al leer cuando un pago está persistido como `Pending` y su `due_date` ya pasó. 

### "`status` resuelto"
 
Cuando los endpoints de consulta devuelven un pago, el campo `status` ya viene **calculado** por el backend. 
 
Por ejemplo, un pago con `status = Pending` y `due_date = 2026-04-01` (ya pasada) se persiste como `Pending` en la base de datos, pero al consultarse aparece en el response como `status = Overdue`. La traducción la hace el caso de uso antes de devolver el pago.

### Diferencia entre los query params públicos y el objeto `filters` interno

- **Query params** (lo que el cliente manda en la URL): pueden incluir `status=Overdue`.
- **Objeto `filters`** (lo que el caso de uso le pasa al repositorio): nunca incluye `Overdue`. El caso de uso lo traduce a `(status='Pending', due_date<hoy)` antes de pasarlo.



