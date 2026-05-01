---
id: 0009
estado: Propuesto
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
- El sistema debe permitir editar `issue_date`, `expiry_date` y/o `doctor_license` solo cuando el certificado esté activo (`is_invalidated = false`).
- Si el certificado ya está invalidado (`is_invalidated = true`), la edición debe rechazarse para preservar la integridad del historial médico.
- No se permite editar `member_id` ni `is_invalidated` por esta vía.
- Al menos un campo modificable debe estar presente en el body; un PATCH vacío debe rechazarse.
- Si se editan ambas fechas, o una de ellas junto con la otra ya existente, `expiry_date` debe seguir siendo estrictamente posterior a `issue_date`.
- La `issue_date` editada no puede ser una fecha futura (debe cumplir `issue_date <= hoy`), consistente con la restricción definida en TDD-0008.

**Invalidación manual:**
- Solo se puede invalidar un certificado que esté activo (`is_invalidated = false`). Intentar invalidar uno ya invalidado debe rechazarse.
- La operación debe marcar `is_invalidated = true` en el certificado indicado.
- Esta operación **no** crea un certificado nuevo; solo invalida el existente.

---

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. Se reutilizan los mismos campos.

### Contrato de API (@alentapp/shared)

Se exponen dos endpoints diferenciados para mantener explícita la semántica de cada operación:

#### 1. Edición de campos

- Endpoint: `PATCH /api/v1/medical-certificates/:id`
- Request Body (`UpdateMedicalCertificateRequest`):

```ts
{
  issueDate?:     string; // ISO Date YYYY-MM-DD
  expiryDate?:    string; // ISO Date YYYY-MM-DD, debe ser > issueDate resultante
  doctorLicense?: string; // matrícula del médico
}
```

- Response: 200 OK con el `MedicalCertificateResponse` actualizado.

```ts
{
  id:             string;
  memberId:       string;
  issueDate:      string; // ISO Date
  expiryDate:     string; // ISO Date
  doctorLicense:  string;
  isInvalidated:  boolean;
  createdAt:      string; // ISO DateTime
}
```

#### 2. Invalidación manual

- Endpoint: `PATCH /api/v1/medical-certificates/:id/invalidar`
- Request Body: vacío (sin body requerido).
- Response: 200 OK con el `MedicalCertificateResponse` actualizado (`isInvalidated: true`).

**Justificación de la separación**: usar un único `PATCH /api/v1/medical-certificates/:id` con un campo `is_invalidated` opcional abriría la puerta a invalidaciones accidentales mezcladas con ediciones de datos. Un endpoint orientado a acción (`/invalidar`) hace explícita la transición de estado y facilita el control de permisos y la auditoría.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (métodos `findById(id)` y `update(certificate)`).
2. **Entidad de Dominio**: `MedicalCertificate` se amplía con dos métodos que encapsulan las reglas de negocio:
   - `updateFields({ issueDate?, expiryDate?, doctorLicense? })`: rechaza la operación si `is_invalidated = true`; valida que `expiry_date` siga siendo posterior a `issue_date` con los valores resultantes.
   - `invalidate()`: rechaza la operación si `is_invalidated = true`; marca `is_invalidated = true`.
3. **Caso de Uso**: `UpdateMedicalCertificateUseCase` (recupera el certificado vía `findById`, invoca `updateFields` sobre la entidad y delega la persistencia al repositorio).
4. **Caso de Uso**: `InvalidateMedicalCertificateUseCase` (recupera el certificado, invoca `invalidate()` y delega la persistencia).
5. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (actualización usando el método `update` de Prisma).
6. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar`, que extraen el `id` y mapean excepciones a códigos HTTP).

## Casos de Borde y Errores

### Edición de campos (`PATCH /api/v1/medical-certificates/:id`)

| Escenario                                        | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente                          | Mensaje: "El certificado no existe"                                         | 404 Not Found             |
| Certificado ya invalidado                        | Mensaje: "No se puede modificar un certificado invalidado"                  | 409 Conflict              |
| Body vacío (ningún campo enviado)                | Mensaje: "Debe proveer al menos un campo a modificar"                       | 400 Bad Request           |
| `expiryDate` resultante ≤ `issueDate` resultante | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"       | 400 Bad Request           |
| Formato de fecha inválido                        | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                  | 400 Bad Request           |
| Cliente envía `memberId` o `isInvalidated`       | Se ignora; no se persiste el campo prohibido                                | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

### Invalidación manual (`PATCH /api/v1/medical-certificates/:id/invalidar`)

| Escenario                            | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente              | Mensaje: "El certificado no existe"                                         | 404 Not Found             |
| Certificado ya está invalidado       | Mensaje: "El certificado ya se encuentra invalidado"                        | 409 Conflict              |
| Operación exitosa                    | Devuelve el certificado actualizado con `isInvalidated: true`               | 200 OK                    |
| Error de conexión a la base de datos | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `UpdateMedicalCertificateRequest` en el paquete `@alentapp/shared`.
2. Ampliar el puerto `MedicalCertificateRepository` con los métodos `findById` y `update`, junto con sus implementaciones en `PostgresMedicalCertificateRepository`.
3. Agregar los métodos `updateFields` e `invalidate` a la entidad `MedicalCertificate`, asegurando que rechacen la operación si el certificado ya está invalidado.
4. Implementar los casos de uso `UpdateMedicalCertificateUseCase` e `InvalidateMedicalCertificateUseCase`.
5. Exponer las rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
6. En el frontend, agregar la acción "Editar" (modal con los tres campos editables) y la acción "Invalidar" (botón con confirmación) en la tabla de certificados.

## Observaciones Adicionales

### Por qué solo se permiten editar `issue_date`, `expiry_date` y `doctor_license`

La modificación está acotada a estos tres campos porque son los únicos que representan datos descriptivos del certificado: información que fue ingresada por el administrativo y que puede contener errores tipográficos o de carga sin afectar la identidad ni el ciclo de vida del documento. Corregir una fecha de vencimiento mal escrita o actualizar una matrícula médica incorrecta no cambia *qué es* el certificado ni *a quién pertenece*; solo corrige *cómo está documentado*.

Los campos excluidos, en cambio, no admiten corrección por esta vía porque modificarlos implicaría una operación de naturaleza distinta:

- **`member_id`**: identifica a quién pertenece el certificado. Reasignarlo a otro socio no es una corrección de datos, es transferir un registro médico de una persona a otra. Desde el punto de vista médico y legal, un certificado emitido para una persona no puede simplemente "moverse" a otra. Si se cometió un error de asignación, lo correcto es invalidar el certificado actual y emitir uno nuevo al socio correcto mediante el endpoint de alta (TDD-0008), dejando trazabilidad de lo ocurrido.

- **`is_invalidated`**: este campo no es un dato descriptivo del certificado sino el indicador de su estado de vida. Permitir editarlo como un campo más en el PATCH genérico sería tratar una transición de estado —con sus propias reglas de negocio, consecuencias y carácter irreversible— como si fuera equivalente a corregir una fecha. Además, si en el futuro se requiriera auditar cuándo y por qué se invalidó un certificado, no habría forma de distinguirlo de una simple edición de campos. Por eso se gestiona de forma explícita mediante su propio endpoint.

### Por qué la invalidación tiene un endpoint separado (`/invalidar`)

Separar la invalidación en su propio endpoint (`PATCH /api/v1/medical-certificates/:id/invalidar`) responde a tres motivos concretos:

**1. Semántica explícita.** La invalidación no es "editar el certificado": es una decisión deliberada de dar de baja un registro médico activo. Nombrar esa acción en la URL comunica con claridad la intención, tanto para quien consume la API como para quien la mantiene. Un `PATCH` con `isInvalidated: true` en el body no transmite lo mismo y obliga a quien lee el código a inferir el significado.

**2. Reglas de negocio propias.** La invalidación tiene consecuencias que van más allá de persistir un campo: puede afectar la habilitación del socio para participar en deportes que requieran certificado médico vigente, y es irreversible por diseño. Al aislarla en un caso de uso propio (`InvalidateMedicalCertificateUseCase`), esas reglas quedan encapsuladas y no se mezclan con la lógica de edición de datos. Si en el futuro se agregan efectos secundarios (por ejemplo, notificar al socio o registrar quién realizó la invalidación), el punto de extensión es claro.

**3. Prevención de errores accidentales.** Si la invalidación fuera un campo editable más, un cliente que envía un PATCH para corregir `expiryDate` podría incluir accidentalmente `isInvalidated: true` y dar de baja el certificado sin saberlo. Al requerir una llamada explícita a `/invalidar`, la operación se vuelve imposible de realizar de forma inadvertida.

### Irreversibilidad de la invalidación

Una vez que un certificado se marca como invalidado (`is_invalidated = true`), no puede volver a activarse. Esto se debe a que la invalidación representa un hecho consumado: el certificado dejó de ser válido en un momento determinado, y revertir ese estado borraría ese hecho del historial. Si la invalidación fue un error, la única vía correcta es emitir un nuevo certificado mediante el endpoint de alta (TDD-0008), lo cual preserva el registro del certificado invalidado y genera uno nuevo con trazabilidad propia.

### Invalidación de certificados ya vencidos

La invalidación manual aplica incluso cuando el certificado tiene una `expiry_date` anterior a la fecha actual (certificado expirado). Aunque el certificado ya no tenga validez médica práctica, puede seguir figurando como `is_invalidated = false` en la base de datos si nunca fue invalidado explícitamente. Marcarlo como invalidado en estos casos es válido y recomendable para mantener la coherencia del historial: un certificado expirado no invalidado podría generar confusión al consultar el registro del socio.
