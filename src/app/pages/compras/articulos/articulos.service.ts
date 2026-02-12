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

export interface ActivarArticuloPayload {
  Codigo: string;
  Estatus: string;
  Inventariable: string;
  Usuario: string;
}

export interface InsertFolioCambioPrecioPayload {
  IdSucursal: string;
  IdUsuario: string;
}

export interface InsertCambioPrecioPayload {
  Codigo: string;
  Costo: string;
  PrecioFinal: string;
  PrecioMayoreo: string;
  PrecioMayoreoCred: string;
  IdUsuario: string;
}

export interface CambioPrecioItem {
  Codigo: string;
  Descripcion: string;
  PrecioFinal: number;
  Costo: number;
  PrecioMayoreo: number;
  PrecioMayoreoCred: number;
}

@Injectable({ providedIn: 'root' })
export class ArticulosService {
  private readonly url = '/api/GetArticulos';
  private readonly createUrl = '/api/InsertArticulo';
  private readonly activarArticuloUrl = '/api/ActivarArticulo';
  private readonly insertFolioCambioPrecioUrl = '/api/InsertFolioCambioPrecio';
  private readonly insertCambioPrecioUrl = '/api/InsertCambioPrecio';
  private readonly getCambiosPrecioUrl = '/api/GetCambiosPrecio';
  private readonly ejecutarCambioPreciosUrl = '/api/EjecutarCambioPrecios';

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

  activarArticulo(payload: ActivarArticuloPayload): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.activarArticuloUrl, payload).pipe(
      map((res) => !!res && (res.success === true || res.StatusCode === 200)),
      catchError((err) => {
        console.error('Error activando articulo', err);
        return of(false);
      }),
    );
  }

  insertFolioCambioPrecio(payload: InsertFolioCambioPrecioPayload): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.insertFolioCambioPrecioUrl, payload).pipe(
      map((res) => !!res && (res.success === true || res.StatusCode === 200)),
      catchError((err) => {
        console.error('Error creando folio de cambio de precio', err);
        return of(false);
      }),
    );
  }

  insertCambioPrecio(payload: InsertCambioPrecioPayload): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.insertCambioPrecioUrl, payload).pipe(
      map((res) => !!res && (res.success === true || res.StatusCode === 200)),
      catchError((err) => {
        console.error('Error insertando renglon de cambio de precio', err);
        return of(false);
      }),
    );
  }

  getCambiosPrecio(): Observable<CambioPrecioItem[]> {
    return this.http.post<ApiResponse<CambioPrecioItem>>(this.getCambiosPrecioUrl, {}).pipe(
      map((res) => (res && res.response && (res.response as any).data) || []),
      catchError((err) => {
        console.error('Error obteniendo cambios de precio', err);
        return of([]);
      }),
    );
  }

  ejecutarCambioPrecios(): Observable<boolean> {
    return this.http.post<ApiResponse<any>>(this.ejecutarCambioPreciosUrl, {}).pipe(
      map((res) => !!res && (res.success === true || res.StatusCode === 200)),
      catchError((err) => {
        console.error('Error ejecutando cambio de precios', err);
        return of(false);
      }),
    );
  }
}
