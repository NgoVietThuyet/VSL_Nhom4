import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-menu-left',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-left.component.html',
  styleUrl: './menu-left.component.scss'
})
export class MenuLeftComponent {
  @Input() resourceTypes: any[] = [];
  @Input() selectedResourceType: any = null;
  @Output() selectResourceType = new EventEmitter<any>();

  constructor() { }

  selectResourceTypeData(resourceType: any): void {
    this.selectResourceType.emit(resourceType);
  }
}
