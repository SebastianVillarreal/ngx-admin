import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ProveedorDto {
  Id: number;
  nombre: string;
}

interface ProveedoresApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ProveedorDto[];
  };
}

export interface InsertCotizacionPayload {
  IdSucursal: string;
  IdProveedor: string;
  IdUsuario: string;
}

interface InsertCotizacionApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private readonly proveedoresEndpoint = '/api/GetProveedores';

  constructor(private readonly http: HttpClient) {}

  obtenerProveedores(): Observable<ProveedorDto[]> {
    return this.http.post<ProveedoresApiResponse>(this.proveedoresEndpoint, {}).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetProveedores error', error);
        return throwError(() => new Error('No se pudieron cargar los proveedores.'));
      }),
    );
  }

  insertarCotizacion(payload: InsertCotizacionPayload): Observable<number> {
    return this.http.post<InsertCotizacionApiResponse>('/api/InsertCotizacion', payload).pipe(
      map((res) => res.response?.data ?? 0),
      catchError((error) => {
        console.error('InsertCotizacion error', error);
        return throwError(() => new Error('No se pudo guardar la cotización.'));
      }),
    );
  }
}
