import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Agent } from './agent.service';
import { Admin } from './admin.service';

export type UserRole = 'admin' | 'agent';
export type User = Agent | Admin;

@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  private userRoleSubject = new BehaviorSubject<UserRole>('agent');
  private userDataSubject = new BehaviorSubject<User | null>(null);

  public userRole$: Observable<UserRole> = this.userRoleSubject.asObservable();
  public userData$: Observable<User | null> =
    this.userDataSubject.asObservable();

  constructor() {
    this.loadUserDataFromStorage();
  }

  /**
   * Load user data from localStorage
   */
  private loadUserDataFromStorage(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userDataSubject.next(user);
        // Ensure the type is valid UserRole
        const normalizedType = (user.type || '').toString().toLowerCase();
        const userType: UserRole =
          normalizedType === 'admin' || normalizedType === 'agent'
            ? normalizedType
            : 'agent';
        this.userRoleSubject.next(userType);
      } catch (error) {
        console.error('Error parsing user data from storage:', error);
        this.clearUserData();
      }
    }
  }

  /**
   * Set user data and role
   */
  setUserData(user: User): void {
    // Store user data in localStorage
    localStorage.setItem('user_data', JSON.stringify(user));

    // Update subjects
    this.userDataSubject.next(user);
    // Ensure the type is valid UserRole
    const normalizedType = (user.type || '').toString().toLowerCase();
    const userType: UserRole =
      normalizedType === 'admin' || normalizedType === 'agent'
        ? normalizedType
        : 'agent';
    this.userRoleSubject.next(userType);
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    return this.userDataSubject.value;
  }

  /**
   * Get current role
   */
  getCurrentRole(): UserRole {
    return this.userRoleSubject.value;
  }

  /**
   * Set user role (for backward compatibility)
   */
  setUserRole(role: UserRole): void {
    this.userRoleSubject.next(role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.getCurrentRole() === 'admin';
  }

  /**
   * Check if user is agent
   */
  isAgent(): boolean {
    return this.getCurrentRole() === 'agent';
  }

  /**
   * Check if user is active
   */
  isUserActive(): boolean {
    const user = this.getCurrentUser();
    return user ? user.active === 1 : false;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = localStorage.getItem('access_token');
    return !!(user && token);
  }

  /**
   * Clear user data and role
   */
  clearUserData(): void {
    localStorage.removeItem('user_data');
    this.userDataSubject.next(null);
    this.userRoleSubject.next('agent');
  }

  /**
   * Get user name
   */
  getUserName(): string {
    const user = this.getCurrentUser();
    return user ? user.name : '';
  }

  /**
   * Get user email
   */
  getUserEmail(): string {
    const user = this.getCurrentUser();
    return user ? user.email : '';
  }

  /**
   * Get user phone number
   */
  getUserPhone(): string {
    const user = this.getCurrentUser();
    return user ? user.phone_number || '' : '';
  }

  /**
   * Get stored admin ID from localStorage
   */
  getStoredAdminId(): number | null {
    const adminId = localStorage.getItem('admin_id');
    return adminId ? parseInt(adminId, 10) : null;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  /**
   * Refresh admin profile data from localStorage
   */
  refreshAdminProfile(): void {
    const adminId = this.getStoredAdminId();
    if (adminId) {
      // Update the current user data with the stored admin ID
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.type === 'admin') {
        const updatedUser = { ...currentUser, id: adminId };
        this.setUserData(updatedUser);
      }
    }
  }

  /**
   * Get stored agent ID from localStorage
   */
  getStoredAgentId(): number | null {
    const agentId = localStorage.getItem('agent_id');
    return agentId ? parseInt(agentId, 10) : null;
  }

  /**
   * Refresh agent profile data from localStorage
   */
  refreshAgentProfile(): void {
    const agentId = this.getStoredAgentId();
    if (agentId) {
      // Update the current user data with the stored agent ID
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.type === 'agent') {
        const updatedUser = { ...currentUser, id: agentId };
        this.setUserData(updatedUser);
      }
    }
  }
}
