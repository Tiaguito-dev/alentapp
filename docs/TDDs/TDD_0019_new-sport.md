---
version: 2.3
id: 0019
estado: Aprobado
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

1. El sistema debe validar que el nombre del deporte no sea vacío y no esté registrado en un deporte existente con `deleted_at` nulo.
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
- `description`: Cadena de texto.
- `max_capacity`: Número entero positivo mayor a cero.
- `additional_price`: Número decimal positivo (default 0).
- `requires_medical_certificate`: Booleano.
- `createdAt`: Fecha de creación autogenerada.
- `deleted_at`: Fecha de borrado lógico o nulo (default null).

### Contrato de API (@alentapp/shared)

Definiremos los tipos en el paquete compartido para asegurar sincronización:

- Endpoint: `POST /api/v1/sports`
- Request Body (CreateSportRequest):

```ts
{
    name: string;
    description?: string;
    max_capacity: number;
    additional_price?: number;
    requires_medical_certificate: boolean;
}
```

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Interface en el Dominio).
2. `SportValidator` (Servicio de dominio encargado de validar invariantes, reglas de negocio y que el nombre no se repita en la base de datos).    
3. **Caso de Uso**: `CreateSportUseCase` (Lógica que verifica las reglas de negocio usando al validador y el repositorio).
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
3. Implementar el repositorio y el caso de uso.
4. Crear la ruta `POST` en el controlador y enlazarla a la app de Fastify.
5. Crear formulario en React y conectar con el endpoint del backend.

### Observaciones adicionales: motivos de decisión
- Se asume que el proceso de registro de un nuevo deporte se realiza de forma manual por un administrativo y que el sistema actual no tiene una funcionalidad digital para esto.
- Respecto al CA N3, en caso de que el usuario deje el campo de precio adicional vacío, se interpretará como que el precio adicional es cero, ya que no se puede asumir un valor negativo ni dejarlo sin especificar.
- La verificación de unicidad de nombre se realiza únicamente contra deportes activos, esto es, aquellos con `deleted_at = null`. Un deporte dado de baja lógicamente no bloquea el registro de un nuevo deporte con el mismo nombre, ya que desde la perspectiva del negocio ese nombre queda liberado al darse de baja.

## Modificaciones
### v2.1 - 2026-05-14
- La verificación de unicidad de nombre no se delega a un validador de dominio del tipo `SportValidator`, sino que la realiza el `CreateSportUseCase` directamente, ya que dicha validación requiere consultar el estado persistido del sistema mediante el repositorio.
- Un `SportValidator`, en caso de ser aplicado, se concibe como un servicio de dominio, encargado únicamente de validar invariantes y reglas de negocio que puedan evaluarse sin acceso a infraestructura ni persistencia.