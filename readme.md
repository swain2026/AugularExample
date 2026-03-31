# Angular CMS Admin

A full-featured CMS admin panel built with Angular 19 (standalone components) and Tailwind CSS, backed by a FastAPI JWT-authenticated REST API.

## Features

- JWT authentication (login / auto-logout on 401)
- Dashboard with live stats
- User management (CRUD + role assignment + pagination)
- Role management (CRUD + permissions)
- Route guards protecting all authenticated pages
- HTTP interceptor auto-attaches Bearer token

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 19 (standalone, signals) |
| Styling | Tailwind CSS 3 |
| HTTP | Angular HttpClient + functional interceptor |
| Auth | JWT (stored in localStorage) |
| API | FastAPI — `http://localhost:8000` |

## Project Structure

```
cms-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         auth.guard.ts
│   │   │   ├── interceptors/   auth.interceptor.ts
│   │   │   ├── models/         auth.model.ts, user.model.ts
│   │   │   └── services/       auth.service.ts, user.service.ts, role.service.ts
│   │   ├── features/
│   │   │   ├── auth/login/     login.component.ts
│   │   │   ├── dashboard/      dashboard.component.ts
│   │   │   ├── users/          user-list, user-form
│   │   │   └── roles/          role-list, role-form
│   │   └── shared/
│   │       └── components/layout/  layout.component.ts (sidebar nav)
│   ├── environments/
│   │   ├── environment.ts          (dev — apiUrl: http://localhost:8000)
│   │   └── environment.prod.ts
│   ├── styles.css                  (Tailwind + component classes)
│   └── main.ts
├── angular.json
├── tailwind.config.js
└── package.json
```

## API Endpoints Expected

| Method | Path | Description |
|---|---|---|
| POST | `/auth/token` | Login (form-data: username, password) |
| GET | `/users?page=&size=` | List users (paginated) |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |
| GET | `/roles` | List all roles |
| POST | `/roles` | Create role |
| PUT | `/roles/{id}` | Update role |
| DELETE | `/roles/{id}` | Delete role |

Full API docs: http://localhost:8000/docs

## Getting Started

```bash
cd cms-app

# Install dependencies
npm install

# Start dev server
npm start
```

App runs at `http://localhost:4200`.

## Authentication Flow

1. User submits credentials on `/login`
2. `AuthService` POSTs to `/auth/token` with `application/x-www-form-urlencoded` (FastAPI OAuth2 format)
3. JWT stored in `localStorage`
4. `authInterceptor` attaches `Authorization: Bearer <token>` to every request
5. On 401 response, user is automatically logged out and redirected to `/login`
6. `authGuard` protects all routes under the layout shell

## Changing the API URL

Edit `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://your-api-host:port'
};
```
