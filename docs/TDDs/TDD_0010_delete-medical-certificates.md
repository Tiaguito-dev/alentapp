---
id: 0010
estado: Propuesto
autor: Federico Alvarez Pieroni
fecha: 2026-05-01
titulo: Eliminación de Certificados Médicos
---

# TDD-0010: Eliminación de Certificados Médicos

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos eliminar permanentemente un certificado médico del sistema. Esta operación aplica únicamente cuando el certificado fue cargado por error y nunca debió existir. Se diferencia de la invalidación (TDD-0009), que es el flujo normal para dar de baja un certificado con validez histórica.

### User Persona

- **Nombre**: Rodrigo (Administrativo).
- **Necesidad**: Borrar un certificado cargado por error (por ejemplo, asociado al socio equivocado o con datos completamente incorrectos) desde la pantalla de gestión de certificados. Necesita una advertencia explícita antes de confirmar el borrado, dado que la operación es irreversible.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado.
- El sistema debe validar que el certificado exista antes de intentar borrarlo.
- El sistema debe realizar un borrado físico de la base de datos (hard delete).
- Si el certificado a eliminar es el único activo del socio (`is_validated = true`), el borrado debe proceder igualmente; queda bajo responsabilidad del administrativo recargar uno nuevo.
- Si el borrado es exitoso, la tabla debe actualizarse automáticamente reflejando la ausencia del registro.

## Diseño Técnico (RFC)

### Modelo de Datos

No se introducen cambios al modelo definido en TDD-0008. La operación de borrado no requiere nuevos campos.

### Contrato de API (@alentapp/shared)

Al tratarse de una operación destructiva que solo requiere conocer el identificador, no se envía cuerpo en la petición HTTP.

- Endpoint: `DELETE /api/v1/medical-certificates/:id`
- Request Body: ninguno.
- Response: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `MedicalCertificateRepository` (método `delete(id)`; el método `findById(id)` ya existe desde TDD-0009 y se reutiliza para verificar la existencia previa).
2. **Caso de Uso**: `DeleteMedicalCertificateUseCase` (comprueba existencia previa vía `findById` y delega la eliminación).
3. **Adaptador de Salida**: `PostgresMedicalCertificateRepository` (eliminación usando el método `delete` de Prisma).
4. **Adaptador de Entrada**: `MedicalCertificateController` (ruta HTTP que extrae el `id` y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                          | Resultado Esperado                                                 | Código HTTP       |
| ---------------------------------- | ------------------------------------------------------------------ | ----------------- |
| Certificado inexistente            | Mensaje: "El certificado no existe"                                | 404 Not Found     |
| Error de conexión a DB             | Mensaje: "Error interno, reintente más tarde"                      | 500 Internal Server Error |
| Eliminación exitosa                | Respuesta vacía                                                    | 204 No Content    |

## Plan de Implementación

1. Ampliar el `MedicalCertificateRepository` y `PostgresMedicalCertificateRepository` con el método `delete(id)`.
2. Crear la lógica de negocio en `DeleteMedicalCertificateUseCase` (verificar existencia con `findById` antes de eliminar).
3. Crear el endpoint `DELETE /api/v1/medical-certificates/:id` en el `MedicalCertificateController` y registrarlo en `app.ts`.
4. Añadir el método `deleteMedicalCertificate` al servicio Frontend (`medicalCertificates.ts`).
5. Enlazar el botón de eliminación en la vista de certificados médicos agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada.

## Observaciones Adicionales

### Distinción con la invalidación

El borrado físico es para errores de carga; la invalidación (TDD-0009) es el camino correcto cuando el certificado tiene validez histórica y solo se quiere darlo de baja lógicamente. Ambas operaciones no deben confundirse ni intercambiarse.

### Impacto en el certificado activo

Si se elimina el único certificado activo del socio (`is_validated = true`), el sistema queda sin cobertura médica registrada para ese socio. La operación no se bloquea, pero el frontend debe mostrar una advertencia adicional en este caso para que el administrativo sea consciente de las consecuencias.

