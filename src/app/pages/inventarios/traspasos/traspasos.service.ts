import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface NuevoTraspasoPayload {
  SucursalOrigen: number;
  SucursalDestino: number;
  Usuario: string;
  Referencia: string;
}

export interface NuevoTraspasoMetadata {
  IdEntrada: number;
  IdSalida: number;
  FolioEntrada: number;
  FolioSalida: number;
}

interface NuevoTraspasoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: NuevoTraspasoMetadata;
  };
}

export interface InsertRenglonTraspasoPayload {
  FolioSalida: number;
  IdSalida: number;
  FolioEntrada: number;
  IdEntrada: number;
  Codigo: string;
  Cantidad: number;
  Origen: number;
  Destino: number;
}

interface InsertRenglonTraspasoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TraspasosService {
  private readonly nuevoTraspasoEndpoint = '/api/INV_NuevoTraspaso';
  private readonly insertRenglonEndpoint = '/api/INV_InsertRenglonTraspaso';

  constructor(private readonly http: HttpClient) {}

  generarTraspaso(payload: NuevoTraspasoPayload): Observable<NuevoTraspasoMetadata> {
    return this.http.post<NuevoTraspasoApiResponse>(this.nuevoTraspasoEndpoint, payload).pipe(
      map((res) => {
        const data = res.response?.data;
        if (!res.success || !data) {
          throw new Error(res.message || 'No se pudo generar el traspaso.');
        }
        return data;
      }),
      catchError((error) => {
        console.error('INV_NuevoTraspaso error', error);
        const message = error?.message || 'No se pudo generar el traspaso.';
        return throwError(() => new Error(message));
      }),
    );
  }

  insertarRenglonTraspaso(payload: InsertRenglonTraspasoPayload): Observable<number> {
    return this.http.post<InsertRenglonTraspasoApiResponse>(this.insertRenglonEndpoint, payload).pipe(
      map((res) => {
        const data = res.response?.data;
        if (!res.success || data == null) {
          throw new Error(res.message || 'No se pudo agregar el renglón.');
        }
        return data;
      }),
      catchError((error) => {
        console.error('INV_InsertRenglonTraspaso error', error);
        const message = error?.message || 'No se pudo agregar el renglón.';
        return throwError(() => new Error(message));
      }),
    );
  }
}
