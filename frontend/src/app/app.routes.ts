// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  // Root → login
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // 1) Public auth routes
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-module').then(m => m.AuthModule),
  },

  // 2) Protected app shell (everything else goes through authGuard)
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'tasks',
        loadChildren: () =>
          import('./features/tasks/tasks-module').then(m => m.TasksModule),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar-module').then(m => m.CalendarModule),
      },
      {
        path: 'notes',
        loadChildren: () =>
          import('./features/notes/notes-module').then(m => m.NotesModule),
      },

      // when inside the shell: '' -> 'tasks'
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile-module').then((m) => m.ProfileModule),
      },
    ],
  },



  // 3) Fallback
  { path: '**', redirectTo: 'auth/login' },
];
