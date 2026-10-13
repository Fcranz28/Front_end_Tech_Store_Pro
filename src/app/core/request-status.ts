import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RequestStatus {
  readonly slow = signal(false);
  private pending = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  begin() {
    if (this.pending++ === 0) this.timer = setTimeout(() => this.slow.set(true), 6000);
  }
  end() {
    if (--this.pending === 0) {
      clearTimeout(this.timer);
      this.slow.set(false);
    }
  }
}

export function requestError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No pudimos conectar. Comprueba tu conexión y vuelve a intentarlo.';
    if ([502, 503, 504].includes(error.status)) return 'La tienda no está disponible en este momento. Espera unos segundos y vuelve a intentarlo.';
  }
  if (error instanceof Error && error.name === 'TimeoutError') return 'La conexión tardó demasiado. Vuelve a intentarlo.';
  return fallback;
}
