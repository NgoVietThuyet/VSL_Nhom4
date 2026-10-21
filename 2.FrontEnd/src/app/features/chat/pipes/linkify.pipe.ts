import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeHtml } from '../../../core/security/html-sanitize';

@Pipe({
    name: 'linkify',
    standalone: true
})
export class LinkifyPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string): SafeHtml {
        if (!value) return value;
        // SECURITY: escape HTML first so untrusted input cannot inject markup/scripts,
        // then linkify only http(s) URLs.
        const escaped = this.escapeHtml(value);
        const urlRegex = /(https?:\/\/[^\s<]+)/g;
        const replaced = escaped.replace(urlRegex, (match) => {
            const href = encodeURI(match).replace(/"/g, '%22');
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${match}</a>`;
        });
        return this.sanitizer.bypassSecurityTrustHtml(sanitizeHtml(replaced, 'richText'));
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
