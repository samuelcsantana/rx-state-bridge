import { Component, signal } from '@angular/core';
import { withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fake-api';

@Component({
  selector: 'app-with-loading-demo',
  imports: [],
  templateUrl: './with-loading-demo.html',
})
export class WithLoadingDemo {
  loading = signal(false);
  name = signal<string | null>(null);

  run(): void {
    fetchUser$(1, { latency: 800 })
      .pipe(withLoading(this.loading))
      .subscribe((user) => this.name.set(user.name));
  }
}
