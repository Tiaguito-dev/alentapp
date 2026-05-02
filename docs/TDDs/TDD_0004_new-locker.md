---
id: 0004
estado: Propuesto
autor: Sereno Santiago
fecha: 2026-05-01
titulo: Alta de Casillero (Locker)
---

# TDD-0004: Alta de Casillero (Locker)

## Contexto de Negocio (PRD)

### Objetivo

Permitir al personal administrativo registrar nuevos casilleros en el sistema cuando la institución lo requiera.

### User Persona

- Nombre: Julian (Administrativo).
- Necesidad: Cargar rápidamente los nuevos módulos de casilleros indicando su número de identificación y dónde están ubicados.

### Criterios de Aceptación

- El sistema debe permitir ingresar el número, ubicación y estado inicial del casillero.
- El sistema debe garantizar que el número (`number`) de casillero sea único en toda la institución.
- Al crearse, no debe estar asignado a ningún socio por defecto (member_id null).
- El estado inicial al momento de crear el Casillero es `Available`.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Locker` con las siguientes propiedades:
- `id`: UUID (Primary Key).
- `number`: Entero, único (Unique Key) e indexado.
- `location`: Cadena de texto.
- `status`: enumeracion (`Available`, `Occupied`, `Maintenance`).
- `member_id`: UUID (Foreign Key a Member), nullable.

### Contrato de API (@alentapp/shared)

- Endpoint: `POST /api/v1/lockers`
- Request Body (CreateLockerRequest):
```ts
{
    number: number;
    location: string;
    status: 'Available' | 'Occupied' | 'Maintenance';
}
```

### Componentes de Arquitectura Hexagonal

- Puerto: `LockerRepository` (Interface en el Dominio).
- Caso de Uso: `CreateLockerUseCase` (Lógica que verifica si el numero del locker ya existe antes de llamar al repositorio).
- Adaptador de Salida: `PostgresLockerRepository` (Inserción en la base de datos usando el método `create` de Prisma).
- Adaptador de Entrada: `LockerController` (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Número duplicado           | Mensaje: "Ya existe locker con ese numero"    | 409 Conflict              |
| Tipo de dato inválido      | Mensaje: "error de validacion"                | 400 Bad Request           |
| Error de conexión a DB     | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |


## Plan de Implementación


1. Actualizar esquema agregando el modelo Locker y generar la migración.
2. Definir tipos de Request/Response en @alentapp/shared.
3. Implementar el puerto en la capa de Dominio .
4. Desarrollar el caso de uso CreateLockerUseCase.
5. Consumir el endpoint desde el servicio de Frontend y crear el modal de alta de casillero.

## Observaciones Adicionales


1. Normalización de Ubicaciones: Actualmente `location` es un texto libre, esto puede generar problemas por datos repetidos anotados de forma diferente, se tendra que controlar en el frontend.

2. en el modelo de datos, el `number` es indexado porque es un valor por el cual se va a usar como indice para recuperar los Casilleros. 