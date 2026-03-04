// mohzzzz — Multi-Layer Lua Obfuscator
// 3 layers: ByteTable → XOR Encryption → ByteTable wrap
// Random keys + confusing variable names = nearly impossible to reverse

// Generate confusing variable names (mix of I, l, 1, O, 0)
function randVar() {
  const confusing = ['I', 'l', '1', 'O', '0', 'Il', 'lI', 'I1', '1I', 'O0', '0O'];
  let name = '_';
  // Start with a letter prefix so it's valid Lua
  const starts = ['I', 'l', 'O', '_'];
  name = starts[Math.floor(Math.random() * starts.length)];
  for (let i = 0; i < 10 + Math.floor(Math.random() * 15); i++) {
    const set = 'IlO_' + (i > 0 ? '10' : '');
    name += set[Math.floor(Math.random() * set.length)];
  }
  // Ensure uniqueness with random suffix
  name += '_' + Math.random().toString(36).slice(2, 6);
  return name;
}

// Generate junk Lua code (dead code that does nothing)
function generateJunk(count) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    const v = randVar();
    const type = Math.floor(Math.random() * 5);
    switch (type) {
      case 0: lines.push(`local ${v}=${Math.floor(Math.random() * 999999)}`); break;
      case 1: lines.push(`local ${v}="${Math.random().toString(36).slice(2)}"`); break;
      case 2: lines.push(`local ${v}=math.floor(${Math.random().toFixed(6)}*${Math.floor(Math.random() * 9999)})`); break;
      case 3: lines.push(`local ${v}=string.rep("${String.fromCharCode(65 + Math.floor(Math.random() * 26))}",${Math.floor(Math.random() * 50)})`); break;
      case 4: lines.push(`local ${v}=tostring(${Math.floor(Math.random() * 99999)})..tostring(${Math.floor(Math.random() * 99999)})`); break;
    }
  }
  return lines.join('\n');
}

// LAYER 1: Byte Table — converts code to {byte,byte,...} → string.char → loadstring
function byteTableLayer(luaCode) {
  const bytes = [];
  for (let i = 0; i < luaCode.length; i++) {
    bytes.push(luaCode.charCodeAt(i));
  }

  const tblVar = randVar();
  const resVar = randVar();
  const iVar = randVar();

  // Split into chunks of random size to make pattern matching harder
  const chunkSize = 15 + Math.floor(Math.random() * 20);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize).join(','));
  }

  // Build the table with line breaks between chunks
  const tableStr = chunks.join(',\n');

  return `local ${tblVar}={${tableStr}}
local ${resVar}={}
for ${iVar}=1,#${tblVar} do
${resVar}[${iVar}]=string.char(${tblVar}[${iVar}])
end
loadstring(table.concat(${resVar}))()`;
}

// LAYER 2: XOR Encryption — encrypts with random key, decrypts at runtime
function xorLayer(luaCode) {
  // Random key of 32-64 bytes
  const keyLen = 32 + Math.floor(Math.random() * 33);
  const key = [];
  for (let i = 0; i < keyLen; i++) {
    key.push(1 + Math.floor(Math.random() * 254)); // avoid 0 and 255
  }

  // XOR encrypt in JS
  const encrypted = [];
  for (let i = 0; i < luaCode.length; i++) {
    encrypted.push(luaCode.charCodeAt(i) ^ key[i % keyLen]);
  }

  const xorFunc = randVar();
  const keyVar = randVar();
  const dataVar = randVar();
  const resVar = randVar();
  const iVar = randVar();
  const aVar = randVar();
  const bVar = randVar();
  const rVar = randVar();
  const pVar = randVar();

  // Manual bitwise XOR that works in Roblox Luau (no bit32 needed)
  return `local function ${xorFunc}(${aVar},${bVar})
local ${rVar},${pVar}=0,1
for _=0,7 do
local _a=math.floor(${aVar}/${pVar})%2
local _b=math.floor(${bVar}/${pVar})%2
if _a~=_b then ${rVar}=${rVar}+${pVar} end
${pVar}=${pVar}*2
end
return ${rVar}
end
local ${keyVar}={${key.join(',')}}
local ${dataVar}={${encrypted.join(',')}}
local ${resVar}={}
for ${iVar}=1,#${dataVar} do
${resVar}[${iVar}]=string.char(${xorFunc}(${dataVar}[${iVar}],${keyVar}[((${iVar}-1)%#${keyVar})+1]))
end
loadstring(table.concat(${resVar}))()`;
}

// LAYER 3: String encoding — converts to hex escape sequences
function hexStringLayer(luaCode) {
  let hex = '';
  for (let i = 0; i < luaCode.length; i++) {
    const code = luaCode.charCodeAt(i);
    hex += '\\' + code.toString(8).padStart(3, '0'); // Lua octal escapes
  }

  const sVar = randVar();

  return `local ${sVar}="${hex}"
loadstring(${sVar})()`;
}

// MAIN: Apply all layers with junk code between them
export function obfuscateLua(code) {
  // Layer 1 (innermost): Byte table wrap
  let result = byteTableLayer(code);

  // Add junk between layers
  result = generateJunk(3) + '\n' + result;

  // Layer 2: XOR encryption
  result = xorLayer(result);

  // More junk
  result = generateJunk(4) + '\n' + result;

  // Layer 3 (outermost): Byte table wrap again
  result = byteTableLayer(result);

  // Final junk header + anti-decompile comment
  const header = [
    '-- Protected by mohzzzz hub',
    '-- Deobfuscation is a violation of ToS',
    generateJunk(6)
  ].join('\n');

  return header + '\n' + result;
}
