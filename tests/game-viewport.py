"""Check all games at phone, landscape and desktop sizes against a running dev server."""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.getenv('GAME_BASE_URL','http://127.0.0.1:PORT')
paths=re.findall(r'["\x27]?path["\x27]?:\s*["\x27]([^"\x27]+)',(Path(__file__).resolve().parents[1]/'src/data/games.ts').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch();page=browser.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 for width,height in [(320,568),(844,390),(1440,900)]:
  page.set_viewport_size({'width':width,'height':height})
  for path in paths:
   page.goto(BASE+path,wait_until='domcontentloaded');page.locator('.game-fit-content').wait_for();page.wait_for_timeout(100)
   assert page.evaluate("""()=>{const r=document.querySelector('.game-fit-content').getBoundingClientRect(),a=document.querySelector('.game-fit-area').getBoundingClientRect();return r.top>=a.top-2&&r.bottom<=a.bottom+2&&r.left>=a.left-2&&r.right<=a.right+2}"""),(path,width,height)
   assert page.get_by_role('button',name='How to play',exact=True).is_visible()
  print('PASS',len(paths),'games fit',width,height,flush=True)
 assert not errors,errors
 browser.close()
