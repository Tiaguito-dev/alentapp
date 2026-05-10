---
id: 0011
estado: Aprobado
autor: Federico Alvarez Pieroni
fecha: 2026-05-01
titulo: Consulta de Certificados Médicos
---

# TDD-0011: Consulta de Certificados Médicos

## Contexto de Negocio (PRD)

### Objetivo

Permitir al administrativo consultar los certificados médicos del sistema con filtros relevantes para control y auditoría: por socio, por estado (activo o invalidado) y por fecha de vencimiento.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Identificar rápidamente qué socios tienen certificados médicos próximos a vencer para solicitarles la renovación, ver el historial completo de certificados de un socio puntual, y listar los certificados activos actuales para auditoría general.

### Criterios de Aceptación

- El sistema debe permitir filtrar por: `member_id`, `is_validated` y `expiry_date`.
- El sistema debe permitir recuperar un certificado puntual por su `id`.
- Cada certificado devuelto debe incluir todos sus campos: `id`, `member_id`, `issue_date`, `expiry_date`, `doctor_license`, `is_validated` y `created_at`.
- Si no se aplica ningún filtro, se devuelven todos los certificados.
- Todas las consultas deben excluir certificados dados de baja (`deleted_at IS NOT NULL`). Un certificado dado de baja se trata como inexistente desde la API.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. La consulta opera sobre los mismos campos persistidos:

- `id`, `issue_date`, `expiry_date`, `doctor_license`, `is_validated`, `member_id`, `created_at`, `deleted_at`.

### Contrato de API (@alentapp/shared)

#### 1. Listado

- Endpoint: `GET /api/v1/medical-certificates`
- Query Params:

```ts
{
  member_id?:    string;  // UUID del socio
  is_validated?: boolean; // true = activos, false = invalidados
  expiry_date?:  string;  // ISO Date YYYY-MM-DD
}
```

- Response: `200 OK` con la lista de certificados, ordenada por `created_at DESC`.

```ts
MedicalCertificateResponse[]
```

Donde cada `MedicalCertificateResponse` es:

```ts
{
  id:             string;
  member_id:      string;
  issue_date:     string; // ISO Date YYYY-MM-DD
  expiry_date:    string; // ISO Date YYYY-MM-DD
  doctor_license: string;
  is_validated:   boolean;
  created_at:     string; // ISO DateTime
}
```

#### 2. Detalle por ID

- Endpoint: `GET /api/v1/medical-certificates/:id`
- Response: `200 OK` con el `MedicalCertificateResponse` del certificado.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `findById(id)` y `findMany(filters)`. Ambos aplican implícitamente el filtro `deleted_at IS NULL`).
2. **Servicio de Dominio**: `MedicalCertificateFilterValidator` (valida los filtros de entrada: `validateMemberId(memberId)` verifica formato UUID; `validateIsValidated(isValidated)` verifica que sea booleano; `validateExpiryDate(expiryDate)` verifica que el formato sea ISO `YYYY-MM-DD`).
3. **Caso de Uso**: `ListMedicalCertificatesUseCase` (delega las validaciones de filtros en `MedicalCertificateFilterValidator`, recupera los certificados vía `findMany(filters)`, ordena por `created_at DESC` y devuelve los resultados).
4. **Caso de Uso**: `GetMedicalCertificateByIdUseCase` (recupera un certificado por ID vía `findById`; si no existe o está dado de baja lanza error 404).
5. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (consulta usando el método `findMany` de Prisma con los filtros correspondientes; ordena por `created_at DESC` y filtra `deleted_at IS NULL` en todas las consultas).
6. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` que validan los query params/path params y devuelven status 200).

## Casos de Borde y Errores

| Escenario                                        | Resultado Esperado                                                    | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente (consulta por ID)        | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| Certificado dado de baja (consulta por ID)       | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| `member_id` con formato UUID inválido            | Mensaje: "Formato de ID inválido"                                     | 400 Bad Request           |
| `is_validated` con valor inválido (no booleano)  | Mensaje: "El campo is_validated debe ser booleano (true/false)"       | 400 Bad Request           |
| `expiry_date` con formato inválido               | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"            | 400 Bad Request           |
| Certificados dados de baja (en listados)         | No se incluyen en el resultado                                          | 200 OK                    |
| Sin resultados                                   | Devuelve un array vacío `[]`                                          | 200 OK                    |
| Operación exitosa                                | Devuelve la lista de certificados ordenada por `created_at` descendente | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos de query params y del response en el paquete `@alentapp/shared`.
2. Crear el `MedicalCertificateFilterValidator` en la capa de Dominio con los métodos de validación de filtros.
3. Ampliar el puerto `MedicalCertificateRepository` con el método `findMany(filters)`, junto con su implementación en `PostgresMedicalCertificateRepository` (el método `findById` ya existe desde TDD-0009 y no requiere reimplementación).
4. Asegurar que `findById` y `findMany` apliquen el filtro `deleted_at IS NULL` por defecto.
5. Implementar los casos de uso `ListMedicalCertificatesUseCase` y `GetMedicalCertificateByIdUseCase`, delegando las validaciones de filtros en `MedicalCertificateFilterValidator`.
6. Exponer las rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
7. En el frontend, agregar la vista de listado con tabla y filtros (socio, estado, fecha de vencimiento).

## Observaciones Adicionales

### Filtros opcionales

Todos los filtros son opcionales. Si no se envía ninguno, se devuelven todos los certificados. Los filtros se aplican con lógica AND: si se envían varios, un certificado debe cumplir con todos para aparecer en los resultados.

### Ordenamiento

Los resultados siempre se ordenan por `created_at` descendente (más reciente primero). Esto permite auditar cuándo se cargaron los certificados en el sistema, no solo cuándo fueron emitidos (`issue_date`).

### Filtro por fecha de vencimiento

El filtro `expiry_date` sirve para buscar certificados que vencen en una fecha puntual exacta. Si en el futuro fuera necesario consultar vencimientos dentro de un período (ejemplo: vencimientos entre dos fechas), eso se podría agregar como una ampliación aparte con nuevos parámetros (`expiry_date_from`, `expiry_date_to`).

### Validación de filtros

Cada filtro se valida independientemente. Si alguno tiene un formato inválido, el servidor rechaza la consulta con un 400 Bad Request sin procesar ningún filtro. Esto evita consultas parciales o ambíguas.

### Exclusión de bajas lógicas

Los certificados con `deleted_at` no nulo quedan fuera de cualquier consulta de la API.
Eso incluye tanto listados como detalle por ID. Desde la perspectiva del cliente, un
certificado dado de baja se comporta como inexistente.



