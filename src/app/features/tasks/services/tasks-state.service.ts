import { Injectable, signal } from '@angular/core';
import { Task } from '../../../core/models/domain.models';

@Injectable({ providedIn: 'root' })
export class TasksStateService {
  readonly items = signal<Task[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
}
