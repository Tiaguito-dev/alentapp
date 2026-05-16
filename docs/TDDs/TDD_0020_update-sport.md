---
version: 2.2
id: 0020
estado: Aprobado
autor: Tiago Solis
fecha: 2026-05-01
titulo: Actualización de Deportes Existentes
---

# TDD-0020: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrador modifique ciertos datos configurables de un deporte ya registrado en el sistema, como su descripción, capacidad máxima, precio adicional o requerimiento de certificado médico, sin necesidad de eliminar y volver a crear el registro.

### User Persona

- Nombre: Juanceto (Administrador).
- Necesidad: Editar los datos de un deporte existente desde el panel de administración. Por ejemplo, actualizar la capacidad máxima de un deporte ante una nueva temporada o habilitar/deshabilitar el requerimiento de certificado médico. No puede permitirse que el nombre del deporte pueda ser modificado.

### Criterios de Aceptación

1. El sistema solo debe permitir la actualización de los campos ´description´, ´max_capacity´, ´additional_price´ y ´requires_medical_certificate´.
2. Si se intenta modificar el campo `name`, el sistema debe rechazar la solicitud con un mensaje de error indicando que el nombre del deporte no puede ser modificado.
3. El sistema debe validar que, si se modifica la capacidad máxima, sea mayor a cero.
4. El sistema debe validar que, si se modifica el precio adicional, sea mayor o igual a cero.
5. Si la edición es correcta, debe mostrar un mensaje de éxito e imprimir los datos del deporte con sus campos actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial.

Aquellos campos enviados por el cliente como null serán ignorados en la actualización, a excepción de description que puede ser null.

- Endpoint: `PATCH /api/v1/sports/:id`
- Request Body (UpdateSportRequest):

```ts
{
    name?: string | null;
    description?: string | null;
    max_capacity?: number | null;
    additional_price?: number | null;
    requires_medical_certificate?: boolean | null;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `update(id, data)`, extendiendo la interfaz definida en TDD-0019).
2. **Caso de Uso**: `UpdateSportUseCase` (Lógica que verifica las reglas de negocio, valida los campos y llama al repositorio).
3. **Adaptador de Salida**: `PrismaSportRepository` (Actualización usando el método `update` de Prisma).
4. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                   | Código HTTP actual        |
| -------------------------- | -----------------------------------------------------| ------------------------- |
| Deporte no existente       | Mensaje: "No existe deporte con ese id"              | 404 Not Found             |
| Intento de modificación del campo `name`       | Mensaje: "El nombre del deporte no puede ser modificado"       | 409 Conflict              |
| Capacidad máxima ≤ 0       | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| Precio adicional < 0       | Mensaje: "El precio adicional no puede ser negativo" | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateSportRequest`).
2. Ampliar el `SportRepository` con el método `update`.
3. Implementar la lógica en `UpdateSportUseCase`.
4. Crear la ruta `PATCH` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.

### Observaciones adicionales: motivos de decisión

- Si el campo additional_price se envía como null o vacío, se interpreta como cero, en línea con la decisión tomada en TDD-0019.
- Se opta por `PATCH` en el endpoint aunque el comportamiento sea una actualización parcial (campos opcionales), manteniendo consistencia con la convención ya establecida en TDD-0002.
- Se admite el campo name en el cuerpo de la petición para facilitar la validación, pero se rechaza cualquier intento de modificarlo, asegurando que el nombre del deporte permanezca inmutable. Esto a fin de hacer explícita la regla de negocio que dice que *"El atributo name es inmutable después de la creación (solo se permite editar descripción y cupo)."*

### Puntos que no abordamos en esta etapa
- La lógica de actualización del campo `max_capacity` de un deporte que tenga inscripciones activas será motivo de una futura implementación.