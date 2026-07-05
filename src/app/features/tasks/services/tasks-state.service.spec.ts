import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TasksStateService } from './tasks-state.service';
import { Task } from '../../../core/models/domain.models';

describe('TasksStateService', () => {
  let service: TasksStateService;
  const STORAGE_KEY = 'jg_tasks';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should be created', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    expect(service).toBeTruthy();
    expect(service.loading()).toBeTrue();
    
    tick(500); // Complete initial load
    expect(service.loading()).toBeFalse();
    expect(service.items().length).toBe(4); // 4 initial seed tasks
  }));

  it('should load tasks from localStorage if available', fakeAsync(() => {
    const mockTasks: Task[] = [
      {
        id: 't_custom',
        title: 'Custom Local Task',
        status: 'in_progress',
        assignee: 'Agent Alpha',
        createdAt: new Date()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTasks));
    
    service = TestBed.inject(TasksStateService);
    tick(500);

    expect(service.items().length).toBe(1);
    expect(service.items()[0].title).toBe('Custom Local Task');
    expect(service.inProgressTasks().length).toBe(1);
  }));

  it('should add a new task', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    tick(500); // Initial load

    let success = false;
    service.addTask('New Spec Task', 'todo', 'Agent Beta').subscribe(() => {
      success = true;
    });

    expect(service.loading()).toBeTrue();
    tick(500);

    expect(success).toBeTrue();
    expect(service.loading()).toBeFalse();
    
    const items = service.items();
    expect(items.length).toBe(5);
    const addedTask = items.find(t => t.title === 'New Spec Task');
    expect(addedTask).toBeDefined();
    expect(addedTask?.status).toBe('todo');
    expect(addedTask?.assignee).toBe('Agent Beta');
    
    // Check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('New Spec Task');
  }));

  it('should update a task', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    tick(500); // Initial load

    const initialTask = service.items()[0];
    let success = false;
    
    service.updateTask(initialTask.id, {
      title: 'Updated Title',
      status: 'done',
      assignee: 'Agent Gamma'
    }).subscribe(() => {
      success = true;
    });

    tick(500);
    expect(success).toBeTrue();

    const updatedTask = service.items().find(t => t.id === initialTask.id);
    expect(updatedTask?.title).toBe('Updated Title');
    expect(updatedTask?.status).toBe('done');
    expect(updatedTask?.assignee).toBe('Agent Gamma');
  }));

  it('should update task status specifically', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    tick(500); // Initial load

    const initialTask = service.items()[0];
    let success = false;

    service.updateTaskStatus(initialTask.id, 'blocked').subscribe(() => {
      success = true;
    });

    tick(500);
    expect(success).toBeTrue();

    const updatedTask = service.items().find(t => t.id === initialTask.id);
    expect(updatedTask?.status).toBe('blocked');
  }));

  it('should delete a task', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    tick(500); // Initial load

    const initialCount = service.items().length;
    const taskToDelete = service.items()[0];
    let success = false;

    service.deleteTask(taskToDelete.id).subscribe(() => {
      success = true;
    });

    tick(500);
    expect(success).toBeTrue();
    expect(service.items().length).toBe(initialCount - 1);
    expect(service.items().find(t => t.id === taskToDelete.id)).toBeUndefined();
  }));

  it('should handle error when updating a non-existent task', fakeAsync(() => {
    service = TestBed.inject(TasksStateService);
    tick(500); // Initial load

    let errorOccurred = false;
    service.updateTask('non-existent-id', { title: 'No task' }).subscribe({
      error: () => {
        errorOccurred = true;
      }
    });

    tick(500);
    expect(errorOccurred).toBeTrue();
    expect(service.error()).toBe('Task with id non-existent-id not found');
  }));
});
