import { Component } from '@angular/core';

@Component({
  selector: 'ngx-ieps-especial',
  templateUrl: './ieps-especial.component.html',
  styleUrls: ['./ieps-especial.component.scss'],
})
export class IepsEspecialComponent {
  tabs = [
    { title: 'CRUD', route: 'crud' },
    { title: 'Reporte', route: 'reporte' },
  ];
}
