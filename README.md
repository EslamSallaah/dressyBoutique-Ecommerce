# DressyBoutique — clothing storefront

A React storefront backed by two independently runnable Spring Boot services:

| App | Port | Responsibility |
| --- | ---: | --- |
| `frontend/` | 5173 | Storefront, product browsing, shopping bag, account screens |
| Root Spring Boot app | 8082 | Customer registration, login, and JWT identity validation |
| `product-service/` | 8083 | Public catalog and JWT-protected test orders |

Both backend services use their own H2 file database under `data/`. The catalog seeds its sample products on first startup.

## Run locally

Requirements: Java 17+, Node.js 20.19+ (or 22.12+).

Open three terminals from the project root:

```powershell
# Terminal 1 — identity service
.\mvnw.cmd spring-boot:run
```

```powershell
# Terminal 2 — product service
.\mvnw.cmd -f product-service\pom.xml spring-boot:run
```

```powershell
# Terminal 3 — React storefront
Set-Location frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api/auth` to the identity service and `/api/products` and `/api/orders` to the catalog service.

## Deploy the storefront to Netlify

Netlify hosts the React frontend; it does not run these Spring Boot services. Deploy the identity and product services separately, then configure the Netlify site with these build environment variables:

- `VITE_IDENTITY_API_URL` — public base URL of the identity service (for example, `https://your-identity-service.example.com`)
- `VITE_CATALOG_API_URL` — public base URL of the product service (for example, `https://your-product-service.example.com`)

The included `netlify.toml` sets the frontend base directory, production build, publish directory, Node version, and SPA fallback. In each backend's hosting environment, set `FRONTEND_ORIGINS` to the exact Netlify site origin (for example, `https://your-site.netlify.app`) and set the same strong `JWT_SECRET` on both services. Keep the Netlify URLs free of trailing path components; API paths are appended by the frontend.

The backend services also need persistent database storage before using real customer accounts. Their current H2 file databases are intended for local development and may not persist on many hosting platforms.

## API

- `POST /api/auth/register` — create an account (`name`, `email`, `password`; password must be 8–72 characters)
- `POST /api/auth/login` — authenticate and receive a signed, one-hour JWT
- `GET /api/auth/me` — validate the bearer token and return the current customer
- `GET /api/products` — list catalog products
- `GET /api/products?category=Clothing` — filter by category
- `POST /api/orders` — create an authenticated test purchase with `{"items":[{"productId":1,"quantity":2}]}`

Registration validates the request, normalizes email addresses, and stores BCrypt password hashes. The identity service signs JWTs, and both services validate them. The catalog calculates order totals from its own product prices and persists each test purchase. Test checkout simulates completion only; it does not collect card details or charge money. The included JWT secret is for local development only; set the same `JWT_SECRET` value for both services before deploying. The frontend keeps the bearer token in local storage; production deployments should use a carefully configured secure, HttpOnly cookie and HTTPS.

The shopping bag persists locally, and a test order can be placed after signing in. This is not a real payment system.

## Verify

```powershell
.\mvnw.cmd test
.\mvnw.cmd -f product-service\pom.xml test
Set-Location frontend
npm run build
```
