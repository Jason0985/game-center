import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { supabase } from '../../supabase.client';
import { AppErrorService } from '../../services/app-error.service';
import { describeSupabaseError } from '../../services/supabase-errors';
import { SkeletonRows } from '../../ui/skeleton-rows';
import { RoleManagement } from './role-management/role-management';

interface ClientError {
  id: number;
  created_at: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  app_version: string | null;
  profile: { username: string } | null;
}

const timeFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' });

// Nur für Admins (roleGuard): Fehler-Überwachung und Rollenmanagement
@Component({
  selector: 'app-admin',
  imports: [MatIconModule, MatTooltipModule, RouterLink, RoleManagement, SkeletonRows],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  private readonly appError = inject(AppErrorService);
  readonly errors = signal<ClientError[] | null>(null);
  readonly formatTime = (value: string) => timeFormat.format(new Date(value));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    const { data, error } = await supabase
      .from('client_errors')
      .select('*, profile:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) this.appError.report(describeSupabaseError(error));
    this.errors.set((data as ClientError[] | null) ?? []);
  }

  async resolve(entry: ClientError): Promise<void> {
    const { error } = await supabase.from('client_errors').delete().eq('id', entry.id);
    if (error) return this.appError.report(describeSupabaseError(error));
    this.errors.update((errors) => errors?.filter((existing) => existing.id !== entry.id) ?? null);
  }
}
