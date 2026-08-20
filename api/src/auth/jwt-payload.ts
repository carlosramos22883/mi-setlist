// La "forma" exacta de lo que vive DENTRO de nuestro access token.
// Al definirlo una sola vez, todo el proyecto usa el mismo tipo.
export interface JwtPayload {
  sub: string; // "subject": el id del usuario
  email?: string; // correo (lo metimos al firmar, opcional de leer)
  iat?: number; // "issued at": cuándo se firmó (segundos unix)
  exp?: number; // "expiration": cuándo muere (segundos unix)
}
