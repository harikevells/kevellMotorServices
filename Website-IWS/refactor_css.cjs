const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findCssFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findCssFiles(filePath, fileList);
    } else if (filePath.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const cssFiles = findCssFiles(srcDir);

cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Tablet overrides (1024px, 992px, 900px) -> max-width: 1023px
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*1024px\s*\)/g, '@media (max-width: 1023px)');
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*992px\s*\)/g, '@media (max-width: 1023px)');
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*900px\s*\)/g, '@media (max-width: 1023px)');

  // Mobile overrides (768px, 600px, 576px, 375px) -> max-width: 600px
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*768px\s*\)/g, '@media (max-width: 600px)');
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*576px\s*\)/g, '@media (max-width: 600px)');
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*375px\s*\)/g, '@media (max-width: 600px)');

  // Large Desktop overrides -> min-width: 1024px and max-width: 2500px
  content = content.replace(/@media\s*\(\s*min-width\s*:\s*2000px\s*\)/g, '@media (min-width: 1024px) and (max-width: 2500px)');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated breakpoints in ${file}`);
  }
});

console.log('Done refactoring CSS files.');
