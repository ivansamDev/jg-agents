import { Component, signal, inject, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { TasksStateService } from '../services/tasks-state.service';
import { AgentsStateService } from '../../agents/services/agents-state.service';
import { Task } from '../../../core/models/domain.models';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DatePipe],
  template: `
    <div class="tasks-container">
      <div class="board-header">
        <div class="title-section">
          <h1>Kanban Tasks</h1>
          <p class="subtitle">Organize, track, and assign tasks to system agents.</p>
        </div>
        <button class="btn btn-primary" (click)="toggleForm()">
          <svg *ngIf="!showForm()" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <svg *ngIf="showForm()" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          {{ showForm() ? 'Cancel' : 'New Task' }}
        </button>
      </div>

      <!-- Loading Progress Bar -->
      <div class="loading-bar-container" *ngIf="loading()">
        <div class="loading-bar"></div>
      </div>

      <!-- Add/Edit Task Form -->
      <div *ngIf="showForm()" class="form-panel">
        <h3 class="form-panel-title">{{ editingTaskId() ? 'Edit Task' : 'Create New Task' }}</h3>
        <div class="form-grid">
          <div class="form-group flex-2">
            <label class="form-label">Task Title</label>
            <input 
              type="text" 
              [value]="newTitle()" 
              (input)="newTitle.set($any($event).target.value)" 
              placeholder="What needs to be done?" 
              class="form-input"
              (keyup.enter)="submitTask()"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select 
              [value]="newAssignee()" 
              (change)="newAssignee.set($any($event).target.value)" 
              class="form-select"
            >
              <option value="">Unassigned</option>
              <option *ngFor="let agent of agents()" [value]="agent.name">{{ agent.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Status</label>
            <select 
              [value]="newStatus()" 
              (change)="newStatus.set($any($event).target.value)" 
              class="form-select"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div class="form-group form-actions">
            <label class="form-label hidden-label">&nbsp;</label>
            <div class="action-buttons-group">
              <button class="btn btn-success" (click)="submitTask()" [disabled]="!newTitle().trim() || loading()">
                {{ editingTaskId() ? 'Save' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <div 
          *ngFor="let col of columns"
          class="kanban-column"
          [ngClass]="'column-' + col.id"
          [class.drag-over]="draggedOverColumn() === col.id"
          (dragover)="onDragOver($event, col.id)"
          (dragenter)="onDragEnter($event, col.id)"
          (dragleave)="onDragLeave($event, col.id)"
          (drop)="onDrop($event, col.id)"
        >
          <div class="column-header">
            <div class="column-header-title">
              <span class="dot" [ngClass]="col.dotClass"></span>
              <span class="column-title">{{ col.title }}</span>
            </div>
            <span class="task-count">{{ col.tasks().length }}</span>
          </div>
          <div class="column-body">
            <div *ngIf="col.tasks().length === 0" class="empty-column-msg">
              No tasks in {{ col.title.toLowerCase() }}
            </div>
            <div 
              *ngFor="let task of col.tasks()" 
              class="task-card"
              [ngClass]="col.cardClass"
              [class.dragging]="draggedTaskId() === task.id"
              draggable="true"
              (dragstart)="onDragStart($event, task)"
              (dragend)="onDragEnd()"
            >
              <h4 class="task-title">{{ task.title }}</h4>
              <div class="task-meta">
                <span class="task-assignee" *ngIf="task.assignee">
                  🤖 {{ task.assignee }}
                </span>
                <span class="task-assignee unassigned" *ngIf="!task.assignee">
                  👤 Unassigned
                </span>
                <span class="task-date">{{ task.createdAt | date:'MMM d' }}</span>
              </div>
              <div class="card-actions">
                <button class="btn-edit" (click)="editTask(task, $event)" title="Edit Task" [disabled]="loading()">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="btn-delete" (click)="deleteTask(task.id, $event)" title="Delete Task" [disabled]="loading()">
                  <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      min-height: 550px;
      gap: 20px;
      box-sizing: border-box;
    }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--app-text) 0%, var(--app-accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 4px 0 0 0;
      font-size: 0.9rem;
      color: var(--app-text-muted);
    }

    /* Loading Progress Bar */
    .loading-bar-container {
      width: 100%;
      height: 3px;
      background: var(--app-border);
      position: relative;
      overflow: hidden;
      border-radius: 2px;
      margin-top: -10px;
      margin-bottom: 10px;
    }

    .loading-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--app-accent), var(--app-success), var(--app-danger), var(--app-accent));
      width: 30%;
      position: absolute;
      animation: loading-slide 1.5s infinite linear;
      border-radius: 2px;
    }

    @keyframes loading-slide {
      0% { left: -30%; }
      100% { left: 100%; }
    }

    /* Glassmorphism task form */
    .form-panel {
      background: var(--app-glass-bg);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      padding: 18px 24px;
      box-shadow: var(--app-shadow);
      animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-panel-title {
      margin: 0 0 14px 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--app-accent);
    }

    .form-grid {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .form-group.flex-2 {
      flex: 2;
      min-width: 260px;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--app-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hidden-label {
      visibility: hidden;
    }

    .form-input, .form-select {
      background: var(--app-bg);
      border: 1px solid var(--app-border);
      border-radius: 6px;
      padding: 9px 12px;
      color: var(--app-text);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
      height: 38px;
    }

    .form-input:focus, .form-select:focus {
      border-color: var(--app-accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .action-buttons-group {
      display: flex;
      gap: 8px;
    }

    /* Kanban board grid */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      flex: 1;
      overflow-y: hidden;
    }

    @media (max-width: 1024px) {
      .kanban-board {
        grid-template-columns: 1fr;
        overflow-y: auto;
      }
      .form-grid {
        flex-direction: column;
        align-items: stretch;
      }
      .form-group {
        width: 100%;
      }
      .hidden-label {
        display: none;
      }
    }

    .kanban-column {
      background: var(--app-glass-bg);
      border: 1px solid var(--app-border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: 100%;
      overflow: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Column Headers & Border Highlights */
    .column-todo { border-top: 4px solid var(--app-text-muted); }
    .column-in_progress { border-top: 4px solid var(--app-success); }
    .column-blocked { border-top: 4px solid var(--app-danger); }
    .column-done { border-top: 4px solid var(--app-accent); }

    .column-header {
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--app-border);
      background: var(--app-bg);
    }

    .column-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-todo { background: var(--app-text-muted); }
    .dot-in-progress { background: var(--app-success); }
    .dot-blocked { background: var(--app-danger); }
    .dot-done { background: var(--app-accent); }

    .column-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--app-text);
    }

    .task-count {
      background: var(--app-border);
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--app-text-muted);
      border: 1px solid var(--app-border);
    }

    .column-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      overflow-y: auto;
      min-height: 120px; /* Essential to drop on empty columns */
      transition: background-color 0.2s ease;
    }

    /* Drag-over states with status-colored glow */
    .kanban-column.drag-over {
      background: var(--app-bg);
      border-style: dashed;
      border-width: 1.5px;
    }
    .column-todo.drag-over { border-color: var(--app-text-muted); }
    .column-in_progress.drag-over { border-color: var(--app-success); }
    .column-blocked.drag-over { border-color: var(--app-danger); }
    .column-done.drag-over { border-color: var(--app-accent); }

    /* Task Card */
    .task-card {
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      border-radius: 8px;
      padding: 14px;
      cursor: grab;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .task-card:hover {
      background: var(--app-bg);
      transform: translateY(-2px);
      border-color: var(--app-border);
      box-shadow: var(--app-shadow);
    }

    .task-card:active {
      cursor: grabbing;
    }

    .task-card.dragging {
      opacity: 0.3;
      border-style: dashed;
      transform: scale(0.98);
    }

    /* Left accents */
    .todo-card { border-left: 3.5px solid var(--app-text-muted); }
    .in_progress-card { border-left: 3.5px solid var(--app-success); }
    .blocked-card { border-left: 3.5px solid var(--app-danger); }
    .done-card { border-left: 3.5px solid var(--app-accent); }

    .task-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--app-text);
      line-height: 1.45;
      word-break: break-word;
    }

    .task-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-assignee {
      font-size: 0.75rem;
      color: var(--app-accent);
      background: var(--app-border);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 500;
      border: 1px solid var(--app-border);
    }

    .task-assignee.unassigned {
      color: var(--app-text-muted);
      background: var(--app-bg);
      border: 1px solid var(--app-border);
    }

    .task-date {
      font-size: 0.7rem;
      color: var(--app-text-muted);
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      border-top: 1px solid var(--app-border);
      padding-top: 8px;
      margin-top: 2px;
    }

    .btn-edit, .btn-delete {
      background: transparent;
      border: none;
      color: var(--app-text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-edit:hover {
      background: rgba(99, 102, 241, 0.15);
      color: var(--app-accent);
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.15);
      color: var(--app-danger);
    }

    .btn-edit:disabled, .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-column-msg {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      color: var(--app-text-muted);
      font-size: 0.8rem;
      border: 1px dashed var(--app-border);
      border-radius: 8px;
      user-select: none;
    }

    /* Buttons styling */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      height: 38px;
      box-sizing: border-box;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--app-accent);
      color: var(--app-text);
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-success {
      background: var(--app-success);
      color: var(--app-text);
    }
    .btn-success:hover:not(:disabled) {
      opacity: 0.9;
    }
  `]
})
export class TasksListComponent implements OnInit {
  private readonly tasksState = inject(TasksStateService);
  private readonly agentsState = inject(AgentsStateService);

  readonly loading = this.tasksState.loading;
  readonly error = this.tasksState.error;

  readonly todoTasks = this.tasksState.todoTasks;
  readonly inProgressTasks = this.tasksState.inProgressTasks;
  readonly blockedTasks = this.tasksState.blockedTasks;
  readonly doneTasks = this.tasksState.doneTasks;

  readonly agents = this.agentsState.agents;

  // Form State
  readonly showForm = signal(false);
  readonly editingTaskId = signal<string | null>(null);
  readonly newTitle = signal('');
  readonly newAssignee = signal('');
  readonly newStatus = signal<Task['status']>('todo');

  // Drag State
  readonly draggedTaskId = signal<string | null>(null);
  readonly draggedOverColumn = signal<Task['status'] | null>(null);

  // Column definitions for template iteration
  readonly columns = [
    { id: 'todo' as Task['status'], title: 'To Do', cssClass: 'todo', dotClass: 'dot-todo', cardClass: 'todo-card', tasks: this.todoTasks },
    { id: 'in_progress' as Task['status'], title: 'In Progress', cssClass: 'in_progress', dotClass: 'dot-in-progress', cardClass: 'in_progress-card', tasks: this.inProgressTasks },
    { id: 'blocked' as Task['status'], title: 'Blocked', cssClass: 'blocked', dotClass: 'dot-blocked', cardClass: 'blocked-card', tasks: this.blockedTasks },
    { id: 'done' as Task['status'], title: 'Done', cssClass: 'done', dotClass: 'dot-done', cardClass: 'done-card', tasks: this.doneTasks }
  ];

  ngOnInit() {
    // Ensure agents list is loaded so it can be selected as assignees
    if (this.agents().length === 0) {
      this.agentsState.load().subscribe();
    }
  }

  toggleForm() {
    if (this.showForm()) {
      this.resetForm();
    } else {
      this.showForm.set(true);
    }
  }

  resetForm() {
    this.showForm.set(false);
    this.editingTaskId.set(null);
    this.newTitle.set('');
    this.newAssignee.set('');
    this.newStatus.set('todo');
  }

  editTask(task: Task, event: Event) {
    event.stopPropagation();
    this.editingTaskId.set(task.id);
    this.newTitle.set(task.title);
    this.newAssignee.set(task.assignee || '');
    this.newStatus.set(task.status);
    this.showForm.set(true);
  }

  submitTask() {
    const title = this.newTitle().trim();
    if (!title) return;

    if (this.editingTaskId()) {
      this.tasksState.updateTask(this.editingTaskId()!, {
        title,
        status: this.newStatus(),
        assignee: this.newAssignee() || undefined
      }).subscribe({
        next: () => this.resetForm()
      });
    } else {
      this.tasksState.addTask(title, this.newStatus(), this.newAssignee() || undefined).subscribe({
        next: () => this.resetForm()
      });
    }
  }

  deleteTask(id: string, event: Event) {
    event.stopPropagation();
    this.tasksState.deleteTask(id).subscribe();
  }

  // HTML5 Drag & Drop handlers
  onDragStart(event: DragEvent, task: Task) {
    this.draggedTaskId.set(task.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  onDragEnd() {
    this.draggedTaskId.set(null);
    this.draggedOverColumn.set(null);
  }

  onDragOver(event: DragEvent, column: Task['status']) {
    event.preventDefault(); // Required to allow drop!
  }

  onDragEnter(event: DragEvent, column: Task['status']) {
    event.preventDefault();
    this.draggedOverColumn.set(column);
  }

  onDragLeave(event: DragEvent, column: Task['status']) {
    if (this.draggedOverColumn() === column) {
      this.draggedOverColumn.set(null);
    }
  }

  onDrop(event: DragEvent, column: Task['status']) {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain') || this.draggedTaskId();
    if (taskId) {
      this.tasksState.updateTaskStatus(taskId, column).subscribe();
    }
    this.draggedOverColumn.set(null);
    this.draggedTaskId.set(null);
  }
}

