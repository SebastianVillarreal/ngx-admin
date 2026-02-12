import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ngx-table-toolbar',
  templateUrl: './table-toolbar.component.html',
  styleUrls: ['./table-toolbar.component.scss'],
})
export class TableToolbarComponent {
  @Input() searchTerm = '';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() loading = false;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];
  @Input() showPageSize = true;
  @Input() showExport = true;
  @Input() exportDisabled = false;
  @Input() exportLabel = 'Exportar Excel';
  @Input() refreshLabel = 'Actualizar';

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchTermChange.emit(value);
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onExport(): void {
    this.export.emit();
  }
}

