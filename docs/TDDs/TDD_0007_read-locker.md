---
id: 0007
estado: Propuesto
autor: Sereno Santiago
fecha: 2026-05-01
titulo: Listado y Consulta de Casilleros (Lockers)
---

# TDD-0007: Listado y Consulta de Casilleros (Lockers)

## Contexto de Negocio (PRD)

### Objetivo
Proveer una interfaz de lectura rápida para visualizar el inventario completo de casilleros, permitiendo conocer su estado y ubicación.

### User Persona
- Nombre: Julian (Administrativo).
- Necesidad: Encontrar un casillero libre rápidamente cuando un socio lo solicita en el mostrador, o buscar en qué estado se encuentra un número de casillero en particular.

### Criterios de Aceptación
- El campo estado que devuelve la consulta y por el cual se filtra debe corresponder a los valores definidos: Available, Occupied, o Maintenance.
- El sistema debe devolver un listado de todos los casilleros registrados en la base de datos.
- El sistema debe permitir filtrar por: `status` y `member_id`.
- La respuesta debe incluir a qué socio está asignado el casillero (si corresponde).

## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)
-   Endpoints: 
    -   `GET /api/v1/lockers` (Listado general)
    -   `GET /api/v1/lockers/:id` (Detalle por ID)


- Query Params:
{
    status?: 'Available' | 'Occupied' | 'Maintenance';
    member_id?: string;         // UUID
    page?: number;             // default 1
    limit?: number;            // default 20
}



### Componentes de Arquitectura Hexagonal 

- Puerto: `LockerRepository` (Métodos findAll(filters) y findById(id)).

- Caso de Uso: `ListLockersUseCase` (Recupera la lista aplicando filtros opcionales) y GetLockerByIdUseCase (Busca un casillero puntual validando su existencia).

- Adaptador de Salida: `PostgresLockerRepository` (Consultas de lectura usando los métodos findMany y findUnique de Prisma, incluyendo la relación con Member).

- Adaptador de Entrada: `LockerController` (Rutas HTTP GET en Fastify que extraen parámetros y devuelven la data con un status).

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                                          | Código HTTP     |
| --------------------------- | ------------------------------------------------------------| --------------- |
| Casillero inexistente       | Error: "El casillero especificado no fue encontrado"        | 404 Not Found   |
| status con valor no reconocido | Error:  "Estado de casillero inválido"                   | 400 Bad Request |
| Error de conexión a DB      | Error: "Error interno, reintente más tarde"                 | 500 Internal Server Error |
|Formato de memberId inválido | Error: "Formato de ID de socio inválido"                    |400 Bad Request   |

## Plan de Implementación

1. Ampliar el  LockerRepository con los métodos findById y findMany  junto con su implementación en PostgresLockerRepository (asegurando el cruce de datos con la tabla de socios).

2. Implementar los casos de uso ListLockersUseCase y GetLockerByIdUseCase.

3. Exponer las rutas GET /api/v1/lockers y GET /api/v1/lockers/:id en el LockerController y registrarlas en la app de Fastify.

4. En el frontend, agregar la vista de listado/grilla de casilleros con filtros (estado, socio) y paginación.
