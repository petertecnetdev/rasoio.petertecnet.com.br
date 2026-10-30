'use strict';
// Mantém o símbolo oficial em um único arquivo e gera um ícone escalável
// compatível com manifestos PWA, sem depender de serviços externos.
const fs = require('fs');
const path = require('path');
const publicDir = path.resolve(__dirname, '..', 'public');
const image = fs.readFileSync(path.join(publicDir, 'rasoio-logo.webp'));
const base64 = image.toString('base64');
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 192 192">' +
  '<rect width="192" height="192" fill="#000" />' +
  '<image width="192" height="192" href="data:image/webp;base64,' + base64 + '" />' +
  '</svg>\n';
fs.writeFileSync(path.join(publicDir, 'rasoio-logo.svg'), svg);
console.log('[Rasoio] Ícone PWA atualizado a partir da logo oficial.');
