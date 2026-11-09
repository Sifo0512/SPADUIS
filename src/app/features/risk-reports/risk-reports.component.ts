import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';

import { FilterDropdownComponent, FilterOption } from '../../shared/filter-dropdown/filter-dropdown.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { SearchInputComponent } from '../../shared/search-input/search-input.component';
import { HelpDrawerComponent } from './components/help-drawer/help-drawer.component';
import { ProgramSidebarComponent } from './components/program-sidebar/program-sidebar.component';
import { QuickCard, QuickCardsComponent } from './components/quick-cards/quick-cards.component';
import { PageChange, StudentsTableComponent } from './components/students-table/students-table.component';
import { StudentsQuery } from './models/page.model';
import { Program } from './models/program.model';
import { RiskRange } from './models/risk-range.model';
import { RiskLevel, StudentRisk } from './models/student-risk.model';
import { RiskReportsService } from './services/risk-reports.service';
import { RR_PATHS } from './risk-reports.paths';

/**
 * Pantalla "Reportes por riesgo de deserción".
 *
 * Es el único componente que habla con el servicio. Los hijos solo reciben datos
 * por @Input y avisan por @Output, así que cada uno se puede reemplazar por su
 * equivalente de la librería sin tocar el resto.
 *
 * Flujo de datos:
 *   1. Al abrir: getPrograms() -> llena el panel izquierdo y selecciona el primero.
 *   2. Cualquier cambio de programa / página / tamaño / filtro actualiza el signal
 *      `request`, y eso dispara getStudents() (la petición anterior se cancela).
 */
@Component({
  selector: 'app-risk-reports',
  imports: [
    IconComponent,
    SearchInputComponent,
    FilterDropdownComponent,
    QuickCardsComponent,
    ProgramSidebarComponent,
    StudentsTableComponent,
    HelpDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Activa el tema del módulo (variables y botones); ver risk-reports.theme.scss.
  host: { class: 'rr-theme' },
  templateUrl: './risk-reports.component.html',
  styleUrl: './risk-reports.component.scss',
})
export class RiskReportsComponent {
  private readonly service = inject(RiskReportsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // ---------- Estado: programas ----------
  protected readonly programs = signal<Program[]>([]);
  protected readonly programsLoading = signal(true);
  protected readonly selectedProgramId = signal<number | null>(null);
  protected readonly selectedProgram = computed(
    () => this.programs().find((p) => p.id === this.selectedProgramId()) ?? null,
  );
  protected readonly sidebarCollapsed = signal(false);

  // ---------- Estado: estudiantes ----------
  protected readonly students = signal<StudentRisk[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // ---------- Estado: filtros y paginación ----------
  protected readonly page = signal(0);
  protected readonly pageSize = signal(5);
  protected readonly search = signal('');
  protected readonly risk = signal<RiskLevel | ''>('');
  protected readonly semester = signal('');
  private readonly reloadTick = signal(0);

  protected readonly pageSizeOptions = [5, 10, 25, 100];

  protected readonly riskOptions: FilterOption[] = [
    { value: 'Bajo', label: 'Riesgo bajo' },
    { value: 'Medio', label: 'Riesgo medio' },
    { value: 'Alto', label: 'Riesgo alto' },
    { value: 'Muy alto', label: 'Riesgo muy alto' },
  ];
  // BACK: placeholder del segundo filtro del mockup ("Label"). Definir el real
  // y, si sus opciones vienen del backend, cargarlas desde el servicio.
  protected readonly semesterOptions: FilterOption[] = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `Semestre ${i + 1}`,
  }));

  protected readonly quickCards: QuickCard[] = [
    { id: 'create', label: 'Crear', title: 'Registro de reporte', icon: 'file-plus', color: 'green' },
    { id: 'alerts', label: 'Gestionar', title: 'Alertas', icon: 'bell', color: 'orange' },
    { id: 'params', label: 'Configurar', title: 'Parámetros', icon: 'settings', color: 'purple' },
    { id: 'student', label: 'Consultar', title: 'Estudiante', icon: 'user', color: 'blue' },
  ];

  protected readonly downloading = signal(false);

  // ---------- Estado: panel de ayuda ----------
  protected readonly helpOpen = signal(false);
  protected readonly riskRanges = signal<RiskRange[]>([]);
  protected readonly rangesLoading = signal(false);
  protected readonly rangesError = signal<string | null>(null);

  /** Todo lo que, al cambiar, obliga a volver a pedir los estudiantes. */
  private readonly request = computed(() => {
    const programId = this.selectedProgramId();
    const query: StudentsQuery | null =
      programId === null
        ? null
        : {
            programId,
            page: this.page(),
            size: this.pageSize(),
            search: this.search(),
            risk: this.risk(),
            semester: this.semester(),
          };
    return { query, tick: this.reloadTick() };
  });

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.loadPrograms();
    this.listenStudentsRequests();
    this.listenSearchInput();
  }

  // ---------------------------------------------------------------- carga de datos

  private loadPrograms(): void {
    this.service
      .getPrograms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.programs.set(list);
          this.programsLoading.set(false);
          if (list.length) this.selectedProgramId.set(list[0].id);
        },
        // LIB: si la librería tiene un servicio de notificaciones / snackbar, úsalo aquí.
        error: () => {
          this.programsLoading.set(false);
          this.error.set('No se pudo cargar el listado de programas.');
        },
      });
  }

  private listenStudentsRequests(): void {
    toObservable(this.request)
      .pipe(
        filter((r) => r.query !== null),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        // switchMap cancela la petición anterior si el usuario cambia algo rápido.
        switchMap(({ query }) =>
          this.service.getStudents(query!).pipe(
            catchError(() => {
              // LIB: equivale al @Output errorLoadData de mat-table-full.
              this.error.set('No se pudo cargar el listado de estudiantes.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.students.set(res?.content ?? []);
        this.total.set(res?.totalElements ?? 0);
        this.loading.set(false);
      });
  }

  private listenSearchInput(): void {
    this.searchInput$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((text) => {
        this.search.set(text.trim());
        this.page.set(0);
      });
  }

  protected retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  // ---------------------------------------------------------------- eventos de la vista

  protected onSelectProgram(program: Program): void {
    this.selectedProgramId.set(program.id);
    this.page.set(0);
  }

  protected onToggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  protected onSearch(text: string): void {
    this.searchInput$.next(text);
  }

  protected onRiskChange(value: string): void {
    this.risk.set(value as RiskLevel | '');
    this.page.set(0);
  }

  protected onSemesterChange(value: string): void {
    this.semester.set(value);
    this.page.set(0);
  }

  protected onPageChange(change: PageChange): void {
    this.page.set(change.page);
    this.pageSize.set(change.size);
  }

  protected onQuickCard(card: QuickCard): void {
    const routes: Record<string, string> = {
      create: RR_PATHS.create,
      params: RR_PATHS.params,
      alerts: RR_PATHS.alerts,
      student: RR_PATHS.student,
    };
    const route = routes[card.id];
    if (route) {
      this.router.navigate([route]);
      return;
    }
    console.warn('Tarjeta sin ruta:', card.id);
  }

  protected onHelp(): void {
    this.helpOpen.set(true);
    // Los rangos se piden solo la primera vez (o si la vez anterior falló).
    if (this.riskRanges().length === 0 && !this.rangesLoading()) {
      this.loadRiskRanges();
    }
  }

  private loadRiskRanges(): void {
    this.rangesLoading.set(true);
    this.rangesError.set(null);
    this.service
      .getRiskRanges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ranges) => {
          this.riskRanges.set(ranges);
          this.rangesLoading.set(false);
        },
        error: () => {
          this.rangesError.set('No se pudo cargar la información de ayuda.');
          this.rangesLoading.set(false);
        },
      });
  }

  protected onView(row: StudentRisk): void {
    this.router.navigate([RR_PATHS.student, row.id]);
  }

  protected onCreateRecord(row: StudentRisk): void {
    // Abre el formulario con este estudiante ya elegido (lo lee como ?studentId=...).
    this.router.navigate([RR_PATHS.create], { queryParams: { studentId: row.id } });
  }

  protected onDownload(): void {
    const program = this.selectedProgram();
    if (!program) return;

    this.downloading.set(true);
    this.service.downloadReport(program.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // BACK: extensión real del archivo (xlsx, csv, pdf).
        link.download = `reporte-desercion-${program.name}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.downloading.set(false);
        this.error.set('No se pudo descargar el reporte.');
      },
    });
  }
}
