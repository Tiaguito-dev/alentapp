---
id: 0006
estado: Propuesto
autor: Sereno Santiago
fecha: 2026-05-01
titulo: Baja de Casillero (Locker)
---

# TDD-0006: Baja de Casillero (Locker)

## Contexto de Negocio (PRD)

### Objetivo

Permitir la eliminación de un casillero del sistema en caso de que sea removido físicamente de las instalaciones de manera permanente o desechado.

### User Persona

-  Nombre: Julian (Administrativo).
-   Necesidad: Mantener el inventario digital sincronizado con la realidad del club, eliminando Casilleros que ya no existen para no generar confusión.

### Criterios de Aceptación

-   El sistema debe permitir eliminar un casillero mediante su identificador único.
-  Por razones de integridad, el sistema debe impedir la eliminación de un casillero si actualmente se encuentra ocupado por un socio (tiene un `member_id` asignado).

## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)

-  Endpoint: `DELETE /api/v1/lockers/:id`
-  Request Body: (Vacío)

### Componentes de Arquitectura Hexagonal

  - puerto: `LockerRepository` (Método `delete(id)`).
  - Caso de uso: `DeleteLockerUseCase` (Comprueba existencia previa vía findById, valida que no tenga un socio asignado, y delega la eliminación).
  - adapador de entrada: `LockerController` (Ruta HTTP en Fastify que extrae el id de los parámetros y devuelve un status 204).
  - adaptador de salida: `PostgresLockerRepository` (Eliminación usando el método `delete` de Prisma).  

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                                          | Código HTTP     |
| --------------------------- | ------------------------------------------------------------| --------------- |
| Casillero no existe         | Error: "El casillero especificado no fue encontrado"        | 404 Not Found   |
| Dar de baja Casillero ocupado| Error: "No se puede eliminar un casillero ocupado por un socio"| 409 Conflict |
| Error de conexión a DB      | Mensaje: "Error interno, reintente más tarde"            |500 Internal Server Error|



## Plan de Implementación

1. Ampliar el `LockerRepository` y `PostgresLockerRepository` con el método `delete`.
2. Implementar la lógica en `DeleteLockerUseCase` utilizando el `LockerValidator` centralizado para comprobar que el casillero no esté asignado.
3. Crear la ruta `DELETE` en el controlador y enlazarla a la app de Fastify.
4. Consumir el endpoint desde el servicio de Frontend implementando un modal de confirmación antes de ejecutar la eliminación.

## Observaciones Adicionales

- En este caso se realiza un borrado fisico que elimina el Casillero, pero tal vez no siempre sea la mejor opcion, ya que si se quiere tener un registro historico, para esos casos se necesita un borrado logico, pero por un tema de simplicidad se aplica el borrado fisico sino se tendria que agregar una nueva opcion en status que sea "deleted".