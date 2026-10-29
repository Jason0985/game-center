import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { HeaderChatService } from './services/header-chat.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.top-bar-title')?.textContent).toContain('Game Center');
  });

  it('shows the lobby chat next to the notifications while a lobby registers it', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const header = (fixture.nativeElement as HTMLElement).querySelector('.header-actions')!;
    expect(header.querySelector('[aria-label^="Lobby-Chat"]')).toBeNull();

    const open = vi.fn();
    TestBed.inject(HeaderChatService).chat.set({ unread: signal(3), open });
    await fixture.whenStable();
    const button = header.querySelector('button.header-icon-button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Lobby-Chat, 3 neu');
    expect(button.textContent).toContain('3');
    expect(button.nextElementSibling?.getAttribute('href')).toBe('/notifications');
    button.click();
    expect(open).toHaveBeenCalled();
  });
});
