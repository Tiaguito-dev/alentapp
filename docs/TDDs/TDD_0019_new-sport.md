---
version: 1.2
id: 0019
estado: Propuesto
autor: Tiago Solis
fecha: 2026-05-01
titulo: Registro de Nuevos Deportes
---

# TDD-0019: Registro de Nuevos Deportes

## Contexto de Negocio (PRD)

### Objetivo

Eliminar el registro manual de los deportes en formato papel, permitiendo que un administrativo dé de alta a un deporte de forma digital, asegurando la integridad de los datos desde el primer momento.

### User Persona

- Nombre: Juanceto (Administrador).
- Necesidad: Registrar los datos de los nuevos deportes que se incorporan al negocio para que los miembros puedan inscribirse. No puede permitirse nombres de deportes duplicados que ya estén registrados en el reservorio de datos, capacidad máxima de inscripciones sin detallar, ni que la especificación de que si el miembro requiere o no certificado médico esté vacía.

### Criterios de Aceptación

1. El sistema debe validar que el nombre del deporte no sea vacío y no esté registrado en un deporte existente con `logical_delete` nulo.
2. El sistema debe permitir que la descripción sea opcional.
3. El sistema debe validar que la capacidad máxima de inscripciones sea mayor a cero.
4. El sistema debe validar que el precio adicional sea opcional, y en caso de ser informado, sea mayor o igual a cero.
5. El sistema debe permitir especificar si el deporte requiere certificado médico.
6. Al finalizar, el sistema debe mostrar un mensaje de éxito y limpiar el formulario de registro del deporte.

## Diseño Técnico (RFC)

### Modelo de Datos 

Se definirá la entidad `Deporte` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `name`: Cadena de texto.
- `description`: Cadena de texto o nulo.
- `max_capacity`: Número entero positivo mayor a cero.
- `additional_price`: Número decimal positivo (default 0).
- `requires_medical_certificate`: Booleano.
- `createdAt`: Fecha de creación autogenerada.
- `logical_delete`: Fecha de borrado lógico o nulo (default null).

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/sports`
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

1. **Puerto**: `SportRepository` (Interface en el Dominio).
2. **op**: `SportValidator` (Encargado de validar las reglas de negocio relacionadas con el deporte).
3. **Caso de Uso**: `CreateSportUseCase` (Delega la validación en `SportValidator`, verifica que el nombre no esté registrado y llama al repositorio).
4. **Adaptador de Salida**: `PrismaSportRepository` (Implementación del puerto SportRepository usando Prisma sobre PostgreSQL).
5. **Adaptador de Entrada**: `SportController` (Ruta HTTP).

## Casos de Borde y Errores

| Escenario              | Resultado Esperado                                   | Código HTTP               |
| ---------------------- | ---------------------------------------------------- | ------------------------- |
| Nombre ya registrado en un deporte activo   | Mensaje: "Ya existe un deporte con ese nombre"       | 409 Conflict              |
| Capacidad máxima ≤ 0   | Mensaje: "La capacidad máxima debe ser mayor a cero" | 400 Bad Request           |
| Precio adicional < 0   | Mensaje: "El precio adicional no puede ser negativo" | 400 Bad Request           |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde"        | 500 Internal Server Error |

## Plan de Implementación

1. Definir esquema de persistencia y correr migración.
2. Crear tipos en shared y puerto en el Dominio.
3. Implementar el repositorio y el caso de uso utilizando el `SportValidator` centralizado.
4. Crear la ruta `POST` en el controlador y enlazarla a la app de Fastify.
5. Crear formulario en React y conectar con el endpoint del backend.

### Observaciones adicionales: motivos de decisión
- Se asume que el proceso de registro de un nuevo deporte se realiza de forma manual por un administrativo y que el sistema actual no tiene una funcionalidad digital para esto.
- Se opta porque solo el administrador (rol con permisos privilegiados, distinto al rol del administrativo) pueda registrar nuevos deportes, ya que se asume que no cualquiera debería tener la capacidad de dar de alta nuevos deportes a los que puedan inscribirse los miembros, por lo que es considerada como una tarea crítica para el impacto en el negocio, que requiere control y supervisión.
- Respecto al CA N3, en caso de que el usuario deje el campo de precio adicional vacío, se interpretará como que el precio adicional es cero, ya que no se puede asumir un valor negativo ni dejarlo sin especificar.
- La verificación de unicidad de nombre no se delega al `SportValidator` sino que la realiza el `CreateSportUseCase` directamente, ya que el `SportValidator` es un servicio de dominio puro y no debe conocer al repositorio, ya que hacerlo introduciría una dependencia hacia la capa de infraestructura, violando el principio de que un objeto solo debe interactuar con sus colaboradores directos. La verificación contra el estado persistido es responsabilidad del caso de uso, que sí tiene acceso legítimo al repositorio.
- La verificación de unicidad de nombre se realiza únicamente contra deportes activos, esto es, aquellos con `logical_delete = null`. Un deporte dado de baja lógicamente no bloquea el registro de un nuevo deporte con el mismo nombre, ya que desde la perspectiva del negocio ese nombre queda liberado al darse de baja.