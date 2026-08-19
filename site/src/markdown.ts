// Minimal renderer for the course's own lesson.md files: headings, paragraphs,
// fenced code blocks, unordered lists, and `code`/**bold**/[link](url) inline spans.
// Not a general Markdown implementation — the content is authored, not user input.

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, (_, bold) => `<strong>${bold}</strong>`)
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, text, href) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`,
    );
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const code: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) {
        code.push(lines[j]);
        j++;
      }
      html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>\n`;
      i = j + 1;
      continue;
    }

    if (line.startsWith("## ")) {
      html += `<h2>${inline(escapeHtml(line.slice(3)))}</h2>\n`;
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      html += `<h1>${inline(escapeHtml(line.slice(2)))}</h1>\n`;
      i++;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].startsWith("- ")) {
        items.push(lines[j].slice(2));
        j++;
      }
      html += `<ul>${items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join("")}</ul>\n`;
      i = j;
      continue;
    }

    const ordered = line.match(/^\d+\.\s(.*)/);
    if (ordered) {
      const items: string[] = [ordered[1]];
      let j = i + 1;
      let m: RegExpMatchArray | null;
      while (j < lines.length && (m = lines[j].match(/^\d+\.\s(.*)/))) {
        items.push(m[1]);
        j++;
      }
      html += `<ol>${items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join("")}</ol>\n`;
      i = j;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [line];
    let j = i + 1;
    while (
      j < lines.length &&
      lines[j].trim() !== "" &&
      !lines[j].startsWith("#") &&
      !lines[j].startsWith("```") &&
      !lines[j].startsWith("- ") &&
      !/^\d+\.\s/.test(lines[j])
    ) {
      para.push(lines[j]);
      j++;
    }
    html += `<p>${inline(escapeHtml(para.join(" ")))}</p>\n`;
    i = j;
  }

  return html;
}
