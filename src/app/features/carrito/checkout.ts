import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { requestError } from '../../core/request-status';
import { StoreApi, money } from '../../core/store-api';

@Component({
  selector: 'app-checkout', imports: [FormsModule, RouterLink],
  template: `
    <section class="container inner-page">
      <div class="page-heading"><div><h1>Revisa y confirma tu pedido</h1><p>Completa los datos de entrega. Esta compra es una demostración sin cobros reales.</p></div><a routerLink="/carrito" class="text-link">Volver al carrito</a></div>
      @if (loading()) { <p class="feedback" role="status">Recuperando tu carrito…</p> }
      @else if (loadError()) { <div class="feedback feedback-error" role="alert">{{ loadError() }} <button type="button" (click)="load()">Reintentar</button><a routerLink="/carrito">Revisar carrito</a></div> }
      @else if (!api.cart().items.length) { <div class="empty-state"><h2>Tu carrito está vacío</h2><a routerLink="/productos" class="button button-primary">Elegir productos</a></div> }
      @else {
        <form #checkoutForm="ngForm" (ngSubmit)="submit()" class="checkout-grid">
          <div class="delivery-fields">
            <h2>Datos de entrega</h2>
            <label for="recipient">Nombre del destinatario</label>
            <input id="recipient" name="nombreDestinatario" [(ngModel)]="delivery.nombreDestinatario" required maxlength="140" autocomplete="name" [disabled]="saving()">
            <label for="phone">Teléfono de contacto</label>
            <input id="phone" name="telefonoEntrega" [(ngModel)]="delivery.telefonoEntrega" required pattern="[0-9+ ()-]{7,20}" maxlength="20" type="tel" autocomplete="tel" [disabled]="saving()" aria-describedby="phone-help">
            <small id="phone-help">Usa entre 7 y 20 caracteres: números, +, espacios, paréntesis o guiones.</small>
            <label for="address">Dirección de entrega</label>
            <textarea id="address" name="direccionEntrega" [(ngModel)]="delivery.direccionEntrega" required maxlength="300" rows="3" autocomplete="street-address" [disabled]="saving()"></textarea>
          </div>
          <aside class="order-summary">
            <h2>Resumen final</h2>
            @for (item of api.cart().items; track item.id) { <div class="summary-row"><span>{{ item.nombre }} × {{ item.cantidad }}</span><strong>{{ money(item.subtotal) }}</strong></div> }
            <div class="summary-total"><span>Total de productos</span><strong>{{ money(api.cart().total) }}</strong></div>
            <p><strong>Pago simulado.</strong> No se realizará ningún cargo ni se solicitarán datos de tarjeta. Al confirmar se crea el pedido y se descuenta el stock.</p>
            @if (error()) { <p role="alert" class="form-error">{{ error() }} <a routerLink="/carrito">Revisar carrito</a></p> }
            <button type="submit" class="button button-primary full-width" [disabled]="saving() || checkoutForm.invalid || !!api.transferError()">{{ saving() ? 'Confirmando…' : 'Confirmar pedido simulado' }}</button>
          </aside>
        </form>
      }
    </section>`,
  styles: [`
    .delivery-fields { display: flex; flex-direction: column; gap: .65rem; }
    .delivery-fields h2 { margin-bottom: .5rem; }
    .delivery-fields label { margin-top: .75rem; font-weight: 600; }
    .delivery-fields input, .delivery-fields textarea { width: 100%; padding: .85rem; border: 1px solid #38506a; border-radius: .4rem; color: #e8f2ff; background: #101c29; font: inherit; }
    .delivery-fields small { color: #b9cbe0; line-height: 1.5; }
    .delivery-fields input:focus-visible, .delivery-fields textarea:focus-visible { outline: 2px solid #69b5ff; outline-offset: 2px; }
    .summary-row { gap: 1rem; } .summary-row strong { white-space: nowrap; }
  `]
})
export class CheckoutPage implements OnInit {
  readonly api = inject(StoreApi); private readonly auth = inject(AuthService);
  private readonly router = inject(Router); private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(true); readonly saving = signal(false);
  readonly loadError = signal(''); readonly error = signal(''); readonly money = money;
  delivery = { nombreDestinatario: this.auth.user()?.nombre ?? '', telefonoEntrega: '', direccionEntrega: '' };
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.loadError.set('');
    this.api.restoreAfterLogin().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false))).subscribe({
      error: error => this.loadError.set(requestError(error, 'No pudimos recuperar tu carrito. Vuelve a intentarlo.'))
    });
  }
  submit() {
    if (this.saving() || this.api.transferError() || !this.api.cart().items.length) return;
    const input = { nombreDestinatario: this.delivery.nombreDestinatario.trim(), telefonoEntrega: this.delivery.telefonoEntrega.trim(), direccionEntrega: this.delivery.direccionEntrega.trim() };
    if (!input.nombreDestinatario || !input.direccionEntrega || !/^[0-9+ ()-]{7,20}$/.test(input.telefonoEntrega)) { this.error.set('Completa el nombre, teléfono y dirección de entrega.'); return; }
    this.saving.set(true); this.error.set('');
    this.api.checkout(input).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: order => void this.router.navigate(['/pedidos'], { queryParams: { confirmado: order.id } }),
      error: (error: HttpErrorResponse) => this.error.set(requestError(error, error.status === 409 ? 'El carrito o el stock cambió. Revisa tu selección antes de confirmar.' : error.status === 401 ? 'Tu sesión venció. Vuelve a ingresar para continuar.' : 'No pudimos confirmar el pedido. Revisa los datos y tus pedidos antes de intentarlo de nuevo.'))
    });
  }
}
