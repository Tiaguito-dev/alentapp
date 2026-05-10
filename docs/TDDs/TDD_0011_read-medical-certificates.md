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

Permitir al administrativo consultar los certificados médicos del sistema para facilitar tareas de seguimiento y auditoría.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Visualizar rápidamente el historial completo de certificados para verificar el estado de cobertura médica de los socios y auditar registros.

### Criterios de Aceptación

- El sistema debe permitir recuperar el listado de todos los certificados activos.
- El sistema debe permitir recuperar un certificado puntual por su `id`.
- Cada certificado devuelto debe incluir todos sus campos: `id`, `member_id`, `issue_date`, `expiry_date`, `doctor_license`, `is_validated` y `created_at`.
- Todas las consultas deben excluir certificados dados de baja (`deleted_at IS NOT NULL`). Un certificado dado de baja se trata como inexistente desde la API.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. La consulta opera sobre los mismos campos persistidos.

### Contrato de API (@alentapp/shared)

#### 1. Listado

- Endpoint: `GET /api/v1/medical-certificates`
- Request: Sin parámetros.
- Response: `200 OK` con la lista de todos los certificados activos, ordenada por `created_at DESC`.

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

1. **Puerto**: `MedicalCertificateRepository` (métodos `findById(id)` y `findAll()`. Ambos aplican implícitamente el filtro `deleted_at IS NULL`).
2. **Caso de Uso**: `ListMedicalCertificatesUseCase` (recupera todos los certificados vía `findAll()`, ordena por `created_at DESC` y devuelve los resultados).
3. **Caso de Uso**: `GetMedicalCertificateByIdUseCase` (recupera un certificado por ID vía `findById`; si no existe o está dado de baja lanza error 404).
4. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (consulta usando el método `findAll` de Prisma; ordena por `created_at DESC` y filtra `deleted_at IS NULL` en todas las consultas).
5. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` que devuelven status 200).

## Casos de Borde y Errores

| Escenario                                        | Resultado Esperado                                                    | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente (consulta por ID)        | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| Certificado dado de baja (consulta por ID)       | Mensaje: "El certificado no existe"                                   | 404 Not Found             |
| Certificados dados de baja (en listados)         | No se incluyen en el resultado                                          | 200 OK                    |
| Operación exitosa (listado)                      | Devuelve la lista completa de certificados ordenada por `created_at` DESC | 200 OK                    |
| Sin certificados activos                         | Devuelve un array vacío `[]`                                          | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                         | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos de request y response en el paquete `@alentapp/shared`.
2. Ampliar el puerto `MedicalCertificateRepository` con el método `findAll()`, junto con su implementación en `PostgresMedicalCertificateRepository` (el método `findById` ya existe desde TDD-0009 y no requiere reimplementación).
3. Asegurar que `findById` y `findAll` apliquen el filtro `deleted_at IS NULL` por defecto.
4. Implementar los casos de uso `ListMedicalCertificatesUseCase` y `GetMedicalCertificateByIdUseCase`.
5. Exponer las rutas `GET /api/v1/medical-certificates` y `GET /api/v1/medical-certificates/:id` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
6. En el frontend, agregar la vista de listado con tabla mostrando todos los certificados.

## Observaciones Adicionales

### Ordenamiento

Los resultados siempre se ordenan por `created_at` descendente (más reciente primero). Esto permite auditar cuándo se cargaron los certificados en el sistema, no solo cuándo fueron emitidos (`issue_date`).

### Exclusión de bajas lógicas

Los certificados con `deleted_at` no nulo quedan fuera de cualquier consulta de la API.
Eso incluye tanto listados como detalle por ID. Desde la perspectiva del cliente, un
certificado dado de baja se comporta como inexistente.



