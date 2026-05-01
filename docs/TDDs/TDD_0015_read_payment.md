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
- El campo estado que devuelve la consulta puede valer Pendiente, Pagado, Cancelado o Vencido. El estado Vencido no se persiste: se calcula a partir de la fecha de vencimiento (ver Observaciones Adicionales).
- Filtrar por `estado = 'Pendiente'` debe excluir los pagos con vencimiento pasado (que ya cuentan como Vencido), traduciéndose a `estado = 'Pendiente' AND fechaVencimiento >= hoy`.
- El sistema debe permitir también recuperar un pago puntual.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0012. La consulta opera sobre los mismos campos persistidos.

### Contrato de API (@alentapp/shared)

#### 1 Listado 
- Endpoint: `GET /api/v1/pagos`
- Query Params:
```ts
{
    socioId?: string;          // UUID
    mes?: number;              // entero 1-12 (validado en runtime)
    anio?: number;             // entero (validado en runtime)
    estado?: 'Pendiente' | 'Pagado' | 'Cancelado' | 'Vencido';
    page?: number;             // default 1
    limit?: number;            // default 20, máx 100
}
```
- Response: 200 OK con la lista paginada de pagos. Cada pago se devuelve con su `estado` ya resuelto (los pagos `Pendiente` con `fechaVencimiento < hoy` se devuelven como `Vencido`).

#### 2 Detalle por ID
- Endpoint: `GET /api/v1/pagos/:id`
- Response: 200 OK con el pago, con su `estado` ya resuelto.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `PaymentRepository` (métodos `findById(id)`, `findMany(filters, page, limit)` y `countMatching(filters)`, donde `filters` solo acepta condiciones sobre el `estado` persistido y la `fechaVencimiento`).
2. **Caso de Uso**: `ListPaymentsUseCase` (traduce el filtro virtual `estado = 'Vencido'` a `estado = 'Pendiente' AND fechaVencimiento < hoy` y el filtro `estado = 'Pendiente'` a `estado = 'Pendiente' AND fechaVencimiento >= hoy`; ejecuta la consulta paginada y resuelve el `estado` de cada pago antes de devolverlo).
3. **Caso de Uso**: `GetPaymentByIdUseCase` (recupera un pago por ID y resuelve su `estado` antes de devolverlo).
4. **Adaptador de Salida**: `PostgresPaymentRepository` (consulta usando los métodos `findMany` y `count` de Prisma).
5. **Adaptador de Entrada**: `PaymentController` (Rutas `GET /api/v1/pagos` y `GET /api/v1/pagos/:id` que validan los query params y devuelven status 200).

## Casos de Borde y Errores

| Escenario                                | Resultado Esperado                                              | Código HTTP     |
| ---------------------------------------- | --------------------------------------------------------------- | --------------- |
| Pago inexistente (consulta por ID)       | Mensaje: "El pago no existe"                                    | 404 Not Found   |
| `limit` mayor al máximo permitido (100)  | Se ignora y se acota a 100                                      | 200 OK          |
| `page` ≤ 0                               | Mensaje: "El parámetro page debe ser mayor a cero"              | 400 Bad Request |
| `mes` fuera de rango (no entre 1 y 12)   | Mensaje: "El mes debe estar entre 1 y 12"                       | 400 Bad Request |
| `estado` con valor no reconocido         | Mensaje: "Estado inválido"                                      | 400 Bad Request |
| Filtro `estado = 'Vencido'`              | Devuelve solo pagos `Pendiente` con `fechaVencimiento < hoy`    | 200 OK          |
| Filtro `estado = 'Pendiente'`            | Devuelve solo pagos `Pendiente` con `fechaVencimiento >= hoy`   | 200 OK          |
| Sin resultados                           | Devuelve la lista vacía con `total: 0`                          | 200 OK          |
| Error de conexión a la base de datos     | Mensaje: "Error interno, reintente más tarde"                   | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos del query params y del response paginado en el paquete `@alentapp/shared`.
2. Ampliar el puerto `PaymentRepository` con los métodos `findById`, `findMany` y `countMatching`, junto con su implementación en `PostgresPaymentRepository`.
3. Implementar los casos de uso `ListPaymentsUseCase` y `GetPaymentByIdUseCase`, incluyendo la traducción del filtro `Vencido` a condiciones sobre la base de datos y la resolución del `estado` antes de devolver cada pago.
4. Exponer las rutas `GET /api/v1/pagos` y `GET /api/v1/pagos/:id` en el `PaymentController` y registrarlas en la app de Fastify.
5. En el frontend, agregar la vista de listado con filtros (socio, mes/año, estado) y paginación.

## Observaciones Adicionales

**El estado vencido no se persiste**: El estado 'Vencido' debe traducirse internamente a la condición `estado = 'Pendiente' AND fechaVencimiento < hoy`.

**Paginación**: el endpoint pagina los resultados con defaults `page=1` y `limit=20`. Esto evita que la API devuelva miles de registros en clubes con muchos años de historia, manteniendo tiempos de respuesta consistentes. El cliente puede ajustar `limit` hasta 100 para casos donde necesite traer más resultados (ej: exportar pagos de un socio puntual).

**Precisión temporal**: el cálculo de `Vencido` usa `hoy` con precisión de día, no de hora. Es decir, un pago con `fechaVencimiento = 2026-05-01` se considera vencido a partir del 2026-05-02, no a las 00:01 del mismo día. Esta convención evita ambigüedades de zona horaria y es la práctica habitual en cobranzas.