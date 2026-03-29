// Please use Tampermonkey for the best experience.

// ==UserScript==
// @name         HCP ModLoader
// @namespace    http://tampermonkey.net/
// @version      2.0
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
2.0 - new UI, better mod management, and options page

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
        },
        saveConfig: async () => {
            const config = {
                hml_options_custom_engine: panel.querySelector('#hml-options-custom-engine').checked,
                hml_options_engine_url: panel.querySelector('#hml-options-engine-url').value.trim() ? panel.querySelector('#hml-options-engine-url').value.trim() : null,
                hml_options_optim_engine: panel.querySelector('#hml-options-optim-engine').checked
            };
            await GM_setValue("hml_config", config);
        },
        loadConfig: () => {
            const config = GM_getValue("hml_config", {});
            try {
                let i = 0;
                const wait = setInterval(() => {
                    if (panel) {
                        clearInterval(wait);
                        if (config.hml_options_custom_engine) {
                            panel.querySelector('#hml-options-custom-engine').checked = true;
                            panel.querySelector('#hml-options-engine-url').disabled = false;
                        }
                        if (config.hml_options_engine_url) {
                            panel.querySelector('#hml-options-engine-url').value = config.hml_options_engine_url;
                        }
                        if (config.hml_options_optim_engine) {
                            panel.querySelector('#hml-options-optim-engine').checked = true;
                            panel.querySelector('#hml-options-custom-engine').disabled = true;
                            panel.querySelector('#hml-options-engine-url').disabled = true;
                        }
                    }
                    else {
                        i++;
                        if(i > 10) {
                            clearInterval(wait);
                            throw new Error("Failed to load config: panel not found");
                        }
                    }
                }, 1000);
            } catch (e) {
                if (unsafeWindow.modloader) unsafeWindow.modloader.logMessage(`Error loading config: ${e.message}`, 'err', 'ModLoader');
                else console.error(`[HML] Error loading config: ${e.message}`);
            }
        },
        showAlert: (title, description) => {
            const alertBox = document.createElement('div');
            alertBox.className = 'hml-alert';

            alertBox.innerHTML = `
                <div class="hml-alert-header">${title}</div>
                <div class="hml-alert-body">${description}</div>
                <div class="hml-alert-footer">
                    <button class="hml-btn hml-btn-primary">OK</button>
                </div>
            `;

            document.body.appendChild(alertBox);

            alertBox.style.left = `${window.innerWidth / 2 - 160}px`;
            alertBox.style.top = `${window.innerHeight / 2 - 100}px`;

            const okBtn = alertBox.querySelector('button');
            const header = alertBox.querySelector('.hml-alert-header');

            function closeAlert() {
                alertBox.classList.add('fade-out');
                alertBox.addEventListener('animationend', () => {
                    alertBox.remove();
                }, { once: true });
            }
        
            okBtn.addEventListener('click', closeAlert);
        
            document.addEventListener('mousedown', function outsideClick(e) {
                if (!alertBox.contains(e.target)) {
                    closeAlert();
                    document.removeEventListener('mousedown', outsideClick);
                }
            });
        
            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;
        
            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.clientX - alertBox.offsetLeft;
                offsetY = e.clientY - alertBox.offsetTop;
            });
        
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    alertBox.style.left = `${e.clientX - offsetX}px`;
                    alertBox.style.top = `${e.clientY - offsetY}px`;
                }
            });
        
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }
    };

    function getConfig() {
        return GM_getValue("hml_config", {});
    }

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
            unsafeWindow.modloader.logMessage(`Error loading mod: ${url}`, 'err', 'ModLoader');
            throw e;
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
        if (getConfig().hml_options_custom_engine && getConfig().hml_options_engine_url) {
            try {
                await loadScript(getConfig().hml_options_engine_url, { id: "core" });
            } catch (e) {
                unsafeWindow.modloader.logMessage(`Error loading custom engine, falling back to original one`, 'err', 'ModLoader');
                //console.log("Error loading custom engine, falling back to original one", e);
                await loadScript(`https://raw.githubusercontent.com/ximi-ovh/HML/main/main.js`, { id: "core" });
                const gameRunningInterval = setInterval(() => {
                    if (unsafeWindow.bsp.isGameRunning) {
                        clearInterval(gameRunningInterval);
                        unsafeWindow.modloader.showAlert("Custom Engine Error", "Failed to load the custom engine. The original engine has been loaded instead. Please check if the link is correct and the server is up. If you are the mod developer, please check your engine hosting.");
                    }
                }, 1000);
            }
        }
        else if (getConfig().hml_options_optim_engine) {
            try {
                console.log("Coming soon...");
                throw new Error("Optimized engine is not available yet");
            } catch (e) {
                unsafeWindow.modloader.logMessage(`Error loading optimized engine, falling back to original one`, 'err', 'ModLoader');
                //console.log("Error loading optimized engine, falling back to original one", e);
                await loadScript(`https://raw.githubusercontent.com/ximi-ovh/HML/main/main.js`, { id: "core" });
            }
        }
        else {
            await loadScript(`https://raw.githubusercontent.com/ximi-ovh/HML/main/main.js`, { id: "core" });
        }

        const mods = await GM_getValue("userMods", []);
        for (const mod of mods) {
            await loadScript(mod.url, mod);
        }
    }

    // --- UI ---
    const panel = document.createElement("div");

    const style = document.createElement("style");
    style.textContent = `
.hml-window {
    z-index: 99999;
    position: absolute;
    width: 600px;
    height: 400px;
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid #cccccc;
    box-shadow: 0 4px 8px rgba(43, 0, 0, 0.2);
    border-radius: 10px;
    animation: hml-popup 0.3s ease-out forwards;
    font-family: 'Inter', sans-serif;
    color: #c4c1c1;
    user-select: none;
}
.hml-window-dragbar {
    height: 30px;
    background-color: #303030;
    cursor: move;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    justify-content: center;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 0 10px;
}
.hml-window-dragbar-rightside {
    cursor: pointer;
    background-color: #181818;
    width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
    border-top-right-radius: 10px;
}
.hml-window-dragbar-rightside:hover {
    background-color: #e81123;
    color: white;
}
.hml-window-dragbar-rightside:active {
    background-color: #c50f1f;
}
.hml-window-content {
    display: flex;
    height: calc(100% - 30px);
    background-color: #222222;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
}
.hml-window-sidebar {
    width: 150px;
    background-color: #2b2b2b;
    display: flex;
    flex-direction: column;
    padding: 10px;
}
.hml-option {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #3a3a3a;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.2s ease;
}
.hml-option:hover {
    background-color: #505050;
}
.hml-option.active {
    background-color: #606060;
}
.hml-window-main {
    flex: 1;
    padding: 20px;
}
.hml-hidden {
    display: none;
}
.hml-a {
    color: #c4c1c1;
}
@keyframes hml-popup {
    0% {
        transform: scale(0.5);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
@keyframes hml-close {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(0.5);
        opacity: 0;
    }
}
.hml-checkbox-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    position: relative;
}
.hml-checkbox-container input[type="checkbox"] {
    opacity: 0;
    position: absolute;
    pointer-events: none;
}
.hml-checkbox-box {
    width: 15px;
    height: 15px;
    background-color: #fff;
    border: 2px solid #ccc;
    border-radius: 4px;
    transition: border-color 0.3s, box-shadow 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.hml-checkbox-box::after {
    content: "";
    width: 9px;
    height: 9px;
    background-color: #2196F3;
    border-radius: 2px;
    transform: scale(0);
    transition: transform 0.2s ease-in-out;
}
.hml-checkbox-container input[type="checkbox"]:checked + .hml-checkbox-box::after {
    transform: scale(1);
}
.hml-checkbox-container input[type="checkbox"]:hover + .hml-checkbox-box {
    border-color: #2196F3;
    box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
}
.hml-input {
    width: 100%;
    padding: 8px 10px;
    background-color: #2b2b2b;
    border: 2px solid #3a3a3a;
    border-radius: 6px;
    color: #c4c1c1;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    box-sizing: border-box;
}
.hml-input::placeholder {
    color: #777;
}
.hml-input:hover {
    border-color: #505050;
}
.hml-input:focus {
    border-color: #2196F3;
    box-shadow: 0 0 6px rgba(33, 150, 243, 0.5);
    background-color: #252525;
}
.hml-input:disabled {
    background-color: #1e1e1e;
    color: #666;
    cursor: not-allowed;
}

.hml-btn {
    padding: 8px 14px;
    border-radius: 6px;
    border: 2px solid #3a3a3a;
    background-color: #2b2b2b;
    color: #c4c1c1;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.05s ease;
}

.hml-btn:hover {
    background-color: #353535;
    border-color: #505050;
}

.hml-btn:active {
    transform: scale(0.97);
}

.hml-btn:disabled {
    background-color: #1e1e1e;
    border-color: #2a2a2a;
    color: #666;
    cursor: not-allowed;
}

.hml-btn-primary {
    border-color: #333333;
    background-color: #222222;
    color: white;
}

.hml-btn-primary:hover {
    background-color: #444444;
    border-color: #555555;
    box-shadow: 0 0 8px rgba(78, 81, 85, 0.6);
}

.hml-btn-success {
    border-color: #198000;
    background-color: #156b00;
    color: white;
}

.hml-btn-success:hover {
    border-color: #1d9200;
    background-color: #187700;
    box-shadow: 0 0 8px rgba(232, 17, 35, 0.6);
}

.hml-btn-danger {
    border-color: #c50f1f;
    background-color: #c50f1f;
    color: white;
}

.hml-btn-danger:hover {
    background-color: #e81123;
    border-color: #e81123;
    box-shadow: 0 0 8px rgba(232, 17, 35, 0.6);
}

.hml-btn-group {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.hml-alert {
    position: fixed;
    width: 320px;
    background: #2b2b2b;
    border: 1px solid #3a3a3a;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    color: #c4c1c1;
    font-family: 'Inter', sans-serif;
    animation: hml-alert-in 0.2s ease forwards;
    z-index: 100000;
}

.hml-alert.fade-out {
    animation: hml-alert-out 0.2s ease forwards;
}

.hml-alert-header {
    height: 30px;
    background: #303030;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    cursor: move;
    font-weight: 600;
    color: white;
}

.hml-alert-body {
    padding: 15px;
    font-size: 14px;
    color: #aaa;
}

.hml-alert-footer {
    padding: 0 15px 15px 15px;
}

.hml-alert-footer .hml-btn {
    width: 100%;
}

@keyframes hml-alert-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes hml-alert-out {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
}
    `;
    if (showWindow) {
        document.head.appendChild(style);
    }
    panel.innerHTML = `
    <div class="hml-window hml-hidden" style="left:50px; top:50px;">
            <div class="hml-window-dragbar">
                <div class="hml-window-dragbar-leftside">HML</div><div class="hml-window-dragbar-rightside">X</div>
            </div>

            <div class="hml-window-content">
                <div class="hml-window-sidebar">
                    <div class="hml-option">Home</div>
                    <div class="hml-option">Mods</div>
                    <div class="hml-option">Options</div>
                </div>
                <div class="hml-window-main">
                    select option from sidebar
                </div>
            </div>
        </div>
    `;
    if (showWindow) {
        document.body.appendChild(panel);
    }

    const wndw = document.querySelector('.hml-window');
    const dragbar = wndw.querySelector('.hml-window-dragbar');
    const closeBtn = wndw.querySelector('.hml-window-dragbar-rightside')
    let isDragging = false;
    let offsetX, offsetY;
    let isOpen = false;
    let canClose = true
    dragbar.addEventListener('mousedown', (e) => {
        if (e.target === closeBtn) return
        isDragging = true;
        offsetX = e.clientX - wndw.offsetLeft;
        offsetY = e.clientY - wndw.offsetTop;
    })
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            wndw.style.left = `${e.clientX - offsetX}px`;
            wndw.style.top = `${e.clientY - offsetY}px`
            if (wndw.offsetLeft < 0) wndw.style.left = '0px';
            if (wndw.offsetTop < 0) wndw.style.top = '0px';
        }
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
    })
    // checkbox: <label class="hml-checkbox-container"><input type="checkbox"><span class="hml-checkbox-box" style="width: 15px; height: 15px;"></span>text</label>
    const options = wndw.querySelectorAll('.hml-option');
    const mainContent = wndw.querySelector('.hml-window-main')
    const contents = {
        'Home': `
        Welcome to HML! This is the home page.<br><br>
        Contact: <br>
        - Email: me@ximi.ovh<br>
        - GitHub: <a class="hml-a" href="https://github.com/ximi-ovh">https://github.com/ximi-ovh</a><br>
        - Discord: erdef
        `,

        'Mods': `
        <div id="modloader-list">Loading mods...</div><br>
        <input type="text" class="hml-input" id="modloader-new-url" placeholder="Mod URL" style="width:80%;padding:5px;">
        <button id="modloader-add-btn" class="hml-btn hml-btn-primary" style="padding:5px; width:20%; cursor:pointer;">Add Mod</button><br>
        <button onclick="location.reload()" class="hml-btn hml-btn-primary" style="padding:5px; margin-top:10px; width:100%; cursor:pointer;">Apply changes</button>
        `,

        'Options': `
        <button onclick="window.modloader.saveConfig()" class="hml-btn hml-btn-primary" style="padding:5px; margin-top:10px; width:50%; cursor:pointer;">Save config</button><button onclick="window.modloader.loadConfig()" class="hml-btn hml-btn-primary" style="padding:5px; margin-top:10px; width:50%; cursor:pointer;">Load config</button><br><br>
        <label class="hml-checkbox-container"><input type="checkbox" id="hml-options-custom-engine"><span class="hml-checkbox-box" style="width: 15px; height: 15px;"></span>Use custom engine:</label>
        <input type="text" class="hml-input" id="hml-options-engine-url" placeholder="Custom engine URL" style="width:100%; padding:5px; margin-top:5px;" disabled><br><br>
        <label class="hml-checkbox-container"><input type="checkbox" id="hml-options-optim-engine"><span class="hml-checkbox-box" style="width: 15px; height: 15px;"></span>Use optimized engine</label>
        `
    };
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            mainContent.innerHTML = contents[option.textContent];
            if (option.textContent === 'Mods') {
                renderList();
                panel.querySelector('#modloader-add-btn').addEventListener('click', async () => {
                    const url = panel.querySelector('#modloader-new-url').value.trim();
                    if(url) await unsafeWindow.modloader.addMod(url);
                });
            }
            else if (option.textContent === 'Options') {
                const hml_options_custom_engine = panel.querySelector('#hml-options-custom-engine');
                const hml_options_engine_url = panel.querySelector('#hml-options-engine-url');
                const hml_options_optim_engine = panel.querySelector('#hml-options-optim-engine');
                hml_options_custom_engine.addEventListener('change', () => {
                    hml_options_engine_url.disabled = !hml_options_custom_engine.checked;
                });
                hml_options_optim_engine.addEventListener('change', () => {                
                    if (hml_options_optim_engine.checked) {
                        hml_options_custom_engine.checked = false;
                        hml_options_custom_engine.disabled = true;
                        hml_options_engine_url.value = '';
                        hml_options_engine_url.disabled = true;
                    }
                    else {
                        hml_options_custom_engine.checked = false;
                        hml_options_custom_engine.disabled = false;
                        hml_options_engine_url.value = '';
                        hml_options_engine_url.disabled = false;
                    }
                });

            }
        });
    });
    options[0].click()
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            toggleWindow();
        }
    })
    function toggleWindow() {
        if (!canClose) return;
        if (isOpen) {
            canClose = false;
            wndw.style.animation = 'hml-close 0.3s ease-out forwards';
            wndw.addEventListener('animationend', () => {
                wndw.classList.add('hml-hidden');
                canClose = true;
            }, { once: true });
        } else {
            canClose = false;
            wndw.classList.remove('hml-hidden');
            wndw.style.animation = 'hml-popup 0.3s ease-out forwards';
            setTimeout(() => {
                canClose = true;
            }, 300);
        }

        isOpen = !isOpen;
    }
    closeBtn.addEventListener('click', () => {
        if (isOpen) toggleWindow();
    });

    const checkGameRunning = setInterval(() => {
        if (unsafeWindow.bsp.isGameRunning) {
            clearInterval(checkGameRunning);
            toggleWindow();
        }
    }, 100);

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
                <div class="hml-option" style="margin-bottom:5px; cursor:default; display: flex; align-items: center;">
                    <span>${name}${author ? ' - ' + author : ''}</span>
                    <button data-id="${mod.id}" 
                            style="margin-left:auto; padding:5px; cursor:pointer; background-color:#e81123; color:white; border:none; border-radius:5px;"
                            onClick="this.style.background='#f00'; this.disabled=true;">
                        Delete
                    </button>
                </div>
            `;
            item.querySelector('button').addEventListener('click', async () => {
                await unsafeWindow.modloader.removeMod(mod.id);
            });
            listContainer.appendChild(item);
        }
    }
    unsafeWindow.modloader.loadConfig();
    

    loadMods().then(async () => {
        const el = document.getElementById('game-version');
        const count = await unsafeWindow.modloader.getModCount();
        if(el) el.textContent += ` + ModLoader (${count} Mods)`;
    });
})();