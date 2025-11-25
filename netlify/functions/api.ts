import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import serverless from "serverless-http";
import { verifyAccessToken } from "./lib/auth";
import { ensureSchema } from "./lib/db";
import {
  getClientById,
  initiateLogin,
  registerClient,
  verifyOtpForLogin,
} from "./lib/services/clients";
import {
  createProduct,
  depositToProduct,
  getProduct,
  getTransactions,
  listProducts,
  withdrawFromProduct,
} from "./lib/services/products";
import {
  loginSchema,
  movementSchema,
  otpSchema,
  productSchema,
  registerSchema,
} from "./lib/validations";

const app = express();
const schemaReady = ensureSchema().catch((err) => {
  console.error("Error inicializando el esquema", err);
  throw err;
});

app.use(cors());
app.use(express.json());

// Middleware para remover el prefijo /api del path si existe
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

app.use(async (_req, _res, next) => {
  await schemaReady;
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await registerClient(body);
    res.status(201).json(result);
  })
);

app.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const login = await initiateLogin(body.email, body.password);
    res.json(login);
  })
);

app.post(
  "/auth/verify-otp",
  asyncHandler(async (req, res) => {
    const body = otpSchema.parse(req.body);
    const result = await verifyOtpForLogin(body.loginToken, body.code);
    res.json(result);
  })
);

app.get(
  "/clients/me",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const client = await getClientById(req.clientId!);
    res.json(client);
  })
);

app.post(
  "/products",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = productSchema.parse(req.body);
    const product = await createProduct(req.clientId!, body);
    res.status(201).json(product);
  })
);

app.get(
  "/products",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const products = await listProducts(req.clientId!);
    res.json(products);
  })
);

app.get(
  "/products/:id",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const product = await getProduct(req.clientId!, req.params.id);
    res.json(product);
  })
);

app.get(
  "/products/:id/transactions",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    await getProduct(req.clientId!, req.params.id);
    const transactions = await getTransactions(req.params.id);
    res.json(transactions);
  })
);

app.post(
  "/products/:id/deposit",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = movementSchema.parse({
      amount: Number(req.body.amount),
      description: req.body.description,
    });
    const product = await depositToProduct(
      req.clientId!,
      req.params.id,
      body.amount,
      body.description
    );
    res.json(product);
  })
);

app.post(
  "/products/:id/withdraw",
  authGuard,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = movementSchema.parse({
      amount: Number(req.body.amount),
      description: req.body.description,
    });
    const product = await withdrawFromProduct(
      req.clientId!,
      req.params.id,
      body.amount,
      body.description
    );
    res.json(product);
  })
);

// Ruta catch-all para 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo de errores
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
);

export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  request: (request, event, context) => {
    // Remover el prefijo de la función del path
    if (request.path && request.path.startsWith('/.netlify/functions/api')) {
      request.url = request.url.replace('/.netlify/functions/api', '');
    }
    // También remover /api si está presente
    if (request.path && request.path.startsWith('/api')) {
      request.url = request.url.replace('/api', '');
    }
  }
});

interface AuthedRequest extends Request {
  clientId?: string;
}

function authGuard(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.clientId = payload.sub;
    next();
  } catch (_err) {
    return res.status(401).json({ message: "Token inválido." });
  }
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

