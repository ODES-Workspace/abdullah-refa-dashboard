import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UserRole = 'admin' | 'agent';

@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  private userRoleSubject = new BehaviorSubject<UserRole>('agent');
  public userRole$: Observable<UserRole> = this.userRoleSubject.asObservable();

  constructor() {}

  getCurrentRole(): UserRole {
    return this.userRoleSubject.value;
  }

  setUserRole(role: UserRole): void {
    this.userRoleSubject.next(role);
  }

  isAdmin(): boolean {
    return this.getCurrentRole() === 'admin';
  }

  isAgent(): boolean {
    return this.getCurrentRole() === 'agent';
  }
}
