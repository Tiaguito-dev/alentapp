---
id: 0009
estado: Aprobado
autor: Federico Alvarez Pieroni
fecha: 2026-05-01
titulo: Modificación de Certificados Médicos
---

# TDD-0009: Modificación de Certificados Médicos

## Contexto de Negocio (PRD)

### Objetivo

Permitir al administrativo modificar un certificado médico existente en dos escenarios distintos pero relacionados: (a) corregir datos del certificado (`issue_date`, `expiry_date` y/o `doctor_license`) cuando el certificado todavía está activo; (b) invalidar manualmente un certificado activo sin necesidad de emitir uno nuevo.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Corregir una fecha de vencimiento mal cargada o actualizar la matrícula del médico firmante mientras el certificado sigue activo. También necesita poder invalidar un certificado manualmente cuando un socio, por ejemplo, presenta una baja médica o el certificado fue emitido por error. Necesita que el sistema impida modificaciones sobre certificados ya invalidados, para no alterar registros médicos consolidados.

### Criterios de Aceptación

**Edición de campos:**
- El sistema debe permitir editar `issue_date`, `expiry_date` y/o `doctor_license` solo cuando el certificado esté activo (`is_validated = true`).
- Si el certificado fue dado de baja (`deleted_at IS NOT NULL`), debe tratarse como inexistente para esta API.
- Si el certificado ya está invalidado (`is_validated = false`), la edición debe rechazarse para preservar la integridad del historial médico.
- No se permite editar `member_id` ni `is_validated` por esta vía.
- Si se editan ambas fechas, o una de ellas junto con la otra ya existente, `expiry_date` debe seguir siendo estrictamente posterior a `issue_date`.
- La `issue_date` editada no puede ser una fecha futura (debe cumplir `issue_date <= hoy`), consistente con la restricción definida en TDD-0008.

**Invalidación manual:**
- Solo se puede invalidar un certificado que esté activo (`is_validated = true`). Intentar invalidar uno ya invalidado debe rechazarse.
- Si el certificado fue dado de baja (`deleted_at IS NOT NULL`), la invalidación debe tratarse como recurso inexistente.
- La operación debe marcar `is_validated = false` en el certificado indicado.
- Esta operación **no** crea un certificado nuevo; solo invalida el existente.

---

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. Se reutilizan los mismos campos,
incluyendo `deleted_at` para baja lógica.

### Contrato de API (@alentapp/shared)

Se exponen dos endpoints diferenciados para mantener explícita la semántica de cada operación:

#### 1. Edición de campos

- Endpoint: `PATCH /api/v1/medical-certificates/:id`
- Request Body (`UpdateMedicalCertificateRequest`):

```ts
{
  issue_date?:     string; // ISO Date YYYY-MM-DD
  expiry_date?:    string; // ISO Date YYYY-MM-DD, debe ser > issue_date resultante
  doctor_license?: string; // matrícula del médico
}
```

- Response: 200 OK con el `MedicalCertificateResponse` actualizado.

```ts
{
  id:             string;
  member_id:      string;
  issue_date:     string; // ISO Date
  expiry_date:    string; // ISO Date
  doctor_license: string;
  is_validated:   boolean;
  created_at:     string; // ISO DateTime
}
```

#### 2. Invalidación manual

- Endpoint: `PATCH /api/v1/medical-certificates/:id/invalidar`
- Request Body: vacío (sin body requerido).
- Response: 200 OK con el `MedicalCertificateResponse` actualizado (`is_validated: false`).



### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `findById(id)` y `update(certificate)`).
2. **Servicio de Dominio**: `MedicalCertificateValidator` (reutilizado desde TDD-0008; `validateIssueDate(issue_date)` verifica que `issue_date <= hoy`; `validateExpiryDate(issue_date, expiry_date)` verifica que `expiry_date > issue_date`; `validateDateFormat(date)` verifica el formato ISO `YYYY-MM-DD`).
3. **Caso de Uso**: `UpdateMedicalCertificateUseCase` (recupera el certificado vía `findById`; si no existe o está dado de baja devuelve 404; si `is_validated = false` lanza error; delega las validaciones de `issue_date` y/o `expiry_date` en `MedicalCertificateValidator`; aplica los cambios y delega la persistencia al repositorio).
4. **Caso de Uso**: `InvalidateMedicalCertificateUseCase` (recupera el certificado vía `findById`; si no existe o está dado de baja devuelve 404; si `is_validated = false` lanza error; transiciona el estado a `is_validated = false` y delega la persistencia al repositorio).
5. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (actualización usando el método `update` de Prisma).
6. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar`, que extraen el `id` y mapean excepciones a códigos HTTP).

## Casos de Borde y Errores

### Edición de campos (`PATCH /api/v1/medical-certificates/:id`)

| Escenario                                        | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente o dado de baja           | Mensaje: "El certificado no existe"                                         | 404 Not Found             |
| Certificado ya invalidado (`is_validated = false`) | Mensaje: "No se puede modificar un certificado invalidado"                  | 409 Conflict              |
| Body vacío (ningún campo enviado)                | Mensaje: "Debe proveer al menos un campo a modificar"                       | 400 Bad Request           |
| `issue_date` editada es futura                   | Mensaje: "La fecha de emisión no puede ser futura"                          | 400 Bad Request           |
| `expiry_date` resultante ≤ `issue_date` resultante | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"       | 400 Bad Request           |
| Formato de fecha inválido                        | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                  | 400 Bad Request           |
| Cliente envía `member_id` o `is_validated`      | Se ignora; no se persiste el campo prohibido                                | 200 OK                    |
| Operación exitosa                                | Devuelve el certificado actualizado con los campos modificados              | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

### Invalidación manual (`PATCH /api/v1/medical-certificates/:id/invalidar`)

| Escenario                            | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente o dado de baja | Mensaje: "El certificado no existe"                                       | 404 Not Found             |
| Certificado ya está invalidado       | Mensaje: "El certificado ya se encuentra invalidado"                        | 409 Conflict              |
| Certificado activo vencido (expirado) | Devuelve el certificado actualizado con `is_validated: false`              | 200 OK                    |
| Operación exitosa                    | Devuelve el certificado actualizado con `is_validated: false`              | 200 OK                    |
| Error de conexión a la base de datos | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `UpdateMedicalCertificateRequest` en el paquete `@alentapp/shared`.
2. Ampliar el puerto `MedicalCertificateRepository` con el método `update` y su implementación en `PostgresMedicalCertificateRepository`.
3. Asegurar que `findById` filtre `deleted_at IS NULL` para tratar certificados dados de baja como inexistentes.
4. Agregar métodos de validación al `MedicalCertificateValidator` definido en TDD-0008 si no están presentes.
5. Implementar los casos de uso `UpdateMedicalCertificateUseCase` e `InvalidateMedicalCertificateUseCase`, delegando las validaciones de fechas en `MedicalCertificateValidator` y manejando el chequeo de estado (`is_validated`) y baja lógica (`deleted_at`) directamente en cada caso de uso.
6. Exponer las rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
7. En el frontend, agregar la acción "Editar" (modal con los tres campos editables) y la acción "Invalidar" (botón con confirmación de usuario) en la tabla de certificados.

## Observaciones Adicionales

### Justificación de la separación en el contrato de API

Usar un único `PATCH /api/v1/medical-certificates/:id` con un campo `is_validated` opcional permitiría que un usuario invalide un certificado mientras intenta corregir una fecha. Eso aumenta el riesgo de transiciones accidentales. Endpoints orientados a acción (`/invalidar`) hacen explícita la invalidación.

### Por qué solo se permiten editar `issue_date`, `expiry_date` y `doctor_license`

La modificación está acotada a estos tres campos porque son los únicos que representan datos descriptivos del certificado: información que fue ingresada por el administrativo y que puede contener errores tipográficos o de carga sin afectar la identidad del documento. Corregir una fecha de vencimiento mal escrita o actualizar una matrícula médica incorrecta no cambia *qué es* el certificado ni *a quién pertenece*; solo corrige *cómo está documentado*.

A continuación se detalla el motivo de exclusión de cada campo:

- **`member_id`**: identifica a quién pertenece el certificado. Reasignarlo a otro socio no es una corrección de datos, es transferir un registro médico de una persona a otra. Desde el punto de vista médico y legal, un certificado emitido para una persona no puede simplemente "moverse" a otra. Si se cometió un error de asignación, lo correcto es invalidar el certificado actual y emitir uno nuevo al socio correcto. Si se permitiera editarlo, se podrían encubrir errores graves de carga sin dejar rastro.

- **`is_validated`**: no es un dato del certificado, es su estado. Invalidar un certificado es una decisión deliberada con consecuencias, no una corrección de tipeo. Cada transición de estado tiene reglas de negocio propias y debe quedar registrada como una acción explícita y auditable. Por eso tiene su propio endpoint y no se puede tocar por esta vía.

- **`deleted_at`**: es un campo de ciclo de vida gestionado exclusivamente por la operación de baja lógica (TDD-0010). Un certificado dado de baja no puede editarse ni invalidarse porque deja de existir desde la perspectiva de la API.

### Invalidación de certificados ya vencidos

También se pueden invalidar certificados que ya vencieron. Aunque no tengan más validez práctica, pueden seguir figurando como activos (`is_validated = true`) si nadie los invalidó manualmente. Marcarlo en esos casos ayuda a mantener el historial limpio y evita confusión cuando se consultan los registros de un socio.

### Irreversibilidad de la invalidación

Una vez invalidado (`is_validated = false`), el certificado no puede volver a activarse por esta API. Marcar un certificado como inválido es registrar que en ese momento dejó de estar vigente, y ese dato no debe borrarse. Si la invalidación fue un error, lo correcto es crear un certificado nuevo; el invalidado queda en el historial de todas formas, proporcionando una traza completa de cambios.