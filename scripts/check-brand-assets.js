'use strict';
/** Garante que todas as telas utilizem a marca oficial do Rasoio. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const extensions = /\.(?:js|jsx|ts|tsx|css|scss|html|json)$/i;
const forbidden = [
  /\/rasoio-logo\.png\b/g,
  /\/images\/logo\.(?:png|gif)\b/g,
];
const offenders = [];
function scan(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) {
      scan(full);
      continue;
    }
    if (!item.isFile() || !extensions.test(item.name)) continue;
    const content = fs.readFileSync(full, 'utf8');
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) offenders.push(path.relative(root, full) + ': ' + pattern.source);
    }
  }
}
scan(path.join(root, 'src'));
scan(path.join(root, 'public'));
if (!fs.existsSync(path.join(root, 'public', 'rasoio-logo.webp'))) {
  offenders.push('public/rasoio-logo.webp ausente');
}
if (offenders.length) {
  console.error('Referências antigas de marca Rasoio:\n' + offenders.join('\n'));
  process.exit(1);
}
console.log('Marca Rasoio consistente: nenhum caminho antigo encontrado.');
