'use strict';
const fs=require('fs'); const path=require('path');
const out=path.join(process.cwd(),'build'); const site='https://rasoio.petertecnet.com.br'; const today=new Date().toISOString().slice(0,10);
const publicDir=path.join(process.cwd(),'public');
const routes=fs.existsSync(publicDir)?fs.readdirSync(publicDir,{withFileTypes:true}).filter(e=>e.isDirectory()&&fs.existsSync(path.join(publicDir,e.name,'index.html'))).filter(e=>!/^(login|register|password|profile|admin|checkout)$/i.test(e.name)).map(e=>`/${e.name}/`):[];
const urls=['/',...routes]; const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.mkdirSync(out,{recursive:true}); fs.writeFileSync(path.join(out,'sitemap.xml'),xml); fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /register\nDisallow: /password-email\nDisallow: /password/\nDisallow: /profile\nDisallow: /admin\nDisallow: /checkout\nDisallow: /item/products\nDisallow: /establishments\n\nSitemap: ${site}/sitemap.xml\n`); console.log(`[seo] Rasoio: ${urls.length} URLs públicas no sitemap; rotas funcionais removidas da descoberta.`);
