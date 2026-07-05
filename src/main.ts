import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { appConfig } from './app/app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app/app.html',
  styleUrl: './app/app.css'
})
export class App {}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
