# Guía de uso: Conventional Commits en Alentapp

Este proyecto sigue el estándar [Conventional Commits](https://www.conventionalcommits.org/), con algunas extensiones en el uso de las reglas que pueden ser encontradas en el archivo `commitlint.config.mjs`. La validación es automática: al ejecutar git commit, Husky activa Commitlint y bloquea los mensajes que no cumplan el formato.

> Si es la primera vez que clonás el repo, o después de hacer pull de esta rama,
> corré `npm install` para instalar las dependencias y activar los hooks de Git.

---

## El formato

Todo commit debe tener esta estructura:

```
tipo(scope): descripción breve
```

Los tres componentes son obligatorios en este proyecto.

---

## Tipos disponibles

Elegí el tipo según qué hace el cambio, no según qué archivos tocaste:

| Tipo       | Usarlo cuando...                                                                 |
| ---------- | -------------------------------------------------------------------------------- |
| `feat`     | Agregás algo nuevo que antes no existía (endpoint, pantalla, funcionalidad)      |
| `fix`      | Corregís algo que estaba roto o funcionaba mal                                   |
| `docs`     | Solo cambiás documentación (README, comentarios, CONTRIBUTING, etc.)             |
| `style`    | Cambios de formato que no afectan la lógica (espacios, punto y coma, indentación)|
| `refactor` | Reorganizás o simplificás código sin cambiar su comportamiento externo            |
| `perf`     | Mejorás rendimiento sin cambiar comportamiento                                   |
| `test`     | Agregás, modificás o corregís tests                                              |
| `chore`    | Tareas de mantenimiento: dependencias, configuración, scripts, CI                |

### Casos que generan duda

**"Cambié código y también escribí el test"** — Dos commits separados: uno `feat` o `fix`, otro `test`. Si son inseparables, usá el tipo principal.

**"Hice un refactor pero también corregí un bug de paso"** — Dos commits separados. Si no podés separarlos, usá `fix` porque tiene mayor impacto.

**"Actualicé el README"** — `docs`, aunque el README esté en la raíz y no en `/docs`.

**"Cambié la configuración de ESLint"** — `chore`.

**"Cambié el formato de un archivo con Prettier"** — `style`.

---

## Scopes disponibles

El scope indica a qué módulo del proyecto pertenece el cambio:

| Scope                 | Cuándo usarlo                                    |
| --------------------- | ------------------------------------------------ |
| `member`              | Cambios en el módulo de miembros                 |
| `locker`              | Cambios en el módulo de casilleros               |
| `medical-certificate` | Cambios en certificados médicos                  |
| `payment`             | Cambios en el módulo de pagos                    |
| `discipline`          | Cambios en el módulo de disciplinas              |
| `sport`               | Cambios en el módulo de deportes                 |

### Cambios que cruzan módulos

Si el cambio toca múltiples módulos, usá el scope del módulo principal afectado. Si realmente es transversal (ej: un cambio en un middleware global), podés omitir el scope — vas a recibir una advertencia pero el commit no se bloqueará.

Si el equipo identifica que falta un scope relevante, acordarlo y agregarlo al `commitlint.config.mjs` mediante un PR.

---

## Ejemplos por situación

### Trabajo en tu entidad asignada

```bash
# Felipe — Payment
feat(payment): agregar endpoint de creación de cobro
fix(payment): corregir cálculo de monto con descuento
test(payment): agregar tests para el servicio de facturación

# Santiago — Locker
feat(locker): implementar asignación automática de casillero
fix(locker): corregir validación de disponibilidad por turno

# Federico — Medical Certificates
feat(medical-certificate): agregar validación de vencimiento
docs(medical-certificate): documentar estados posibles del certificado

# Facundo — Discipline
feat(discipline): crear endpoint de registro de sanción
refactor(discipline): simplificar lógica de cálculo de puntos

# Tiago — Sport
feat(sport): agregar soporte para deportes con equipos
test(sport): cubrir casos borde en la creación de deportes
```

---

## Cómo funciona la validación automática

Al ejecutar `git commit`, Husky intercepta el evento y ejecuta Commitlint antes de que el commit se guarde.

**Commit válido** — se guarda sin inconvenientes:
```
$ git commit -m "feat(payment): agregar endpoint de reembolso"
[feature/payment-refund abc1234] feat(payment): agregar endpoint de reembolso
```

**Commit inválido** — se bloquea con el detalle del error:
```
$ git commit -m "cambios en payment"
⧗   input: cambios en payment
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   scope must not be empty [scope-empty]

✖   found 3 problems, 0 warnings
husky - commit-msg script failed (code 1)
```

**Advertencia (el commit igual se guarda):**
```
$ git commit -m "feat(billing): agregar endpoint de reembolso"
⚠   scope must be one of [member, locker, medical-certificate, payment, discipline, sport] [scope-enum]
⚠   found 0 problems, 1 warning
[feature/billing abc1234] feat(billing): agregar endpoint de reembolso
```

---

## Antes de commitear: probar el mensaje

Para verificar que un mensaje va a pasar sin necesidad de hacer el commit:

```bash
echo "feat(payment): agregar endpoint de reembolso" | npx commitlint
```

Si no devuelve nada, el mensaje es válido. Si devuelve errores o advertencias, los muestra con el mismo formato que al hacer el commit.

---

## Mensajes con cuerpo (opcional)

Para cambios que requieren contexto adicional, se puede agregar un cuerpo al mensaje separado por una línea en blanco:

```bash
git commit -m "fix(locker): corregir asignación cuando no hay casilleros disponibles

El sistema devolvía un error 500 en lugar de un 404 cuando no había
casilleros disponibles para el turno solicitado. Se agrega validación
previa y respuesta apropiada."
```

El cuerpo no tiene restricciones de formato: puede ser tan largo como sea necesario.

---

## Errores comunes

**"scope must not be empty"**
```bash
# Mal — falta el scope
feat: agregar endpoint de reembolso

# Bien
feat(payment): agregar endpoint de reembolso
```

**"type may not be empty" o "type must be one of"**
```bash
# Mal — tipo inválido o ausente
update(payment): ajustes
agregué la pantalla de pagos

# Bien
chore(payment): ajustar configuración del módulo
feat(payment): agregar pantalla de historial de pagos
```

**"header-max-length"** — el encabezado supera 120 caracteres:
```bash
# Mal — demasiado largo
feat(payment): agregar endpoint de reembolso parcial con validación de monto mínimo y notificación al usuario por email

# Bien — descripción más concisa, detalle en el cuerpo si hace falta
feat(payment): agregar endpoint de reembolso parcial
```

**"subject-full-stop"** — la descripción termina con punto:
```bash
# Mal
fix(locker): corregir validación de disponibilidad.

# Bien
fix(locker): corregir validación de disponibilidad
```

---

## Situaciones de emergencia

Si necesitás saltear la validación por una razón excepcional:

```bash
git commit -m "mensaje" --no-verify
```

Esto omite todos los hooks. Debe usarse solo en casos justificados (ej: fix urgente en producción, conflicto de herramientas en el entorno local) y documentarse en el PR correspondiente explicando el motivo.

---

## Referencia rápida

```
feat(scope):     nueva funcionalidad
fix(scope):      corrección de bug
docs(scope):     documentación
style(scope):    formato sin cambio de lógica
refactor(scope): reorganización sin cambio de comportamiento
perf(scope):     mejora de rendimiento
test(scope):     tests
chore(scope):    mantenimiento

Scopes: member | locker | medical-certificate | payment | discipline | sport
```