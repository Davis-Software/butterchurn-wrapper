import butterchurn from 'butterchurn';
import butterchurnPresets from '../node_modules/butterchurn-presets/lib/butterchurnPresets.min';
import butterchurnPresetsExtra from '../node_modules/butterchurn-presets/lib/butterchurnPresetsExtra.min';
import butterchurnPresetsExtra2 from '../node_modules/butterchurn-presets/lib/butterchurnPresetsExtra2.min';

import _ from "lodash";


let sourceID = null

window.ipc.onSetSource(s => {
    sourceID = s
    console.log(`Got source id ${s}`)
})
window.ipc.askForSourceID()


class ButterChurnViz{
    constructor(canvasSelector, debugSelector=null) {
        this.visualizer = null
        this.rendering = false
        this.audioContext = new AudioContext()
        this.sourceNode = null
        this.cycleInterval = null
        this.presets = {
            // ...butterchurnPresets.getPresets(),
            ...butterchurnPresetsExtra.getPresets(),
            ...butterchurnPresetsExtra2.getPresets()
        }
        this.presetKeys = []
        this.presetIndexHist = []
        this.presetIndex = 0
        this.presetCycle = true
        this.presetCycleLength = 15000
        this.presetRandom = true
        this.presetRatings = {}
        this.canvas = (typeof canvasSelector === "string") ? document.querySelector(canvasSelector) : canvasSelector
        this.debugElement = (typeof debugSelector === "string") ? document.querySelector(debugSelector) : debugSelector
    }
    loadCustomPresetWeights(callback){
        fetch("https://interface.software-city.org/butter-churn").then(res => res.json()).then(data => {
            for(let preset of data){
                this.presetRatings[preset.key] = preset.weight
            }
            console.info("Loaded preset weights")
            callback()
        }).catch(e => {
            console.error(e)
            callback()
        })
    }
    computeCustomRatings(){
        for(let presetKey of Object.keys(this.presets)){
            this.presets[presetKey].rating = this.presets[presetKey].baseVals.rating || 0
        }
        for(let presetKey of Object.keys(this.presetRatings)){
            if(this.presets[presetKey]){
                this.presets[presetKey].rating += this.presetRatings[presetKey]
            }
        }
        this.sortByCustomRatings()
    }
    sortByCustomRatings(){
        this.presetKeys = Object.keys(this.presets).sort((a, b) => this.presets[b].rating - this.presets[a].rating)
    }
    updateDebugInfo(){
        if(this.debugElement && sessionStorage.getItem("debug") === "true"){
            this.debugElement.innerHTML = `
                <div>Preset Amount: ${this.presetKeys.length}</div>
                <div>Current Preset: ${this.presetKeys[this.presetIndex]}</div>
                <div>Preset Rating: ${this.presets[this.presetKeys[this.presetIndex]].rating}</div>
                <div>Current Preset Index: ${this.presetIndex}</div>
                <div>Preset History: ${this.presetIndexHist.join(", ")}</div>
                <div>Random Presets: ${this.presetRandom}</div>
                <div>Cycle Presets: ${this.presetCycle}</div>
                <div>Cycle Length: ${this.presetCycleLength}</div>
            `
        }else{
            if(!this.debugElement) return
            this.debugElement.innerHTML = ""
        }
    }
    startRenderer() {
        if(!this.rendering) return
        requestAnimationFrame(() => this.startRenderer())
        this.visualizer.render()
    }
    stopRender() {
        this.rendering = false
    }
    prepareConnect(){
        if (!this.rendering) {
            this.rendering = true
            this.startRenderer()
        }
        if (this.sourceNode) {
            this.sourceNode.disconnect()
        }
    }
    connectToMic() {
        this.prepareConnect()
        navigator.getUserMedia({audio: true}, stream => {
            this.sourceNode = this.audioContext.createMediaStreamSource(stream)

            let gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.25;
            this.sourceNode.connect(gainNode);

            this.visualizer.connectAudio(gainNode)
        }, (err) => {
            console.error(err)
        })
    }
    connectToAudioCapture() {
        if(!sourceID){
            console.error("No valid source loaded")
            return
        }

        this.prepareConnect()
        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceID,
                    minWidth: 16,
                    maxWidth: 16,
                    minHeight: 9,
                    maxHeight: 9
                }
            },
            audio: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceID
                }
            }
        }).then(stream => {
            this.sourceNode = this.audioContext.createMediaStreamSource(stream)

            let gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.25;
            this.sourceNode.connect(gainNode);

            this.visualizer.connectAudio(gainNode)
        })
    }
    wightedRandomPreset(){
        let total = _.sumBy(this.presetKeys, presetKey => this.presets[presetKey].rating)
        let random = Math.random() * total
        let sum = 0
        for(let presetKey of this.presetKeys){
            sum += this.presets[presetKey].rating
            if(sum >= random){
                return presetKey
            }
        }
        return this.presetKeys[this.presetKeys.length - 1]
    }
    nextPreset(blendTime = 5.7, weighted=true) {
        this.presetIndexHist.push(this.presetIndex)

        let numPresets = this.presetKeys.length
        if (this.presetRandom) {
            if(weighted){
                this.presetIndex = this.presetKeys.indexOf(this.wightedRandomPreset())
                this.presets[this.presetKeys[this.presetIndex]].rating -= 1 // penalize the preset for being selected
                this.sortByCustomRatings()
            }else{
                this.presetIndex = Math.floor(Math.random() * this.presetKeys.length)
            }
        } else {
            this.presetIndex = (this.presetIndex + 1) % numPresets
        }

        this.visualizer.loadPreset(this.presets[this.presetKeys[this.presetIndex]], blendTime)
    }
    prevPreset(blendTime = 5.7) {
        let numPresets = this.presetKeys.length
        if (this.presetIndexHist.length > 0) {
            this.presetIndex = this.presetIndexHist.pop()
        } else {
            this.presetIndex = ((this.presetIndex - 1) + numPresets) % numPresets
        }

        this.visualizer.loadPreset(this.presets[this.presetKeys[this.presetIndex]], blendTime)
    }
    restartCycleInterval() {
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval)
            this.cycleInterval = null
        }

        if (this.presetCycle) {
            this.cycleInterval = setInterval(() => this.nextPreset(2.7), this.presetCycleLength)
        }
    }
    finishInit() {
        this.computeCustomRatings()

        this.presetIndex = Math.floor(Math.random() * this.presetKeys.length)

        this.visualizer = butterchurn.createVisualizer(this.audioContext, this.canvas , {
            width: window.outerWidth,
            height: window.outerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            textureRatio: 1,
        })
        this.nextPreset(0)
        this.cycleInterval = setInterval(() => this.nextPreset(2.7), this.presetCycleLength)
        setInterval(() => this.updateDebugInfo(), 1000)
        document.addEventListener("keydown", (e) => {
            if (e.key === "ü") {
                sessionStorage.setItem("debug", sessionStorage.getItem("debug") === "true" ? "false" : "true")
                this.updateDebugInfo()
            }
        })
    }
    initPlayer(callback) {
        this.loadCustomPresetWeights(() => {
            this.finishInit()
            callback()
        })
    }
    startPlayer(inputMode = "mic") {
        this.initPlayer(() => {
            switch(inputMode){
                case "mic":
                    this.connectToMic()
                    break;
                case "capture":
                    this.connectToAudioCapture()
                    break;
            }
        })
    }
}

export default ButterChurnViz