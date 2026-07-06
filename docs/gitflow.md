# Gitflow del proyecto

Este proyecto usa un Gitflow basico para separar codigo estable, integracion y trabajo por funcionalidades.

## Ramas principales

- `main`: contiene la version estable del proyecto.
- `develop`: integra los avances antes de pasar a `main`.

## Ramas de trabajo

Las nuevas funcionalidades se trabajan en ramas con el prefijo `feature/`.

Ejemplos:

- `feature/mentor-search`
- `feature/time-credits`
- `feature/landing-content`
- `feature/trust-and-reviews`

Las ramas no deben usar codigos de historias de usuario, numeros tipo `US`, ni identificadores de requerimientos.

## Flujo recomendado

1. Actualizar `develop`.
2. Crear una rama `feature/...` desde `develop`.
3. Hacer commits pequenos y descriptivos.
4. Subir la rama al remoto.
5. Integrar la rama a `develop` cuando el cambio este listo.
6. Pasar de `develop` a `main` solo cuando la version sea estable.

## Convencion de commits

Usar mensajes claros y cortos:

- `feat: add mentor search section`
- `style: improve responsive layout`
- `docs: document gitflow workflow`
- `fix: adjust navigation behavior`

Cada commit debe representar un cambio entendible y verificable.
