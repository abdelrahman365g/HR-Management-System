import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';
import { DetailsDialog } from './shared/components/details-dialog/details-dialog';

@Component({
  imports: [RouterOutlet, ConfirmDialog, DetailsDialog],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Human Resource Management System');
}
