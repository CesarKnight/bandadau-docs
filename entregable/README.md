# Documento entregable (Word)

Genera `Bandada-U-Documento-Entregable.docx` siguiendo el índice ICONIX de la asignatura (capítulos I–VI, bibliografía y anexos),
reutilizando la documentación de `../docs/` y renderizando los diagramas Mermaid como imágenes.

```bash
brew install pandoc                                   # una vez
npm i --prefix /tmp/mmdc @mermaid-js/mermaid-cli      # una vez (usa tu Chrome: ver PUPPETEER_CONFIG)
MMDC=/tmp/mmdc/node_modules/.bin/mmdc PUPPETEER_CONFIG=ruta/puppeteer.json node entregable/build.mjs
python3 entregable/make-reference.py                  # solo si cambias estilos (regenera reference.docx)
```

- `capitulos/*.md`: texto propio y directivas `@@include`, `@@uc`, `@@uc-test-summary` que traen contenido de `docs/`.
- Si cambias un documento de `docs/`, vuelve a ejecutar `build.mjs` (las imágenes se guardan en caché en `build/img`).
- Al abrir el .docx, Word pregunta si actualizar campos: responde **Sí** para generar el índice. Completa el nombre del docente en la portada
  y la tabla de la sección 5.5.3 tras el despliegue en la nube.

## Capturas de pantalla (sección 3.6.1)

`capturas/capturar.mjs` abre cada pantalla con los usuarios del seed (estudiante `lucia@`, organizador `org@`, administrador `admin@`)
y guarda los PNG en `capturas/img/`. Requisitos: `make up` + `make seed` en `bandadau-infra`, y los frontends en modo desarrollo
(app `:8081`, panel `:3001` + MFEs `:4201`/`:4301`, landing `:3000`).

```bash
# Si el .env del frontend apunta a una IP de red local vieja, sobrescribe la URL del API solo para esta sesión:
(cd bandadau-frontend && EXPO_PUBLIC_API_URL=http://api.bandada.localhost EXPO_PUBLIC_APP_URL=http://localhost:8081 pnpm web)
CHROME=/ruta/chrome-headless-shell PUPPETEER_DIR=/ruta/con/node_modules/puppeteer-core/.. \
  node entregable/capturas/capturar.mjs [app|panel|landing|all]
```
