---
id: 0007
estado: Aprobado
autor: Sereno Santiago
fecha: 2026-05-01
titulo: Consulta de Casilleros Existentes 
---

# TDD-0007: Consulta de Casilleros Existentes 

## Contexto de Negocio (PRD)

### Objetivo
Proveer una interfaz de lectura rápida para visualizar el inventario completo de casilleros, permitiendo conocer su estado y ubicación.

### User Persona
- Nombre: Julian (Administrativo).
- Necesidad: Listar todos los casilleros del lugar y mostrar en que estado se encuentran.

### Criterios de Aceptación
- El campo estado que devuelve la consulta debe corresponder a los valores definidos: Available, Occupied, o Maintenance.
- El sistema debe devolver un listado de todos los casilleros registrados en la base de datos.

## Diseño Técnico (RFC)


### Contrato de API (@alentapp/shared)
-   Endpoints: 
    -   `GET /api/v1/lockers` (Listado general)
    -   `GET /api/v1/lockers/:number` (Detalle por Numero)



### Componentes de Arquitectura Hexagonal 

- Puerto: `LockerRepository` (Métodos findAll() y findByNumber(number)).

- Caso de Uso: `ListLockersUseCase` (Recupera la lista ) y `GetLockerByNumberUseCase` (Busca un casillero puntual validando su existencia).

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

1. Ampliar el  LockerRepository con los métodos findBynumber y findMany  junto con su implementación en PostgresLockerRepository (asegurando el cruce de datos con la tabla de socios).

2. Implementar los casos de uso ListLockersUseCase y GetLockerByNumberUseCase.

3. Exponer las rutas GET /api/v1/lockers y GET /api/v1/lockers/:number en el LockerController y registrarlas en la app de Fastify.

4. En el frontend, agregar la vista de listado/grilla de casilleros.
