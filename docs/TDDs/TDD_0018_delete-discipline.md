id: 0018
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Baja de Discipline

---

# TDD-[0018]: Baja de Discipline

## Contexto de Negocio (PRD)

### Objetivo

Permitir la eliminación de disciplinas del sistema para mantener actualizada la información, eliminando aquellas que ya no se utilizan.

### User Persona

* **Nombre**: Enzo (Administrador del sistema)
* **Necesidad**: Eliminar disciplinas que ya no están activas o no son necesarias

### Criterios de Aceptación

* El sistema debe permitir eliminar una disciplina existente
* El sistema debe informar si la disciplina no existe
* El sistema debe eliminar correctamente el registro de la base de datos

## Diseño Técnico (RFC)

### Modelo de Datos

Se mantiene la estructura de la entidad `Discipline`


### Contrato de API (@alentapp/shared)

* **Endpoint**: `DELETE /api/v1/disciplines/:id`

* **Response (204 No Content)**

### Componentes de Arquitectura Hexagonal

* **Domain**:

  * Eliminación de la entidad

* **Application**:

  * Caso de uso: `DeleteDiscipline`
  * Validación de existencia

* **Infrastructure**:

  * Controller HTTP
  * Repositorio Prisma

## Casos de Borde y Errores

| Escenario      | Resultado Esperado    | Código HTTP               |
| -------------- | --------------------- | ------------------------- |
| ID inexistente | Recurso no encontrado | 404 Not Found             |
| Error interno  | Error genérico        | 500 Internal Server Error |

## Plan de Implementación

1. Crear endpoint DELETE `/api/v1/disciplines/:id`
2. Buscar disciplina por ID
3. Validar existencia
4. Eliminar registro
5. Testear funcionamiento
