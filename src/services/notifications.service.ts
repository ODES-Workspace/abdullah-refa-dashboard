import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface NotificationData {
  id: number;
  type: 'rent_request' | 'contract' | 'transaction';
  title: string;
  message: string;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private baseUrl = environment.baseUrl;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get notifications with pagination
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 10)
   * @returns Observable of NotificationsResponse
   */
  getNotifications(
    page: number = 1,
    perPage: number = 10
  ): Observable<NotificationsResponse> {
    return this.http
      .get<NotificationsResponse>(`${this.baseUrl}/notifications`, {
        params: {
          page: page.toString(),
          per_page: perPage.toString(),
        },
      })
      .pipe(
        tap((response) => {
          if (page === 1) {
            // Replace notifications for first page
            this.notificationsSubject.next(response.data);
          } else {
            // Append notifications for subsequent pages
            const currentNotifications = this.notificationsSubject.value;
            this.notificationsSubject.next([
              ...currentNotifications,
              ...response.data,
            ]);
          }
          this.updateUnreadCount();
        }),
        catchError((error) => {
          console.error('Error fetching notifications:', error);
          throw error;
        })
      );
  }

  /**
   * Load more notifications (next page)
   * @param currentPage - Current page number
   * @param perPage - Items per page
   * @returns Observable of NotificationsResponse
   */
  loadMoreNotifications(
    currentPage: number,
    perPage: number = 10
  ): Observable<NotificationsResponse> {
    return this.getNotifications(currentPage + 1, perPage);
  }

  /**
   * Mark a specific notification as read
   * @param notificationId - The notification ID
   * @returns Observable of any
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/notifications/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          // Update the notification in the local state
          const notifications = this.notificationsSubject.value;
          const updatedNotifications = notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          );
          this.notificationsSubject.next(updatedNotifications);
          this.updateUnreadCount();
        }),
        catchError((error) => {
          console.error('Error marking notification as read:', error);
          throw error;
        })
      );
  }

  /**
   * Mark all notifications as read
   * @returns Observable of any
   */
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/read-all`, {}).pipe(
      tap(() => {
        // Update all notifications in the local state
        const notifications = this.notificationsSubject.value;
        const updatedNotifications = notifications.map((notification) => ({
          ...notification,
          read_at: new Date().toISOString(),
        }));
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      }),
      catchError((error) => {
        console.error('Error marking all notifications as read:', error);
        throw error;
      })
    );
  }

  /**
   * Get current notifications
   * @returns Current notifications array
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get current unread count
   * @returns Current unread count
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Update unread count based on current notifications
   */
  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter(
      (notification) => !notification.read_at
    ).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Refresh notifications (reload first page)
   * @returns Observable of NotificationsResponse
   */
  refreshNotifications(): Observable<NotificationsResponse> {
    return this.getNotifications(1);
  }
}
