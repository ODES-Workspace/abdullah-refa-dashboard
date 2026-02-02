import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { QuillModule } from 'ngx-quill';
import {
  StaticPagesService,
  StaticPage,
  CreateStaticPageRequest,
} from '../../../services/static-pages.service';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-static-pages',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, TranslateModule, QuillModule],
  templateUrl: './static-pages.component.html',
  styleUrl: './static-pages.component.scss',
})
export class StaticPagesComponent implements OnInit {
  // Admin permission properties
  adminActive: number | null = null;
  permissionsLoading = true;

  get canManagePages(): boolean {
    return this.adminActive === 1;
  }

  // Pages data
  pages: StaticPage[] = [];
  isLoading = false;
  isSaving = false;

  // Edit state
  selectedPage: StaticPage | null = null;
  editMode = false;
  createMode = false;

  // Form fields
  formTitle = '';
  formSlug = '';
  formContent = '';

  // Quill editor configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image'],
    ],
  };

  currentLang: 'en' | 'ar' =
    (localStorage.getItem('lang') as 'en' | 'ar') || 'en';

  constructor(
    private staticPagesService: StaticPagesService,
    private translate: TranslateService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadPages();
    this.loadAdminPermissions();

    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang === 'ar' ? 'ar' : 'en';
    });
  }

  private loadAdminPermissions(): void {
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData && userData.id) {
          this.adminService.getAdminById(userData.id).subscribe({
            next: (adminRes) => {
              this.adminActive = adminRes.active;
              this.permissionsLoading = false;
            },
            error: (err) => {
              console.error('Error fetching admin details:', err);
              this.permissionsLoading = false;
            },
          });
        } else {
          this.permissionsLoading = false;
        }
      } else {
        this.permissionsLoading = false;
      }
    } catch (e) {
      console.error('Error parsing user_data from localStorage:', e);
      this.permissionsLoading = false;
    }
  }

  loadPages(): void {
    this.isLoading = true;
    this.staticPagesService.getStaticPages().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading static pages:', error);
        this.pages = [];
        this.isLoading = false;
      },
    });
  }

  createNewPage(): void {
    this.selectedPage = null;
    this.formTitle = '';
    this.formSlug = '';
    this.formContent = '';
    this.editMode = false;
    this.createMode = true;
  }

  editPage(page: StaticPage): void {
    this.selectedPage = page;
    this.formTitle = page.title;
    this.formSlug = page.slug;
    this.formContent = page.content;
    this.editMode = true;
    this.createMode = false;
  }

  cancelEdit(): void {
    this.selectedPage = null;
    this.editMode = false;
    this.createMode = false;
    this.formTitle = '';
    this.formSlug = '';
    this.formContent = '';
  }

  savePage(): void {
    if (!this.formTitle || !this.formSlug) {
      alert(this.translate.instant('Please fill in all required fields'));
      return;
    }

    this.isSaving = true;

    if (this.createMode) {
      // Create new page
      const request: CreateStaticPageRequest = {
        title: this.formTitle,
        slug: this.formSlug,
        content: this.formContent,
      };

      this.staticPagesService.createStaticPage(request).subscribe({
        next: (newPage) => {
          this.pages.push(newPage);
          this.cancelEdit();
          this.isSaving = false;
          this.loadPages(); // Refresh the list
        },
        error: (error) => {
          console.error('Error creating page:', error);
          alert(this.translate.instant('Error creating page'));
          this.isSaving = false;
        },
      });
    } else if (this.editMode && this.selectedPage) {
      // Update existing page
      const request = {
        title: this.formTitle,
        slug: this.formSlug,
        content: this.formContent,
      };

      this.staticPagesService.updateStaticPage(this.selectedPage.id, request).subscribe({
        next: (updatedPage) => {
          const index = this.pages.findIndex((p) => p.id === updatedPage.id);
          if (index !== -1) {
            this.pages[index] = updatedPage;
          }
          this.cancelEdit();
          this.isSaving = false;
          this.loadPages(); // Refresh the list
        },
        error: (error) => {
          console.error('Error updating page:', error);
          alert(this.translate.instant('Error updating page'));
          this.isSaving = false;
        },
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB');
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onTitleChange(): void {
    // Auto-generate slug from title when creating new page
    if (this.createMode && this.formTitle) {
      this.formSlug = this.generateSlug(this.formTitle);
    }
  }
}
