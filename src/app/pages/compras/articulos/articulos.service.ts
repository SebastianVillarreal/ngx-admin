import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ArticuloDto {
  Codigo: string;
  Descripcion: string;
  UMedida: string | null;
  ImpuestoUno: number | null;
  ImpuestoDos: number | null;
  ImpuestoTres: number | null;
  IvaSn: number;
  IepsSn: number;
  PrecioFinalImpuestos: number;
  PrecioOriginalImpuestos: number;
  PrecioOriginal: number;
  PrecioOferta: number;
  PrecioFinal: number;
  Iva: number;
  Ieps: number;
  Familia: string;
  NombreFamilia: string;
  UltimoPrecio: number;
  Existencia: number;
  Ventas: number;
  Dias: number;
  Cedis: number;
  Faltante: number;
  NombreDepartamento: string;
  Departamento: string;
  CostoEstandar: number;
  TipoProducto: number;
  nTipoProducto: string | null;
  FechaUltimoPrecio: string;
  FolioUltimaEntrada: string;
  TipoUltimaEntrada: string;
  ClaveSat: string;
  FechaUltimaEntrada: string | null;
  FormulaSN: number;
  Proveedor: string | null;
  IdRegistro: number;
  Costo: number;
  PrecioMayoreo: number;
  PrecioMayoreoCred: number;
  PrecioPv: number;
  CantidadCaja: number;
  CantidadTotal: number;
  CostoActual: number;
  Margen: number;
  PorcentajeAlcohol: number;
  Unidad: number;
  IepsEspecial: number;
  Inventariable: number;
  IdUsuario: number;
  Estatus: number;
}

export interface ApiResponse<T> {
  StatusCode: number;
  success: boolean;
  message: string;
  response: {
    data: T[];
  };
}

export interface GetArticulosParams {
  skip: number;
  pageSize: number;
  search: string;
}

export interface DepartamentoDto {
  Id: number;
  Nombre: string;
}

export interface FamiliaDto {
  Id: number;
  Nombre: string;
  IdDepartamento: number;
  NombreDepartamento: string;
}

@Injectable({ providedIn: 'root' })
export class ArticulosService {
  private readonly url = '/api/GetArticulos';
  private readonly createUrl = '/api/InsertArticulo';

  constructor(private http: HttpClient) {}

  getArticulos(params: GetArticulosParams): Observable<{ rows: ArticuloDto[]; total: number }>{
    const body = {
      skip: String(params.skip ?? 0),
      pageSize: String(params.pageSize ?? 10),
      search: params.search ?? '',
    };

    return this.http.post<ApiResponse<ArticuloDto>>(this.url, body).pipe(
      map((res) => {
        const data = (res && res.response && (res.response as any).data) || [];
        const rows = data as unknown as ArticuloDto[];
        const total = rows.length > 0 && typeof rows[0].CantidadTotal === 'number' ? rows[0].CantidadTotal : rows.length;
        return { rows, total };
      }),
      catchError((err) => {
        // Fallback empty on error to keep UI responsive
        console.error('Error fetching artículos', err);
        return of({ rows: [], total: 0 });
      })
    );
  }

  // Crea un artículo. Retorna true si el backend responde 2xx.
  createArticulo(body: any): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.createUrl, body).pipe(
      map((res) => !!res && res.success === true),
      catchError((err) => {
        console.error('Error creando artículo', err);
        return of(false);
      })
    );
  }

  getDepartamentos(): Observable<DepartamentoDto[]> {
    return this.http.get<ApiResponse<DepartamentoDto>>('/api/GetDepartamentos').pipe(
      map((res) => (res && res.response && (res.response as any).data) || []),
      catchError((err) => {
        console.error('Error cargando departamentos', err);
        return of([]);
      })
    );
  }

  getFamilias(idDepartamento: number): Observable<FamiliaDto[]> {
    return this.http
      .get<ApiResponse<FamiliaDto>>(`/api/GetFamilias?idDepartamento=${encodeURIComponent(String(idDepartamento))}`)
      .pipe(
        map((res) => (res && res.response && (res.response as any).data) || []),
        catchError((err) => {
          console.error('Error cargando familias', err);
          return of([]);
        })
      );
  }
}
