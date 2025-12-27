import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface CreditoCliente {
  Tickets: number;
  Monto: number;
  Id: number;
  Nombre: string;
  Deuda: number;
  Rfc: string | null;
  CondicionPago: string | null;
  LimiteCredito: number;
  LimiteCreditoCliente: number;
  CreditoOriginal: number;
  Correo: string | null;
  DireccionFiscal: string | null;
  direccion: string | null;
  Telefono: string | null;
  CodPostal: string | null;
  Ciudad: string | null;
  Colonia: string | null;
  Contacto: string | null;
  Representante: string | null;
  ListaPrecios: number;
  Cfdi: string | null;
  DescripcionCfdi: string | null;
  Banco: string | null;
  Cuenta: string | null;
  Comentarios: string | null;
  IdEstatus: number;
  Regimen: string | null;
  DescripcionRegimen: string | null;
  idSucursal: number;
  IdCliente: number;
  Huella: string | null;
  Historico: number;
  Aval: string | null;
  TelefonoAval: string | null;
}

interface CreditosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: CreditoCliente[];
  };
}

@Injectable({ providedIn: 'root' })
export class CreditosService {
  private readonly endpoint = `${environment.apiBase}/GetClientesCreditos`;

  constructor(private readonly http: HttpClient) {}

  fetchCreditos(idSucursal = '1'): Observable<CreditoCliente[]> {
    const payload = { idSucursal };
    return this.http.post<CreditosApiResponse>(this.endpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('CreditosService error', error);
        return throwError(() => new Error('No se pudo obtener la información de créditos.'));
      }),
    );
  }

  fetchCreditoResumenById(id: number, idSucursal = '1'): Observable<CreditoCliente | null> {
    return this.fetchCreditos(idSucursal).pipe(
      map((creditos) => creditos.find((item) => item.Id === id) ?? null),
    );
  }
}
