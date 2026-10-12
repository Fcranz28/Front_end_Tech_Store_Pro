import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { money } from '../../core/store-api';
import { Purchase, ReturnRequest, ReturnsApi, returnError, returnStatusLabel } from './returns-api';

@Component({
  selector: 'app-returns', imports: [RouterLink], styleUrl: './returns.css',
  template: `
    <main class="container inner-page returns-page">
      <div class="page-heading"><div><span class="returns-eyebrow">Servicio posventa</span><h1>Mis devoluciones</h1><p>Consulta tus compras y el estado de cada solicitud.</p></div><a class="button button-outline" routerLink="/pedidos">Ver pedidos</a></div>
      @if (loading()) { <p class="feedback">Cargando tus compras…</p> }
      @else if (error()) { <div class="feedback feedback-error" role="alert">{{ error() }} <button type="button" (click)="load()">Reintentar</button></div> }
      @else {
        <section class="returns-section"><h2>Compras</h2>
          @for (purchase of purchases(); track purchase.id) {
            <article class="returns-card"><div class="returns-card-top"><div><small>Compra #{{ purchase.id }}</small><h3>{{ date(purchase.createdAt) }}</h3></div><span class="status-pill">{{ purchase.estado }}</span></div>
              <ul>@for (line of purchase.items; track line.pedidoDetalleId) { <li><span>{{ line.nombre }} · {{ line.comprado }} comprado(s)</span><strong>{{ line.disponible }} disponibles</strong></li> }</ul>
              @if (purchase.estado === 'ENTREGADO' && hasAvailable(purchase)) { <a class="button button-primary" [routerLink]="['/devoluciones/nueva', purchase.id]">Solicitar devolución</a> }
            </article>
          } @empty { <p class="returns-empty">Todavía no tienes compras. <a routerLink="/productos">Explorar productos</a></p> }
        </section>
        <section class="returns-section"><h2>Solicitudes</h2>
          @for (item of requests(); track item.id) {
            <article class="returns-card"><div class="returns-card-top"><div><small>Devolución #{{ item.id }} · Compra #{{ item.pedidoId }}</small><h3>{{ item.motivo }}</h3><time>{{ date(item.createdAt) }}</time></div><span class="status-pill">{{ statusLabel[item.estado] }}</span></div>
              <ul>@for (line of item.items; track line.pedidoDetalleId) { <li><span>{{ line.nombre }} × {{ line.cantidad }}</span><strong>{{ money(line.subtotal) }}</strong></li> }</ul>
              <div class="returns-total"><span>Importe solicitado</span><strong>{{ money(item.importe) }}</strong></div>
              @if (item.comentario) { <p class="returns-note">Tu comentario: {{ item.comentario }}</p> }
              @if (item.observacionOperador) { <p class="returns-note">Observación: {{ item.observacionOperador }}</p> }
            </article>
          } @empty { <p class="returns-empty">Aún no has solicitado devoluciones.</p> }
        </section>
      }
    </main>
  `
})
export class ReturnsPage implements OnInit {
  private readonly api = inject(ReturnsApi);
  readonly purchases = signal<Purchase[]>([]);
  readonly requests = signal<ReturnRequest[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly money = money;
  readonly statusLabel = returnStatusLabel;
  readonly date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(value));
  readonly hasAvailable = (purchase: Purchase) => purchase.items.some(line => line.disponible > 0);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    forkJoin({ purchases: this.api.purchases(), requests: this.api.mine() }).subscribe({
      next: data => { this.purchases.set(data.purchases); this.requests.set(data.requests); this.loading.set(false); },
      error: error => { this.error.set(returnError(error)); this.loading.set(false); }
    });
  }
}
