// Please use Tampermonkey for the best experience.

// ==UserScript==
// @name         HCP ModLoader
// @namespace    http://tampermonkey.net/
// @version      1.3
// @match        *://hypercubesplanet.web.app/
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/ximi-ovh/HML/main/modloader.user.js
// @downloadURL  https://raw.githubusercontent.com/ximi-ovh/HML/main/modloader.user.js
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
1.3 - trying to implement new UI, also moved to github for easier updates
2.0 (incoming) - new UI, better mod management, and more features!

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

const showWindow = true;

(function() {
    'use strict';

    const blockedPattern = /\/main\.js(\?.*)?$/;

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'SCRIPT' && node.src && blockedPattern.test(node.src)) {
                    node.type = 'javascript/blocked';
                    node.parentElement?.removeChild(node);
                    console.log(`%c[ModLoader Block] Blocked: ${node.src}`, 'color: red; font-weight: bold;');
                }
            });
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const originalAppend = Element.prototype.appendChild;
    Element.prototype.appendChild = function(node) {
        if (node.tagName === 'SCRIPT' && node.src && blockedPattern.test(node.src)) {
            console.log(`%c[ModLoader Block] Blocked (appendChild): ${node.src}`, 'color: red; font-weight: bold;');
            return node;
        }
        return originalAppend.call(this, node);
    };

    const originalInsert = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function(node, ref) {
        if (node.tagName === 'SCRIPT' && node.src && blockedPattern.test(node.src)) {
            console.log(`%c[ModLoader Block] Blocked (insertBefore): ${node.src}`, 'color: red; font-weight: bold;');
            return node;
        }
        return originalInsert.call(this, node, ref);
    };


    unsafeWindow.modloader = {
        license: async () => {
            return 'GPL-3.0';
        },
        printLicense: async () => {
            console.log(`ModLoader for HyperCubesPlanet is licensed under GPL-3.0. See https://www.gnu.org/licenses/gpl-3.0.en.html for details.`);
        },
        addMod: async (url) => {
            if (!url) return;
            const mods = await GM_getValue("userMods", []);
            if (!mods.find(m => m.url === url)) {
                const id = Date.now() + "_" + Math.floor(Math.random()*1000);
                mods.push({ id, url, manifest: null });
                await GM_setValue("userMods", mods);
                alert(`Mod added!`);
                //location.reload();
            } else {
                alert("This mod already exists in the loader!");
            }
        },
        addModCORS: async (url) => {
            if (!url) return;
            url = `https://corsproxy.io/?url=${encodeURIComponent(url)}?v=${Date.now()}`;
            const mods = await GM_getValue("userMods", []);
            if (!mods.find(m => m.url === url)) {
                const a = prompt("Mods added in CORS may not work because of ratelimits. Please get your web server to work with CORS. This function will be removed in the next update.\nPlease type in \"I understand\" in the box below to continue.");
                if (a.toLowerCase() != "i understand") {
                    return;
                }
                const id = Date.now() + "_" + Math.floor(Math.random()*1000);
                mods.push({ id, url, manifest: null });
                await GM_setValue("userMods", mods);
                alert(`Mod added!`);
                //location.reload();
            } else {
                alert("This mod already exists in the loader!");
            }
        },
        removeMod: async (id) => {
            if (!id) return;
            let mods = await GM_getValue("userMods", []);
            mods = mods.filter(m => m.id !== id);
            await GM_setValue("userMods", mods);
            alert(`Mod removed!`);
            //location.reload();
        },
        listMods: async () => {
            const mods = await GM_getValue("userMods", []);
            return mods;
        },
        getModCount: async () => {
            const mods = await GM_getValue("userMods", []);
            return mods.length;
        },
        logMessage: (message, type = 'log', funcpar = "main") => {
            if (message === null || message === undefined) return;
            const style1 = 'background:#c5e1a5; color:#000; padding:2px 6px; border-radius:4px 0 0 4px; font-weight:bold;';
            const style2 = 'background:#90caf9; color:#000; padding:2px 6px; border-radius:0 4px 4px 0; font-weight:bold;';
            if (type === "log") console.log(`%c ModLoader %c ${funcpar}`, style1, style2, message);
            else if (type === "warn") console.warn(`%c ModLoader %c ${funcpar}`, style1, style2, message);
            else if (type === "err") console.error(`%c ModLoader %c ${funcpar}`, style1, style2, message);
        }
    };

    async function loadScript(url, modObj) {
        try {
            const res = await fetch(url);
            const code = await res.text();
            const s = document.createElement('script');
            s.type = 'module';
            s.textContent = `
                ${code}
                if (typeof modManifest !== 'undefined') {
                    window.modloader.logMessage('Loaded mod: ' + modManifest.name + ' author: ' + modManifest.author, 'log', 'ModLoader');
                    window.modloader._updateModManifest && window.modloader._updateModManifest('${modObj.id}', modManifest);
                }
            `;
            document.documentElement.appendChild(s);
        } catch (e) {
            window.modloader.logMessage(`Error loading mod: ${url}`, 'err', 'ModLoader');
        }
    }

    unsafeWindow.modloader._updateModManifest = async (id, manifest) => {
        let mods = await GM_getValue("userMods", []);
        const mod = mods.find(m => m.id === id);
        if (mod) {
            mod.manifest = manifest;
            await GM_setValue("userMods", mods);
            renderList();
        }
    };

    async function loadMods() {
        await loadScript(`https://raw.githubusercontent.com/ximi-ovh/HML/main/main.js`, { id: "core" });

        const mods = await GM_getValue("userMods", []);
        for (const mod of mods) {
            await loadScript(mod.url, mod);
        }
    }

    // --- UI ---
    const panel = document.createElement('div');
    panel.id = 'modloader-panel';
    const style = document.createElement('style');
    style.textContent = `
        #modloader-panel {
            position: fixed; top: 20px; right: 20px; width: 350px; max-height: 500px; background: rgba(0,0,0,0.9);
            color: white; font-family: sans-serif; padding: 15px; border-radius: 8px; box-shadow: 0 0 10px black; overflow-y: auto; z-index: 99999;
        }
        #modloader-panel h2 { margin: 0 0 10px 0; font-size: 16px; }
        #modloader-panel input { width: 70%; margin-right: 5px; padding: 5px; border-radius: 3px; border: none; }
        #modloader-panel button { padding: 5px 8px; border-radius: 3px; border: none; cursor: pointer; margin-top: 5px; }
        #modloader-panel .mod-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        #modloader-panel .close-btn { position: absolute; top: 5px; right: 5px; cursor: pointer; font-weight: bold; }
    `;
    if (showWindow) document.head.appendChild(style);
    panel.innerHTML = `
        <div class="close-btn">X</div>
        <h2>ModLoader UI</h2>
        <div>
            <input type="text" id="modloader-new-url" placeholder="Mod URL" /><br>
            <button id="modloader-add-btn">Add mod</button><button id="modloader-add-cors-btn">Add mod (CORS)</button><button style="background:#0f0;" onclick="location.reload();">Apply changes</button>
        </div>
        <div id="modloader-list"></div>
    `;
    if (showWindow) document.body.appendChild(panel);

    panel.querySelector('.close-btn').addEventListener('click', () => panel.style.display = 'none');

    panel.querySelector('#modloader-add-btn').addEventListener('click', async () => {
        const url = panel.querySelector('#modloader-new-url').value.trim();
        if(url) await unsafeWindow.modloader.addMod(url);
    });
    panel.querySelector('#modloader-add-cors-btn').addEventListener('click', async () => {
        const url = panel.querySelector('#modloader-new-url').value.trim();
        if(url) await unsafeWindow.modloader.addModCORS(url);
    });

    async function renderList() {
        if (!showWindow) return;
        const listContainer = panel.querySelector('#modloader-list');
        const mods = await unsafeWindow.modloader.listMods();
        listContainer.innerHTML = '';
        for (const mod of mods) {
            const name = mod.manifest?.name || mod.url;
            const author = mod.manifest?.author || '';
            const item = document.createElement('div');
            item.className = 'mod-item';
            item.innerHTML = `
                <span>${name}${author ? ' - ' + author : ''}</span>
                <button data-id="${mod.id}" onClick="this.style.background='#f00';">Usuń</button>
            `;
            item.querySelector('button').addEventListener('click', async () => {
                await unsafeWindow.modloader.removeMod(mod.id);
            });
            listContainer.appendChild(item);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderList();
    });

    loadMods().then(async () => {
        const el = document.getElementById('game-version');
        const count = await unsafeWindow.modloader.getModCount();
        if(el) el.textContent += ` + ModLoader (${count} Mods)`;
    });
})();