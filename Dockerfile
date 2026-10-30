# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite SPA -------------------------------------
FROM node:22.23.4-alpine AS build
WORKDIR /app

# Install deps from the lockfile first so this layer caches across source edits.
# devDependencies are required here (tsc, vite live in devDependencies).
# `usb` is an optionalDependency (native node-gyp module) used only by the local
# Electron shell — the web bundle uses WebUSB and never imports it. alpine has no
# Python toolchain, so its build fails; because it's optional, npm warns and
# continues rather than failing the install. (Don't use --omit=optional: it would
# also drop rolldown/esbuild's platform-native bindings that Vite needs.)
# The two in-repo Capacitor plugins are `file:` devDependencies (the iPad build
# finds them that way), so npm needs their manifests in place to link them.
COPY package.json package-lock.json ./
COPY plugins/capacitor-nord-usb/package.json plugins/capacitor-nord-usb/
COPY plugins/capacitor-midi-input/package.json plugins/capacitor-midi-input/
RUN npm ci

# Build: `tsc -b && vite build` -> static assets in /app/dist
COPY . .
RUN npm run build

# --- Docs stage: the documentation site (docs-site/, Astro Starlight) -------
# Its own npm project, served at /docs/ next to the app.
FROM node:22.23.4-alpine AS docs
WORKDIR /docs
COPY docs-site/package.json docs-site/package-lock.json ./
RUN npm ci
COPY docs-site/ ./
RUN npm run build

# --- Runtime stage: serve the static bundle with nginx ---------------------
# Only /app/dist is copied in — no node_modules, no source, no RE tooling.
FROM nginx:1.30.6-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=docs /docs/dist /usr/share/nginx/html/docs

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
