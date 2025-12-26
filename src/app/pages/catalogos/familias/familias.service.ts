import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface Familia {
  Id: number;
  Nombre: string;
  Descripcion: string | null;
  IdDepartamento: number;
  NombreDepartamento: string;
}

interface FamiliasApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Familia[];
  };
}

@Injectable({ providedIn: 'root' })
export class FamiliasService {
  private readonly endpoint = `${environment.apiBase}/GetFamilias`;

  constructor(private readonly http: HttpClient) {}

  fetchFamilias(): Observable<Familia[]> {
    return this.http.post<FamiliasApiResponse>(this.endpoint, { IdDepartamento: '0' }).pipe(
      map((payload) => payload.response?.data ?? []),
      catchError((error) => {
        console.error('FamiliasService error', error);
        return throwError(() => new Error('No se pudo obtener la información de familias'));
      }),
    );
  }
}
