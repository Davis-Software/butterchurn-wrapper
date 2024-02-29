import ButterChurnViz from "./butterchurnViz";


const canvas = document.querySelector("canvas")

canvas.width = window.outerWidth
canvas.height = window.outerHeight

let visualizer


window.onReady(() => {
    if (visualizer && visualizer.rendering) return

    visualizer = new ButterChurnViz(
        canvas,
        document.querySelector("div.debug")
    )

    window.ctrl.sendToCtrl("presets-ready", visualizer.presets)
    visualizer.on("preset-select", presetIndex => {
        window.ctrl.sendToCtrl("preset-select", presetIndex)
    })

    window.ctrl.on("preset-select", presetIndex => {
        visualizer.setPreset(presetIndex)
    })
    window.ctrl.on("settings-change", settings => {
        for(let key in settings){
            visualizer[key] = settings[key]
        }
        visualizer.restartCycleInterval()
    })
    window.ctrl.sendToCtrl("get-settings")
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
document.addEventListener("keydown", e => {
    document.querySelector("div.controls").style.display = "none"
    switch(e.key){
        case "d":
            sessionStorage.setItem("debug", (sessionStorage.getItem("debug") !== "true").toString())
            break;

        case "f":
            canvas.requestFullscreen()
            break;

        case "Escape":
            document.exitFullscreen()
            break;

        case "c":
            if(visualizer){
                visualizer.startPlayer("capture")
            }
            break;
        case "m":
            if(visualizer){
                visualizer.startPlayer("mic")
            }
            break;
    }
})