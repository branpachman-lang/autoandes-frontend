import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response';
export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0)
    return 'No se pudo conectar con AutoAndes. Comprueba que el servicio esté disponible.';
  return (
    (err.error as Partial<ErrorResponse> | null)?.mensaje ||
    `No se pudo completar la operación (${err.status}).`
  );
}
export function erroresDeValidacion(err: HttpErrorResponse): Record<string, string> {
  return (err.error as Partial<ErrorResponse> | null)?.campos ?? {};
}
