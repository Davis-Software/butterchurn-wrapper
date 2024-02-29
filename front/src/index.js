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

    visualizer.startPlayer("capture")
})


document.addEventListener("keydown", e => {
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

        case "s":
            if(visualizer || visualizer.rendering){
                visualizer.stopRender()
                visualizer = null
                return
            }
    }
})