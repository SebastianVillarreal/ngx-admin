import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbInputModule, NbSelectModule, NbCheckboxModule, NbButtonModule, NbAlertModule } from '@nebular/theme';
import { NbToastrService } from '@nebular/theme';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Sucursal {
  id: number;
  nombre: string;
}

@Component({
  selector: 'ngx-ofertas-add',
  standalone: true,
  imports: [CommonModule, FormsModule, NbInputModule, NbSelectModule, NbCheckboxModule, NbButtonModule, NbAlertModule],
  templateUrl: './ofertas-add.component.html',
  styleUrls: ['./ofertas-add.component.scss'],
})
export class OfertasAddComponent {
  constructor(private http: HttpClient, private toastr: NbToastrService) {
    this.cargarSucursales();
  }

  // Modelo de formulario
  nombre = '';
  fechaInicial = '';
  fechaFinal = '';
  sucursalId: number | null = null;
  archivo?: File;

  // Días de la semana
  dias = [
    { key: 'lu', label: 'Lunes' },
    { key: 'ma', label: 'Martes' },
    { key: 'mi', label: 'Miercoles' },
    { key: 'ju', label: 'Jueves' },
    { key: 'vi', label: 'Viernes' },
    { key: 'sa', label: 'Sabado' },
    { key: 'do', label: 'Domingo' },
  ];
  seleccionTodos = false;
  seleccionDias: Record<string, boolean> = {
    lu: false, ma: false, mi: false, ju: false, vi: false, sa: false, do: false,
  };

  sucursales: Sucursal[] = [];
  cargandoSucursales = false;
  guardando = false;

  private cargarSucursales() {
    // Intento de carga desde API; si falla, dejamos opciones vacías para que el usuario seleccione más tarde
    this.cargandoSucursales = true;
    this.http.get<{ success?: boolean; response?: { data?: Array<{ IdSucursal: number; Nombre: string }> } }>(
      `${environment.apiBase}/GetSucursales`,
    ).subscribe({
      next: (res) => {
        const data = res?.response?.data || [];
        this.sucursales = data.map(s => ({ id: s.IdSucursal, nombre: s.Nombre }));
      },
      error: () => {
        // Silencioso; la lista quedará vacía para que se llene luego
      },
      complete: () => this.cargandoSucursales = false,
    });
  }

  onSelectTodosChange() {
    Object.keys(this.seleccionDias).forEach(k => this.seleccionDias[k] = this.seleccionTodos);
  }

  onDiaChange() {
    const all = this.dias.every(d => this.seleccionDias[d.key]);
    this.seleccionTodos = all;
  }

  onArchivoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files && input.files.length ? input.files[0] : undefined;
  }

  guardar() {
    // Validaciones mínimas
    if (!this.nombre.trim()) return this.toastr.warning('Captura el nombre de la oferta', 'Aviso');
    if (!this.fechaInicial) return this.toastr.warning('Selecciona la fecha inicial', 'Aviso');
    if (!this.fechaFinal) return this.toastr.warning('Selecciona la fecha final', 'Aviso');
    if (!this.sucursalId) return this.toastr.warning('Selecciona la sucursal', 'Aviso');
    if (!this.archivo) return this.toastr.warning('Selecciona un archivo', 'Aviso');
    const diasSeleccionados = this.dias.filter(d => this.seleccionDias[d.key]).map(d => d.key);
    if (diasSeleccionados.length === 0) return this.toastr.warning('Selecciona al menos un día', 'Aviso');

    // Construcción de payload (demo)
    const form = new FormData();
    form.append('Nombre', this.nombre.trim());
    form.append('FechaInicial', this.fechaInicial);
    form.append('FechaFinal', this.fechaFinal);
    form.append('SucursalId', String(this.sucursalId));
    form.append('Dias', JSON.stringify(diasSeleccionados));
    form.append('Archivo', this.archivo);

    this.guardando = true;

    // Enviar a un endpoint a definir; por ahora haremos una llamada no bloqueante y mostraremos éxito si responde 200
    this.http.post(`${environment.apiBase}/Ofertas/Agregar`, form).subscribe({
      next: () => this.toastr.success('Oferta guardada', 'Éxito'),
      error: () => this.toastr.info('Formulario listo. Define el endpoint para guardar.', 'Nota'),
      complete: () => this.guardando = false,
    });
  }
}
