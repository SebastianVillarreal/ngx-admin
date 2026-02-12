import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ngx-table-pagination',
  templateUrl: './table-pagination.component.html',
  styleUrls: ['./table-pagination.component.scss'],
})
export class TablePaginationComponent {
  @Input() totalItems = 0;
  @Input() rangeStart = 0;
  @Input() rangeEnd = 0;
  @Input() page = 1;
  @Input() totalPages = 0;
  @Input() disabled = false;

  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  onPrevious(): void {
    if (!this.disabled && this.page > 1) {
      this.previous.emit();
    }
  }

  onNext(): void {
    if (!this.disabled && this.page < this.totalPages) {
      this.next.emit();
    }
  }
}

