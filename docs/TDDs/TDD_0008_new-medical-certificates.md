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

- El sistema debe crear el certificado con `is_validated = true` por defecto.
- El sistema debe garantizar que solo exista un certificado activo (`is_validated = true`) por socio.
- Si ya existe un certificado activo para el socio, el sistema debe marcarlo como
  invalidado (`is_validated = false`) antes de crear el nuevo.
- El sistema debe validar que `expiry_date` sea estrictamente posterior a `issue_date`.
- El sistema debe rechazar certificados con `issue_date` futura; debe cumplirse `issue_date <= hoy`.
- El sistema debe validar que el socio referenciado exista.

---

## Diseño Técnico (RFC)

### Modelo de Datos

Se utilizará el modelo `MedicalCertificate` con las siguientes propiedades,
respetando el ER del enunciado:

- `id`: UUID, identificador único.
- `issue_date`: fecha (sin hora).
- `expiry_date`: fecha (sin hora).
- `doctor_license`: string, matrícula del médico firmante.
- `is_validated`: booleano. `true` = certificado activo; `false` = invalidado.
- `member_id`: UUID, FK a `Member`.
- `created_at`: timestamp, fecha y hora de creación del registro.

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/medical-certificates`
- Request Body (`CreateMedicalCertificateRequest`):

```ts
{
   member_id:      string; // UUID del socio
   issue_date:     string; // ISO Date YYYY-MM-DD
   expiry_date:    string; // ISO Date YYYY-MM-DD, debe ser > issue_date
   doctor_license: string; // matrícula del médico
}
```

- Response (`MedicalCertificateResponse`, 201 Created):

```ts
{
  id:             string;
   member_id:      string;
   issue_date:     string; // ISO Date
   expiry_date:    string; // ISO Date
   doctor_license: string;
   is_validated:   true;   // siempre true al crear
   created_at:     string; // ISO DateTime
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `create(certificate)`,
   `findActiveByMember(memberId)` e `invalidateByMember(memberId)`).
   También se reutiliza `MemberRepository` (método `findById`) para validar
   la existencia del socio.
2. **Caso de Uso**: `CreateMedicalCertificateUseCase` (verifica existencia del
   socio, busca certificado activo previo, lo invalida si existe, y crea el
   nuevo con `is_validated = true`).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository`
   (implementación con Prisma)
4. **Adaptador de Entrada**: `MedicalCertificateController`
   (ruta `POST /api/v1/medical-certificates`, valida el payload y retorna 201).

## Casos de Borde y Errores

| Escenario                              | Resultado Esperado                                                         | Código HTTP               |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| Falta un campo requerido               | Mensaje: "El campo {campo} es obligatorio"                                 | 400 Bad Request           |
| `member_id` con formato inválido       | Mensaje: "Formato de ID inválido"                                          | 400 Bad Request           |
| Socio inexistente                      | Mensaje: "El socio especificado no existe"                                 | 404 Not Found             |
| `expiry_date` ≤ `issue_date`           | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"      | 400 Bad Request           |
| Formato de fecha inválido              | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                 | 400 Bad Request           |
| Ya existe un certificado activo        | Se invalida el anterior y se crea el nuevo correctamente                   | 201 Created               |
| Error de conexión a la base de datos   | Mensaje: "Error interno, reintente más tarde"                              | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `CreateMedicalCertificateRequest` y `MedicalCertificateResponse`
   en el paquete `@alentapp/shared`.
2. Agregar el modelo `MedicalCertificate` al schema de Prisma y ejecutar la migración.
3. Crear el puerto `MedicalCertificateRepository`.
4. Implementar `PostgresMedicalCertificateRepository` con los métodos `create`,
   `findActiveByMember` e `invalidateByMember`.
5. Implementar `CreateMedicalCertificateUseCase`.
6. Exponer la ruta `POST /api/v1/medical-certificates` en `MedicalCertificateController`
   y registrarla en la app de Fastify.
7. Agregar el formulario de alta en el frontend y conectarlo al endpoint.

## Observaciones Adicionales

### Atomicidad de la invalidación y creación

La invalidación del certificado anterior y la creación del nuevo deben ejecutarse
al mismo tiempo. Esto evita que un fallo parcial
deje al socio sin ningún certificado activo o con dos activos simultáneamente.

### Por qué se incluye `created_at`

Si bien el certificado ya tiene una `issue_date`, eso no es lo mismo que saber cuándo fue cargado al sistema. Un administrativo puede ingresar hoy un certificado que el médico firmó hace tres días, y en ese caso `issue_date` va a decir "lunes" pero el registro apareció en la base el "jueves". Con `created_at` sabemos exactamente ese momento de carga, lo que resulta útil si en algún momento alguien pregunta cuándo se registró algo o si se quiere ordenar los certificados por orden de ingreso al sistema (como se hace en TDD-0011).

### Sobre `expiry_date`

En este TDD, `expiry_date` se carga desde el formulario y no se calcula automáticamente como `issue_date + 1 año`. La idea es mantenerlo alineado con lo que figure en el certificado presentado. Si más adelante el negocio define una vigencia fija anual para todos, este punto puede cambiar.

### Restricción sobre `issue_date`

El sistema debe rechazar certificados cuya `issue_date` sea una fecha futura. Un certificado médico representa un hecho ya ocurrido (la emisión del apto), por lo que permitir fechas futuras generaría un certificado marcado como activo (`is_validated = true`) que técnicamente aún no fue emitido. Esto podría invalidar erróneamente un certificado vigente real del socio. La validación debe asegurar que `issue_date <= hoy`.
