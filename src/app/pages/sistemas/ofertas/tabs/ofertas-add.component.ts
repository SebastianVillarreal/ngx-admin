import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbInputModule, NbSelectModule, NbCheckboxModule, NbButtonModule, NbAlertModule } from '@nebular/theme';
import { NbToastrService } from '@nebular/theme';
import { OfertasService } from '../ofertas.service';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

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
  constructor(private toastr: NbToastrService, private ofertasSrv: OfertasService) {}

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

  // Fallback: dos sucursales estáticas por defecto
  sucursales: Sucursal[] = [
    { id: 1, nombre: 'Sucursal 1' },
    { id: 2, nombre: 'Sucursal 2' },
  ];
  cargandoSucursales = false;
  guardando = false;
  // Sin carga remota de sucursales: se usan únicamente las dos fijas definidas arriba

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
    const diasArray = ['lu','ma','mi','ju','vi','sa','do'].map(k => this.seleccionDias[k] ? 1 : 0);
    if (diasArray.every(v => v === 0)) return this.toastr.warning('Selecciona al menos un día', 'Aviso');

    this.guardando = true;

    // 1) Insertar configuración de oferta
    this.ofertasSrv.insertConfigOferta({
      Descripcion: this.nombre.trim(),
      FechaInicial: this.fechaInicial,
      FechaFinal: this.fechaFinal,
      Tipo: '1',
      Dias: diasArray,
    }).subscribe({
      next: (res) => {
        const idOferta = res?.response?.data;
        if (!idOferta) throw new Error('No se recibió el id de la oferta');
        // 2) Leer Excel y mandar renglones
        this.parseExcel(this.archivo!).then(rows => {
          const efectivos = rows.filter(r => r.Articulo);
          if (efectivos.length === 0) {
            this.toastr.warning('El archivo no contiene renglones válidos', 'Aviso');
            this.guardando = false;
            return;
          }

          const peticiones = efectivos.map(r => this.ofertasSrv.insertRenglonOferta({
            Oferta: String(idOferta),
            IdSucursal: String(this.sucursalId),
            Articulo: String(r.Articulo),
            Descuento: String(r.Descuento ?? ''),
          }));

          forkJoin(peticiones).subscribe({
            next: () => {
              this.toastr.success('Información actualizada con éxito', 'Éxito');
              this.resetForm();
            },
            error: (err) => {
              console.error(err);
              this.toastr.danger('Error al registrar renglones de la oferta', 'Error');
            },
            complete: () => this.guardando = false,
          });
        }).catch(err => {
          console.error(err);
          this.toastr.danger('No fue posible leer el archivo Excel', 'Error');
          this.guardando = false;
        });
      },
      error: (err) => {
        console.error(err);
        this.toastr.danger('No fue posible crear la configuración de la oferta', 'Error');
        this.guardando = false;
      },
    });
  }

  private resetForm() {
    this.nombre = '';
    this.fechaInicial = '';
    this.fechaFinal = '';
    this.sucursalId = null;
    this.archivo = undefined;
    this.seleccionTodos = false;
    Object.keys(this.seleccionDias).forEach(k => this.seleccionDias[k] = false);
  }

  private parseExcel(file: File): Promise<Array<{ Articulo: string; Descuento: number }>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (e) => reject(e);
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          if (!ws) return resolve([]);
          // Convertimos a filas: primera fila es encabezado, comenzamos desde la segunda
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
          const salida: Array<{ Articulo: string; Descuento: number }> = [];
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const articulo = (r[0] ?? '').toString().trim();
            const descRaw = (r[1] ?? '').toString().toLowerCase().replace('%','').trim();
            if (!articulo) continue;
            const descuento = descRaw ? Number(descRaw) : 0;
            if (Number.isNaN(descuento)) continue;
            salida.push({ Articulo: articulo, Descuento: descuento });
          }
          resolve(salida);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
