// 3-layer Lua obfuscator — XOR + ByteTable + junk code
// Matches the client-side obfuscator in index.html

function randVar() {
  const s = ['I', 'l', 'O', '_'];
  let n = s[Math.floor(Math.random() * s.length)];
  for (let i = 0; i < 10 + Math.floor(Math.random() * 15); i++) {
    const c = 'IlO_' + (i > 0 ? '10' : '');
    n += c[Math.floor(Math.random() * c.length)];
  }
  return n + '_' + Math.random().toString(36).slice(2, 6);
}

function junkCode(count) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const v = randVar();
    const t = Math.floor(Math.random() * 4);
    if (t === 0) lines.push(`local ${v}=${Math.floor(Math.random() * 999999)}`);
    else if (t === 1) lines.push(`local ${v}="${Math.random().toString(36).slice(2)}"`);
    else if (t === 2) lines.push(`local ${v}=string.rep("${String.fromCharCode(65 + Math.floor(Math.random() * 26))}",${Math.floor(Math.random() * 50)})`);
    else lines.push(`local ${v}=tostring(${Math.floor(Math.random() * 99999)})`);
  }
  return lines.join('\n');
}

function byteTable(code) {
  const bytes = [];
  for (let i = 0; i < code.length; i++) bytes.push(code.charCodeAt(i));
  const t = randVar(), r = randVar(), iv = randVar();
  const chunks = [];
  const cs = 15 + Math.floor(Math.random() * 20);
  for (let i = 0; i < bytes.length; i += cs) chunks.push(bytes.slice(i, i + cs).join(','));
  return `local ${t}={${chunks.join(',\n')}}\nlocal ${r}={}\nfor ${iv}=1,#${t} do\n${r}[${iv}]=string.char(${t}[${iv}])\nend\nloadstring(table.concat(${r}))()`;
}

function xorEncrypt(code) {
  const kl = 32 + Math.floor(Math.random() * 33);
  const key = [];
  for (let i = 0; i < kl; i++) key.push(1 + Math.floor(Math.random() * 254));
  const enc = [];
  for (let i = 0; i < code.length; i++) enc.push(code.charCodeAt(i) ^ key[i % kl]);
  const xf = randVar(), kv = randVar(), dv = randVar(), rv = randVar(), iv = randVar(), av = randVar(), bv = randVar(), rr = randVar(), pv = randVar();
  return `local function ${xf}(${av},${bv})\nlocal ${rr},${pv}=0,1\nfor _=0,7 do\nlocal _a=math.floor(${av}/${pv})%2\nlocal _b=math.floor(${bv}/${pv})%2\nif _a~=_b then ${rr}=${rr}+${pv} end\n${pv}=${pv}*2\nend\nreturn ${rr}\nend\nlocal ${kv}={${key.join(',')}}\nlocal ${dv}={${enc.join(',')}}\nlocal ${rv}={}\nfor ${iv}=1,#${dv} do\n${rv}[${iv}]=string.char(${xf}(${dv}[${iv}],${kv}[((${iv}-1)%#${kv})+1]))\nend\nloadstring(table.concat(${rv}))()`;
}

export function obfuscateLua(code) {
  let r = byteTable(code);
  r = junkCode(3) + '\n' + r;
  r = xorEncrypt(r);
  r = junkCode(4) + '\n' + r;
  r = byteTable(r);
  return '-- mohzzzz hub | protected script\n-- deobfuscation = ban\n' + junkCode(6) + '\n' + r;
}
