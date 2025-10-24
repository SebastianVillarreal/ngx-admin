import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { ArticulosService, DepartamentoDto, FamiliaDto } from './articulos.service';

// Petición base para crear articulo; ajustar propiedades según API real
export interface NewArticuloRequest {
  Codigo: string;
  Descripcion: string;
  Familia: string; // id fam
  PrecioFinalImpuestos: string; // ej "15.00"
  UMedida: string; // ej "PZA"
  ImpuestoUno: string; // ej "16"
  ImpuestoDos: string;
  ImpuestoTres: string;
  ClaveSat: string;
  Costo: string; // ej "7.9"
  PrecioMayoreo: string; // ej "13"
  PrecioMayoreoCred: string; // ej "14"
  Inventariable: string; // "1" | "0"
}

@Component({
  selector: 'ngx-nuevo-articulo',
  templateUrl: './nuevo-articulo.component.html',
  styleUrls: ['./nuevo-articulo.component.scss'],
})
export class NuevoArticuloComponent implements OnInit {
  cargando = false;

  // Mock de catálogos; reemplazar por servicios en cuanto estén
  unidades = [
    { id: 'PZA', name: 'Pieza' },
    { id: 'CJ', name: 'Caja' },
    { id: 'PQT', name: 'Paquete' },
  ];
  departamentos: DepartamentoDto[] = [];
  familias: FamiliaDto[] = [];

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
  codigoBarras: ['', [Validators.maxLength(20)]],
    descripcion: ['', [Validators.required, Validators.maxLength(200)]],
  unidadMedida: ['', Validators.required],
    departamento: ['', Validators.required],
  familia: ['', Validators.required],
  precioPublico: [null as number | null, [Validators.required, Validators.min(0)]],
    precioMayoreo: [null as number | null, [Validators.required, Validators.min(0)]],
  precioMayoreoC: [null as number | null, [Validators.required, Validators.min(0)]],
  ultimoCosto: [null as number | null, [Validators.required, Validators.min(0)]],
    impuestoUno: [null as number | null, [Validators.required, Validators.min(0)]],
    impuestoDos: [null as number | null, [Validators.required, Validators.min(0)]],
    impuestoTres: [null as number | null, [Validators.required, Validators.min(0)]],
    claveSat: ['', Validators.required],
    inventariable: [false],
    importador: [null], // archivo opcional
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: NbToastrService,
    private articulosSvc: ArticulosService,
  ) {}

  ngOnInit(): void {
    this.cargarDepartamentos();

    // Cuando cambie el depto, limpiar familias y cargar nuevas
    this.form.get('departamento')!.valueChanges.subscribe((val) => {
      const id = Number(val);
      this.form.patchValue({ familia: '' }, { emitEvent: false });
      this.familias = [];
      if (id) {
        this.cargarFamilias(id);
      }
    });
  }

  get f() { return this.form.controls; }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.form.patchValue({ importador: input.files[0] });
    }
  }

  cancelar(): void {
    this.router.navigate(['/pages/compras/articulos']);
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Completa los campos obligatorios', 'Validación');
      return;
    }

    const v = this.form.value;
    const body: NewArticuloRequest = {
      Codigo: String(v.codigo),
      Descripcion: String(v.descripcion),
      Familia: String(v.familia),
      PrecioFinalImpuestos: Number(v.precioPublico || 0).toFixed(2),
      UMedida: String(v.unidadMedida),
      ImpuestoUno: String(v.impuestoUno ?? ''),
      ImpuestoDos: String(v.impuestoDos ?? ''),
      ImpuestoTres: String(v.impuestoTres ?? ''),
      ClaveSat: String(v.claveSat),
      Costo: String(v.ultimoCosto ?? ''),
      PrecioMayoreo: String(v.precioMayoreo ?? ''),
      PrecioMayoreoCred: String(v.precioMayoreoC ?? ''),
      Inventariable: v.inventariable ? '1' : '0',
    };

    try {
      this.cargando = true;
  const ok = await this.articulosSvc.createArticulo(body).toPromise();
      if (ok) {
        this.toastr.success('Artículo creado correctamente', 'Éxito');
        this.router.navigate(['/pages/compras/articulos']);
      } else {
        this.toastr.danger('No fue posible crear el artículo', 'Error');
      }
    } catch (e) {
      console.error(e);
      this.toastr.danger('Ocurrió un error al guardar', 'Error');
    } finally {
      this.cargando = false;
    }
  }

  private cargarDepartamentos(): void {
    this.articulosSvc.getDepartamentos().subscribe((rows) => {
      this.departamentos = rows.map((d) => ({ Id: d.Id, Nombre: d.Nombre }));
    });
  }

  private cargarFamilias(idDepartamento: number): void {
    this.articulosSvc.getFamilias(idDepartamento).subscribe((rows) => {
      this.familias = rows;
    });
  }
}
