import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import MarkdownIt from 'markdown-it';
import { sanitizeHtml } from '../../../core/security/html-sanitize';

const md = new MarkdownIt({
    html: false,       // disallow raw HTML in source for XSS safety
    linkify: true,     // auto-convert URLs to links
    typographer: true,
    breaks: true,      // treat single newlines as <br>
})
// Open every link in a new tab with noopener
.use((instance) => {
    const defaultRender = instance.renderer.rules['link_open'] ??
        ((...args: Parameters<typeof instance.renderer.renderToken>) => instance.renderer.renderToken(...args));

    instance.renderer.rules['link_open'] = (tokens, idx, options, env, self) => {
        tokens[idx].attrSet('target', '_blank');
        tokens[idx].attrSet('rel', 'noopener noreferrer');
        return defaultRender(tokens, idx, options, env, self);
    };
});

@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string): SafeHtml {
        if (!value) return '';
        const html = md.render(value);
        return this.sanitizer.bypassSecurityTrustHtml(sanitizeHtml(html, 'richText'));
    }
}
