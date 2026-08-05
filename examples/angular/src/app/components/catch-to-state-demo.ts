import { Component, signal } from '@angular/core';
import { catchToState, withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fake-api';

@Component({
  selector: 'app-catch-to-state-demo',
  imports: [],
  templateUrl: './catch-to-state-demo.html',
})
export class CatchToStateDemo {
  loading = signal(false);
  error = signal<unknown>(null);
  name = signal<string | null>(null);

  run(): void {
    this.error.set(null);
    fetchUser$(4, { latency: 500, failRate: 0.5 })
      .pipe(withLoading(this.loading), catchToState(this.error))
      .subscribe((user) => this.name.set(user.name));
  }

  get errorMessage(): string {
    return (this.error() as Error)?.message ?? '';
  }
}
