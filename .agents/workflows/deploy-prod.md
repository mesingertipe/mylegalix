---
description: Sube los cambios actuales a Git y dispara el despliegue automático en DigitalOcean
---

Este workflow automatiza el envío de cambios a la rama `main`, lo que a su vez activa la Action de GitHub para desplegar en el Droplet.

1. Añadir todos los cambios locales.
// turbo
2. git add .

3. Crear un commit con un mensaje descriptivo.
// turbo
4. git commit -m "Despliegue automático: Actualización de MyLegalix"

5. Subir los cambios a la rama principal.
// turbo
6. git push origin main
