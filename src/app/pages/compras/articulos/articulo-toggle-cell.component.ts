import { Component, Input } from '@angular/core';
import { ViewCell } from 'ng2-smart-table';

export type ToggleField = 'inventariable' | 'estatus';

export interface ArticuloToggleEvent {
  field: ToggleField;
  checked: boolean;
  rowData: any;
}

@Component({
  selector: 'ngx-articulo-toggle-cell',
  template: `
    <input
      type="checkbox"
      [checked]="checked"
      (change)="onChange($event)"
      [disabled]="disabled"
    />
  `,
})
export class ArticuloToggleCellComponent implements ViewCell {
  @Input() value: any;
  @Input() rowData: any;

  field: ToggleField = 'inventariable';
  disabled = false;
  onToggle?: (event: ArticuloToggleEvent) => void;

  get checked(): boolean {
    return this.value === true || this.value === 1 || this.value === '1';
  }

  onChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onToggle?.({
      field: this.field,
      checked: !!input.checked,
      rowData: this.rowData,
    });
  }
}
