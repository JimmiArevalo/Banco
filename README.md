## Banco 2FA

Aplicación full stack con autenticación de dos factores para gestionar clientes y productos bancarios, lista para desplegar en Netlify (frontend + funciones serverless) usando Postgres como base de datos principal.

### Arquitectura

- **Frontend**: React + Vite + TypeScript (`frontend/`)
- **Backend**: Express desplegado como función Netlify (`netlify/functions/api.ts`)
- **Base de datos**: Postgres manejado mediante consultas SQL directas
- **Seguridad**: Hash de contraseñas con `bcryptjs`, JWT para sesiones y TOTP (`speakeasy`) como segundo factor

### Requisitos previos

1. Node.js 18+
2. Una instancia de Postgres (Neon, Supabase, Render o local)
3. Cuenta Netlify para desplegar sitio y funciones

### Variables de entorno

Configúralas en Netlify y en tu entorno local (`.env`) antes de ejecutar:

- `DATABASE_URL`: cadena de conexión Postgres
- `JWT_SECRET`: semilla para firmar los tokens
- `ALLOWED_ORIGINS`: (opcional) lista separada por comas de orígenes permitidos, ej. `http://localhost:5173`
- `PGSSL`: establece `1` si tu proveedor exige SSL

### Instalación y configuración

1. **Instala las dependencias:**
```bash
npm install
cd frontend && npm install
```

2. **Configura las variables de entorno:**
   - Crea un archivo `.env` en la raíz del proyecto con:
   ```
   DATABASE_URL=postgres://postgres:1077112698@localhost:5432/Banco
   JWT_SECRET=tu-secret-jwt-muy-seguro-cambiar-en-produccion
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8888
   PGSSL=0
   ```

3. **Inicializa la base de datos:**
```bash
npm run init-db
```
   Esto creará automáticamente las tablas necesarias en PostgreSQL.

### Comandos principales

```bash
# Desarrollo solo frontend (puerto 5173)
npm run dev

# Desarrollo completo: frontend + funciones Netlify (puerto 8888)
npm run dev:netlify

# Inicializar base de datos (solo la primera vez)
npm run init-db

# Build para producción
npm run build
```

### Flujo de autenticación 2FA

1. **Registro**: al crear un cliente se genera un secreto TOTP y una URL `otpauth://` para enrolar Google Authenticator u otra app.
2. **Login paso 1**: el cliente envía correo/contraseña y recibe un `loginToken` temporal (expira en 5 minutos).
3. **Login paso 2**: envía `loginToken` + código TOTP. Si es válido recibe un `accessToken` JWT para operar.

### Funcionalidades del backend

- Crear clientes (`POST /api/auth/register`)
- Iniciar sesión + 2FA (`/api/auth/login`, `/api/auth/verify-otp`)
- Crear productos bancarios para el cliente autenticado
- Listar productos y transacciones
- Consignaciones y retiros simulados con registro histórico
- Consulta de saldos en tiempo real

### Despliegue en Netlify

1. Ejecuta `netlify init` y vincula el repositorio.
2. Configura las variables de entorno en el panel “Site settings > Build & deploy > Environment”.
3. La build `npm run build` compila el frontend (`frontend/dist`) y Netlify empaqueta las funciones en `netlify/functions`.
4. Publica. Netlify expondrá el frontend y las rutas `/api/*` se resolverán vía funciones serverless.

### Próximos pasos sugeridos

- Añadir pruebas automatizadas para servicios críticos.
- Implementar bloqueo de cuenta tras múltiples intentos fallidos.
- Internacionalización y soporte multi-moneda real.

