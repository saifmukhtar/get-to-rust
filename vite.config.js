import { defineConfig } from 'vite';
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

export default defineConfig({
  plugins: [
    {
      name: 'markdown-pages',
      async configureServer(server) {
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
                themes: {
                  light: 'light-plus',
                  dark: 'dark-plus'
                }
              });
            }
            if (lang === 'mermaid') {
              return `<div class="mermaid">\n${code}\n</div>`;
            }
            return '';
          }
        });

        // Register all containers
        Object.keys(containerConfigs).forEach(name => {
          const config = containerConfigs[name];
          md.use(markdownItContainer, name, {
            render: function (tokens, idx) {
              const m = tokens[idx].info.trim().match(new RegExp(`^${name}\\s*(.*)$`));
              if (tokens[idx].nesting === 1) {
                // opening tag
                const customTitle = m && m[1] ? m[1] : config.title;
                return `<div class="card ${config.class}">\n  <div class="card-header">\n    <span class="card-icon">${config.icon}</span>\n    <span class="card-title">${customTitle}</span>\n  </div>\n  <div class="card-body">\n`;
              } else {
                // closing tag
                return '  </div>\n</div>\n';
              }
            }
          });
        });

        server.middlewares.use(async (req, res, next) => {
          if (req.url.endsWith('.html') || req.url === '/' || (!req.url.includes('.') && !req.url.startsWith('/@'))) {
            let pageName = req.url === '/' ? '01-variables' : req.url.replace('.html', '').replace(/^\//, '');
            if (!pageName) pageName = '01-variables'; // default
            
            const mdPath = path.resolve(__dirname, `chapters/${pageName}.md`);
            if (fs.existsSync(mdPath)) {
              const mdContent = fs.readFileSync(mdPath, 'utf-8');
              const htmlContent = md.render(mdContent);
              const layoutPath = path.resolve(__dirname, 'layouts/chapter.html');
              let layout = fs.readFileSync(layoutPath, 'utf-8');
              
              // Replace placeholder
              layout = layout.replace('<!-- CONTENT -->', htmlContent);
              layout = layout.replace('<!-- TITLE -->', pageName);
              
              layout = await server.transformIndexHtml(req.url, layout);
              
              res.setHeader('Content-Type', 'text/html');
              res.end(layout);
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
