import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface CreditoOperacion {
  Abonado: number;
  Monto: number;
  IdTicketCredito: number;
  Resto: number;
  Id: number;
  Folio: string | null;
  Fecha: string | null;
  IdSucursal: number;
  Total: number;
  Impuestos: number;
  SubTotal: number;
  Estatus: number;
  IdUsuario: number;
  FolioInterno: string | null;
  FechaHora: string | null;
  Descuento: number;
  Caja: number;
  AAAADDMM: string | null;
  NombreSucursal: string | null;
  Cliente: string | null;
  Cajero: string | null;
  rfc: string | null;
  numeroCliente: number;
  DescEstatus: string | null;
  Iva: number;
  Ieps: number;
  IepsSeis: number;
  Hora: string | null;
  CondicionPago: number;
  FechaVencimiento: string | null;
  TotalNuevo: number;
  Devolucion: number;
  VentaNeta: number;
  Anticipo: number;
}

interface TicketCreditosApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: CreditoOperacion[];
  };
}

export interface AbonoTicket {
  Id: number;
  nombreCliente: string | null;
  IdCliente: number;
  total: number;
  Monto: number;
  Usuario: number;
  IdTicket: string;
  Fecha: string;
  Hora: string;
  FolioInterno: string;
  IdFolio: number;
}

interface AbonosTicketApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: AbonoTicket[];
  };
}

export interface InsertFolioAbonoPayload {
  IdCliente: string;
  IdSucursal: string;
  Usuario: string;
  FormaPago: string;
  Referencia: string;
}

interface InsertFolioAbonoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

export interface InsertDetalleFolioAbonoPayload {
  IdFolio: string;
  FolioInterno: string;
  Monto: string;
}

interface InsertDetalleFolioAbonoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: number;
  };
}

export interface DetalleFolioAbono {
  Id: number;
  IdFolio: number;
  FolioInterno: string;
  Abono: number;
  Restante: number;
  Concepto: string;
  Referencia: string;
  Fecha: string;
}

interface DetalleFolioAbonosResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: DetalleFolioAbono[];
  };
}

interface FinalizarFolioAbonoResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: unknown;
  };
}

export interface FinalizarFolioAbonoResult {
  success: boolean;
  pdfBase64?: string;
}

export interface FolioAbono {
  Id: number;
  IdSucursal: number;
  Usuario: number;
  Monto: number;
  IdCliente: number;
  Fecha: string;
  NombreCliente: string;
  Direccion: string | null;
  Rfc: string | null;
  Total: number;
  Referencia: string | null;
  FormaPago: number;
  Iva: number;
  SaldoGlobal: number;
  Estatus: number;
}

interface FoliosAbonoApiResponse {
  StatusCode: number;
  success: boolean;
  message: string;
  response?: {
    data?: FolioAbono[];
  };
}

@Injectable({ providedIn: 'root' })
export class CreditosService {
  private readonly endpoint = `${environment.apiBase}/GetClientesCreditos`;
  private readonly ticketCreditosEndpoint = `${environment.apiBase}/GetTicketCreditos`;
  private readonly abonosTicketEndpoint = `${environment.apiBase}/GetAbonosTicket`;
  private readonly insertFolioAbonoEndpoint = `${environment.apiBase}/InsertFolioAbono`;
  private readonly insertDetalleFolioAbonoEndpoint = `${environment.apiBase}/InsertDetalleFolioAbonos`;
  private readonly detalleFolioAbonosEndpoint = `${environment.apiBase}/GetDetalleFolioAbonos`;
  private readonly finalizarFolioAbonoEndpoint = `${environment.apiBase}/FinalizarFolioAbono`;
  private readonly foliosAbonoEndpoint = `${environment.apiBase}/GetFoliosAbono`;

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

  fetchTicketCreditos(idCliente: number, historico = '0'): Observable<CreditoOperacion[]> {
    const payload = {
      IdCliente: String(idCliente),
      Historico: historico,
    };
    return this.http.post<TicketCreditosApiResponse>(this.ticketCreditosEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetTicketCreditos error', error);
        return throwError(() => new Error('No se pudo obtener las operaciones del crédito.'));
      }),
    );
  }

  fetchAbonosTicket(folioInterno: string): Observable<AbonoTicket[]> {
    const payload = { FolioInterno: folioInterno };
    return this.http.post<AbonosTicketApiResponse>(this.abonosTicketEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetAbonosTicket error', error);
        return throwError(() => new Error('No se pudo obtener la lista de abonos.'));
      }),
    );
  }

  insertFolioAbono(payload: InsertFolioAbonoPayload): Observable<number> {
    return this.http.post<InsertFolioAbonoResponse>(this.insertFolioAbonoEndpoint, payload).pipe(
      map((res) => res.response?.data ?? 0),
      catchError((error) => {
        console.error('InsertFolioAbono error', error);
        return throwError(() => new Error('No se pudo crear el folio de abono.'));
      }),
    );
  }

  insertDetalleFolioAbono(payload: InsertDetalleFolioAbonoPayload): Observable<number> {
    return this.http.post<InsertDetalleFolioAbonoResponse>(this.insertDetalleFolioAbonoEndpoint, payload).pipe(
      map((res) => res.response?.data ?? 0),
      catchError((error) => {
        console.error('InsertDetalleFolioAbonos error', error);
        return throwError(() => new Error('No se pudo registrar el abono.'));
      }),
    );
  }

  fetchDetalleFolioAbonos(idFolio: string): Observable<DetalleFolioAbono[]> {
    const payload = { IdFolio: idFolio };
    return this.http.post<DetalleFolioAbonosResponse>(this.detalleFolioAbonosEndpoint, payload).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetDetalleFolioAbonos error', error);
        return throwError(() => new Error('No se pudo obtener el detalle de abonos.'));
      }),
    );
  }

  finalizarFolioAbono(idFolio: string): Observable<FinalizarFolioAbonoResult> {
    const payload = { IdFolio: idFolio };
    return this.http.post<FinalizarFolioAbonoResponse>(this.finalizarFolioAbonoEndpoint, payload).pipe(
      map((res) => {
        const data = res.response?.data;
        if (typeof data === 'string') {
          const trimmed = data.trim();
          if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
            return { success: trimmed.toLowerCase() === 'true' };
          }
          return { success: true, pdfBase64: trimmed };
        }
        if (typeof data === 'boolean') {
          return { success: data };
        }
        if (typeof data === 'number') {
          return { success: data > 0 };
        }
        if (data && typeof data === 'object') {
          const pdfCandidate = (data as { PdfBase64?: string; pdf?: string; PDF?: string }).PdfBase64
            || (data as { pdf?: string }).pdf
            || (data as { PDF?: string }).PDF;
          if (pdfCandidate) {
            return { success: true, pdfBase64: pdfCandidate };
          }
          return { success: true };
        }
        return { success: !!data };
      }),
      catchError((error) => {
        console.error('FinalizarFolioAbono error', error);
        return throwError(() => new Error('No se pudo finalizar el folio de abono.'));
      }),
    );
  }

  fetchFoliosAbono(fechaInicio: string, fechaFin: string): Observable<FolioAbono[]> {
    const params = new HttpParams().set('fecha_inicial', fechaInicio).set('fecha_final', fechaFin);
    return this.http.get<FoliosAbonoApiResponse>(this.foliosAbonoEndpoint, { params }).pipe(
      map((res) => res.response?.data ?? []),
      catchError((error) => {
        console.error('GetFoliosAbono error', error);
        return throwError(() => new Error('No se pudo obtener la lista de folios de pago.'));
      }),
    );
  }
}
