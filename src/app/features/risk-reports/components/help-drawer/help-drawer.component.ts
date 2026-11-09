import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  viewChild,
  ElementRef,
} from '@angular/core';

import { IconComponent } from '../../../../shared/icon/icon.component';
import { RiskRange } from '../../models/risk-range.model';
import { RiskTagComponent } from '../risk-tag/risk-tag.component';

/**
 * Panel lateral (drawer) que se desliza desde la derecha: "Ayuda".
 *
 * ============================================================================
 *  LIB: reemplazar por el componente de panel lateral de la librería
 *       (busca: sidenav / drawer / side-panel / sheet / offcanvas).
 *       Si la librería usa Angular Material, es <mat-sidenav> con mode="over"
 *       y position="end", o un MatDialog con panelClass pegado a la derecha.
 * ============================================================================
 *  Lo que el reemplazo debe cumplir:
 *   - Abrir/cerrar desde fuera (aquí: [(open)]).
 *   - Cerrar con la X, con la tecla Escape y al hacer clic fuera del panel.
 *   - Título "Ayuda" y contenido proyectado (el texto y los rangos van dentro).
 *   - Devolver el foco al botón "Ayuda" al cerrar (accesibilidad).
 *
 *  Dentro del panel, las etiquetas Bajo/Medio/Alto/Muy alto son <app-risk-tag>
 *  (LIB: el mismo tag/chip que se use en la tabla).
 */
@Component({
  selector: 'app-help-drawer',
  imports: [IconComponent, RiskTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div class="backdrop" [class.open]="open()" (click)="close()"></div>

    <aside
      class="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-drawer-title"
      [class.open]="open()"
      [attr.inert]="open() ? null : ''"
    >
      <header class="header">
        <h2 id="help-drawer-title">Ayuda</h2>
        <button #closeBtn type="button" class="close" aria-label="Cerrar ayuda" (click)="close()">
          <app-icon name="close" />
        </button>
      </header>

      <div class="body">
        <p class="subtitle"><app-icon name="info" style="--icon-size: 14px" /> Información</p>

        <p class="text">
          A continuación, encontrará la relación de los rangos de cada indicador en categoría de riesgo.
        </p>

        @if (loading()) {
          <p class="state">Cargando rangos...</p>
        } @else if (error()) {
          <p class="state state--error" role="alert">{{ error() }}</p>
        } @else {
          <ul class="ranges">
            @for (r of ranges(); track r.level) {
              <li>
                <strong>Riesgo {{ r.level.toLowerCase() }}:</strong>
                <span>{{ r.min.toFixed(2) }} - {{ r.max.toFixed(2) }}</span>
                <app-risk-tag [level]="r.level" />
              </li>
            }
          </ul>
        }
      </div>
    </aside>
  `,
  styleUrl: './help-drawer.component.scss',
})
export class HelpDrawerComponent {
  /** Abierto / cerrado. Se usa como [(open)]="signal". */
  readonly open = model(false);
  readonly ranges = input<RiskRange[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  private readonly injector = inject(Injector);
  private readonly closeBtn = viewChild.required<ElementRef<HTMLButtonElement>>('closeBtn');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    // Al abrir: guarda quién tenía el foco y lo mueve al panel.
    // Al cerrar: devuelve el foco (normalmente al botón "Ayuda").
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        afterNextRender(() => this.closeBtn().nativeElement.focus(), { injector: this.injector });
      } else if (this.previouslyFocused) {
        this.previouslyFocused.focus();
        this.previouslyFocused = null;
      }
    });
  }

  protected close(): void {
    if (this.open()) this.open.set(false);
  }
}
