import ButterChurnViz from "./butterchurnViz";


const canvas = document.querySelector("canvas")
const overlay = document.querySelector("div#overlay")

canvas.width = window.outerWidth
canvas.height = window.outerHeight

let visualizer


window.addEventListener("resize", () => {
    if(!visualizer || !visualizer.visualizer) return
    canvas.width = window.outerWidth
    canvas.height = window.outerHeight
    visualizer.visualizer.setRendererSize(window.outerWidth, window.outerHeight)
})


window.onReady(() => {
    if (visualizer && visualizer.rendering) return

    visualizer = new ButterChurnViz(
        canvas,
        document.querySelector("div.debug")
    )

    window.ctrl.sendToCtrl("presets-ready", visualizer.presets)
    visualizer.on("preset-select", preset => {
        window.ctrl.sendToCtrl("preset-select", preset)
    })
    visualizer.on("preset-exclude", preset => {
        window.ctrl.sendToCtrl("preset-exclude", preset)
    })
    visualizer.on("preset-include", preset => {
        window.ctrl.sendToCtrl("preset-include", preset)
    })

    window.ctrl.on("get-presets", () => {
        window.ctrl.sendToCtrl("presets-ready", visualizer.presets)
    })
    window.ctrl.on("preset-select", preset => {
        if(!visualizer || !visualizer.visualizer) return
        visualizer.setPreset(preset)
    })
    window.ctrl.on("preset-exclude", preset => {
        visualizer.excludePreset(preset)
    })
    window.ctrl.on("preset-include", preset => {
        visualizer.includePreset(preset)
    })
    window.ctrl.on("preset-next", () => {
        if(!visualizer || !visualizer.visualizer) return
        visualizer.nextPreset()
    })
    window.ctrl.on("settings-change", settings => {
        for(let key in settings){
            visualizer[key] = settings[key]
        }
        visualizer.restartCycleInterval()
    })
    window.ctrl.sendToCtrl("get-settings")

    window.ctrl.on("set-overlay", overlayData => {
        overlay.innerHTML = overlayData.text
        overlay.classList.toggle("visible", true)
        setTimeout(() => {
            overlay.classList.toggle("visible", false)
        }, overlayData.duration)
    })
})


document.querySelector("div.controls").innerHTML = `
    Controls:
    d: toggle debug
    f: fullscreen
    Esc: exit fullscreen
    c: capture audio
    m: use mic
    s: stop rendering
`.replace(/\n/g, "<br>")
function hideControls(){
    document.querySelector("div.controls").style.display = "none"
}
document.addEventListener("keydown", e => {
    switch(e.key){
        case "d":
            sessionStorage.setItem("debug", (sessionStorage.getItem("debug") !== "true").toString())
            break;
        case "f":
            document.body.requestFullscreen()
            break;
        case "Escape":
            document.exitFullscreen()
            break;
        case "c":
            hideControls()
            if(visualizer){
                visualizer.startPlayer("capture")
            }
            break;
        case "m":
            hideControls()
            if(visualizer){
                visualizer.startPlayer("mic")
            }
            break;
    }
})