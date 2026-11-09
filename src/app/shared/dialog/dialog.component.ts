import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../icon/icon.component';

let nextDialogId = 0;

/**
 * Ventana modal: título, botones de minimizar / cerrar, contenido y botones de acción.
 * Existe mientras el padre la deje en el DOM (se usa con @if): crearla = abrirla.
 *
 * ============================================================================
 *  LIB: reemplazar por el dialog / modal de la librería
 *       (si es Angular Material: MatDialog o <mat-dialog-container>).
 *  Lo que el reemplazo debe cumplir:
 *    - Fondo oscuro que bloquea la pantalla y foco atrapado dentro.
 *    - Cerrar con Escape (aquí: el evento `closed`).
 *    - Título + contenido + botones de acción abajo.
 *    - Devolver el foco al elemento que la abrió al cerrarse.
 *  "Minimizar" (el guion del mockup "Crear/editar equipo") es poco común en
 *  librerías: si la de ustedes no lo trae, hay que preguntar a diseño si es
 *  necesario. Aquí minimizar deja solo la barra del título abajo a la derecha,
 *  y conserva lo que el usuario había escrito.
 * ============================================================================
 *
 * Uso:
 *   <app-dialog title="Crear equipo" [minimizable]="true" (closed)="cerrar()">
 *     ...contenido...
 *     <button dialogFooter ...>Cancelar</button>   <- cada botón de acción lleva `dialogFooter`
 *     <button dialogFooter ...>Guardar</button>
 *   </app-dialog>
 *
 * Para enfocar un elemento al abrir, ponerle el atributo `data-autofocus`.
 */
@Component({
  selector: 'app-dialog',
  imports: [IconComponent],
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    @if (!minimized()) {
      <div class="backdrop"></div>
    }

    <div
      #panel
      class="dialog"
      role="dialog"
      tabindex="-1"
      [attr.aria-modal]="minimized() ? null : 'true'"
      [attr.aria-labelledby]="titleId"
      [class.dialog--sm]="size() === 'sm'"
      [class.dialog--lg]="size() === 'lg'"
      [class.dialog--neutral]="tone() === 'neutral'"
      [class.is-minimized]="minimized()"
    >
      <header class="dialog__header">
        <h2 [id]="titleId">{{ title() }}</h2>
        <div class="dialog__tools">
          @if (minimizable()) {
            <button
              type="button"
              class="tool"
              [attr.aria-label]="minimized() ? 'Restaurar ventana' : 'Minimizar ventana'"
              (click)="minimized.set(!minimized())"
            >
              <app-icon [name]="minimized() ? 'maximize' : 'minus'" style="--icon-size: 16px" />
            </button>
          }
          @if (closable()) {
            <button type="button" class="tool" aria-label="Cerrar" (click)="closed.emit()">
              <app-icon name="close" style="--icon-size: 18px" />
            </button>
          }
        </div>
      </header>

      <div class="dialog__body">
        <ng-content />
      </div>

      <footer class="dialog__footer" [class.dialog__footer--center]="actionsAlign() === 'center'">
        <ng-content select="[dialogFooter]" />
      </footer>
    </div>
  `,
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnDestroy {
  readonly title = input.required<string>();
  /** "brand": título verde. "neutral": título oscuro (confirmaciones). */
  readonly tone = input<'brand' | 'neutral'>('brand');
  readonly size = input<'md' | 'sm' | 'lg'>('md');
  /** Muestra la X. Escape siempre emite `closed`. */
  readonly closable = input(true);
  readonly minimizable = input(false);
  readonly actionsAlign = input<'end' | 'center'>('end');

  /** El usuario pidió cerrar (X o Escape). El padre decide si quita el diálogo. */
  readonly closed = output<void>();

  protected readonly titleId = `dialog-title-${nextDialogId++}`;
  protected readonly minimized = signal(false);

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  /** Quién tenía el foco al abrir: se le devuelve al cerrar. */
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  constructor() {
    afterNextRender(() => this.focusInitial());
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key === 'Tab' && !this.minimized()) this.trapFocus(event);
  }

  private focusInitial(): void {
    const panel = this.panel().nativeElement;
    const target =
      panel.querySelector<HTMLElement>('[data-autofocus]') ??
      panel.querySelector<HTMLElement>(
        '.dialog__body input, .dialog__body select, .dialog__body textarea, .dialog__footer button',
      ) ??
      panel;
    target.focus();
  }

  /** Mantiene el Tab dentro de la ventana mientras está abierta (modal). */
  private trapFocus(event: KeyboardEvent): void {
    const panel = this.panel().nativeElement;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.getClientRects().length > 0);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const outside = !panel.contains(active);

    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }
}
