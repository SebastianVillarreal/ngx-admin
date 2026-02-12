import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';

export interface ExistenciaSeparado {
  Id: number;
  Codigo: string;
  Descripcion: string;
  Cantidad: number;
  PrecioVenta: number;
}

interface GetExistenciaSeparadosResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: ExistenciaSeparado[];
  };
}

@Injectable({ providedIn: 'root' })
export class ExistenciasSeparadosService {
  private readonly endpoint = `${environment.apiBase}/GetExistenciaSeparados`;

  constructor(private readonly http: HttpClient) {}

  fetchExistencias(): Observable<ExistenciaSeparado[]> {
    return this.http.get<GetExistenciaSeparadosResponse>(this.endpoint).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetExistenciaSeparados error', error);
        return throwError(() => new Error('No se pudo obtener la informacion de existencias.'));
      }),
    );
  }
}

