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
- El sistema debe permitir editar `issue_date`, `expiry_date` y/o `doctor_license` solo cuando el certificado esté activo (`is_validated = true`).
- Si el certificado ya está invalidado (`is_validated = false`), la edición debe rechazarse para preservar la integridad del historial médico.
- No se permite editar `member_id` ni `is_validated` por esta vía.
- Si se editan ambas fechas, o una de ellas junto con la otra ya existente, `expiry_date` debe seguir siendo estrictamente posterior a `issue_date`.
- La `issue_date` editada no puede ser una fecha futura (debe cumplir `issue_date <= hoy`), consistente con la restricción definida en TDD-0008.

**Invalidación manual:**
- Solo se puede invalidar un certificado que esté activo (`is_validated = true`). Intentar invalidar uno ya invalidado debe rechazarse.
- La operación debe marcar `is_validated = false` en el certificado indicado.
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
2. **Caso de Uso**: `UpdateMedicalCertificateUseCase` (recupera el certificado vía `findById`, valida las reglas de edición sobre los valores resultantes y delega la persistencia al repositorio con `update`).
3. **Caso de Uso**: `InvalidateMedicalCertificateUseCase` (recupera el certificado, valida que siga activo y delega la persistencia marcando `is_validated = false`).
4. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `MedicalCertificateController` (rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar`, que extraen el `id` y mapean excepciones a códigos HTTP).

## Casos de Borde y Errores

### Edición de campos (`PATCH /api/v1/medical-certificates/:id`)

| Escenario                                        | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente                          | Mensaje: "El certificado no existe"                                         | 404 Not Found             |
| Certificado ya invalidado                        | Mensaje: "No se puede modificar un certificado invalidado"                  | 409 Conflict              |
| Body vacío (ningún campo enviado)                | Mensaje: "Debe proveer al menos un campo a modificar"                       | 400 Bad Request           |
| `expiry_date` resultante ≤ `issue_date` resultante | Mensaje: "La fecha de vencimiento debe ser posterior a la de emisión"       | 400 Bad Request           |
| Formato de fecha inválido                        | Mensaje: "Formato de fecha inválido (esperado YYYY-MM-DD)"                  | 400 Bad Request           |
| Cliente envía `member_id` o `is_validated`      | Se ignora; no se persiste el campo prohibido                                | 200 OK                    |
| Error de conexión a la base de datos             | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

### Invalidación manual (`PATCH /api/v1/medical-certificates/:id/invalidar`)

| Escenario                            | Resultado Esperado                                                          | Código HTTP               |
| ------------------------------------ | --------------------------------------------------------------------------- | ------------------------- |
| Certificado inexistente              | Mensaje: "El certificado no existe"                                         | 404 Not Found             |
| Certificado ya está invalidado       | Mensaje: "El certificado ya se encuentra invalidado"                        | 409 Conflict              |
| Operación exitosa                    | Devuelve el certificado actualizado con `is_validated: false`              | 200 OK                    |
| Error de conexión a la base de datos | Mensaje: "Error interno, reintente más tarde"                               | 500 Internal Server Error |

## Plan de Implementación

1. Definir el tipo `UpdateMedicalCertificateRequest` en el paquete `@alentapp/shared`.
2. Ampliar el puerto `MedicalCertificateRepository` con los métodos `findById` y `update`, junto con sus implementaciones en `PostgresMedicalCertificateRepository`.
3. Implementar las validaciones de edición e invalidación en los casos de uso (`UpdateMedicalCertificateUseCase` e `InvalidateMedicalCertificateUseCase`), asegurando que rechacen la operación si el certificado ya está invalidado (`is_validated = false`).
4. Exponer las rutas `PATCH /api/v1/medical-certificates/:id` y `PATCH /api/v1/medical-certificates/:id/invalidar` en el `MedicalCertificateController` y registrarlas en la app de Fastify.
5. En el frontend, agregar la acción "Editar" (modal con los tres campos editables) y la acción "Invalidar" (botón con confirmación) en la tabla de certificados.

## Observaciones Adicionales

### Por qué solo se permiten editar `issue_date`, `expiry_date` y `doctor_license`

La modificación está acotada a estos tres campos porque son los únicos que representan datos descriptivos del certificado: información que fue ingresada por el administrativo y que puede contener errores tipográficos o de carga sin afectar la identidad  del documento. Corregir una fecha de vencimiento mal escrita o actualizar una matrícula médica incorrecta no cambia *qué es* el certificado ni *a quién pertenece*; solo corrige *cómo está documentado*.



- **`member_id`**: identifica a quién pertenece el certificado. Reasignarlo a otro socio no es una corrección de datos, es transferir un registro médico de una persona a otra. Desde el punto de vista médico y legal, un certificado emitido para una persona no puede simplemente "moverse" a otra. Si se cometió un error de asignación, lo correcto es invalidar el certificado actual y emitir uno nuevo al socio correcto.

- **`is_validated`**: no es un dato del certificado, es su estado. Invalidar un certificado es una decisión deliberada con consecuencias, no una corrección de tipeo. Por eso tiene su propio endpoint y no se puede tocar por esta vía.

### Irreversibilidad de la invalidación

Una vez invalidado, no se puede volver atrás. Marcar un certificado como inválido es registrar que en ese momento dejó de estar vigente, y ese dato no debe borrarse. Si la invalidación fue un error, lo correcto es crear un certificado nuevo; el invalidado queda en el historial de todas formas.

### Invalidación de certificados ya vencidos

La invalidación manual aplica incluso cuando el certificado tiene una `expiry_date` anterior a la fecha actual (certificado expirado). Aunque el certificado ya no tenga validez médica práctica, puede seguir figurando como `is_validated = true` en la base de datos si nunca fue invalidado explícitamente. Marcarlo como invalidado en estos casos es válido y recomendable para mantener la coherencia del historial: un certificado expirado no invalidado podría generar confusión al consultar el registro del socio.

### Justificación de la separación

Si la invalidación fuera solo un campo más del PATCH, un administrativo podría invalidar un certificado sin darse cuenta mientras corrige una fecha. Con un endpoint propio (`/invalidar`) queda claro que es una acción diferente y no puede ocurrir de casualidad.