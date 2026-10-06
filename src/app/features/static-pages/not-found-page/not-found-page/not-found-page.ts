import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-not-found-page',
  styleUrl: './not-found-page.css',
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {}
