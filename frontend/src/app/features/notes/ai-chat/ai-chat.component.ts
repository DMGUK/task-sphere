import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
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

  isOpen = signal(false);
  messages = signal<Message[]>([]);
  question = '';
  sending = signal(false);

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

  async send(): Promise<void> {
    const q = this.question.trim();
    if (!q || this.sending()) return;

    this.question = '';
    this.sending.set(true);
    this.messages.update(msgs => [...msgs, { role: 'user', text: q }]);
    this.messages.update(msgs => [...msgs, { role: 'assistant', text: '', streaming: true }]);

    const token = this.tokenStorage.get();
    try {
      const res = await fetch(`${environment.apiBase}/ai/query/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: q, top_k: 5 }),
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
              const token = JSON.parse(payload) as string;
              this.appendToLast(token);
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
      copy[copy.length - 1] = { ...copy[copy.length - 1], streaming };
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
