import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastComponent } from './shared/components/ui-toast/ui-toast.component';
import { UiConfirmDialogComponent } from './shared/components/ui-confirm-dialog/ui-confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastComponent, UiConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
