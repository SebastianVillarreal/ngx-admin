import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';

export interface EstadoCuentaPeriodoItem {
  IdCliente: number;
  Cliente: string;
  SaldoInicial: number;
  CargoPeriodo: number;
  AbonoPeriodo: number;
  SaldoFinal: number;
}

interface EstadoCuentaPeriodoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: EstadoCuentaPeriodoItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class EstadoCuentaPeriodoService {
  private readonly endpoint = `${environment.apiBase}/RPT_EdoCuentaPeriodo`;

  constructor(private readonly http: HttpClient) {}

  fetchEstadoCuentaPeriodo(fechaInicial: string, fechaFinal: string): Observable<EstadoCuentaPeriodoItem[]> {
    const params = new HttpParams()
      .set('fecha_inicial', fechaInicial)
      .set('fecha_final', fechaFinal);

    return this.http.get<EstadoCuentaPeriodoApiResponse>(this.endpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('RPT_EdoCuentaPeriodo error', error);
        return throwError(() => new Error('No se pudo recuperar el estado de cuenta por periodo.'));
      }),
    );
  }
}

