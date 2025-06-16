export const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // simple unordered lists
  html = html.replace(/^-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/<li>([^<]+)<\/li>(\n<li>[^<]+<\/li>)+/g, match => '<ul>' + match + '</ul>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};
