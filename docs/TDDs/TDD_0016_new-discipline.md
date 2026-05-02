---
id: 0016
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Alta de Disciplina
---

# TDD-0016: Alta de Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir la creación de nuevas disciplinas deportivas dentro del sistema Alentapp, garantizando la integridad de los datos mediante validaciones de negocio. Esta funcionalidad permite organizar correctamente las actividades deportivas evitando inconsistencias en la planificación, especialmente asegurando que la fecha de finalización de una disciplina sea posterior a su fecha de inicio.

### User Persona

* **Nombre**: Enzo (Administrador del sistema).
* **Necesidad**: Necesita registrar nuevas disciplinas deportivas asegurando que los datos ingresados sean correctos, evitando errores en fechas que puedan afectar la organización de actividades.

### Criterios de Aceptación

* El sistema debe permitir crear una disciplina con nombre y fechas válidas.
* El sistema debe validar que `end_date` sea estrictamente mayor que `start_date`.
* El sistema debe validar que el campo `name` no esté vacío.
* El sistema debe almacenar correctamente la disciplina en la base de datos.
* El sistema debe devolver la disciplina creada con su identificador único.

## Diseño Técnico (RFC)

### Modelo de Datos

Entidad `Discipline`:

* `id`: UUID (Primary Key, autogenerado)
* `description`: String (opcional)
* `start_date`: DateTime (requerido)
* `end_date`: DateTime (requerido, debe ser mayor a start_date)
* `is_total_suspension`:boolean
* `member_id`: UUDI(Foreign Key a Member)

### Contrato de API (@alentapp/shared)

* **Endpoint**: `POST /api/v1/disciplines`

* **Request Body**:

```ts
{
    description: "string",
    start_date: "Datetime",
    end_date: "Datetime"
}
```

* **Response (201 Created)**:

```ts
{
    id: "UUDI (Primary Key, autogenerado)"
    description: "String (opcional)",
    start_date: "DateTime",
    end_date: "DateTime",
    is_total_suspension:"boolean"
    }
```

### Componentes de Arquitectura Hexagonal

Puerto: DisciplineRepository (Interface en el Dominio).

Caso de Uso: CreateDisciplineUseCase (Lógica que valida las reglas de negocio, especialmente que end_date sea estrictamente mayor que start_date antes de persistir la disciplina).

Adaptador de Salida: PostgresDisciplineRepository (Inserción en la base de datos usando el método create de Prisma).

Adaptador de Entrada: DisciplineController (Ruta HTTP encargada de recibir la request y delegarla al caso de uso).

## Casos de Borde y Errores

| Escenario                 | Resultado Esperado                                     | Código HTTP               |
| ------------------------- | ------------------------------------------------------ | ------------------------- |
| end_date <= start_date    | Error: "La fecha de fin debe ser mayor a la de inicio" | 400 Bad Request           |
| Nombre vacío              | Error: "El nombre es obligatorio"                      | 400 Bad Request           |
| Formato de fecha inválido | Error: de validación                                   | 400 Bad Request           |
| Error de conexión a DB    | Mensaje:"Error interno, reintente más tarde"           |500 Internal Server Error  |


## Plan de Implementación

1. Actualizar esquema agregando el modelo Discipline y generar la migración.
2. Definir tipos de Request/Response en @alentapp/shared.
3. Implementar el puerto en la capa de Dominio .
4. Desarrollar el caso de uso CreateDisciplineUseCase.
5. Consumir el endpoint desde el servicio de Frontend y crear el modal de alta de casillero.
