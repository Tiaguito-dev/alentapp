id: 0018
estado: propuesto
autor: Facundo Gomez
fecha: 2026-05-01
titulo: Baja de Disciplina

---

# TDD-0018: Baja de Disciplina

## Contexto de Negocio (PRD)

### Objetivo

Permitir la eliminación de disciplinas del sistema para mantener actualizada la información, eliminando aquellas que ya no se utilizan.

### User Persona

* **Nombre**: Enzo (Administrador del sistema).
* **Necesidad**: Eliminar disciplinas que ya no están activas o no son necesarias.

### Criterios de Aceptación

* El sistema debe permitir eliminar una disciplina existente.
* El sistema debe informar si la disciplina no existe.
* El sistema debe eliminar correctamente el registro de la base de datos.

## Diseño Técnico (RFC)

### Modelo de Datos

Se mantiene la estructura de la entidad `Discipline`


### Contrato de API (@alentapp/shared)

* **Endpoint**: `DELETE /api/v1/disciplines/:id`


### Componentes de Arquitectura Hexagonal

- puerto: `DisciplineRepository` (Método `delete(id)`).
  - Caso de uso: `DeleteDisciplineUseCase` (Comprueba existencia previa vía findById, valida que no tenga un socio asignado, y delega la eliminación).
  - adapador de entrada: `DisciplineController` (Ruta HTTP en Fastify que extrae el id de los parámetros y devuelve un status 204).
  - adaptador de salida: `PostgresDisciplineRepository` (Eliminación usando el método `delete` de Prisma).  

## Casos de Borde y Errores

| Escenario      | Resultado Esperado    | Código HTTP               |
| -------------- | --------------------- | ------------------------- |
| ID inexistente | Mensaje: Recurso no encontrado | 404 Not Found             |
| Eliminación exitosa | Mensaje: Respuesta vacía  | 204 No Content            |
| Error de conexión a DB| Mensaje:"Error interno, reintente más tarde"|500 Internal Server Error|


## Plan de Implementación

1. Ampliar el `DisciplineRepository` y `PostgresDisciplineRepository` con el método `delete`.
2. Implementar la lógica en `DeleteDisciplineUseCase` utilizando el `DisciplineValidator`.
3. Crear la ruta `DELETE` en el controlador y enlazarla a la app de Fastify.
4. Consumir el endpoint desde el servicio de Frontend implementando un modal de confirmación antes de ejecutar la eliminación.