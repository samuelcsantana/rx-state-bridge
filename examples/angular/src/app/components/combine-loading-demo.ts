import { Component, computed, signal } from '@angular/core';
import { combineLoading, withLoading } from 'rx-state-bridge';
import { fetchUser$ } from '../fake-api';

@Component({
  selector: 'app-combine-loading-demo',
  imports: [],
  templateUrl: './combine-loading-demo.html',
})
export class CombineLoadingDemo {
  usersLoading = signal(false);
  ordersLoading = signal(false);
  isAnythingLoading = computed(() => combineLoading(this.usersLoading(), this.ordersLoading()));

  fetchUsers(): void {
    fetchUser$(7, { latency: 700 }).pipe(withLoading(this.usersLoading)).subscribe();
  }

  fetchOrders(): void {
    fetchUser$(8, { latency: 1400 }).pipe(withLoading(this.ordersLoading)).subscribe();
  }
}
