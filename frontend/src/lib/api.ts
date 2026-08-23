/**
 * API client for the existing FastAPI backend.
 *
 * Base URL defaults to http://127.0.0.1:8000 and can be overridden with the
 * VITE_API_URL environment variable.
 *
 * Authentication uses the access_token returned by POST /api/auth/login,
 * sent as Authorization: Bearer <token> on protected requests.
 *
 * Endpoints used:
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   GET    /api/vehicles
 *   GET    /api/vehicles/search
 *   POST   /api/vehicles
 *   PUT    /api/vehicles/{vehicle_id}
 *   DELETE /api/vehicles/{vehicle_id}
 *   POST   /api/vehicles/{vehicle_id}/purchase
 *   POST   /api/vehicles/{vehicle_id}/restock
 */

export const VEHICLE_IMAGES = [
  {
    label: "Silver Sedan",
    value:
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Black Sedan",
    value:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "SUV",
    value:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "White Car",
    value:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
  },
];

import type {
  User,
  Vehicle,
  VehicleInput,
  VehicleType,
} from "./types";

import { fallbackImageFor } from "./vehicle-images";

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  "https://apex-motors-backend.onrender.com";


/* ------------------------------ token storage ------------------------------ */

const TOKEN_KEY = "apex_access_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Fired on window when an authenticated request is rejected with 401. */
export const UNAUTHORIZED_EVENT = "apex:unauthorized";

/* --------------------------------- errors --------------------------------- */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Turn a FastAPI error body into readable text. */
function extractDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const detail = (body as Record<string, unknown>)["detail"];

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d) => {
        if (d && typeof d === "object" && "msg" in d) {
          const loc = Array.isArray(
            (d as { loc?: unknown[] }).loc,
          )
            ? (
                (d as { loc: unknown[] }).loc.filter(
                  (p) => p !== "body",
                ) as unknown[]
              ).join(".")
            : "";

          return loc
            ? `${loc}: ${(d as { msg: string }).msg}`
            : (d as { msg: string }).msg;
        }

        return String(d);
      })
      .join("; ");
  }

  return null;
}

/* --------------------------------- request -------------------------------- */

interface RequestOptions {
  method?: string;
  body?: unknown;

  /** Send as application/x-www-form-urlencoded instead of JSON. */
  form?: Record<string, string>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;

  if (options.form) {
    headers["Content-Type"] =
      "application/x-www-form-urlencoded";

    body = new URLSearchParams(options.form).toString();
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;

  try {
    const requestInit:RequestInit = {
      method: options.method ?? "GET",
      headers,
    };
    if(body!==undefined){
      requestInit.body = body;
    }
    res = await fetch(`${API_BASE_URL}${path}`,requestInit);

  } catch {
    throw new ApiError(
      `Could not reach the server at ${API_BASE_URL}. Make sure the FastAPI backend is running.`,
      0,
    );
  }

  if (res.status === 401) {
    if (token) {
      clearToken();

      window.dispatchEvent(
        new Event(UNAUTHORIZED_EVENT),
      );

      throw new ApiError(
        "Your session has expired. Please sign in again.",
        401,
      );
    }

    const parsed = await res.json().catch(() => null);

    throw new ApiError(
      extractDetail(parsed) ??
        "Invalid email or password.",
      401,
    );
  }

  if (res.status === 403) {
    const parsed = await res.json().catch(() => null);

    throw new ApiError(
      extractDetail(parsed) ??
        "You don't have permission to perform this action.",
      403,
    );
  }

  if (!res.ok) {
    const parsed = await res.json().catch(() => null);

    throw new ApiError(
      extractDetail(parsed) ??
        `Request failed (${res.status}).`,
      res.status,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/* ------------------------------- normalizers ------------------------------- */

function asString(
  value: unknown,
): string | undefined {
  return typeof value === "string" && value !== ""
    ? value
    : undefined;
}

function asNumber(
  value: unknown,
): number | undefined {
  const n = Number(value);

  return Number.isFinite(n) ? n : undefined;
}

function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(
      atob(base64),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeUser(
  raw: unknown,
  fallbackEmail: string,
): User {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const email =
    asString(obj["email"]) ?? fallbackEmail;

  const isAdmin =
    obj["is_admin"] === true ||
    obj["role"] === "admin";

  return {
    id:
      asString(obj["id"]) ??
      asString(obj["_id"]) ??
      email,

    name:
      asString(obj["name"]) ??
      asString(obj["full_name"]) ??
      asString(obj["username"]) ??
      email.split("@")[0]!,

    email,

    role: isAdmin
      ? "admin"
      : "customer",
  };
}

function normalizeVehicle(
  raw: unknown,
): Vehicle {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const id = String(
    obj["id"] ??
      obj["_id"] ??
      crypto.randomUUID(),
  );

  const make =
    asString(obj["make"]) ?? "Unknown";

  const model =
    asString(obj["model"]) ?? "";

  /*
   * Backend uses "category".
   * Frontend uses "type".
   */
  const type =
    (
      asString(obj["type"]) ??
      asString(obj["category"]) ??
      asString(obj["body_type"]) ??
      "Sedan"
    ) as VehicleType;

  const image =
    asString(obj["image"]) ??
    asString(obj["image_url"]) ??
    fallbackImageFor(id, type);

  return {
    id,
    make,
    model,

    year:
      asNumber(obj["year"]) ??
      new Date().getFullYear(),

    price:
      asNumber(obj["price"]) ?? 0,

    type,

    fuel:
      asString(obj["fuel"]) ??
      asString(obj["fuel_type"]) ??
      "Petrol",

    transmission:
      asString(obj["transmission"]) ??
      "Automatic",

    mileage:
      asNumber(obj["mileage"]) ?? 0,

    color:
      asString(obj["color"]) ?? "",

    /*
     * Backend uses "quantity".
     * Frontend uses "stock".
     */
    stock:
      asNumber(obj["stock"]) ??
      asNumber(obj["quantity"]) ??
      0,

    sold:
      asNumber(obj["sold"]) ?? 0,

    image,
  };
}

function normalizeVehicleList(
  data: unknown,
): Vehicle[] {
  const list = Array.isArray(data)
    ? data
    : (
        (data as Record<string, unknown>)?.[
          "vehicles"
        ] ??
        (data as Record<string, unknown>)?.[
          "items"
        ] ??
        []
      );

  return (
    Array.isArray(list) ? list : []
  ).map(normalizeVehicle);
}

/* ---------------------------------- auth ---------------------------------- */

function extractAuthPayload(
  data: unknown,
  email: string,
): {
  token: string | null;
  user: User | null;
} {
  const obj =
    (data ?? {}) as Record<string, unknown>;

  const token =
    asString(obj["access_token"]) ??
    asString(obj["token"]) ??
    null;

  let user: User | null = null;

  if (
    obj["user"] &&
    typeof obj["user"] === "object"
  ) {
    user = normalizeUser(
      obj["user"],
      email,
    );
  } else if (
    obj["email"] ||
    obj["name"] ||
    obj["role"] ||
    obj["is_admin"] !== undefined
  ) {
    user = normalizeUser(
      obj,
      email,
    );
  } else if (token) {
    const claims =
      decodeJwtPayload(token);

    if (claims) {
      user = normalizeUser(
        {
          ...claims,
          email:
            asString(claims["email"]) ??
            asString(claims["sub"]),
        },
        email,
      );
    }
  }

  return {
    token,
    user,
  };
}

export interface AuthResult {
  user: User;
  token: string;
}

/** POST /api/auth/login */
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  let data: unknown;

  try {
    data = await request<unknown>(
      "/api/auth/login",
      {
        method: "POST",
        body: {
          email,
          password,
        },
      },
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 422
    ) {
      data = await request<unknown>(
        "/api/auth/login",
        {
          method: "POST",
          form: {
            username: email,
            password,
          },
        },
      );
    } else {
      throw error;
    }
  }

  const {
    token,
    user,
  } = extractAuthPayload(
    data,
    email,
  );

  if (!token) {
    throw new ApiError(
      "The server did not return an access token.",
      500,
    );
  }

  setToken(token);

  return {
    token,
    user:
      user ??
      normalizeUser(null, email),
  };
}

/** POST /api/auth/register */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const data = await request<unknown>(
    "/api/auth/register",
    {
      method: "POST",
      body: {
        name,
        email,
        password,
      },
    },
  );

  const {
    token,
    user,
  } = extractAuthPayload(
    data,
    email,
  );

  if (token) {
    setToken(token);

    return {
      token,
      user:
        user ??
        normalizeUser(null, email),
    };
  }

  return login(
    email,
    password,
  );
}

export function logout() {
  clearToken();
}

/* -------------------------------- vehicles -------------------------------- */

/**
 * Backend vehicle input.
 *
 * FastAPI expects:
 * make
 * model
 * category
 * price
 * quantity
 */
export interface BackendVehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
}

/** GET /api/vehicles */
export async function listVehicles(): Promise<Vehicle[]> {
  return normalizeVehicleList(
    await request<unknown>(
      "/api/vehicles",
    ),
  );
}

/**
 * GET /api/vehicles/search
 *
 * The FastAPI backend expects separate search parameters
 * such as make and model instead of q.
 */
export async function searchVehicles(
  query: string,
): Promise<Vehicle[]> {
  const search = query.trim();

  if (!search) {
    return listVehicles();
  }

  const makeParams =
    new URLSearchParams({
      make: search,
    });

  const modelParams =
    new URLSearchParams({
      model: search,
    });

  const [
    makeData,
    modelData,
  ] = await Promise.all([
    request<unknown>(
      `/api/vehicles/search?${makeParams.toString()}`,
    ),

    request<unknown>(
      `/api/vehicles/search?${modelParams.toString()}`,
    ),
  ]);

  const vehicles = [
    ...normalizeVehicleList(makeData),
    ...normalizeVehicleList(modelData),
  ];

  const uniqueVehicles = Array.from(
    new Map(
      vehicles.map(
        (vehicle) => [
          vehicle.id,
          vehicle,
        ],
      ),
    ).values(),
  );

  return uniqueVehicles;
}

/** POST /api/vehicles (admin) */
export async function createVehicle(
  input: BackendVehicleInput,
): Promise<Vehicle> {
  const data =
    await request<unknown>(
      "/api/vehicles",
      {
        method: "POST",
        body: input,
      },
    );

  return normalizeVehicle(data);
}

/** PUT /api/vehicles/{vehicle_id} (admin) */
export async function updateVehicle(
  id: string,
  input: BackendVehicleInput,
): Promise<Vehicle> {
  const data =
    await request<unknown>(
      `/api/vehicles/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: input,
      },
    );

  return normalizeVehicle(data);
}

/** DELETE /api/vehicles/{vehicle_id} (admin) */
export async function deleteVehicle(
  id: string,
): Promise<void> {
  await request<unknown>(
    `/api/vehicles/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

/** POST /api/vehicles/{vehicle_id}/purchase */
export async function purchaseVehicle(
  vehicleId: string,
  quantity: number,
): Promise<unknown> {
  return request<unknown>(
    `/api/vehicles/${encodeURIComponent(vehicleId)}/purchase`,
    {
      method: "POST",
      body: {
        quantity,
      },
    },
  );
}

/** POST /api/vehicles/{vehicle_id}/restock (admin) */
export async function restockVehicle(
  id: string,
  quantity: number,
): Promise<Vehicle> {
  const data =
    await request<unknown>(
      `/api/vehicles/${encodeURIComponent(id)}/restock`,
      {
        method: "POST",
        body: {
          quantity,
        },
      },
    );

  return normalizeVehicle(data);
}