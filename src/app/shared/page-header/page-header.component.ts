import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * LIB: reemplazar por el encabezado de página de la librería
 * (busca: page-header / header / banner / card simple con título).
 * Si la librería trae uno con botón de "volver" incluido, usarlo y borrar este.
 */
@Component({
  selector: 'app-page-header',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      @if (showBack()) {
        <button type="button" class="back" aria-label="Volver" (click)="back.emit()">
          <app-icon name="arrow-left" />
        </button>
      }
      <h1>{{ title() }}</h1>
    </header>
  `,
  styles: `
    .header {
      position: relative;
      padding: 14px 56px;
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--green-dark);
    }
    .back {
      position: absolute;
      top: 50%;
      left: 12px;
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      color: var(--green);
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      transform: translateY(-50%);
    }
    .back:hover {
      background: var(--green-soft);
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  /** Muestra la flecha "←" a la izquierda. */
  readonly showBack = input(false);
  readonly back = output<void>();
}
