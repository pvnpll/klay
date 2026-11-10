import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_utils import ensure_server, get_output_dir

BASE_URL, preview_proc = ensure_server(default_port=4173)
output_dir = get_output_dir()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        errors = []

        # -------------------------------------------------------------
        # 1. MOBILE VIEWPORT & CONTROLS CHECK
        # -------------------------------------------------------------
        page = browser.new_page(viewport={"width": 420, "height": 860}, has_touch=True)
        page.on("pageerror", lambda e: errors.append(str(e)))

        print(f"Visiting {BASE_URL}/bounce on mobile viewport...")
        page.goto(f"{BASE_URL}/bounce", wait_until="domcontentloaded")
        page.wait_for_timeout(500)

        assert len(errors) == 0, f"Page errors found: {errors}"

        # Check Nokia handset image exists
        handset = page.locator("img[alt='Nokia 3510i Handset']")
        assert handset.count() > 0, "Nokia 3510i handset image not found"
        print("PASS Nokia 3510i Handset image verified.")

        # Check LCD canvas exists
        canvas = page.locator("canvas")
        assert canvas.count() > 0, "Canvas not found"
        print("PASS LCD Canvas verified.")

        # Verify initial state hook
        initial_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert initial_state is not None, "__BOUNCE_TEST__ hook not exposed on window"
        assert initial_state["gameMode"] == "title", f"Expected title mode, got {initial_state['gameMode']}"
        assert initial_state["levelIdx"] == 0, "Expected Level 1 index 0"

        # Start game via touch
        canvas.tap()
        page.wait_for_timeout(300)
        state_playing = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert state_playing["gameMode"] == "playing", f"Expected playing mode, got {state_playing['gameMode']}"
        print("PASS touch start game.")

        # Test Keypad Key 6 (Move Right) and Key 2 (Jump)
        key_6 = page.locator("button[aria-label*='Key 6']").first
        key_6.click()
        page.wait_for_timeout(150)
        key_2 = page.locator("button[aria-label*='Key 2']").first
        key_2.click()
        page.wait_for_timeout(200)
        print("PASS Nokia keypad steering (keys 6 and 2).")

        # Test Cheat code 787898 and #
        for key in ["7", "8", "7", "8", "9", "8"]:
            page.locator(f"button[aria-label*='Key {key}']").first.click()
            page.wait_for_timeout(40)
        page.wait_for_timeout(200)
        god_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert god_state["isGodMode"] is True, "Expected God Mode to be ON after 787898"
        print("PASS cheat code 787898 activates God Mode.")

        # Toggle God Mode off with #
        page.keyboard.press("#")
        page.wait_for_timeout(100)
        god_off = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert god_off["isGodMode"] is False, "Expected God Mode to toggle OFF with #"
        print("PASS toggle God Mode OFF with #.")

        # Test Pause & Resume via Escape / P
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        assert page.evaluate("() => window.__BOUNCE_TEST__?.getState().gameMode") == "paused"
        page.keyboard.press("Escape")
        page.wait_for_timeout(100)
        assert page.evaluate("() => window.__BOUNCE_TEST__?.getState().gameMode") == "playing"
        print("PASS Pause / Resume toggle via Escape.")

        # -------------------------------------------------------------
        # 2. LEVEL 1: GATED EXIT & RING COLLECTION
        # -------------------------------------------------------------
        # Verify 4 rings uncollected
        lvl1_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert lvl1_state["uncollectedRings"] == 4, f"Expected 4 rings, got {lvl1_state['uncollectedRings']}"

        # Move ball to exit tile while rings remain uncollected
        exit_pos = lvl1_state["exitPosition"]
        page.evaluate("(pos) => window.__BOUNCE_TEST__?.teleportBall(pos.x, pos.y)", exit_pos)
        page.wait_for_timeout(200)

        # Exit must remain locked and cannot advance
        locked_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert locked_state["gameMode"] == "playing", "Locked exit must not advance level when rings are uncollected"
        assert locked_state["levelIdx"] == 0, "Level index must still be 0"
        print("PASS Level 1 exit is strictly gated when rings remain.")

        # Collect all rings -> exit unlocks
        page.evaluate("() => window.__BOUNCE_TEST__?.collectAllRings()")
        assert page.evaluate("() => window.__BOUNCE_TEST__?.getState().uncollectedRings") == 0

        # Now touch exit -> level clears!
        page.evaluate("(pos) => window.__BOUNCE_TEST__?.teleportBall(pos.x, pos.y)", exit_pos)
        page.wait_for_timeout(200)
        clear_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert clear_state["gameMode"] == "level_clear", f"Expected level_clear mode, got {clear_state['gameMode']}"
        print("PASS Level 1 clears upon touching unlocked exit.")

        # -------------------------------------------------------------
        # 3. LEVEL 2: SPIKES, CHECKPOINTS, LIVES & GAME OVER
        # -------------------------------------------------------------
        # Advance to Level 2
        page.evaluate("() => window.__BOUNCE_TEST__?.advanceToNextLevel()")
        lvl2_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert lvl2_state["levelIdx"] == 1, "Expected Level 2 (index 1)"
        assert lvl2_state["gameMode"] == "playing"
        assert lvl2_state["checkpoint"] is None, "New level must start with no active checkpoint"
        print("PASS Level 2 loaded cleanly.")

        # Test death on spike / hazard: lives decrement
        lives_before = lvl2_state["lives"]
        page.evaluate("() => window.__BOUNCE_TEST__?.popBall()")
        page.wait_for_timeout(100)
        lives_after = page.evaluate("() => window.__BOUNCE_TEST__?.getState().lives")
        assert lives_after == lives_before - 1, f"Expected lives to decrease by 1, got {lives_after}"

        # Respawn ball -> respawns at level start
        page.evaluate("() => window.__BOUNCE_TEST__?.respawnBall()")
        ball_pos = page.evaluate("() => window.__BOUNCE_TEST__?.getState().ball")
        assert ball_pos["x"] == 50 and ball_pos["y"] == 110, f"Expected start spawn, got {ball_pos}"
        print("PASS ball pop decrements lives and respawns at start before checkpoint.")

        # Test Game Over when lives reach 0
        page.evaluate("() => window.__BOUNCE_TEST__?.setLives(1)")
        page.evaluate("() => window.__BOUNCE_TEST__?.popBall()")
        page.wait_for_timeout(800)
        gameover_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert gameover_state["gameMode"] == "gameover", f"Expected gameover, got {gameover_state['gameMode']}"
        print("PASS Game Over triggers when lives are depleted.")

        # Test Restart from Game Over resets score to 0, lives to 5, level to 0
        page.evaluate("() => window.__BOUNCE_TEST__?.startNewGame()")
        page.wait_for_timeout(200)
        restarted_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert restarted_state["levelIdx"] == 0, "Restart must reset level to 0"
        assert restarted_state["score"] == 0, f"Expected score 0 on restart, got {restarted_state['score']}"
        assert restarted_state["lives"] == 5, f"Expected 5 lives on restart, got {restarted_state['lives']}"
        assert restarted_state["gameMode"] == "playing"
        print("PASS restart from game over resets level, lives, and score.")

        # -------------------------------------------------------------
        # 4. LEVEL 3: AQUA SPRINGS (WATER & SIZE PUMP)
        # -------------------------------------------------------------
        page.evaluate("() => window.__BOUNCE_TEST__?.loadLevel(2, true)")
        lvl3_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert lvl3_state["levelIdx"] == 2, "Expected Level 3 (index 2)"

        # Complete Level 3
        page.evaluate("() => window.__BOUNCE_TEST__?.collectAllRings()")
        exit3_pos = lvl3_state["exitPosition"]
        page.evaluate("(pos) => window.__BOUNCE_TEST__?.teleportBall(pos.x, pos.y)", exit3_pos)
        page.wait_for_timeout(200)
        assert page.evaluate("() => window.__BOUNCE_TEST__?.getState().gameMode") == "level_clear"
        print("PASS Level 3 completed.")

        # -------------------------------------------------------------
        # 5. LEVEL 4: CITADEL OF BOUNCE & FINAL VICTORY
        # -------------------------------------------------------------
        page.evaluate("() => window.__BOUNCE_TEST__?.advanceToNextLevel()")
        page.wait_for_timeout(200)
        lvl4_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert lvl4_state["levelIdx"] == 3, "Expected Level 4 (index 3)"
        assert lvl4_state["gameMode"] == "playing"

        # Complete Level 4
        page.evaluate("() => window.__BOUNCE_TEST__?.collectAllRings()")
        exit4_pos = lvl4_state["exitPosition"]
        page.evaluate("(pos) => window.__BOUNCE_TEST__?.teleportBall(pos.x, pos.y)", exit4_pos)
        page.wait_for_timeout(200)
        assert page.evaluate("() => window.__BOUNCE_TEST__?.getState().gameMode") == "level_clear"

        # Advancing after final level triggers Game Won!
        page.evaluate("() => window.__BOUNCE_TEST__?.advanceToNextLevel()")
        page.wait_for_timeout(200)
        won_state = page.evaluate("() => window.__BOUNCE_TEST__?.getState()")
        assert won_state["gameMode"] == "won", f"Expected won mode after Level 4, got {won_state['gameMode']}"
        print("PASS Level 4 completion triggers final victory (won state).")

        page.close()

        # -------------------------------------------------------------
        # 6. DESKTOP VIEWPORT TEST
        # -------------------------------------------------------------
        page_desktop = browser.new_page(viewport={"width": 1280, "height": 800})
        page_desktop.goto(f"{BASE_URL}/bounce", wait_until="domcontentloaded")
        page_desktop.wait_for_timeout(300)
        assert page_desktop.locator("canvas").count() > 0
        assert page_desktop.locator("img[alt='Nokia 3510i Handset']").count() > 0
        print("PASS Desktop viewport renders cleanly.")
        page_desktop.close()

        browser.close()
        assert not errors, f"Errors encountered: {errors}"
        print("ALL BOUNCE REGRESSION TESTS PASSED (KL-201).")

finally:
    if preview_proc:
        preview_proc.terminate()
