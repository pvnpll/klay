const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=process.env.GAME_BASE_URL || 'http://127.0.0.1:5173';
const outputDir=process.env.OUTPUT_DIR || process.env.HANUMAN_SCREENSHOT_DIR;
(async()=>{
const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(base+'/hanuman');await page.getByRole('button',{name:'BEGIN THE JOURNEY'}).waitFor({timeout:30000});

await page.getByRole('button',{name:'BEGIN THE JOURNEY'}).click();
const state=()=>page.locator('.hanuman-game').evaluate(e=>({status:e.dataset.status,x:+e.dataset.x,z:+e.dataset.z,y:+e.dataset.height}));
assert.equal((await state()).status,'playing');
await page.keyboard.down('w');await page.waitForTimeout(600);await page.keyboard.up('w');assert((await state()).z<13);
await page.keyboard.press('Space');await page.waitForTimeout(220);assert((await state()).y>0);await page.waitForTimeout(1000);
await page.keyboard.press('Escape');await page.waitForTimeout(150);assert.equal((await state()).status,'paused');const paused=await state();await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');assert.equal((await state()).z,paused.z);
await page.getByRole('button',{name:'RESUME JOURNEY'}).click();
async function go(x,z){ for(let i=0;i<140;i++){ const p=await state();if(p.status!=='playing')throw Error('Unexpected '+p.status); const dx=x-p.x,dz=z-p.z;if(Math.hypot(dx,dz)<.7)return;const horizontal=Math.abs(dx)>.4,vertical=Math.abs(dz)>.4;const ks=[...(horizontal?[dx>0?'d':'a']:[]),...(vertical?[dz>0?'s':'w']:[])];for(const k of ks)await page.keyboard.down(k);await page.waitForTimeout(100);for(const k of ks)await page.keyboard.up(k); }throw Error('Navigation timeout '+JSON.stringify(await state())); }
// Approach each patrol while guarding; strikes and divine landing clear nearby guardians.
// Fruit pickups heal and charge the special. Pots can be broken with the gada.
await go(-4,11);await page.waitForTimeout(200);assert(+(await page.locator('.hanuman-game').getAttribute('data-mangoes'))>=1);
await go(-12,11);await page.keyboard.press('j');await page.waitForTimeout(650);assert(+(await page.locator('.hanuman-game').getAttribute('data-mangoes'))>=2);
console.log('PASS mango pickup and breakable pot');
await page.keyboard.down('c');
for(const target of [[-8,5],[8,1],[-7,-9],[7,-12],[0,-7]]){
 await go(...target);
 for(let i=0;i<12;i++){await page.keyboard.press('j');if(i===3)await page.keyboard.press('k');await page.waitForTimeout(580);}
}
await page.keyboard.up('c');

console.log('combat HUD',await page.locator('.hanuman-objective').innerText());
for(const target of [[-11,-10],[11,-10],[0,-17]]) {await go(...target);await page.keyboard.press('f');await page.waitForTimeout(200);}
assert.equal((await state()).status,'playing');
await page.getByRole('progressbar',{name:'Storm Guardian vitality',exact:true}).waitFor();
const bossHealth=()=>page.locator('.hanuman-game').getAttribute('data-boss-health').then(Number);
assert.equal(await bossHealth(),18);
assert.equal(+(await page.locator('.hanuman-game').getAttribute('data-energy')),100);
await go(0,-8);await page.keyboard.down('c');
await page.keyboard.press('l');await page.waitForTimeout(1000);assert((await bossHealth())<18);console.log('PASS boss awakening and Gada Storm damage');
if(outputDir)await page.screenshot({path:path.join(outputDir, 'hanuman-boss.png')});
for(let i=0;i<32 && (await state()).status==='playing';i++) {await page.keyboard.press('j');if(i%5===0)await page.keyboard.press('Space');await page.waitForTimeout(600);}
await page.keyboard.up('c');await page.waitForTimeout(200);
assert.equal((await state()).status,'won');
if(outputDir)await page.screenshot({path:path.join(outputDir, 'hanuman-victory.png')});
await page.getByRole('button',{name:'PLAY AGAIN'}).click();await page.getByRole('button',{name:'BEGIN THE JOURNEY'}).waitFor();assert.equal((await state()).status,'ready');
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.goto(base+'/');await page.getByRole('link').filter({hasText:'Hanuman'}).first().waitFor();assert.deepEqual(errors,[]);console.log('PASS movement, jump, pause, combat, mangoes, breakable pots, three seals, boss, Gada Storm, victory, restart, mobile overflow, catalog, no JS errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
