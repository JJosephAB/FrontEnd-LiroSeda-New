# LirioAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend API

The frontend calls the Spring Boot API at `http://10.20.10.9:8490/api` by default.
Set `window.LIRIO_API_BASE_URL` in `public/runtime-config.js` to the deployed API
base URL (including `/api`) before serving the generated frontend.
The login screen uses `POST /auth/login` with `{ "correo": "...", "clave": "..." }`.
The returned JWT is kept in session storage and sent as a Bearer token on
subsequent requests. Products, suppliers, orders, inventory entries, and inventory exits use
`/productos`, `/productos-sedes`, `/modelos`, `/sedes`, `/proveedores`,
`/pedidos`, `/estados`, `/entradas`, `/salidas`, and `/motivos`.

Order, entry, and exit screens obtain the authenticated user's ID and assigned
site from `GET /usuarios/me`, then use that site's stock. Products, orders,
entries, and exits support editing; entries, orders, and exits allow multiple
detail lines in the same operation. The backend must allow the frontend's
origin through its CORS configuration; the provided backend defaults to
`http://localhost:4200`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
