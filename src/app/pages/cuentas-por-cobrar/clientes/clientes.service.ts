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

interface UsoCfdiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Array<{ id: string; text: string }>;
  };
}

interface RegimenFiscalResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Array<{ id: string; text: string }>;
  };
}

interface ClienteByIdResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: Cliente[];
  };
}

export interface InsertClientePayload {
  Nombre: string;
  rfc: string;
  condicionPago: string;
  limiteCredito: string;
  correo: string;
  direccion: string;
  telefono: string;
  codPostal: string;
  ciudad: string;
  colonia: string;
  representante: string;
  banco: string;
  cuenta: string;
  comentarios: string;
  usuario: string;
  contacto: string;
  Aval: string;
  TelefonoAval: string;
  Cfdi: string;
  regimen: string;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly endpoint = `${environment.apiBase}/GetClientes`;
  private readonly insertEndpoint = `${environment.apiBase}/InsertCliente`;
  private readonly usoCfdiEndpoint = `${environment.apiBase}/Getc_UsoCfdi`;
  private readonly regimenEndpoint = `${environment.apiBase}/Getc_RegimenFiscal`;
  private readonly clienteByIdEndpoint = `${environment.apiBase}/GetDatosCliente`;

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

  insertCliente(payload: InsertClientePayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.insertEndpoint, payload).pipe(
      catchError((error) => {
        console.error('InsertCliente error', error);
        return throwError(() => new Error('No se pudo registrar el cliente.'));
      }),
    );
  }

  fetchUsoCfdi(): Observable<Array<{ value: string; label: string }>> {
    return this.http.post<UsoCfdiResponse>(this.usoCfdiEndpoint, {}).pipe(
      map((res) => (res.response?.data ?? []).map((item) => ({ value: item.id, label: item.text }))),
      catchError((error) => {
        console.error('Getc_UsoCfdi error', error);
        return throwError(() => new Error('No se pudo recuperar el catálogo de uso de CFDI.'));
      }),
    );
  }

  fetchRegimenFiscal(): Observable<Array<{ value: string; label: string }>> {
    return this.http.post<RegimenFiscalResponse>(this.regimenEndpoint, {}).pipe(
      map((res) => (res.response?.data ?? []).map((item) => ({ value: item.id, label: item.text }))),
      catchError((error) => {
        console.error('Getc_RegimenFiscal error', error);
        return throwError(() => new Error('No se pudo recuperar el catálogo de régimen fiscal.'));
      }),
    );
  }

  fetchClienteById(idCliente: number): Observable<Cliente | null> {
    const payload = { IdCliente: String(idCliente) };
    return this.http.post<ClienteByIdResponse>(this.clienteByIdEndpoint, payload).pipe(
      map((res) => res.response?.data?.[0] ?? null),
      catchError((error) => {
        console.error('GetDatosCliente error', error);
        return throwError(() => new Error('No se pudo obtener la información del cliente.'));
      }),
    );
  }
}
