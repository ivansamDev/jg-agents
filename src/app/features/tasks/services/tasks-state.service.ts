import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Task } from '../../../core/models/domain.models';

const STORAGE_KEY = 'jg_tasks';

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Configure Logstash Data Pipeline',
    status: 'blocked',
    assignee: 'Agent Delta',
    createdAt: new Date(Date.now() - 3600000 * 4)
  },
  {
    id: 't2',
    title: 'Optimize Dashboard Metrics Queries',
    status: 'in_progress',
    assignee: 'Agent Beta',
    createdAt: new Date(Date.now() - 3600000 * 8)
  },
  {
    id: 't3',
    title: 'Implement OAuth2 Authentication Flow',
    status: 'done',
    assignee: 'Agent Alpha',
    createdAt: new Date(Date.now() - 3600000 * 24)
  },
  {
    id: 't4',
    title: 'Design Agent Orchestration Schema',
    status: 'todo',
    assignee: 'Agent Gamma',
    createdAt: new Date(Date.now() - 3600000 * 1)
  }
];

@Injectable({ providedIn: 'root' })
export class TasksStateService {
  readonly #items = signal<Task[]>([]);
  readonly #loading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly items = this.#items.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();

  // Computed signals for each column status
  readonly todoTasks = computed(() => this.#items().filter(t => t.status === 'todo'));
  readonly inProgressTasks = computed(() => this.#items().filter(t => t.status === 'in_progress'));
  readonly blockedTasks = computed(() => this.#items().filter(t => t.status === 'blocked'));
  readonly doneTasks = computed(() => this.#items().filter(t => t.status === 'done'));

  constructor() {
    this.load().subscribe();
  }

  load(): Observable<Task[]> {
    this.#loading.set(true);
    this.#error.set(null);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let tasks: Task[];
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        tasks = parsed.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
      } else {
        tasks = INITIAL_TASKS;
        this.saveToStorage(INITIAL_TASKS);
      }
      return of(tasks).pipe(
        delay(500),
        tap({
          next: (loadedTasks) => {
            this.#items.set(loadedTasks);
            this.#loading.set(false);
          },
          error: (err: any) => {
            this.#error.set(err.message || 'Error loading tasks');
            this.#loading.set(false);
          }
        })
      );
    } catch (err: any) {
      this.#error.set(err.message || 'Error loading tasks');
      this.#loading.set(false);
      return throwError(() => err);
    }
  }

  addTask(title: string, status: Task['status'] = 'todo', assignee?: string): Observable<Task> {
    this.#loading.set(true);
    this.#error.set(null);

    const newTask: Task = {
      id: 't_' + Math.random().toString(36).substring(2, 9),
      title,
      status,
      assignee: assignee || undefined,
      createdAt: new Date()
    };

    return of(newTask).pipe(
      delay(500),
      tap({
        next: (task) => {
          const updated = [...this.#items(), task];
          this.#items.set(updated);
          this.saveToStorage(updated);
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error adding task');
          this.#loading.set(false);
        }
      })
    );
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Observable<Task> {
    this.#loading.set(true);
    this.#error.set(null);

    const currentTasks = this.#items();
    const taskIndex = currentTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      this.#loading.set(false);
      const err = new Error(`Task with id ${id} not found`);
      this.#error.set(err.message);
      return throwError(() => err);
    }

    const updatedTask: Task = {
      ...currentTasks[taskIndex],
      ...updates,
      assignee: updates.assignee || undefined
    };

    return of(updatedTask).pipe(
      delay(500),
      tap({
        next: (task) => {
          const updatedList = this.#items().map(t => t.id === id ? task : t);
          this.#items.set(updatedList);
          this.saveToStorage(updatedList);
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error updating task');
          this.#loading.set(false);
        }
      })
    );
  }

  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.updateTask(id, { status });
  }

  deleteTask(id: string): Observable<void> {
    this.#loading.set(true);
    this.#error.set(null);

    return of(undefined).pipe(
      delay(500),
      tap({
        next: () => {
          const updated = this.#items().filter(t => t.id !== id);
          this.#items.set(updated);
          this.saveToStorage(updated);
          this.#loading.set(false);
        },
        error: (err: any) => {
          this.#error.set(err.message || 'Error deleting task');
          this.#loading.set(false);
        }
      })
    );
  }

  private saveToStorage(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}
