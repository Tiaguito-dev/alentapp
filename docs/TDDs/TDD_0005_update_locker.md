---
id: 0005
estado: Aprobado
autor: Sereno Santiago
fecha: 2026-05-01
titulo: Modificación y Asignación de Casillero (Locker)
---

# TDD-0005: Modificación y Asignación de Casillero (Locker)

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos corregir o modificar la información de un Casillero existente en el sistema, como su estado de cuenta, categoría o datos personales que hayan cambiado o se hayan ingresado incorrectamente.

### User Persona

- Nombre: Julian (Administrativo).
- Necesidad: Asignar un Casillero a un socio que acaba de pedir uno, o marcar un Casillero como "Maintenance" por algun motivo.

### Criterios de Aceptación

- El sistema debe permitir editar la ubicación y el estado del casillero.
- El sistema debe permitir asociar el casillero a un socio existente.
- **Regla crítica:** Un casillero no puede asignarse (vincularse a un socio) si su status es "Maintenance"

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- Endpoint: `PATCH /api/v1/lockers/:number`
- Request Body (UpdateLockerRequest):
```ts
{
    
    location?: string;
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string | null;
}
```
### Componentes de Arquitectura Hexagonal

- Puerto: `LockerRepository` (Método `update(number, data)`).
- Servicio de dominio: `LockerValidator` (Encargado validar el numero del Casillero y si esta en estado maintenace no deja asignarlo).
- Caso de Uso: `UpdateLockerUseCase` (orquesta la validación de unicidad) y puerto de salida LockerRepository.
- Adaptador de Salida: `PostgresLockerRepository` (Actualización usando el método `update` de Prisma).
- Adaptador de Entrada:  `LockerController` (Ruta HTTP ).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Asignar Casillero en Maintenance| Mensaje: "error: casillero en mantenimiento"| 422 Unprocessable Entity  |
| Asignar Socio inexistente  | Mensaje: "error: Socio no existe"             | 404 not found             |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Actualizar las interfaces en el paquete `@alentapp/shared` (`UpdateLockerRequest`).
2. Ampliar el `LockerRepository` con el método `update`.
3. Implementar la lógica en `UpdateLockerUseCase` utilizando el `LockerValidator`.
4. Crear la ruta `PATCH` en el controlador y enlazarla a la app de Fastify.
5. Consumir el endpoint desde el servicio de Frontend y reutilizar el modal de creación para permitir la edición.

## Observaciones Adicionales

- Protección contra Sobreescritura : Si un casillero ya está asignado al Socio A, y el administrativo intenta enviar un request asignándolo al Socio B, el sistema debería rechazar la operación solicitando que primero se desasigne al Socio A. Esto previene errores humanos en el mostrador.

- Transición a Mantenimiento: Si un casillero actualmente ocupado por un socio se rompe y el administrativo intenta cambiar su status a `Maintenance`, el sistema debería alertar o forzar a que primero se reasigne a ese socio a un casillero nuevo, para no dejar a un usuario activo vinculado a un Casillero inhabilitado.

- en el request body no agrego el atributo number porque no es un valor que se deberia poder cambiar ya que es un atributo necesario para conocer el Casillero.