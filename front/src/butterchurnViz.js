import butterchurn from 'butterchurn';
import butterchurnPresets from '../node_modules/butterchurn-presets/lib/butterchurnPresets.min';
import butterchurnPresetsExtra from '../node_modules/butterchurn-presets/lib/butterchurnPresetsExtra.min';
import butterchurnPresetsExtra2 from '../node_modules/butterchurn-presets/lib/butterchurnPresetsExtra2.min';

import _ from "lodash";


let sourceID = null

window.ipc.onSetSource(s => {
    sourceID = s
})
window.ipc.askForSourceID()


class ButterChurnViz{
    constructor(canvasSelector, debugSelector=null) {
        this.visualizer = null
        this.rendering = false
        this.audioContext = new AudioContext()
        this.sourceNode = null

        // configurable options
        this.cycleInterval = null
        this.presetCycle = true
        this.presetCycleLength = 15000
        this.presetRandom = true
        this.weightedRandom = false
        this.penalizeSelected = false
        this.blendTime = 2.7
        this.presets = {
            ...butterchurnPresets.getPresets(),
            ...butterchurnPresetsExtra.getPresets(),
            ...butterchurnPresetsExtra2.getPresets()
        }

        this.presetKeys = []
        this.preset = null
        this.presetRatings = {}
        this.canvas = (typeof canvasSelector === "string") ? document.querySelector(canvasSelector) : canvasSelector
        this.debugElement = (typeof debugSelector === "string") ? document.querySelector(debugSelector) : debugSelector
        this.listeners = {}
    }
    _callListener(event, data){
        if(this.listeners && this.listeners[event] && this.listeners[event].length > 0){
            this.listeners[event].forEach(e => e(data))
        }
    }
    on(event, listener){
        if(!this.listeners[event]){
            this.listeners[event] = []
        }
        this.listeners[event].push(listener)
    }
    _updateDebugInfo(){
        if(this.preset !== null && this.debugElement && sessionStorage.getItem("debug") === "true"){
            this.debugElement.innerHTML = `
                <div>Preset Amount: ${this.presetKeys.length}</div>
                <div>Current Preset: ${this.preset}</div>
                <div>Preset Rating: ${this.presets[this.preset].rating}</div>
                <div>Current Preset Index: ${Object.keys(this.presets).indexOf(this.preset)}</div>
                <hr/>
                <div>Random Presets: ${this.presetRandom}</div>
                <div>Weighted Random: ${this.weightedRandom}</div>
                <div>Penalize Selected: ${this.penalizeSelected}</div>
                <hr/>
                <div>Cycle Presets: ${this.presetCycle}</div>
                <div>Cycle Length: ${this.presetCycleLength}</div>
            `
        }else{
            if(!this.debugElement) return
            this.debugElement.innerHTML = ""
        }
    }

    _loadCustomPresetWeights(callback){
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
    _computeCustomRatings(){
        for(let presetKey of Object.keys(this.presets)){
            this.presets[presetKey].rating = this.presets[presetKey].baseVals.rating || 0
        }
        for(let presetKey of Object.keys(this.presetRatings)){
            if(this.presets[presetKey]){
                this.presets[presetKey].rating += this.presetRatings[presetKey]
            }
        }
        this._sortByCustomRatings()
    }
    _sortByCustomRatings(){
        this.presetKeys = Object.keys(this.presets).sort((a, b) => this.presets[b].rating - this.presets[a].rating)
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
            alert("Error getting microphone input")
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
        }).catch(err => {
            console.error(err)
            alert("Error getting desktop audio input\nIs this a USB audio device? If so, try using the mic input instead.")
        })
    }

    weightedRandomPreset(){
        this._sortByCustomRatings()
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
    nextPreset() {
        let numPresets = Object.keys(this.presets).length
        let presetList = Object.keys(this.presets)
        let newPreset

        if (this.presetRandom) {
            if(this.weightedRandom){
                newPreset = this.weightedRandomPreset()
                if(this.penalizeSelected){
                    this.presets[newPreset].rating -= 1 // penalize the preset for being selected
                }
            }else{
                newPreset = presetList[Math.floor(Math.random() * numPresets)]
            }
        } else {
            newPreset = presetList[(presetList.indexOf(this.preset) + 1) % numPresets]
        }

        this.setPreset(newPreset)
    }
    setPreset(presetName){
        this.preset = presetName
        this.visualizer.loadPreset(this.presets[presetName], this.blendTime)
        this._callListener("preset-select", presetName)
    }
    includePreset(presetName){
        this.presets[presetName].excluded = false
        this._callListener("preset-include", presetName)
    }
    excludePreset(presetName){
        this.presets[presetName].excluded = true
        this._callListener("preset-exclude", presetName)
    }

    restartCycleInterval() {
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval)
            this.cycleInterval = null
        }

        if (this.presetCycle) {
            this.cycleInterval = setInterval(() => this.nextPreset(), this.presetCycleLength)
        }
    }
    finishInit() {
        this._computeCustomRatings()

        this.visualizer = butterchurn.createVisualizer(this.audioContext, this.canvas , {
            width: window.outerWidth,
            height: window.outerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            textureRatio: 1,
        })
        this.nextPreset()
        this.restartCycleInterval()
        setInterval(() => this._updateDebugInfo(), 1000)
    }
    _initPlayer(callback) {
        this._loadCustomPresetWeights(() => {
            this.finishInit()
            callback()
        })
    }
    startPlayer(inputMode = "mic") {
        this._initPlayer(() => {
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