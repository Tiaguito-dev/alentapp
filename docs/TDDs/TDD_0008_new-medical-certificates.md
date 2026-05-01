---
id: 0008
estado: Propuesto
autor: Federico Alvarez Pieroni
fecha: 2026-05-01
titulo: Alta de Certificados Médicos
---

# TDD-0008: Alta de Certificados Médicos

## Contexto de Negocio (PRD)

### Objetivo

Permitir al administrativo registrar certificados médicos de socios, asegurando
que cada socio tenga un único certificado activo e invalidando automáticamente
los registros anteriores al crear uno nuevo.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Registrar certificados médicos de forma rápida y segura,
  garantizando que nunca queden dos certificados vigentes para el mismo socio.
  Por ejemplo, cuando un socio renueva su apto médico anual, el certificado
  anterior debe quedar invalidado automáticamente.

### Criterios de Aceptación

- El sistema debe crear el certificado con `is_invalidated = false` por defecto.
- El sistema debe garantizar que solo exista un certificado activo (`is_invalidated = false`) por socio.
- Si ya existe un certificado activo para el socio, el sistema debe marcarlo como
  invalidado (`is_invalidated = true`) antes de crear el nuevo.
- El sistema debe validar que `expiry_date` sea estrictamente posterior a `issue_date`.
- El sistema debe validar que el socio referenciado exista.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se utilizará la entidad `MedicalCertificate` con las siguientes propiedades,
respetando el ER del enunciado:

- `id`: UUID, identificador único.
- `issue_date`: fecha (sin hora).
- `expiry_date`: fecha (sin hora).
- `doctor_license`: string, matrícula del médico firmante.
- `is_invalidated`: booleano. `false` = certificado activo; `true` = invalidado.
- `member_id`: UUID, FK a `Member`.
- `created_at`: timestamp, fecha y hora de creación del registro.

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/medical-certificates`
- Request Body (`CreateMedicalCertificateRequest`):

```ts
{
  memberId:      string; // UUID del socio
  issueDate:     string; // ISO Date YYYY-MM-DD
  expiryDate:    string; // ISO Date YYYY-MM-DD, debe ser > issueDate
  doctorLicense: string; // matrícula del médico
}
```

- Response (`MedicalCertificateResponse`, 201 Created):

```ts
{
  id:             string;
  memberId:       string;
  issueDate:      string; // ISO Date
  expiryDate:     string; // ISO Date
  doctorLicense:  string;
  isInvalidated:  false;  // siempre false al crear
  createdAt:      string; // ISO DateTime
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `create(certificate)`,
   `findActiveByMember(memberId)` e `invalidateByMember(memberId)`).
   También se reutiliza `MemberRepository` (método `findById`) para validar
   la existencia del socio.
2. **Caso de Uso**: `CreateMedicalCertificateUseCase` (verifica existencia del
   socio, busca certificado activo previo, lo invalida si existe, y crea el
   nuevo con `is_invalidated = false`).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository`
   (implementación con Prisma; opcionalmente se puede reforzar la unicidad con
   un índice parcial sobre `member_id` donde `is_invalidated = false`).
4. **Adaptador de Entrada**: `MedicalCertificateController`
   (ruta `POST /api/v1/medical-certificates`, valida el payload y retorna 201).

## Casos de Borde y Errores

| Escenario                              | Resultado Esperado                                                         | Código HTTP               |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| Falta un campo requerido               | Mensaje: "El campo {campo} es obligatorio"                                 | 400 Bad Request           |
| `memberId` con formato inválido        | Mensaje: "Formato de ID inválido"                                          | 400 Bad Request           |
| Socio inexistente                      | Mensaje: "El socio especificado no existe"                                 | 404 Not Found             |
| `expiryDate` ≤ `issueDate`             | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"      | 400 Bad Request           |
| Formato de fecha inválido              | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                 | 400 Bad Request           |
| Ya existe un certificado activo        | Se invalida el anterior y se crea el nuevo correctamente                   | 201 Created               |
| Error de conexión a la base de datos   | Mensaje: "Error interno, reintente más tarde"                              | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `CreateMedicalCertificateRequest` y `MedicalCertificateResponse`
   en el paquete `@alentapp/shared`.
2. Agregar el modelo `MedicalCertificate` al schema de Prisma y ejecutar la migración.
3. Crear el puerto `MedicalCertificateRepository` y la entidad de dominio.
4. Implementar `PostgresMedicalCertificateRepository` con los métodos `create`,
   `findActiveByMember` e `invalidateByMember`.
5. Implementar `CreateMedicalCertificateUseCase`.
6. Exponer la ruta `POST /api/v1/medical-certificates` en `MedicalCertificateController`
   y registrarla en la app de Fastify.
7. Agregar el formulario de alta en el frontend y conectarlo al endpoint.

## Observaciones Adicionales

### Atomicidad de la invalidación y creación

La invalidación del certificado anterior y la creación del nuevo deben ejecutarse
dentro de una misma transacción de base de datos. Esto evita que un fallo parcial
deje al socio sin ningún certificado activo o con dos activos simultáneamente.
Prisma soporta esto mediante `prisma.$transaction([...])`.

### Restricción sobre `issue_date`

El sistema debe rechazar certificados cuya `issue_date` sea una fecha futura. Un certificado médico representa un hecho ya ocurrido (la emisión del apto), por lo que permitir fechas futuras generaría un certificado marcado como activo (`is_invalidated = false`) que técnicamente aún no fue emitido. Esto podría invalidar erróneamente un certificado vigente real del socio. La validación debe asegurar que `issue_date <= hoy`.
