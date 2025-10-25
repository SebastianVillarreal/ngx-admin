import { Component } from '@angular/core';

@Component({
  selector: 'ngx-ofertas',
  templateUrl: './ofertas.component.html',
  styleUrls: ['./ofertas.component.scss'],
})
export class OfertasComponent {
  tabs = [
    { title: 'Agregar Oferta', route: 'agregar' },
    { title: 'Ofertas Activas', route: 'activas' },
    { title: 'Buscar Oferta', route: 'buscar' },
    { title: 'Histórico', route: 'historico' },
  ];
}
