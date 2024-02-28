import ButterChurnViz from "./butterchurnViz";


const canvas = document.querySelector("canvas")

canvas.width = window.outerWidth
canvas.height = window.outerHeight

let visualizer


window.onReady(() => {
    if (visualizer && visualizer.rendering) return

    console.info("Loading viz")

    visualizer = new ButterChurnViz(
        canvas,
        document.querySelector("div.debug")
    )

    console.info("done")

    visualizer.startPlayer("capture")

    visualizer.on("presets-ready", presetKeys => {
        window.ctrl.send("presets-ready", presetKeys)
    })
    visualizer.on("preset-select", presetIndex => {
        window.ctrl.send("preset-select", presetIndex)
    })
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