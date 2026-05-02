---
version: 1.0
id: 0022
estado: Propuesto
autor: Tiago Solis
fecha: 2026-05-01
titulo: Consulta de Deportes Existentes
---

# TDD-0022: Consulta de Deportes Existentes

## Contexto de Negocio (PRD)

### Objetivo

Permitir al administrador/administrativo consultar los deportes del sistema, tanto en listado como en detalle por ID, para gestionar la oferta deportiva disponible para los miembros.

### User Persona

- Nombre: Lucía (Administrativa).
- Necesidad: Ver el listado de deportes para conocer la oferta vigente y consultar el detalle de un deporte puntual para verificar su configuración. Los deportes dados de baja lógicamente no deben aparecer en ninguna de las dos consultas.

### Criterios de Aceptación

1. El sistema debe validar que el deporte con el id recibido exista y no tenga `logical_delete` seteado.
2. El sistema debe permitir recuperar el listado de deportes que no tengan no tengan `logical_delete` seteado.
3. El sistema debe permitir recuperar el detalle de un deporte puntual por su `id`.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Se utilizará el paquete compartido para definir el cuerpo de la petición. No se introducen cambios al modelo definido en TDD-0019. La consulta opera sobre los mismos campos persistidos.

## Listado de Deportes:
- Endpoint Listado: `GET /api/v1/sports`
- Request Body (UpdateMemberRequest):
## Detalle de Deporte:
- Endpoint Detalle: `GET /api/v1/sports/:id`
- Request Body (UpdateMemberRequest):

### Componentes de Arquitectura Hexagonal

1. **Puerto**: `SportRepository` (Método `findById(id)` y `findAll()`, extendiendo la interfaz definida en TDD-0019. Ambos métodos filtran por `logical_delete=null` internamente).
2. **Caso de Uso**: `ListSportsUseCase` (Llama al repositorio y devuelve el listado de deportes activos).
3. **Caso de Uso**: `GetSportByIdUseCase` (Recupera un deporte por ID y verifica que no esté dado de baja antes de devolverlo).
4. **Adaptador de Salida**: `PrismaSportRepository` (Consulta usando los métodos `findMany` y `findUnique` de Prisma, filtrando por `logical_delete=null`).
5. **Adaptador de Entrada**: `SportController` (Rutas `GET /api/v1/sports` y `GET /api/v1/sports/:id` que devuelven status 200).

## Casos de Borde y Errores

| Escenario                     | Resultado Esperado                            | Código HTTP actual        |
| ----------------------------- | --------------------------------------------- | ------------------------- |
| Deporte inexistente (por ID)  | Mensaje: "No existe deporte con ese id"       | 404 Not Found             |
| Deporte dado de baja (por ID) | Mensaje: "No existe deporte con ese id"       | 404 Not Found             |
| Sin deportes activos en el sistema | Mensaje: "No hay deportes activos disponibles" | 404 Not Found       |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Ampliar el puerto `SportRepository` con los métodos `findById` y `findAll`, junto con su implementación en `PrismaSportRepository`.
2. Implementar los casos de uso `ListSportsUseCase` y `GetSportByIdUseCase`.
3. Exponer las rutas `GET /api/v1/sports` y `GET /api/v1/sports/:id` en el `SportController` y registrarlas en la app de Fastify.
4. Consumir los endpoints desde el Frontend para mostrar el listado y el detalle de deportes en el panel de administración.

### Observaciones adicionales: motivos de decisión

- Los deportes con `logical_delete` seteado se excluyen en todas las consultas sin necesidad de ningún parámetro explícito del cliente. Esta lógica se encapsula en el repositorio para que ningún caso de uso pueda exponer accidentalmente deportes dados de baja.
- El detalle por `id` devuelve el mismo mensaje de error que el caso de deporte inexistente (`"No existe deporte con ese id"`) cuando el deporte tiene `logical_delete` seteado. Esto es intencional: desde la perspectiva del cliente, un deporte dado de baja equivale a un deporte que no existe.
- No se incorpora paginación en esta etapa dado que el volumen esperado de deportes en el sistema es acotado al no ser una entidad transaccional. En caso de que el negocio escale, puede incorporarse siguiendo el mismo esquema definido en TDD-0015.
- No se utiliza ``SportValidator` ya que no hay reglas de negocio sobre los datos recibidos: las únicas entradas son el `id` por URL (en el detalle) y ninguna en el listado.