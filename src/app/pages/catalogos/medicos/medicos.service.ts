import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface Medico {
  Id: number;
  Numero: string;
  Cedula: string;
  Nombre: string;
  ApPaterno: string;
  ApMaterno: string;
  Domicilio: string;
  Telefono: string;
  TelefonoCasa: string;
  Estatus: number;
}

interface MedicosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Medico[];
  };
}

@Injectable({ providedIn: 'root' })
export class MedicosService {
  private readonly endpoint = `${environment.apiBase}/GetMedicos`;

  constructor(private readonly http: HttpClient) {}

  fetchMedicos(): Observable<Medico[]> {
    return this.http.post<MedicosApiResponse>(this.endpoint, null).pipe(
      map((payload) => payload.response?.data ?? []),
      catchError((error) => {
        console.error('MedicosService error', error);
        return throwError(() => new Error('No se pudo obtener la información de médicos'));
      }),
    );
  }
}
