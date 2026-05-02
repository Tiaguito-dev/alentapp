id: 0017
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Modificación de Disciplina

---

# TDD-0017: Modificación de Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir la actualización de disciplinas existentes dentro del sistema, garantizando que las modificaciones respeten las reglas de negocio y mantengan la consistencia de los datos.

### User Persona

* **Nombre**: Enzo (Administrador del sistema).
* **Necesidad**: Necesita modificar información de disciplinas para mantener los datos actualizados sin generar inconsistencias.

### Criterios de Aceptación

* El sistema debe permitir modificar una disciplina existente.
* El sistema debe permitir modificaciones parciales sin afectar los campos no enviados.
* El sistema debe validar que `end_date > start_date` si se modifican fechas.
* El sistema debe rechazar modificaciones inválidas.
* El sistema debe devolver la disciplina actualizada.
* El sistema debe informar si la disciplina no existe.

## Diseño Técnico (RFC)

### Modelo de Datos

Se mantiene la estructura de la entidad `Discipline`

### Contrato de API (@alentapp/shared)

* **Endpoint**: `PATCH /api/v1/disciplines/:id`

* **Request Body**:

```ts
{
    
    end_date?:  datetime;
    is_total_suspension?:  boolean;
    member_id?: string | null;
}
```


### Componentes de Arquitectura Hexagonal

- Puerto: `DisciplineRepository` (Método `update(id, data)`).

- Servicio de dominio: `DisciplineValidator` (Encargado validar la disciplina).

- Caso de Uso: `UpdateDisciplineUseCase` (orquesta la validación de unicidad) y puerto de salida DisciplineRepository.

- Adaptador de Salida: `PostgresDisciplineRepository` (Actualización usando el método `update` de Prisma).

- Adaptador de Entrada:  `DisciplineController` (Ruta HTTP que extrae el `id`).


## Casos de Borde y Errores

| Escenario              | Resultado Esperado    | Código HTTP               |
| ---------------------- | --------------------- | ------------------------- |
| ID inexistente         | Recurso no encontrado | 404 Not Found             |
| end_date <= start_date | Error de validación   | 400 Bad Request           |
| Datos inválidos        | Error de validación   | 400 Bad Request           |
| Error interno          | Error genérico        | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateDisciplineRequest`).
2. Ampliar el `DisciplineRepository` con el método `update`.
3. Implementar la lógica en `UpdateDisciplineUseCase` utilizando el `DisciplineValidator`.
4. Crear la ruta `PATCH` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.