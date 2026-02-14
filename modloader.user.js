// Please use Tampermonkey for the best experience.

// ==UserScript==
// @name         HCP ModLoader
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @match        *://hypercubesplanet.web.app/
// @run-at       document-start
// @updateURL    https://ximi.ovh/mods/HCP/modloader.user.js
// @downloadURL  https://ximi.ovh/mods/HCP/modloader.user.js
// @description  ModLoader for HyperCubesPlanet - easily add and manage mods!
// @author       Erdef @ Ximi.ovh
// @license      GPL-3.0
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

/* // Changelog //

1.0 - initial release
1.1 - cors fix and license notice
1.2 - link change + changelog in file
1.2.1 - corsproxy removal bc of ratelimit
2.0 - complete rewrite with better UI and mod management system, also moved to github

*/ // Changelog //

/* // Credits //

Jasiex - for the original idea of ModLoader.
Me (Erdef) - for developing and maintaining this ModLoader for HyperCubesPlanet.
OpenAI's ChatGPT - for appendChild and insertBefore interception code snippet.
Nixox (his ai) - for making the game in the first place. (and lying about that the game was not made with AI.)

*/ // Credits //

/* // How to use //

1. Add a mod by clicking the "Add Mod" button in the ModLoader window.
2. Remove a mod by clicking the "Remove" button next to it.
3. Mods are loaded from the URL you provide.

*/ // How to use //

/* // How to use (developer) //

1. You can get the example mod template on https://ximi.ovh/mods/HCP/example-mod.js
2. Make sure to define the modManifest object with name, author, version, and description.
3. Your mod code should be inside an IIFE to avoid polluting the global scope.
4. Use window.modloader.logMessage to log messages to the ModLoader console. (you can use console.log, but it's not professional)
5. Mods are loaded as ES modules, so you can use import/export if needed.
6. The game source is (no longer) available on GitHub: https://github.com/nereidagames/HyperCubesPlanet, you can access the BlockStarPlanetGame class from window.bsp object.

*/ // How to use (developer) //

// The code below is licensed under GPL-3.0 license
/*
    ModLoader for HyperCubesPlanet
    Copyright (C) 2026 Erdef

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

(function() {
    'use strict';

    const showWindow = true;
    const blockedPattern = /\/main\.js(\?.*)?$/;

    // --- LOGIC: SCRIPT BLOCKING ---
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'SCRIPT' && node.src && blockedPattern.test(node.src)) {
                    node.type = 'javascript/blocked';
                    node.parentElement?.removeChild(node);
                    console.log(`%c[ModLoader] Blocked: ${node.src}`, 'color: red; font-weight: bold;');
                }
            });
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Monkey-patching appendChild/insertBefore
    const originalAppend = Element.prototype.appendChild;
    Element.prototype.appendChild = function(node) {
        if (node.tagName === 'SCRIPT' && node.src && blockedPattern.test(node.src)) return node;
        return originalAppend.call(this, node);
    };

    // --- MODLOADER CORE API ---
    unsafeWindow.modloader = {
        addMod: async (url) => {
            if (!url) return;
            const mods = await GM_getValue("userMods", []);
            if (!mods.find(m => m.url === url)) {
                const id = Date.now() + "_" + Math.floor(Math.random()*1000);
                mods.push({ id, url, manifest: null });
                await GM_setValue("userMods", mods);
                renderModList();
            }
        },
        removeMod: async (id) => {
            let mods = await GM_getValue("userMods", []);
            mods = mods.filter(m => m.id !== id);
            await GM_setValue("userMods", mods);
            renderModList();
        },
        listMods: () => GM_getValue("userMods", []),
        logMessage: (msg, type = 'log') => {
            const styles = { log: 'background:#c5e1a5', warn: 'background:#fff59d', err: 'background:#ef9a9a' };
            console.log(`%c ModLoader %c ${msg}`, 'color:#000;font-weight:bold;'+styles[type], 'color:#333');
        }
    };

    // --- UI INJECTION ---
    const injectUI = () => {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
            :root {
                --window-bg: #1e1e1e; --sidebar-bg: #252525; --accent: #3b82f6; --danger: #e81123;
                --text: #e0e0e0; --text-dim: #a0a0a0; --border: #333;
            }
            #hml-ui-root { font-family: 'Inter', sans-serif; z-index: 999999; position: fixed; pointer-events: none; top:0; left:0; width:100vw; height:100vh; }
            .hml-window { 
                position: absolute; width: 650px; height: 420px; background: var(--window-bg); 
                border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6); pointer-events: auto; user-select: none;
                animation: hml-pop 0.3s cubic-bezier(0.17, 0.88, 0.32, 1.27);
            }
            .hml-dragbar { height: 40px; background: var(--sidebar-bg); cursor: move; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); border-radius: 12px 12px 0 0; }
            .hml-title { padding-left: 15px; font-weight: 600; font-size: 12px; color: var(--text-dim); letter-spacing: 1px; }
            .hml-close { width: 45px; height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; border-radius: 0 12px 0 0; }
            .hml-close:hover { background: var(--danger); color: white; }
            .hml-content { display: flex; flex: 1; overflow: hidden; }
            .hml-sidebar { width: 160px; background: var(--sidebar-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 15px 10px; gap: 5px; }
            .hml-opt { padding: 10px 15px; border-radius: 8px; cursor: pointer; color: var(--text-dim); font-size: 13px; transition: 0.2s; }
            .hml-opt:hover { background: rgba(255,255,255,0.05); color: var(--text); }
            .hml-opt.active { background: var(--accent); color: white; }
            .hml-main { flex: 1; padding: 20px; color: var(--text); overflow-y: auto; }
            .hml-hidden { display: none !important; }
            
            /* Inputs & Buttons */
            .hml-input { background: #121212; border: 1px solid var(--border); color: white; padding: 8px 12px; border-radius: 6px; width: calc(100% - 26px); margin-bottom: 10px; }
            .hml-btn { background: var(--accent); color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: 0.2s; }
            .hml-btn:hover { filter: brightness(1.2); }
            .mod-item { background: #2a2a2a; padding: 10px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); }
            .mod-info { display: flex; flex-direction: column; gap: 2px; }
            .mod-name { font-weight: 600; font-size: 13px; }
            .mod-meta { font-size: 11px; color: var(--text-dim); }
            .btn-rm { background: transparent; color: #ff5252; border: 1px solid #ff5252; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
            .btn-rm:hover { background: #ff5252; color: white; }

            @keyframes hml-pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'hml-ui-root';
        container.innerHTML = `
            <div class="hml-window" id="hml-window" style="top: 100px; left: 100px;">
                <div class="hml-dragbar" id="hml-drag">
                    <div class="hml-title">HCP MODLOADER</div>
                    <div class="hml-close" id="hml-close-btn">✕</div>
                </div>
                <div class="hml-content">
                    <div class="hml-sidebar">
                        <div class="hml-opt active" data-page="home">Dashboard</div>
                        <div class="hml-opt" data-page="mods">Manage Mods</div>
                        <div class="hml-opt" data-page="options">Settings</div>
                        <div style="margin-top:auto">
                            <button class="hml-btn" style="width:100%; background:#10b981" onclick="location.reload()">Reload Game</button>
                        </div>
                    </div>
                    <div class="hml-main" id="hml-main-view"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        setupUI();
    };

    // --- UI LOGIC ---
    function setupUI() {
        const wndw = document.getElementById('hml-window');
        const drag = document.getElementById('hml-drag');
        const main = document.getElementById('hml-main-view');
        const opts = document.querySelectorAll('.hml-opt');

        // Dragging
        let isMoving = false, px, py;
        drag.onmousedown = (e) => {
            if (e.target.id !== 'hml-drag') return;
            isMoving = true; px = e.clientX - wndw.offsetLeft; py = e.clientY - wndw.offsetTop;
        };
        document.onmousemove = (e) => { if(isMoving) { wndw.style.left = (e.clientX - px) + 'px'; wndw.style.top = (e.clientY - py) + 'px'; } };
        document.onmouseup = () => isMoving = false;

        // Routing
        const pages = {
            home: `<h2>Status</h2><p>ModLoader is active.</p><p>Detected mods: <b>${GM_getValue("userMods", []).length}</b></p>`,
            mods: `<h2>Mods Manager</h2>
                   <input type="text" class="hml-input" id="new-mod-url" placeholder="https://site.com/mod.js">
                   <div style="display:flex; gap:10px; margin-bottom:20px;">
                       <button class="hml-btn" id="add-mod-action">Add Mod</button>
                   </div>
                   <div id="mod-list-container"></div>`,
            options: `<h2>Settings</h2><p>No extra settings available yet.</p>`
        };

        const renderPage = (name) => {
            main.innerHTML = pages[name];
            if(name === 'mods') {
                renderModList();
                document.getElementById('add-mod-action').onclick = () => {
                    const url = document.getElementById('new-mod-url').value;
                    unsafeWindow.modloader.addMod(url);
                    document.getElementById('new-mod-url').value = '';
                };
            }
        };

        opts.forEach(o => o.onclick = () => {
            opts.forEach(x => x.classList.remove('active'));
            o.classList.add('active');
            renderPage(o.dataset.page);
        });

        document.getElementById('hml-close-btn').onclick = () => wndw.classList.toggle('hml-hidden');
        document.addEventListener('keydown', (e) => { if(e.key === 'F1') { e.preventDefault(); wndw.classList.toggle('hml-hidden'); } });

        renderPage('home');
    }

    async function renderModList() {
        const container = document.getElementById('mod-list-container');
        if(!container) return;
        const mods = await GM_getValue("userMods", []);
        container.innerHTML = mods.length ? '' : '<p style="color:var(--text-dim)">No mods installed.</p>';
        mods.forEach(mod => {
            const div = document.createElement('div');
            div.className = 'mod-item';
            div.innerHTML = `
                <div class="mod-info">
                    <span class="mod-name">${mod.manifest?.name || 'Unknown Mod'}</span>
                    <span class="mod-meta">${mod.url.substring(0, 40)}...</span>
                </div>
                <button class="btn-rm" data-id="${mod.id}">Remove</button>
            `;
            div.querySelector('.btn-rm').onclick = () => unsafeWindow.modloader.removeMod(mod.id);
            container.appendChild(div);
        });
    }

    // --- MOD LOADING LOGIC ---
    async function loadScript(url, modId) {
        try {
            const res = await fetch(url);
            const code = await res.text();
            const s = document.createElement('script');
            s.type = 'module';
            s.textContent = `${code}\nif(typeof modManifest!=='undefined')unsafeWindow.modloader._updateManifest('${modId}',modManifest);`;
            document.documentElement.appendChild(s);
        } catch (e) { console.error("Failed to load mod", url); }
    }

    unsafeWindow.modloader._updateManifest = async (id, manifest) => {
        let mods = await GM_getValue("userMods", []);
        const m = mods.find(x => x.id === id);
        if(m) { m.manifest = manifest; await GM_setValue("userMods", mods); }
    };

    // --- INIT ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if(showWindow) injectUI();
        });
    } else {
        if(showWindow) injectUI();
    }

    (async () => {
        const mods = await GM_getValue("userMods", []);
        for(const m of mods) loadScript(m.url, m.id);
    })();

})();