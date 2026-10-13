import { ReturnHistory } from '../../shared/return-history';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { money } from '../../core/store-api';
import { ReturnPage, ReturnRequest, ReturnStatus, ReturnsApi, nextReturnStatuses, returnError, returnStatusLabel } from './returns-api';

@Component({
  selector: 'app-return-management', imports: [FormsModule, RouterLink, ReturnHistory], styleUrl: './returns.css',
  template: `
    <main class="container inner-page returns-page">
      <div class="page-heading"><div><span class="returns-eyebrow">Panel de operación</span><h1>Gestionar devoluciones</h1><p>Revisa las solicitudes y registra cada decisión.</p></div><a class="text-link" routerLink="/">Ir a la tienda →</a></div>
      <form class="returns-filters" (ngSubmit)="search()"><label>Estado<select name="estado" [(ngModel)]="filters.estado"><option value="">Todos</option><option value="SOLICITADA">Solicitada</option><option value="EN_REVISION">En revisión</option><option value="APROBADA">Aprobada</option><option value="RECHAZADA">Rechazada</option><option value="COMPLETADA">Completada</option></select></label>
        <label>Motivo<input name="motivo" [(ngModel)]="filters.motivo" placeholder="Buscar motivo"></label><label>Desde<input name="desde" type="date" [(ngModel)]="filters.desde"></label><label>Hasta<input name="hasta" type="date" [(ngModel)]="filters.hasta"></label><button class="button button-primary" type="submit">Filtrar</button></form>
      @if (loading()) { <p class="feedback">Cargando solicitudes…</p> }
      @else if (error()) { <div class="feedback feedback-error" role="alert">{{ error() }} <button (click)="load()">Reintentar</button></div> }
      @else {
        <p class="returns-count">{{ page()?.totalElements }} solicitudes encontradas</p>
        @for (item of page()?.content ?? []; track item.id) {
          <article class="returns-card"><div class="returns-card-top"><div><small>Solicitud #{{ item.id }} · Compra #{{ item.pedidoId }} · Cliente #{{ item.usuarioId }}</small><h2>{{ item.motivo }}</h2><time>{{ date(item.createdAt) }}</time></div><span class="status-pill">{{ statusLabel[item.estado] }}</span></div>
            <ul>@for (line of item.items; track line.pedidoDetalleId) { <li><span>{{ line.nombre }} × {{ line.cantidad }}</span><strong>{{ money(line.subtotal) }}</strong></li> }</ul>
            <div class="returns-total"><span>Importe calculado</span><strong>{{ money(item.importe) }}</strong></div>
            @if (item.comentario) { <p class="returns-note">Cliente: {{ item.comentario }}</p> }
            @if (item.observacionOperador) { <p class="returns-note">Operador: {{ item.observacionOperador }}</p> }
            <app-return-history [events]="item.historial ?? []" />@if (next(item.estado).length) { <div class="returns-actions"><label>Observación <textarea rows="2" maxlength="1000" [ngModel]="notes[item.id] || ''" (ngModelChange)="notes[item.id] = $event" [name]="'note-' + item.id" placeholder="Obligatoria para rechazar"></textarea></label>
              <div>@for (status of next(item.estado); track status) { <button type="button" class="button" [class.button-primary]="status !== 'RECHAZADA'" [class.button-outline]="status === 'RECHAZADA'" [disabled]="busy() === item.id || (status === 'RECHAZADA' && !notes[item.id]?.trim())" (click)="update(item, status)">{{ statusLabel[status] }}</button> }</div></div> }
          </article>
        } @empty { <p class="returns-empty">No hay solicitudes con estos filtros.</p> }
        @if ((page()?.totalPages ?? 0) > 1) { <div class="returns-pagination"><button class="button button-outline" [disabled]="index() === 0" (click)="go(index() - 1)">Anterior</button><span>Página {{ index() + 1 }} de {{ page()?.totalPages }}</span><button class="button button-outline" [disabled]="index() + 1 >= (page()?.totalPages ?? 0)" (click)="go(index() + 1)">Siguiente</button></div> }
      }
    </main>
  `
})
export class ReturnManagementPage implements OnInit {
  private readonly api = inject(ReturnsApi);
  readonly page = signal<ReturnPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal<number | null>(null);
  readonly index = signal(0);
  readonly money = money;
  readonly statusLabel = returnStatusLabel;
  readonly next = nextReturnStatuses;
  readonly date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  filters = { estado: '', motivo: '', desde: '', hasta: '' };
  notes: Record<number, string> = {};
  ngOnInit() { this.load(); }
  search() { this.index.set(0); this.load(); }
  go(page: number) { this.index.set(page); this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    const params: Record<string, string> = { pagina: String(this.index()), tamanio: '10' };
    if (this.filters.estado) params['estado'] = this.filters.estado;
    if (this.filters.motivo.trim()) params['motivo'] = this.filters.motivo.trim();
    if (this.filters.desde) params['desde'] = new Date(`${this.filters.desde}T00:00:00`).toISOString();
    if (this.filters.hasta) { const end = new Date(`${this.filters.hasta}T00:00:00`); end.setDate(end.getDate() + 1); params['hasta'] = end.toISOString(); }
    this.api.management(params).subscribe({ next: page => { this.page.set(page); this.loading.set(false); },
      error: error => { this.error.set(returnError(error)); this.loading.set(false); } });
  }
  update(item: ReturnRequest, status: ReturnStatus) {
    if (this.busy()) return;
    this.busy.set(item.id); this.error.set('');
    this.api.update(item, status, this.notes[item.id] || '').subscribe({ next: () => { this.busy.set(null); this.load(); },
      error: error => { this.error.set(returnError(error)); this.busy.set(null); } });
  }
}
