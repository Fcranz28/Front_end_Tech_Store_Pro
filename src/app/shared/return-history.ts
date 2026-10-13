import { Component, input } from '@angular/core';
import { ReturnHistoryEvent, returnStatusLabel } from '../features/devoluciones/returns-api';
@Component({
  selector: 'app-return-history',
  template: `<details class="history"><summary>Historial de cambios ({{ events().length }})</summary>
    <ol>@for (event of events(); track event.id) {
      <li><strong>@if (event.estadoAnterior) { {{ labels[event.estadoAnterior] }} → }{{ labels[event.estadoNuevo] }}</strong>
        <time [attr.datetime]="event.createdAt">{{ date(event.createdAt) }}</time>
        <p>{{ event.actorNombre }} · {{ roles[event.actorRol] || event.actorRol }}</p>
        @if (event.observacion) { <p>{{ event.observacion }}</p> }
      </li>
    } @empty { <li>No hay movimientos registrados.</li> }</ol>
  </details>`,
  styles: [`
    .history { margin-top: 1.25rem; border-top: 1px solid #2c3e52; padding-top: 1rem; }
    summary { cursor: pointer; font-weight: 600; color: #dcecff; padding: .25rem 0; }
    summary:focus-visible { outline: 2px solid #69b5ff; outline-offset: 3px; }
    ol { margin: 1rem 0 0; padding-left: 1.3rem; } li { padding: .5rem 0; }
    time { display: block; color: #b6c9df; font-size: .85rem; margin-top: .35rem; }
    p { margin: .35rem 0; overflow-wrap: anywhere; line-height: 1.5; }
  `]
})
export class ReturnHistory {
  readonly events = input<ReturnHistoryEvent[]>([]);
  readonly labels = returnStatusLabel;
  readonly roles: Record<string, string> = { USER: 'Cliente', OPERADOR: 'Operador', ADMIN: 'Administrador', SISTEMA: 'Sistema' };
  readonly date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
