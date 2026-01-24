import { Directive, HostBinding, HostListener, Input, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Directive({
  selector: '[appPrerequisite]',
  standalone: true
})
export class PrerequisiteDirective {
  private toastService = inject(ToastService);

  @Input({ required: true, alias: 'appPrerequisite' }) prerequisitesMet!: boolean;
  @Input() prerequisiteMessage = 'Action unavailable due to missing prerequisites.';
  @Input() prerequisiteAction?: { label: string, link: any[] };

  @HostBinding('style.opacity')
  get opacity() {
    return this.prerequisitesMet ? '1' : '0.5';
  }

  @HostBinding('style.cursor')
  get cursor() {
    return this.prerequisitesMet ? 'pointer' : 'not-allowed';
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.prerequisitesMet) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.toastService.warning(
        this.prerequisiteMessage,
        5000,
        this.prerequisiteAction
      );
    }
  }
}
