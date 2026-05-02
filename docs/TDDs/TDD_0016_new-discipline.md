id: 0016
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Alta de Discipline

---

# TDD-[0016]: Alta de Discipline

## Contexto de Negocio (PRD)

### Objetivo

Permitir la creación de nuevas disciplinas deportivas dentro del sistema Alentapp, garantizando la integridad de los datos mediante validaciones de negocio. Esta funcionalidad permite organizar correctamente las actividades deportivas evitando inconsistencias en la planificación, especialmente asegurando que la fecha de finalización de una disciplina sea posterior a su fecha de inicio

### User Persona

* **Nombre**: Enzo (Administrador del sistema)
* **Necesidad**: Necesita registrar nuevas disciplinas deportivas asegurando que los datos ingresados sean correctos, evitando errores en fechas que puedan afectar la organización de actividades

### Criterios de Aceptación

* El sistema debe permitir crear una disciplina con nombre y fechas válidas
* El sistema debe validar que `end_date` sea estrictamente mayor que `start_date`
* El sistema debe rechazar la creación si `end_date` es menor o igual a `start_date`
* El sistema debe validar que el campo `name` no esté vacío
* El sistema debe almacenar correctamente la disciplina en la base de datos
* El sistema debe devolver la disciplina creada con su identificador único

## Diseño Técnico (RFC)

### Modelo de Datos

Entidad `Discipline`:

* `id`: UUID (Primary Key, autogenerado)
* `name`: String (requerido, no vacío)
* `description`: String (opcional)
* `start_date`: DateTime (requerido)
* `end_date`: DateTime (requerido, debe ser mayor a start_date)
* `created_at`: DateTime (autogenerado)
* `updated_at`: DateTime (autogenerado)

### Contrato de API (@alentapp/shared)

* **Endpoint**: `POST /api/v1/disciplines`

* **Request Body**:

```ts
{
    name: "Basquet",
    description: "Entrenamiento y práctica de basquet",
    start_date: "2026-05-10T10:00:00Z",
    end_date: "2026-12-10T18:00:00Z"
}
```

* **Response (201 Created)**:

```ts
{
    id: "uuid-generado",
    name: "Basquet",
    description: "Entrenamiento y práctica de basquet",
    start_date: "2026-05-10T10:00:00Z",
    end_date: "2026-12-10T18:00:00Z",
    created_at: "2026-05-01T12:00:00Z"
    updated_at: "2026-05-01T12:00:00Z"
}
```

### Componentes de Arquitectura Hexagonal

* **Domain**:

  * Entidad `Discipline`
  * Regla de negocio: `end_date > start_date`
  * Validación implementada dentro de la entidad

* **Application**:

  * Caso de uso: `CreateDiscipline`
  * Validación de datos de entrada
  * Orquestación de persistencia

* **Infrastructure**:

  * Controller HTTP (manejo de request/response)
  * Repositorio implementado con Prisma ORM
  * Mapeo DTO → entidad de dominio

## Casos de Borde y Errores

| Escenario                 | Resultado Esperado                                     | Código HTTP               |
| ------------------------- | ------------------------------------------------------ | ------------------------- |
| end_date <= start_date    | Error: "La fecha de fin debe ser mayor a la de inicio" | 400 Bad Request           |
| Nombre vacío              | Error: "El nombre es obligatorio"                      | 400 Bad Request           |
| Formato de fecha inválido | Error de validación                                    | 400 Bad Request           |
| Error interno             | Error genérico del servidor                            | 500 Internal Server Error |

## Plan de Implementación

1. Definir DTOs en `@alentapp/shared`
2. Implementar entidad `Discipline` con validaciones en Domain
3. Crear caso de uso `CreateDiscipline`
4. Implementar repositorio con Prisma
5. Crear endpoint POST `/api/v1/disciplines`
6. Validar datos de entrada
7. Persistir en base de datos
8. Testear casos válidos e inválidos
