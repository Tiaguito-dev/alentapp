id: 0017
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Modificación de Discipline

---

# TDD-[0017]: Modificación de Discipline

## Contexto de Negocio (PRD)

### Objetivo

Permitir la actualización de disciplinas existentes dentro del sistema, garantizando que las modificaciones respeten las reglas de negocio y mantengan la consistencia de los datos

### User Persona

* **Nombre**: Enzo (Administrador del sistema)
* **Necesidad**: Necesita modificar información de disciplinas para mantener los datos actualizados sin generar inconsistencias

### Criterios de Aceptación

* El sistema debe permitir modificar una disciplina existente
* El sistema debe permitir modificaciones parciales sin afectar los campos no enviados
* El sistema debe validar que `end_date > start_date` si se modifican fechas
* El sistema debe rechazar modificaciones inválidas
* El sistema debe devolver la disciplina actualizada
* El sistema debe informar si la disciplina no existe

## Diseño Técnico (RFC)

### Modelo de Datos

Se mantiene la estructura de la entidad `Discipline`

### Contrato de API (@alentapp/shared)

* **Endpoint**: `PUT /api/v1/disciplines/:id`

* **Request Body**:

```ts
{
    name: "Basquet Profesional",
    end_date: "2026-12-20T18:00:00Z"
}
```

* **Response (200 OK)**:

```ts
{
    id: "uuid-generado",
    name: "Basquet Profesional",
    description: "Entrenamiento y práctica de basquet",
    start_date: "2026-05-10T10:00:00Z",
    end_date: "2026-12-20T18:00:00Z",
    updated_at: "2026-05-02T15:00:00Z"
}
```

### Componentes de Arquitectura Hexagonal

* **Domain**:

  * Validación de reglas de negocio
  * Método de actualización con validación

* **Application**:

  * Caso de uso: `UpdateDiscipline`
  * Verificación de existencia
  * Aplicación de cambios

* **Infrastructure**:

  * Controller HTTP
  * Repositorio Prisma

## Casos de Borde y Errores

| Escenario              | Resultado Esperado    | Código HTTP               |
| ---------------------- | --------------------- | ------------------------- |
| ID inexistente         | Recurso no encontrado | 404 Not Found             |
| end_date <= start_date | Error de validación   | 400 Bad Request           |
| Datos inválidos        | Error de validación   | 400 Bad Request           |
| Error interno          | Error genérico        | 500 Internal Server Error |

## Plan de Implementación

1. Crear endpoint PUT `/api/v1/disciplines/:id`
2. Buscar disciplina por ID
3. Validar existencia
4. Validar reglas de negocio
5. Actualizar datos
6. Persistir cambios
7. Testear escenarios
