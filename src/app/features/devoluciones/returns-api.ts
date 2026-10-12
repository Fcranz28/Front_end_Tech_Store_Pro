import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../core/store-api';

export type ReturnStatus = 'SOLICITADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'COMPLETADA';
export interface PurchaseLine { pedidoDetalleId: number; productoId: number; nombre: string; precioUnitario: number; comprado: number; disponible: number }
export interface Purchase { id: number; estado: string; createdAt: string; items: PurchaseLine[] }
export interface ReturnLine { pedidoDetalleId: number; nombre: string; cantidad: number; precioUnitario: number; subtotal: number }
export interface ReturnRequest {
  id: number; pedidoId: number; usuarioId: number; estado: ReturnStatus; motivo: string;
  comentario: string | null; observacionOperador: string | null; importe: number;
  createdAt: string; updatedAt: string; items: ReturnLine[];
}
export interface ReturnPage { content: ReturnRequest[]; totalElements: number; totalPages: number; number: number }
export const returnStatusLabel: Record<ReturnStatus, string> = {
  SOLICITADA: 'Solicitada', EN_REVISION: 'En revisión', APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada', COMPLETADA: 'Completada'
};
export const nextReturnStatuses = (status: ReturnStatus): ReturnStatus[] => ({
  SOLICITADA: ['EN_REVISION'], EN_REVISION: ['APROBADA', 'RECHAZADA'],
  APROBADA: ['COMPLETADA'], RECHAZADA: [], COMPLETADA: []
})[status] as ReturnStatus[];
export function returnError(error: unknown): string {
  const response = error as HttpErrorResponse;
  return typeof response?.error?.message === 'string' ? response.error.message :
    response?.status === 403 ? 'No tienes permiso para esta operación.' :
    response?.status === 409 ? 'Los datos cambiaron. Actualiza la página e inténtalo de nuevo.' :
    'No se pudo completar la operación. Inténtalo de nuevo.';
}

@Injectable({ providedIn: 'root' })
export class ReturnsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/devoluciones`;
  purchases() { return this.http.get<Purchase[]>(`${this.base}/compras`); }
  purchase(id: number) { return this.http.get<Purchase>(`${this.base}/compras/${id}`); }
  mine() { return this.http.get<ReturnRequest[]>(this.base); }
  create(input: { pedidoId: number; motivo: string; comentario: string; items: { pedidoDetalleId: number; cantidad: number }[] }) {
    return this.http.post<ReturnRequest>(this.base, input);
  }
  management(params: Record<string, string>) { return this.http.get<ReturnPage>(`${this.base}/gestion`, { params }); }
  update(item: ReturnRequest, estado: ReturnStatus, observacionOperador: string) {
    return this.http.patch<ReturnRequest>(`${this.base}/gestion/${item.id}/estado`,
      { estadoActual: item.estado, estado, observacionOperador });
  }
}
