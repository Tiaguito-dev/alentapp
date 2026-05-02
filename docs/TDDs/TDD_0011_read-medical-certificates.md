---
id: 0011
estado: Propuesto
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
- El listado debe estar paginado para evitar traer todos los registros en clubes con historial extenso.
- Si no se aplica ningún filtro, se devuelven todos los certificados paginados.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. La consulta opera sobre los mismos campos persistidos:

- `id`, `issue_date`, `expiry_date`, `doctor_license`, `is_validated`, `member_id`, `created_at`.

### Contrato de API (@alentapp/shared)

#### 1. Listado

- Endpoint: `GET /api/v1/medical-certificates`
- Query Params:

```ts
{
  member_id?:       string;  // UUID del socio
  is_validated?:    boolean; // true = activos, false = invalidados
  expiry_date?:     string;  // ISO Date YYYY-MM-DD
  page?:           number;  // default 1
  limit?:          number;  // default 20, máx 100
}
```

- Response: `200 OK` con la lista paginada de certificados, ordenada por `created_at DESC`.

```ts
{
  data: MedicalCertificateResponse[];
  total: number;
  page: number;
  limit: number;
}
```

Donde cada `MedicalCertificateResponse` es:

```ts
{
  id:            string;
  member_id:     string;
  issue_date:    string; // ISO Date YYYY-MM-DD
  expiry_date:   string; // ISO Date YYYY-MM-DD
  doctor_license:string;
  is_validated:  boolean;
  created_at:    string; // ISO DateTime
}
```

#### 2. Detalle por ID

- Endpoint: `GET /api/v1/medical-certificates/:id`
- Response: `200 OK` con el `MedicalCertificateResponse` del certificado.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (se amplía con los métodos `findMany(filters, page, limit)` y `countMatching(filters)`; el método `findById(id)` ya existe desde TDD-0009 y se reutiliza).
2. **Caso de Uso**: `ListMedicalCertificatesUseCase` (valida los filtros de entrada, ejecuta la consulta paginada y devuelve los resultados).
3. **Caso de Uso**: `GetMedicalCertificateByIdUseCase` (recupera un certificado por ID; lanza error si no existe).
4. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (consulta usando los métodos `findMany` y `count` de Prisma con los filtros correspondientes).
5. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` que validan los query params y devuelven status 200).

## Casos de Borde y Errores

| Escenario                                        | Resultado Esperado                                                    | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente (consulta por ID)        | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| `limit` mayor al máximo permitido (100)          | Se acota a 100                                                        | 200 OK                    |
| `page` ≤ 0                                       | Mensaje: "El parámetro page debe ser mayor a cero"                    | 400 Bad Request           |
| `expiry_date` con formato inválido               | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"            | 400 Bad Request           |
| `member_id` con formato UUID inválido            | Mensaje: "Formato de ID inválido"                                     | 400 Bad Request           |
| Sin resultados                                   | Devuelve lista vacía con `total: 0`                                   | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos de query params y del response paginado en el paquete `@alentapp/shared`.
2. Ampliar el puerto `MedicalCertificateRepository` con los métodos `findMany` y `countMatching`, junto con su implementación en `PostgresMedicalCertificateRepository` (`findById` ya existe desde TDD-0009 y no requiere reimplementación).
3. Implementar los casos de uso `ListMedicalCertificatesUseCase` y `GetMedicalCertificateByIdUseCase`.
4. Exponer las rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
5. En el frontend, agregar la vista de listado con filtros (socio, estado, fecha de vencimiento) y paginación.

## Observaciones Adicionales

**Paginación**: el endpoint pagina los resultados con defaults `page=1` y `limit=20`. El cliente puede ajustar `limit` hasta 100 para casos donde necesite traer más registros (ej: exportar el historial completo de certificados de un socio).

**Filtro por fecha de vencimiento**: el filtro `expiry_date` sirve para buscar certificados que vencen en una fecha puntual. Si más adelante hiciera falta consultar vencimientos dentro de un período, eso se podría agregar como una ampliación aparte.



