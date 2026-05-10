# Guía de Contribución - Alentapp

¡Gracias por querer contribuir a Alentapp! Para mantener el código limpio y organizado, seguimos estas reglas de contribución.

## 🌿 Estrategia de Ramas (Branching)

No se permite pushear directamente a la rama `main`. Todas las contribuciones deben hacerse a través de **Feature Branches**.

### Formato de nombres de rama:
*   `feature/nombre-de-la-funcionalidad` (para nuevas características)
*   `fix/descripcion-del-error` (para corrección de bugs)
*   `docs/mejoras-en-documentacion` (para cambios en docs)
*   `refactor/nombre-del-cambio` (para mejoras de código sin cambio de lógica)

---

## 🛠 Flujo de Trabajo (Workflow)

1.  **Sincronizar**: Asegúrate de tener la última versión de `main`:
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Crear Rama**: Crea tu rama de trabajo:
    ```bash
    git checkout -b feature/nueva-funcionalidad
    ```
3.  **Desarrollar**: Escribe tu código siguiendo los estándares del proyecto.
4.  **Verificar**: Antes de subir tus cambios, **todos los tests deben pasar**. Consulta la [Guía de Testing](./TESTING.md) para más detalles.
    *   `npm run test` (Unitarios)
    *   `npm run e2e:fullstack:run` (E2E Full-stack)
5.  **Commit**: Realiza commits siguiendo el estándar Conventional Commits definido en la sección [Estándar de Commits](#estándar-de-commits) de este documento. Los commits que no cumplan el formato serán bloqueados automáticamente. 
**(Ver próxima sección para más detalles o consultar la guia correpondiente al archivo COMMITS.MD)**
6.  **Pull Request (PR)**: Sube tu rama y abre un PR hacia `main`. Describe claramente qué cambios introdujiste.

---
 
## Estándar de Commits
**(Para más detalles, consultar la guia correpondiente al archivo COMMITS.MD)**
 
Este proyecto sigue el estándar [Conventional Commits](https://www.conventionalcommits.org/). La validación es automática: al ejecutar git commit, Husky activa Commitlint y bloquea los mensajes que no cumplan el formato.
 
### Formato obligatorio
 
```
tipo(scope): descripción breve
```
 
Reglas aplicadas:
 
- El tipo es obligatorio y debe estar en minúsculas.
- El scope es *obligatorio*. Indica a qué módulo del proyecto pertenece el cambio.
- La descripción es obligatoria, no puede terminar con punto y tiene un máximo de 100 caracteres.
- El encabezado completo (tipo(scope): descripción) tiene un máximo de 120 caracteres.

### Tipos permitidos
 
| Tipo       | Cuándo usarlo                                              |
| ---------- | ---------------------------------------------------------- |
| `feat`     | Se agrega una nueva funcionalidad                          |
| `fix`      | Se corrige un bug o error                                  |
| `docs`     | Cambios en documentación                                   |
| `style`    | Cambios de formato que no afectan la lógica               |
| `refactor` | Refactorización sin agregar funcionalidad ni corregir bugs |
| `perf`     | Mejoras de rendimiento                                     |
| `test`     | Agregado o modificación de tests                           |
| `chore`    | Mantenimiento, actualización de dependencias, configuración|
 
### Scopes del proyecto
 
Los scopes disponibles corresponden a los módulos principales de Alentapp:
 
| Scope                 | Módulo                   |
| --------------------- | ------------------------ |
| `member`              | Gestión de miembros      |
| `locker`              | Casilleros               |
| `medical-certificate` | Certificados médicos     |
| `payment`             | Pagos                    |
| `discipline`          | Disciplinas              |
| `sport`               | Deportes                 |
 
> El uso de un scope fuera de esta lista genera una advertencia pero no bloquea el commit. Si el cambio no encaja en ninguno de los módulos anteriores, evaluar con el equipo si corresponde agregar uno nuevo.
 
### Ejemplos válidos
 
feat(payment): agregar endpoint de reembolso
fix(locker): corregir validación de disponibilidad
docs(sport): actualizar descripción de los endpoints
test(discipline): agregar tests para el servicio de sanciones
chore: actualizar dependencias de desarrollo
refactor(member): simplificar lógica de búsqueda

 
### Testear un mensaje antes de commitear
 
```bash
echo "feat(payment): agregar endpoint de reembolso" | npx commitlint
```
 
### Saltear la validación (uso excepcional)
 
El hook puede saltearse con el flag --no-verify. Esto debe reservarse para situaciones de emergencia y quedar documentado en el PR correspondiente.
 
```bash
git commit -m "mensaje" --no-verify
```

---

## 🎨 Estándares de Código
*   **Linting**: Asegúrate de correr `npm run lint` antes de commitear.
*   **Tipado**: No uses `any` en TypeScript. Define interfaces o tipos para todo.
*   **Documentación**: Si agregas una funcionalidad compleja, actualiza los docs correspondientes.

---

## ✅ Checklist para Pull Requests
* [ ] ¿Pasan todos los tests locales?
* [ ] ¿La rama tiene un nombre descriptivo?
* [ ] ¿Se eliminaron `console.log` o comentarios innecesarios?
* [ ] ¿Se actualizó la documentación si era necesario?
