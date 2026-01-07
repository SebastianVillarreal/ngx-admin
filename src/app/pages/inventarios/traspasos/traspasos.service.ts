import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface DetalleTraspasoItem {
  Id: number;
  Codigo: string;
  Descripcion: string;
  Familia: string;
  Departamento: string;
  Cantidad: number;
  CantidadRecibida: number;
  UnidadMedida: string;
}

interface DetalleTraspasoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: DetalleTraspasoItem[];
  };
}

export interface FinalizarTraspasoPayload {
  Salida: string;
  Entrada: string;
}

interface FinalizarTraspasoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

export interface TraspasoPendiente {
  Id: number;
  Origen: string;
  Folio: number;
  FechaElaboracion: string;
}

interface TraspasosPendientesApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: TraspasoPendiente[];
  };
}

export interface ActualizarCantidadRecibidaPayload {
  IdRenglon: string;
  CantidadRecibida: string;
}

interface ActualizarCantidadRecibidaApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
}

export interface RecibirTraspasoPayload {
  IdMovimiento: string;
  Usuario: string;
}

interface RecibirTraspasoApiResponse {
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
  private readonly detalleEndpoint = '/api/GetDetalleTraspasosEnTransito';
  private readonly finalizarEndpoint = '/api/INV_EnviarTraspaso';
  private readonly pendientesEndpoint = '/api/INV_GetTraspasosPendientesRecibir';
  private readonly actualizarCantidadEndpoint = '/api/INV_UpdateCantidadRecibidaTraspaso';
  private readonly recibirTraspasoEndpoint = '/api/INV_RecibirTraspaso';

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

  obtenerDetalleTraspaso(idSalida: number): Observable<DetalleTraspasoItem[]> {
    const params = new HttpParams().set('id_movimiento', String(idSalida));
    return this.http.get<DetalleTraspasoApiResponse>(this.detalleEndpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetDetalleTraspasosEnTransito error', error);
        const message = error?.message || 'No se pudo obtener el detalle del traspaso.';
        return throwError(() => new Error(message));
      }),
    );
  }

  finalizarTraspaso(payload: FinalizarTraspasoPayload): Observable<boolean> {
    return this.http.post<FinalizarTraspasoApiResponse>(this.finalizarEndpoint, payload).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'No se pudo finalizar el traspaso.');
        }
        return true;
      }),
      catchError((error) => {
        console.error('INV_EnviarTraspaso error', error);
        const message = error?.message || 'No se pudo finalizar el traspaso.';
        return throwError(() => new Error(message));
      }),
    );
  }

  obtenerTraspasosPendientes(sucursal: string): Observable<TraspasoPendiente[]> {
    const params = new HttpParams().set('sucursal', sucursal);
    return this.http.get<TraspasosPendientesApiResponse>(this.pendientesEndpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('INV_GetTraspasosPendientesRecibir error', error);
        const message = error?.message || 'No se pudieron obtener los traspasos pendientes.';
        return throwError(() => new Error(message));
      }),
    );
  }

  actualizarCantidadRecibida(payload: ActualizarCantidadRecibidaPayload): Observable<boolean> {
    return this.http.post<ActualizarCantidadRecibidaApiResponse>(this.actualizarCantidadEndpoint, payload).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'No se pudo actualizar la cantidad recibida.');
        }
        return true;
      }),
      catchError((error) => {
        console.error('INV_UpdateCantidadRecibidaTraspaso error', error);
        const message = error?.message || 'No se pudo actualizar la cantidad recibida.';
        return throwError(() => new Error(message));
      }),
    );
  }

  recibirTraspaso(payload: RecibirTraspasoPayload): Observable<boolean> {
    return this.http.post<RecibirTraspasoApiResponse>(this.recibirTraspasoEndpoint, payload).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'No se pudo autorizar el traspaso.');
        }
        return true;
      }),
      catchError((error) => {
        console.error('INV_RecibirTraspaso error', error);
        const message = error?.message || 'No se pudo autorizar el traspaso.';
        return throwError(() => new Error(message));
      }),
    );
  }
}
