'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checks = [
  {
    file: 'package.json',
    forbidden: ['barbearia', 'barbeiro'],
  },
  {
    file: 'src/components/GlobalNav.jsx',
    forbidden: ['Barbearia', 'Barbearias', 'Barbeiro', 'Barbeiros'],
  },
];

const required = [
  {
    file: 'package.json',
    tokens: ['agendamento', 'estabelecimentos', 'profissionais'],
  },
  {
    file: 'src/components/GlobalNav.jsx',
    tokens: ['Estabelecimentos', 'Profissionais', 'Área profissional', 'Gestão de estabelecimentos'],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(root, check.file);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${check.file}: arquivo não encontrado`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const token of check.forbidden) {
    if (content.includes(token)) {
      failures.push(`${check.file}: posicionamento específico legado encontrado (${token})`);
    }
  }
}

for (const check of required) {
  const absolutePath = path.join(root, check.file);
  if (!fs.existsSync(absolutePath)) continue;

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const token of check.tokens) {
    if (!content.includes(token)) {
      failures.push(`${check.file}: linguagem genérica esperada ausente (${token})`);
    }
  }
}

if (failures.length) {
  console.error('Product positioning contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Product positioning contract check passed.');
