import { marked } from 'marked';

export const markdownToHTML = (markdown: string) => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  return marked.parse(markdown);
};
