import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { money } from '../../core/store-api';
import { Purchase, ReturnsApi, returnError } from './returns-api';

@Component({
  selector: 'app-return-form', imports: [ReactiveFormsModule, RouterLink], styleUrl: './returns.css',
  template: `
    <main class="container inner-page returns-page">
      <div class="page-heading"><div><span class="returns-eyebrow">Compra #{{ pedidoId }}</span><h1>Solicitar devolución</h1><p>Selecciona los artículos y explica el motivo.</p></div><a routerLink="/devoluciones" class="text-link">← Volver</a></div>
      @if (loading()) { <p class="feedback">Cargando compra…</p> }
      @else if (error()) { <div class="feedback feedback-error" role="alert">{{ error() }} <button type="button" (click)="load()">Reintentar</button></div> }
      @else if (purchase(); as order) {
        @if (order.estado !== 'ENTREGADO') { <p class="returns-empty">Podrás solicitar la devolución cuando la compra esté entregada.</p> }
        @else {
          <form class="returns-form" [formGroup]="form" (ngSubmit)="submit()">
            <section class="returns-card"><h2>Artículos de la compra</h2><p>Indica la cantidad que deseas devolver. Deja en cero los artículos que conservarás.</p>
              <div formArrayName="items">@for (line of order.items; track line.pedidoDetalleId; let i = $index) {
                <label class="returns-line"><span><strong>{{ line.nombre }}</strong><small>{{ money(line.precioUnitario) }} por unidad · {{ line.disponible }} disponibles</small></span>
                  <input type="number" [formControlName]="i" min="0" [max]="line.disponible" step="1" [attr.aria-label]="'Cantidad a devolver de ' + line.nombre">
                </label>
              }</div>
            </section>
            <section class="returns-card returns-fields"><h2>Motivo</h2>
              <label>Motivo de la devolución <select formControlName="motivo"><option value="">Selecciona un motivo</option><option value="PRODUCTO_DEFECTUOSO">Producto defectuoso</option><option value="PRODUCTO_INCORRECTO">Producto incorrecto</option><option value="NO_CUMPLE_EXPECTATIVAS">No cumple mis expectativas</option><option value="OTRO">Otro</option></select></label>
              <label>Comentario adicional <textarea formControlName="comentario" rows="4" maxlength="1000" placeholder="Cuéntanos qué ocurrió"></textarea></label>
              <div class="returns-total"><span>Importe estimado</span><strong>{{ money(estimate()) }}</strong></div>
              @if (submitError()) { <p class="feedback feedback-error" role="alert">{{ submitError() }}</p> }
              <button type="submit" class="button button-primary" [disabled]="saving() || form.invalid || !selected()">{{ saving() ? 'Enviando…' : 'Enviar solicitud' }}</button>
            </section>
          </form>
        }
      }
    </main>
  `
})
export class ReturnFormPage implements OnInit {
  private readonly api = inject(ReturnsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly pedidoId = Number(this.route.snapshot.paramMap.get('pedidoId'));
  readonly purchase = signal<Purchase | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly submitError = signal('');
  readonly money = money;
  readonly form = new FormGroup({ motivo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    comentario: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    items: new FormArray<FormControl<number>>([]) });
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    this.api.purchase(this.pedidoId).subscribe({
      next: order => { this.purchase.set(order); this.form.controls.items.clear();
        for (const line of order.items) this.form.controls.items.push(new FormControl(0, { nonNullable: true,
          validators: [Validators.required, Validators.min(0), Validators.max(line.disponible), Validators.pattern(/^\d+$/)] }));
        this.loading.set(false); },
      error: error => { this.error.set(returnError(error)); this.loading.set(false); }
    });
  }
  selected() { return this.form.controls.items.controls.some(control => control.value > 0); }
  estimate() { return this.purchase()?.items.reduce((sum, line, i) => sum + line.precioUnitario * this.form.controls.items.at(i).value, 0) ?? 0; }
  submit() {
    const order = this.purchase();
    if (!order || this.form.invalid || !this.selected() || this.saving()) return;
    this.saving.set(true); this.submitError.set('');
    this.api.create({ pedidoId: order.id, motivo: this.form.controls.motivo.value,
      comentario: this.form.controls.comentario.value,
      items: order.items.map((line, i) => ({ pedidoDetalleId: line.pedidoDetalleId,
        cantidad: this.form.controls.items.at(i).value })).filter(line => line.cantidad > 0) }).subscribe({
      next: () => void this.router.navigateByUrl('/devoluciones'),
      error: error => { this.submitError.set(returnError(error)); this.saving.set(false); }
    });
  }
}
