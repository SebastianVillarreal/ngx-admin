import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';

export interface Cliente {
  Id: number;
  Nombre: string;
  Deuda: number;
  Rfc: string;
  CondicionPago: string;
  LimiteCredito: number;
  LimiteCreditoCliente: number;
  CreditoOriginal: number;
  Correo: string;
  DireccionFiscal: string;
  direccion: string;
  Telefono: string;
  CodPostal: string;
  Ciudad: string;
  Colonia: string;
  Contacto: string;
  Representante: string;
  ListaPrecios: number;
  Cfdi: string;
  DescripcionCfdi: string | null;
  Banco: string;
  Cuenta: string;
  Comentarios: string;
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

interface ClientesApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Cliente[];
  };
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly endpoint = `${environment.apiBase}/GetClientes`;

  constructor(private readonly http: HttpClient) {}

  fetchClientes(nombreCliente?: string): Observable<Cliente[]> {
    const payload = { NombreCliente: nombreCliente ?? '' };
    return this.http.post<ClientesApiResponse>(this.endpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('ClientesService error', error);
        return throwError(() => new Error('No se pudo obtener la información de clientes.'));
      }),
    );
  }
}
