import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TokenStorageService } from '../../../core/token-storage.service';
import { environment } from '../../../../environments/environment';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.scss'],
})
export class AiChatComponent implements AfterViewChecked {
  private tokenStorage = inject(TokenStorageService);

  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;
  @Output() noteCreated = new EventEmitter<void>();

  isOpen = signal(false);
  messages = signal<Message[]>([]);
  question = '';
  sending = signal(false);
  syncing = signal(false);

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  async syncNotes(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    const token = this.tokenStorage.get();
    try {
      const res = await fetch(`${environment.apiBase}/notes/reindex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      this.messages.update(msgs => [...msgs, {
        role: 'assistant',
        text: res.ok
          ? `Synced ${data.count} note${data.count !== 1 ? 's' : ''} to AI. You can now ask about all of them.`
          : 'Sync failed — try again.',
      }]);
    } catch {
      this.messages.update(msgs => [...msgs, { role: 'assistant', text: 'Sync failed — try again.' }]);
    } finally {
      this.syncing.set(false);
    }
  }

  async send(): Promise<void> {
    const raw = this.question.trim();
    if (!raw || this.sending()) return;

    this.question = '';
    this.sending.set(true);

    // /note command — create a note
    if (raw.startsWith('/note')) {
      await this.handleNoteCommand(raw);
      this.sending.set(false);
      return;
    }

    this.messages.update(msgs => [...msgs, { role: 'user', text: raw }]);
    this.messages.update(msgs => [...msgs, { role: 'assistant', text: '', streaming: true }]);

    const token = this.tokenStorage.get();
    try {
      const res = await fetch(`${environment.apiBase}/ai/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: raw, top_k: 5 }),
      });

      if (!res.ok) {
        this.replaceLastMessage('Sorry, the AI service is unavailable right now.', false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop()!;

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const payload = event.slice(6);
          if (payload === '[DONE]') {
            this.setStreaming(false);
          } else if (!payload.startsWith('[SOURCES]')) {
            try {
              this.appendToLast(JSON.parse(payload) as string);
            } catch { /* ignore malformed events */ }
          }
        }
      }
    } catch {
      this.replaceLastMessage('Error connecting to AI service.', false);
    } finally {
      this.sending.set(false);
      this.setStreaming(false);
    }
  }

  private async handleNoteCommand(raw: string): Promise<void> {
    const body = raw.slice('/note'.length).trimStart();
    const nlIdx = body.indexOf('\n');
    const title = (nlIdx === -1 ? body : body.slice(0, nlIdx)).trim();
    const content = nlIdx === -1 ? '' : body.slice(nlIdx + 1).trim();

    this.messages.update(msgs => [...msgs, { role: 'user', text: raw }]);

    if (!title) {
      this.messages.update(msgs => [...msgs, { role: 'assistant', text: 'Usage: /note Title\nOptional content here…' }]);
      return;
    }

    const token = this.tokenStorage.get();
    try {
      const res = await fetch(`${environment.apiBase}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, content: content || null, color: '#ffffff' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      this.messages.update(msgs => [...msgs, {
        role: 'assistant',
        text: `Note "${data.title}" created and synced to AI. You can now ask about it.`,
      }]);
      this.noteCreated.emit();
    } catch (err: any) {
      this.messages.update(msgs => [...msgs, { role: 'assistant', text: `Failed to create note: ${err.message}` }]);
    }
  }

  private appendToLast(text: string): void {
    this.messages.update(msgs => {
      const copy = [...msgs];
      const last = { ...copy[copy.length - 1] };
      last.text += text;
      copy[copy.length - 1] = last;
      return copy;
    });
  }

  private replaceLastMessage(text: string, streaming: boolean): void {
    this.messages.update(msgs => {
      const copy = [...msgs];
      copy[copy.length - 1] = { ...copy[copy.length - 1], text, streaming };
      return copy;
    });
  }

  private setStreaming(streaming: boolean): void {
    this.messages.update(msgs => {
      const copy = [...msgs];
      if (copy.length && copy[copy.length - 1].role === 'assistant') {
        copy[copy.length - 1] = { ...copy[copy.length - 1], streaming };
      }
      return copy;
    });
  }

  ngAfterViewChecked(): void {
    if (this.messagesEl) {
      const el = this.messagesEl.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
