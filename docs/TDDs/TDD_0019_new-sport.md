---
version: 1.0
id: 0019
estado: Propuesto
autor: Tiago Solis
fecha: 2026-05-01
titulo: Registro de Nuevos Deportes
---

# TDD-0019: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Eliminar el registro manual de los deportes en formato papel, permitiendo que un administrativo dé de alta a un deportede forma digital, asegurando la integridad de los datos desde el primer momento.

### User Persona

- Nombre: Juanceto (Administrador).
- Necesidad: Registrar los datos de los nuevos deportes que se incorporan al negocio para que los miembros puedan inscribirse. No puede permitirse nombres de deportes duplicados que ya estén registrados en el reservorio de datos, capacidad máxima de inscripciones sin detallar, ni que la especificación de que si el miembro requere o no certificado médico esté vacía.

### Criterios de Aceptación

1. El sistema debe validar que el nombre del deporte no sea vacío y no esté previamente registrado.
2. El sistema debe permitir que la descripción sea opcional.
3. El sistema debe validar que la capacidad máxima de inscripciones sea mayor a cero.
4. El sistema debe validar que el precio adicional sea opcional, y en caso de ser informado, sea mayor o igual a cero.
5. El sistema debe permitir especificar si el deporte requiere certificado médico.
6. Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario de registro del deporte.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Deporte` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto único.
- `description`: Cadena de texto o nulo.
- `max_capacity`: Número entero positivo mayor a cero.
- `additional_price`: Número decimal positivo (default 0).
- `requires_medical_certificate`: Booleano.
- `createdAt`: Fecha de creación autogenerada.
- `baja`: Fecha de borrado lógico o nulo.

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/deportes`
- Request Body (CreateSportRequest):

```ts
{
    name: string;
    description: string | null;
    max_capacity: number;
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: DeporteRepository (Interface en el Dominio).
2. Caso de Uso: CreateSport (Lógica que verifica si el nombre del deporte ya existe antes de llamar al repositorio).
3. Adaptador de Salida: DB persistence adapter (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario              | Resultado Esperado                                   | Código HTTP               |
| ---------------------- | ---------------------------------------------------- | ------------------------- |
| Nombre ya registrado   | Mensaje: "Ya existe un deporte con ese nombre"       | 409 Conflict              |
| Capacidad máxima ≤ 0   | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| Precio adicional < 0   | Mensaje: "El precio adicional no puede ser negativo" | 400 Bad Request           |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso.
4. Crear formulario en React y conectar con el endpoint del backend.

### Observaciones adicionales: motivos de decisión
- Se asume que el proceso de registro de un nuevo deporte se realiza de forma manual por un administrativo y que el sistema actual no tiene una funcionalidad digital para esto.
- Se opta porque solo el administrador (rol con permisos privilegiados, distinto al rol del administrativo) pueda registrar nuevos deportes, ya que se asume que no cualquiera debería tener la capacidad de dar de alta nuevos deportes a los que puedan inscribirse los miembros, por lo que es considerada como una tarea crítica para el impacto en el negocio, que requiere control y supervisión.
- Respecto al CA N3, en caso de que el usuario deje el campo de precio adicional vacío, se interpretará como que el precio adicional es cero, ya que no se puede asumir un valor negativo ni dejarlo sin especificar.