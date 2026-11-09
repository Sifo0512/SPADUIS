import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';

import { FieldComponent } from '../../../../shared/field/field.component';
import { StudentSummary } from '../../models/create-report.model';
import { RiskReportsService } from '../../services/risk-reports.service';

/**
 * Campo "Nombre y/o código del estudiante": escribe y elige de una lista.
 *
 * El valor del formulario es el ESTUDIANTE elegido (StudentSummary), no el texto.
 * Mientras el usuario escribe sin elegir, el control vale null y queda inválido.
 *
 * ============================================================================
 *  LIB: reemplazar por el autocomplete de la librería
 *       (busca: autocomplete / typeahead / combobox / select con búsqueda).
 *  Lo que el reemplazo debe cumplir:
 *    - Buscar mientras se escribe (con espera de ~300 ms, mínimo 2 letras).
 *    - Mostrar por opción: "CC - documento - nombre" y "Código · Programa".
 *    - Devolver al formulario el estudiante elegido (objeto), no el texto.
 *    - Estados: buscando, sin resultados, error.
 * ============================================================================
 *
 *  BACK: la búsqueda vive en RiskReportsService.searchStudents(term).
 *
 *  Nota técnica: todo su estado propio son señales (OnPush). El error y la
 *  etiqueta del campo los resuelve <app-field>, que escucha al control.
 *  Los ids del HTML son fijos: si se usan dos pickers en una pantalla, hay que
 *  hacerlos únicos.
 */
@Component({
  selector: 'app-student-picker',
  imports: [FieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-picker.component.html',
  styleUrl: './student-picker.component.scss',
})
export class StudentPickerComponent implements OnInit {
  /** Control del formulario que guarda el estudiante elegido. */
  readonly control = input.required<FormControl<StudentSummary | null>>();

  private readonly service = inject(RiskReportsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly text = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);

  private readonly results = signal<StudentSummary[]>([]);
  /** Último término cuya búsqueda ya terminó. Sirve para saber si los resultados están al día. */
  protected readonly searchedTerm = signal('');
  protected readonly failed = signal(false);

  private readonly term$ = new Subject<string>();

  protected readonly trimmed = computed(() => this.text().trim());

  /** Resultados válidos para mostrar: solo si corresponden a lo que hay escrito. */
  protected readonly options = computed(() =>
    this.trimmed().length >= 2 && !this.failed() && this.searchedTerm() === this.trimmed() ? this.results() : [],
  );

  ngOnInit(): void {
    // Si el estudiante llega desde afuera (precarga) o el formulario se limpia, el texto se sincroniza.
    this.control()
      .valueChanges.pipe(startWith(this.control().value), takeUntilDestroyed(this.destroyRef))
      .subscribe((student) => this.text.set(student ? this.label(student) : ''));

    this.term$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        // switchMap descarta la búsqueda anterior si el usuario sigue escribiendo.
        switchMap((term) =>
          this.service.searchStudents(term).pipe(
            map((list) => ({ term, list, failed: false })),
            catchError(() => of({ term, list: [] as StudentSummary[], failed: true })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ term, list, failed }) => {
        this.results.set(list);
        this.searchedTerm.set(term);
        this.failed.set(failed);
        this.activeIndex.set(-1);
      });
  }

  protected label(s: StudentSummary): string {
    return `${s.fullName} - ${s.code}`;
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.text.set(value);
    this.failed.set(false);
    this.open.set(value.trim().length > 0);

    // Escribir invalida la selección anterior. Sin emitir evento, para no borrar el texto.
    this.control().setValue(null, { emitEvent: false });
    this.control().markAsDirty();

    if (value.trim().length >= 2) this.term$.next(value.trim());
  }

  protected onFocus(): void {
    if (this.trimmed().length > 0) this.open.set(true);
  }

  protected onBlur(): void {
    this.open.set(false);
    this.control().markAsTouched();
  }

  protected choose(student: StudentSummary, event?: Event): void {
    // mousedown + preventDefault evita que el input pierda el foco antes de elegir.
    event?.preventDefault();
    this.control().setValue(student);
    this.control().markAsDirty();
    this.text.set(this.label(student));
    this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.trimmed().length > 0) this.open.set(true);
        if (count) this.activeIndex.update((i) => Math.min(i + 1, count - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (count) this.activeIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        // Solo se intercepta si hay una opción resaltada; si no, Enter envía el formulario como siempre.
        if (this.open() && this.activeIndex() >= 0 && this.options()[this.activeIndex()]) {
          event.preventDefault();
          this.choose(this.options()[this.activeIndex()]);
        }
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.open.set(false);
        }
        break;
    }
  }
}
