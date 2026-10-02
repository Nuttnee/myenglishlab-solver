'use strict';
// V11 launcher entry point, simplified: the user signs in directly in the browser.
const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const extension = path.resolve(__dirname,'..');
const bases = [process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean);
const choices = ['Microsoft/Edge/Application/msedge.exe','Google/Chrome/Application/chrome.exe'].flatMap(p=>bases.map(b=>path.join(b,p)));
const browser = choices.find(p=>fs.existsSync(p));
if (!browser) {console.error('Khong tim thay Chrome / Edge. Mo trinh duyet va Load unpacked thu muc:',extension);process.exitCode=1;}
else {
  console.log('Thu muc extension:',extension);
  console.log('Neu chua nap extension: Extensions > Developer mode > Load unpacked > chon thu muc tren.');
  console.log('Tu dang nhap tren trang Pearson. Khong can nhap tai khoan trong CMD.');
  const scheme = browser.toLowerCase().includes('msedge') ? 'edge' : 'chrome';
  const profile = path.join(process.env.LOCALAPPDATA || path.dirname(extension),'MyEnglishLabV11Plus','browser-profile');
  fs.mkdirSync(profile,{recursive:true});
  spawn(browser,[`--user-data-dir=${profile}`,`--load-extension=${extension}`,'--no-first-run','--new-window',`${scheme}://extensions/`,'https://myenglishlab.pearson-intl.com/courses'],{detached:true,stdio:'ignore',windowsHide:true}).unref();
}
