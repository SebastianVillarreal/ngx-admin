import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PrecioProgramadoItem {
  Id: number;
  IdFolioCambioPrecio: number;
  FechaAplicacion: string;
  FechaCreacion: string;
  NombreUsuario: string;
}

interface ProgramacionPreciosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: PrecioProgramadoItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class PreciosProgramadosService {
  private readonly endpoint = '/api/GetProgramacionPrecios';

  constructor(private readonly http: HttpClient) {}

  obtenerProgramaciones(): Observable<PrecioProgramadoItem[]> {
    return this.http.get<ProgramacionPreciosApiResponse>(this.endpoint).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetProgramacionPrecios error', error);
        return throwError(() => new Error('No se pudieron obtener los precios programados.'));
      }),
    );
  }
}

