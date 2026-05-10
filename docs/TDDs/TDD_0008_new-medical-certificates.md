---
id: 0008
estado: Aprobado
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

- El sistema debe crear el certificado siempre con `is_validated = true` por defecto. Cualquier intento del cliente de fijar `is_validated = false` en el alta debe ser ignorado y reemplazado por `true`.
- El sistema debe garantizar que solo exista un certificado activo (`is_validated = true`) por socio.
- Si ya existe un certificado activo para el socio, el sistema debe marcarlo como invalidado (`is_validated = false`) antes de crear el nuevo. Esta operación debe ejecutarse atómicamente con la creación del nuevo.
- El sistema debe validar que `expiry_date` sea estrictamente posterior a `issue_date`.
- El sistema debe rechazar certificados con `issue_date` futura; debe cumplirse `issue_date <= hoy`.
- El sistema debe validar que el socio referenciado exista.
- El campo `created_at` debe registrar automáticamente el momento de inserción en la base de datos.
- El campo `deleted_at` debe quedar nulo en el alta; solo se completa cuando se da de baja el certificado (ver TDD-0010).

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
- `deleted_at`: fecha y hora, nullable.

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
2. **Servicio de Dominio**: `MedicalCertificateValidator` (centraliza las validaciones
   de campos: `validateIssueDate(issue_date)` verifica que `issue_date <= hoy`;
   `validateExpiryDate(issue_date, expiry_date)` verifica que `expiry_date > issue_date`;
   `validateDateFormat(date)` verifica que la fecha tenga formato ISO válido `YYYY-MM-DD`).
3. **Caso de Uso**: `CreateMedicalCertificateUseCase` (delega las validaciones
   de campos en `MedicalCertificateValidator`; verifica existencia del socio vía
   `MemberRepository`; busca certificado activo previo y lo invalida si existe;
   construye el objeto `Certificate` con `is_validated = true` y `created_at` automático;
   delega la persistencia atómica al repositorio).
4. **Adaptador de Salida**: `PostgresMedicalCertificateRepository`
   (creación usando el método `create` de Prisma; implementa `invalidateByMember`
   para marcar como inválidos certificados previos dentro de la misma transacción).
5. **Adaptador de Entrada**: `MedicalCertificateController`
   (ruta `POST /api/v1/medical-certificates`, valida el payload, captura excepciones
   de dominio y retorna status 201).

## Casos de Borde y Errores

| Escenario                              | Resultado Esperado                                                         | Código HTTP               |
| -------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| Falta un campo requerido               | Mensaje: "El campo {campo} es obligatorio"                                 | 400 Bad Request           |
| `member_id` con formato inválido       | Mensaje: "Formato de ID inválido"                                          | 400 Bad Request           |
| Socio inexistente                      | Mensaje: "El socio especificado no existe"                                 | 404 Not Found             |
| `issue_date` es una fecha futura       | Mensaje: "La fecha de emisión no puede ser futura"                         | 400 Bad Request           |
| `expiry_date` ≤ `issue_date`           | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"      | 400 Bad Request           |
| Formato de fecha inválido              | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                 | 400 Bad Request           |
| Cliente envía `is_validated = false`   | Se ignora; se persiste con `is_validated = true`                           | 201 Created               |
| Cliente envía `deleted_at`             | Se ignora; se persiste con `deleted_at = null`                              | 201 Created               |
| Ya existe un certificado activo        | Se invalida el anterior y se crea el nuevo correctamente (transacción)     | 201 Created               |
| Error de conexión a la base de datos   | Mensaje: "Error interno, reintente más tarde"                              | 500 Internal Server Error |

## Plan de Implementación

1. Definir los tipos `CreateMedicalCertificateRequest` y `MedicalCertificateResponse`
   en el paquete `@alentapp/shared`.
2. Agregar el modelo `MedicalCertificate` al schema de Prisma (incluyendo `created_at` con
   default `now()` y `deleted_at` nullable) y ejecutar la migración.
3. Crear el puerto `MedicalCertificateRepository` en la capa de Dominio con los métodos
   especificados.
4. Implementar el `MedicalCertificateValidator` con los métodos de validación de fechas
   y formato.
5. Implementar `PostgresMedicalCertificateRepository` con los métodos `create`,
   `findActiveByMember` e `invalidateByMember`, asegurando transaccionalidad.
6. Implementar `CreateMedicalCertificateUseCase`, delegando validaciones en
   `MedicalCertificateValidator`, forzando `is_validated = true` y `deleted_at = null`.
7. Exponer la ruta `POST /api/v1/medical-certificates` en `MedicalCertificateController`
   y registrarla en la app de Fastify.
8. Crear el formulario de alta en el frontend y conectarlo al endpoint.

## Observaciones Adicionales

### Atomicidad de la invalidación y creación

La invalidación del certificado anterior y la creación del nuevo deben ejecutarse
denro de la misma transacción de base de datos. Esto evita que un fallo parcial
deje al socio sin ningún certificado activo o con dos activos simultáneamente.
Si ocurre un error después de invalidar pero antes de crear, la transacción completa
se revierten.

### Cómo se evita la sobrescritura accidental

**Solo puede existir un certificado activo (`is_validated = true`) por socio.** Cuando
se carga uno nuevo, el anterior se invalida automáticamente. Esto garantiza que al
renovar un certificado (por ejemplo, el apto médico anual), el antiguo queda registrado
en el historial pero marcado como inválido, manteniendo una traza completa de cambios.

### Por qué se incluye `created_at`

Aunque el certificado ya tiene `issue_date`, no es lo mismo que saber cuándo fue cargado
al sistema. Un administrativo puede ingresar hoy un certificado que el médico firmó hace tres
días. En ese caso `issue_date` será "lunes" pero el registro se inserta en la base el
"jueves". Con `created_at` sabemos exactamente cuándo se registró en el sistema, lo que
resulta útil para auditoría y para ordenar certificados por orden de ingreso (como se
hace en TDD-0011).

### Campo `deleted_at` en altas

El campo `deleted_at` es un detalle interno del modelo de datos y no debe exponerse
ni completarse durante el alta. Todo certificado nuevo se crea con `deleted_at = null`.
Cuando el certificado se da de baja lógica (TDD-0010), ese campo se completa y el
registro deja de aparecer en consultas.

### Sobre `expiry_date`

En este TDD, `expiry_date` se carga desde el formulario y no se calcula automáticamente
(ej: `issue_date + 1 año`). La idea es mantenerlo alineado con lo que figure en el
certificado médico presentado. Si en el futuro el negocio define una vigencia fija
para todos los certificados, este comportamiento puede cambiar.

### Validación obligatoria de `issue_date`

El sistema rechaza certificados cuya `issue_date` sea futura. Un certificado médico
representa un hecho ya ocurrido (la emisión del apto), por lo que permitir fechas futuras
crearía un registro marcado como activo (`is_validated = true`) que técnicamente aún no
fue emitido. Esto podría invalidar erróneamente un certificado vigente real del socio.
Por eso la validación debe asegurar que `issue_date <= hoy`.
