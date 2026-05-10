---
version: 2.1
id: 0021
estado: Aprobado
autor: Tiago Solis
fecha: 2026-05-01
titulo: Eliminación de Deportes Existentes
---

# TDD-0021: Eliminación de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrador elimine un deporte del sistema de forma lógica, dejando el registro histórico intacto.

### User Persona

- Nombre: Juanceto (Administrador).
- Necesidad: Dar de baja un deporte que ya no se ofrece, evitando que los miembros puedan seguir inscribiéndose a él, pero sin eliminar completamente el registro del deporte para preservar el historial de inscripciones y datos asociados.

### Criterios de Aceptación

1. El sistema debe validar que el deporte con el id recibido exista y que no esté dado de baja (tenga `deleted_at` nulo).
2. Al dar de baja el deporte, el sistema debe setear la fecha actual en el campo `deleted_at`.
3. Al finalizar, el sistema debe mostrar un mensaje de éxito.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. La eliminación es una operación que no requiere datos en el cuerpo, y se implementará mediante endpoint `DELETE`, pero la operación seteará el campo `deleted_at` (soft delete). Esta eliminación se puede ver reflejada porque en las consultas de deportes (TDD-0022) solo se recuperan aquellos que no tengan `deleted_at` seteado.

- Endpoint: `DELETE /api/v1/sports/:id`

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `delete(id)`, extendiendo la interfaz definida en TDD-0019).
2. **Caso de Uso**: `DeleteSportUseCase` (Verifica que el deporte exista y no esté dado de baja, y llama al repositorio para setear el campo `deleted_at`).
3. **Adaptador de Salida**: `PrismaSportRepository` (Seteo del campo `deleted_at` con la fecha actual usando Prisma).
4. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                   | Código HTTP actual        |
| -------------------------- | -----------------------------------------------------| ------------------------- |
| Deporte no existente       | Mensaje: "No existe deporte con ese id"              | 404 Not Found             |
| Deporte ya dado de baja    | Mensaje: "El deporte ya está dado de baja"           | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`DeleteSportRequest`).
2. Ampliar el `SportRepository` con el método `delete`.
3. Implementar la lógica en `DeleteSportUseCase`.
4. Crear la ruta `DELETE` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el Frontend agregando la acción de baja en el panel de administración.

## Observaciones adicionales

### Motivos de decisión
- Se opta por baja lógica (seteo de `deleted_at`) en lugar de eliminación física, preservando el historial de inscripciones y datos asociados al deporte. Además, las operaciones secuenciales de grandes volúmenes de datos es preferente que las gestione el motor de base de datos debido a su optimización para este tipo de tareas.
- Se sugiere no utilizar un `SportValidator` (validador de dominio) en este caso de uso ya que no hay reglas de negocio sobre los datos recibidos: el único campo que llega es el `id` por URL, y su verificación (existencia y estado de baja) es responsabilidad del caso de uso directamente, por las mismas razones expuestas en TDD-0019 y TDD-0020.

### Puntos que no abordamos en esta etapa
- La cancelación de inscripciones activas se delega a un trigger de base de datos disparado al setearse `deleted_at`. Esto mantiene al `DeleteSportUseCase` libre de dependencias hacia otros repositorios y evita acoplar la lógica de cancelación al caso de uso.