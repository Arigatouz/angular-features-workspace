import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
    // Configure marked options for better rendering
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Add <br> for single line breaks
    });
  }

  transform(value: string): SafeHtml {
    if (!value) return '';

    try {
      // Parse Markdown and add custom classes
      let html = marked.parse(value) as string;

      // Add custom classes to elements
      html = html
        .replace(/<h1>/g, '<h1 class="markdown-h1">')
        .replace(/<h2>/g, '<h2 class="markdown-h2">')
        .replace(/<h3>/g, '<h3 class="markdown-h3">')
        .replace(/<h4>/g, '<h4 class="markdown-h4">')
        .replace(/<h5>/g, '<h5 class="markdown-h5">')
        .replace(/<h6>/g, '<h6 class="markdown-h6">')
        .replace(/<p>/g, '<p class="markdown-paragraph">')
        .replace(/<ul>/g, '<ul class="markdown-list">')
        .replace(/<ol>/g, '<ol class="markdown-list">')
        .replace(/<li>/g, '<li class="markdown-list-item">')
        .replace(/<code>/g, '<code class="markdown-inline-code">')
        .replace(/<pre><code class="markdown-inline-code">/g, '<pre class="markdown-code-block"><code>')
        .replace(/<blockquote>/g, '<blockquote class="markdown-blockquote">')
        .replace(/<table>/g, '<table class="markdown-table">');

      return this.sanitizer.bypassSecurityTrustHtml(html);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return value; // Return the original text if parsing fails
    }
  }
}