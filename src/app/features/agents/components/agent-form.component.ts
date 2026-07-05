import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form (ngSubmit)="onSubmit()" #agentForm="ngForm">
      <div>
        <label for="name">Name:</label>
        <input id="name" name="name" [(ngModel)]="model.name" required>
      </div>
      <div>
        <label for="description">Description:</label>
        <textarea id="description" name="description" [(ngModel)]="model.description"></textarea>
      </div>
      <button type="submit" [disabled]="!agentForm.form.valid">Save</button>
    </form>
  `
})
export class AgentFormComponent {
  model = { name: '', description: '' };

  onSubmit() {
    console.log('Saving agent:', this.model);
  }
}