// mod manifest, not an unique identifier
export const modManifest = {
    name: "Example Mod",
    author: "YourName",
    version: "1.0",
    description: "Example mod for HyperCubesPlanet."
};

// main mod code
(function Main() {
    // not needed, you can use window.modManifest directly, added for convenience
    const log = (msg, type = "log") => window.modloader?.logMessage(msg, type, modManifest.name);

    function initMod() {
        return; // this is to prevent accidental execution, remove this line when you start coding
        // REMEMBER: this code is an example, you should adapt it to your needs

        log("Mod init...");
        // your mod code here
        
        // everything inside will run when the game is ready
        waitForBSPGame().then(game => {
            // example: speed up player
            log("Changing player's speed to 50");
            window.bsp.playerController.moveSpeed = 50;

            // example: collect 200 coins (because this is client sided for some reason)
            window.bsp.multiplayer.sendMessage({ type: "collectCoin" }); // this works once per like 5 seconds

            // example: show login scene (logs out?)
            window.bsp.auth.showAuthScreen(); // says that the session is expired, but it isn't

            // example: get all owned blocks, and print them to console
            window.bsp.blockManager.ownedBlocks.forEach(block => {
                log(`Owned block: Name=${block.value}`);
            });
        });

        // start animation frame updates
        requestAnimationFrame(animFrameUpdate); // you can remove this if you don't need per-frame updates
    }

    function animFrameUpdate() {
        // this code will run every animation frame


        requestAnimationFrame(animFrameUpdate); // this needs to be the last line in this function
    }

    // function used to detect if the game is ready, you can see how to use it in examples
    function waitForBSPGame() {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (window.bsp && window.bsp.isGameRunning) {
                    clearInterval(interval);
                    resolve(window.bsp);
                }
            }, 100);
        });
    }


    // mod init loader, you can replace it with your own logic
    if (document.readyState === "complete" || document.readyState === "interactive") {
        initMod();
    } else {
        window.addEventListener("DOMContentLoaded", initMod);
    }
})();