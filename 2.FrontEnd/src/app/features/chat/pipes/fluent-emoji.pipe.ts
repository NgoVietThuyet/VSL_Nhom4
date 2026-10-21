import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeHtml } from '../../../core/security/html-sanitize';

@Pipe({
  name: 'fluentEmoji',
  standalone: true
})
export class FluentEmojiPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(content: any): any {
    if (!content) return content;
    
    // If it's SafeHtml, we need to get the string out
    // Angular doesn't expose a public way to get the string, but we can check if it's an object
    let text: string = typeof content === 'string' ? content : '';
    if (typeof content === 'object' && content !== null) {
      text = (content as { changingThisBreaksApplicationSecurity?: string }).changingThisBreaksApplicationSecurity
        ?? String(content);
    }

    const replaced = text.replace(/:([a-z0-9-]+):/g, (_match: string, name: string) => {
      const url = `https://api.iconify.design/fluent-emoji:${encodeURIComponent(name)}.svg`;
      return `<img src="${url}" class="emoji-inline-msg" alt="${name}" style="width: 22px; height: 22px; vertical-align: middle; margin: 0 2px;">`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(sanitizeHtml(replaced, 'richText'));
  }
}
