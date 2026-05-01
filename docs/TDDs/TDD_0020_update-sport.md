---
version: 1.0
id: 0020
estado: Propuesto
autor: Tiago Solis
fecha: 2026-05-01
titulo: Actualización de Deportes Existentes
---

# TDD-0020: Actualización de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrador modifique la información de un deporte ya registrado en el sistema, corrigiendo datos incorrectos o actualizando condiciones del deporte (como su capacidad máxima o precio adicional) sin necesidad de eliminar y volver a crear el registro.

### User Persona

- Nombre: Juanceto (Administrador).
- Necesidad: Editar los datos de un deporte existente desde el panel de administración. Por ejemplo, actualizar la capacidad máxima de un deporte ante una nueva temporada, corregir un nombre mal tipeado, o habilitar/deshabilitar el requerimiento de certificado médico. No puede permitirse que un deporte quede con un nombre duplicado respecto a otro ya registrado, con capacidad máxima sin detallar o con un precio adicional negativo.

### Criterios de Aceptación

1. El sistema debe permitir actualizar uno, varios o todos los campos del deporte (menos el id).
2. El sistema debe validar que, si se modifica el nombre, este no esté previamente registrado en el reservorio de datos.
3. El sistema debe validar que, si se modifica la capacidad máxima, sea mayor a cero.
4. El sistema debe validar que, si se modifica el precio adicional, sea mayor o igual a cero.
5. Si la edición es correcta, debe mostrar un mensaje de éxito e imprimir los datos del deporte con sus campos actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. Todos los campos son opcionales ya que se trata de una actualización parcial (PATCH a nivel de negocio, aunque el endpoint implemente PUT).

- Endpoint: `PUT /api/v1/deportes/:id`
- Request Body (UpdateSportRequest):

```ts
{
    name?: string;
    description?: string | null;
    max_capacity?: number;
    additional_price?: number;
    requires_medical_certificate?: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `update(id, data)`, extendiendo la interfaz definida en TDD-0019).
2. **Servicio de Dominio**: `SportValidator` (Encargado de validar las reglas de negocio relacionadas con el deporte).
3. **Caso de Uso**: `UpdateSportUseCase` (Delega la validación en `SportValidator`, verifica, excluyendo al propio deporte, que el nombre no esté registrado y llama al repositorio).
4. **Adaptador de Salida**: `PrismaSportRepository` (Actualización usando el método `update` de Prisma).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP que extrae el `id` de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                                   | Código HTTP actual        |
| -------------------------- | -----------------------------------------------------| ------------------------- |
| Deporte no existente       | Mensaje: "No existe deporte con ese id"              | 400 Bad Request           |
| Nombre ya registrado       | Mensaje: "Ya existe un deporte con ese nombre"       | 409 Conflict              |
| Capacidad máxima ≤ 0       | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| Precio adicional < 0       | Mensaje: "El precio adicional no puede ser negativo" | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateSportRequest`).
2. Ampliar el `SportRepository` con el método `update`.
3. Implementar la lógica en `UpdateSportUseCase` utilizando el `SportValidator` centralizado.
4. Crear la ruta `PUT` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.

### Observaciones adicionales: motivos de decisión
- Solo el administrador (rol con permisos privilegiados) puede modificar deportes, por los mismos motivos expuestos en TDD-0019: se trata de una tarea crítica para el negocio que requiere control y supervisión.
- La validación de nombre duplicado excluye al propio deporte que se está editando, para evitar un falso positivo al guardar sin cambiar el nombre.
- Si el campo additional_price se envía como null o vacío, se interpreta como cero, en línea con la decisión tomada en TDD-0019.
- Se opta por PUT en el endpoint aunque el comportamiento sea una actualización parcial (campos opcionales), manteniendo consistencia con la convención ya establecida en TDD-0002.