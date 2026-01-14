import { Component, Input, OnChanges, SimpleChanges, inject, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'ui-icon',
  standalone: true,
  template: '',
  styles: [`
    :host {
      display: inline-block;
      line-height: 0;
    }
    :host ::ng-deep svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
    :host ::ng-deep svg[fill="none"] {
      fill: none;
    }
    :host ::ng-deep svg[stroke] {
      stroke: currentColor;
    }
  `]
})
export class UiIconComponent implements OnChanges {
  @Input({ required: true }) name!: string;

  private http = inject(HttpClient);
  private element = inject(ElementRef);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['name']) {
      this.loadIcon();
    }
  }

  private loadIcon() {
    const name = this.name;
    this.http.get(`assets/icons/${name}.svg`, { responseType: 'text' }).subscribe({
      next: (svg) => {
        // Only update if the name hasn't changed in the meantime
        if (this.name === name) {
          this.element.nativeElement.innerHTML = svg;
        }
      },
      error: () => console.warn(`Icon not found: ${name}`)
    });
  }
}
