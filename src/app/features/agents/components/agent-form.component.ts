import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Agent, AgentState } from '../../../core/models/domain.models';
import { AgentsStateService } from '../services/agents-state.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass],
  template: `
    <div class="agent-form-card">
      <div class="form-header">
        <h2>{{ agent ? 'Edit Agent' : 'Create New Agent' }}</h2>
        <button type="button" class="btn-close" (click)="onCancel()" aria-label="Cancel">&times;</button>
      </div>

      <div *ngIf="formError" class="form-error-banner">
        <svg class="error-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>{{ formError }}</span>
      </div>

      <form (ngSubmit)="onSubmit(agentForm)" #agentForm="ngForm" class="agent-form">
        <div class="form-group">
          <label for="name">Agent Name <span class="required">*</span></label>
          <input 
            id="name" 
            name="name" 
            type="text"
            [(ngModel)]="model.name" 
            required 
            minlength="3" 
            #nameModel="ngModel"
            [ngClass]="{ 'is-invalid': nameModel.invalid && (nameModel.dirty || nameModel.touched) }"
            placeholder="e.g. Data Sync Agent"
            [disabled]="isSubmitting"
          >
          <div *ngIf="nameModel.invalid && (nameModel.dirty || nameModel.touched)" class="invalid-feedback">
            <span *ngIf="nameModel.errors?.['required']">Name is required.</span>
            <span *ngIf="nameModel.errors?.['minlength']">Name must be at least 3 characters.</span>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            name="description" 
            [(ngModel)]="model.description" 
            placeholder="Describe what this agent does..."
            rows="4"
            [disabled]="isSubmitting"
          ></textarea>
        </div>

        <div class="form-group" *ngIf="agent">
          <label for="state">Status</label>
          <select 
            id="state" 
            name="state" 
            [(ngModel)]="model.state"
            [disabled]="isSubmitting"
          >
            <option value="idle">Idle</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            (click)="onCancel()"
            [disabled]="isSubmitting"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            [disabled]="agentForm.invalid || isSubmitting"
          >
            <span class="spinner" *ngIf="isSubmitting"></span>
            {{ isSubmitting ? 'Saving...' : 'Save Agent' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .agent-form-card {
      background: var(--app-glass-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid var(--app-glass-border);
      border-radius: 12px;
      padding: 24px;
      color: var(--app-text);
      box-shadow: var(--app-shadow);
    }
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--app-border);
      padding-bottom: 12px;
    }
    .form-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--app-accent);
    }
    .btn-close {
      background: none;
      border: none;
      color: var(--app-text-muted);
      font-size: 1.8rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      transition: color 0.2s;
    }
    .btn-close:hover {
      color: var(--app-text);
    }
    .form-error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--app-danger);
      color: var(--app-danger);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .error-icon {
      flex-shrink: 0;
    }
    .agent-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--app-text-muted);
    }
    .required {
      color: var(--app-danger);
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 6px;
      padding: 10px 12px;
      color: var(--app-text);
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      border-color: var(--app-accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }
    .form-group input.is-invalid {
      border-color: var(--app-danger);
    }
    .form-group input.is-invalid:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
    .invalid-feedback {
      color: var(--app-danger);
      font-size: 0.8rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, opacity 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-secondary {
      background: var(--app-border);
      color: var(--app-text);
    }
    .btn-secondary:hover:not(:disabled) {
      background: var(--app-bg);
    }
    .btn-primary {
      background: var(--app-accent);
      color: var(--app-text);
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: var(--app-text);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AgentFormComponent implements OnInit, OnDestroy {
  private readonly stateService = inject(AgentsStateService);
  private readonly destroy$ = new Subject<void>();

  @Input() agent: Agent | null = null;
  @Output() saved = new EventEmitter<Agent>();
  @Output() cancelled = new EventEmitter<void>();

  model = {
    name: '',
    description: '',
    state: 'idle' as AgentState
  };

  isSubmitting = false;
  formError: string | null = null;

  ngOnInit() {
    if (this.agent) {
      this.model = {
        name: this.agent.name,
        description: this.agent.description,
        state: this.agent.state
      };
    }
  }

  onSubmit(form: any) {
    if (form.invalid) return;

    this.isSubmitting = true;
    this.formError = null;

    if (this.agent) {
      // Edit mode
      this.stateService.update(this.agent.id, this.model)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedAgent) => {
            this.isSubmitting = false;
            this.saved.emit(updatedAgent);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.formError = err.message || 'An error occurred while updating the agent.';
          }
        });
    } else {
      // Create mode
      this.stateService.create(this.model)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (createdAgent) => {
            this.isSubmitting = false;
            this.saved.emit(createdAgent);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.formError = err.message || 'An error occurred while creating the agent.';
          }
        });
    }
  }

  onCancel() {
    this.cancelled.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}