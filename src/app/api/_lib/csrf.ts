import { ForbiddenError } from "@/lib/auth/auth-errors";

// Las mutaciones usan cookies HttpOnly. SameSite=Lax ayuda, pero no cubre
// login CSRF ni todos los navegadores, así que exigimos un Origin same-origin.
// Sec-Fetch-Site se usa como defensa adicional contra headers contradictorios.
export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const trustedOrigin = new URL(request.url).origin;

  if (!origin || origin !== trustedOrigin) {
    throw new ForbiddenError();
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite !== null && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ForbiddenError();
  }
}
