import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import { createHighlighter } from 'shiki';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const containerConfigs = {
  'definition': { title: 'Definition', icon: '📖', class: 'card-definition' },
  'mental-model': { title: 'Mental Model', icon: '🧠', class: 'card-mental-model' },
  'story': { title: 'Real World Story', icon: '🌍', class: 'card-story' },
  'cpu': { title: 'Become the CPU', icon: '⚙', class: 'card-cpu' },
  'memory': { title: 'Memory Explorer', icon: '📦', class: 'card-memory' },
  'kinetic': { title: 'Kinetic Example', icon: '🚀', class: 'card-kinetic' },
  'warning': { title: 'Warning', icon: '⚠', class: 'card-warning' },
  'challenge': { title: 'Challenge', icon: '🏆', class: 'card-challenge' },
  'remember': { title: 'Remember Forever', icon: '📌', class: 'card-remember' }
};

async function build() {
  console.log('Building static site...');
  
  // Setup Shiki and Markdown
  const highlighter = await createHighlighter({
    themes: ['dark-plus', 'light-plus'],
    langs: ['rust', 'json', 'bash', 'toml', 'html', 'css', 'javascript']
  });
  
  const md = new MarkdownIt({
    html: true,
    highlight: (code, lang) => {
      if (lang && lang !== 'mermaid') {
        return highlighter.codeToHtml(code, { 
          lang: lang, 
          themes: { light: 'light-plus', dark: 'dark-plus' }
        });
      }
      if (lang === 'mermaid') {
        return `<div class="mermaid">\n${code}\n</div>`;
      }
      return '';
    }
  });

  Object.keys(containerConfigs).forEach(name => {
    const config = containerConfigs[name];
    md.use(markdownItContainer, name, {
      render: function (tokens, idx) {
        const m = tokens[idx].info.trim().match(new RegExp(`^${name}\\s*(.*)$`));
        if (tokens[idx].nesting === 1) {
          const customTitle = m && m[1] ? m[1] : config.title;
          return `<div class="card ${config.class}">\n  <div class="card-header">\n    <span class="card-icon">${config.icon}</span>\n    <span class="card-title">${customTitle}</span>\n  </div>\n  <div class="card-body">\n`;
        } else {
          return '  </div>\n</div>\n';
        }
      }
    });
  });

  // Prepare dist dir
  const distDir = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Copy public and assets
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }
  
  const assetsDir = path.resolve(__dirname, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.resolve(distDir, 'assets'), { recursive: true });
  }

  // Render HTML files
  const layout = fs.readFileSync(path.resolve(__dirname, 'layouts/chapter.html'), 'utf-8');
  const chaptersDir = path.resolve(__dirname, 'chapters');
  const files = fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const pageName = file.replace('.md', '');
    const mdContent = fs.readFileSync(path.resolve(chaptersDir, file), 'utf-8');
    const htmlContent = md.render(mdContent);
    
    // In dev, Vite transformed index.html and injected things. For SSG, we just need to use the layout directly.
    let finalHtml = layout.replace('<!-- CONTENT -->', htmlContent);
    finalHtml = finalHtml.replace('<!-- TITLE -->', pageName);
    // Replace Vite's CSS injection with actual link tag since Vite isn't building this
    finalHtml = finalHtml.replace(
      '</head>', 
      `<link rel="stylesheet" href="/assets/styles/base.css">\n<link rel="stylesheet" href="/assets/styles/cards.css">\n</head>`
    );
    
    fs.writeFileSync(path.resolve(distDir, `${pageName}.html`), finalHtml);
    
    if (pageName === '01-variables') {
      fs.writeFileSync(path.resolve(distDir, 'index.html'), finalHtml);
    }
  }

  console.log('Build complete!');
}

build();
