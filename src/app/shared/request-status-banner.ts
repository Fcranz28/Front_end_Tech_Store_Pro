import { Component, inject } from '@angular/core';
import { RequestStatus } from '../core/request-status';

@Component({
  selector: 'app-request-status',
  template: `@if (status.slow()) {
    <div class="connection-status" role="status" aria-live="polite">
      <span class="connection-status-indicator" aria-hidden="true"></span>
      <p>La conexión está tardando más de lo habitual. Seguimos intentando cargar tus datos.</p>
    </div>
  }`,
  styles: [`
    .connection-status { display: flex; align-items: center; gap: .75rem; padding: .85rem 1.25rem; background: #112338; color: #d7eaff; border-bottom: 1px solid #284867; }
    p { margin: 0; font-size: .875rem; line-height: 1.5; }
    .connection-status-indicator { flex: 0 0 auto; width: .65rem; height: .65rem; border-radius: 50%; background: #69b5ff; }
  `]
})
export class RequestStatusBanner { readonly status = inject(RequestStatus); }
