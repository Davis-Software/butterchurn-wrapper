const SAMPLER_COUNT = 4

let presets = {}
const presetList = document.querySelector("#preset-list")
const presetListSearch = document.querySelector("#preset-list input")


const autoScrollCheckbox = document.querySelector("#check-auto-scroll-current")
const autoSelectCheckbox = document.querySelector("#check-auto-select-current")

const selectedPresetSwitchButton = document.querySelector("#button-selected-preset-switch")
const selectedPresetExcludeButton = document.querySelector("#button-selected-preset-exclude")
const selectedPresetIncludeButton = document.querySelector("#button-selected-preset-include")
const selectedPresetClearButton = document.querySelector("#button-selected-preset-clear")
const selectedPresetInput = document.querySelector("#input-selected-preset")

const nextPresetButton = document.querySelector("#button-preset-next")

const autoSwitchCheckbox = document.querySelector("#check-auto-switch")
const autoSwitchRandomCheckbox = document.querySelector("#check-auto-switch-random")
const autoSwitchWeightedRandomCheckbox = document.querySelector("#check-auto-switch-weighted-random")
const autoSwitchPenalizeCheckbox = document.querySelector("#check-auto-switch-penalize")
const cycleTimeInput = document.querySelector("#input-cycle-time")
const blendTimeInput = document.querySelector("#input-blend-time")

const overlayInput = document.querySelector("#text-overlay")
const overlayButton = document.querySelector("#button-overlay")
const overlayDurationInput = document.querySelector("#input-overlay-duration")
const overlaySampleHolder = document.querySelector("#overlay-sample-holder")

// default to checked
autoScrollCheckbox.checked = true

setTimeout(() => {
    if(Object.keys(presets).length > 0) return
    window.ctrl.sendToWin("get-presets")
}, 500)
window.ctrl.on("presets-ready", respPresets => {
    presetList.querySelectorAll("div").forEach(e => e.remove())
    presets = respPresets

    Object.keys(presets).map(preset => {
        let newElem = document.createElement("div")

        newElem.textContent = preset
        newElem.setAttribute("data-preset", preset)
        newElem.classList.toggle("excluded", !!presets[preset].excluded)
        newElem.addEventListener("click", () => {
            presetList.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"))
            newElem.classList.add("selected")
            selectedPresetInput.value = preset
            selectedPresetInput.parentNode.querySelector("span").textContent = `(Base Rating ${presets[preset].rating || presets[preset].baseVals.rating})`
            selectedPresetExcludeButton.disabled = presets[preset].excluded
            selectedPresetIncludeButton.disabled = !presets[preset].excluded
            selectedPresetClearButton.disabled = false
            selectedPresetSwitchButton.disabled = false
        })

        presetList.append(newElem)
    })

    presetListSearch.addEventListener("input", () => {
        let search = presetListSearch.value.toLowerCase()
        if(search === ""){
            presetList.querySelectorAll("div").forEach(e => e.style.display = "")
            return
        }
        presetList.querySelectorAll("div").forEach(e => {
            e.style.display = e.textContent.toLowerCase().includes(search) ? "" : "none"
        })
    })
    presetListSearch.placeholder = `Search ${Object.keys(presets).length} presets`
})
window.ctrl.on("preset-select", presetName => {
    presetList.querySelectorAll(".current").forEach(e => e.classList.remove("current"))
    let preset = presetList.querySelector(`[data-preset="${presetName}"]`)
    if(preset) {
        preset.classList.remove("selected")
        preset.classList.add("current")
    }
    if(autoScrollCheckbox.checked){
        preset.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })
    }
    if(autoSelectCheckbox.checked){
        preset.click()
    }
})

selectedPresetSwitchButton.addEventListener("click", () => {
    window.ctrl.sendToWin("preset-select", selectedPresetInput.value)
})
selectedPresetExcludeButton.addEventListener("click", () => {
    window.ctrl.sendToWin("preset-exclude", selectedPresetInput.value)
})
selectedPresetIncludeButton.addEventListener("click", () => {
    window.ctrl.sendToWin("preset-include", selectedPresetInput.value)
})
selectedPresetClearButton.addEventListener("click", () => {
    selectedPresetInput.value = ""
    selectedPresetInput.parentNode.querySelector("span").textContent = "None selected"
    selectedPresetClearButton.disabled = true
    selectedPresetSwitchButton.disabled = true
    selectedPresetExcludeButton.disabled = true
    selectedPresetIncludeButton.disabled = true
    presetList.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"))
})
window.ctrl.on("preset-exclude", presetName => {
    let preset = presetList.querySelector(`[data-preset="${presetName}"]`)
    if(preset) {
        preset.classList.add("excluded")
    }
    if(presetName === selectedPresetInput.value) {
        selectedPresetExcludeButton.disabled = true
        selectedPresetIncludeButton.disabled = false
    }
    presets[presetName].excluded = true
})
window.ctrl.on("preset-include", presetName => {
    let preset = presetList.querySelector(`[data-preset="${presetName}"]`)
    if(preset) {
        preset.classList.remove("excluded")
    }
    if(presetName === selectedPresetInput.value) {
        selectedPresetExcludeButton.disabled = false
        selectedPresetIncludeButton.disabled = true
    }
    presets[presetName].excluded = false
})

nextPresetButton.addEventListener("click", () => {
    window.ctrl.sendToWin("preset-next")
})

const updateVars = [
    autoSwitchCheckbox,
    autoSwitchRandomCheckbox,
    autoSwitchWeightedRandomCheckbox,
    autoSwitchPenalizeCheckbox,
    cycleTimeInput,
    blendTimeInput
]
function updateFunc(){
    window.ctrl.sendToWin("settings-change", {
        presetCycle: autoSwitchCheckbox.checked,
        presetRandom: autoSwitchRandomCheckbox.checked,
        weightedRandom: autoSwitchWeightedRandomCheckbox.checked,
        penalizeSelected: autoSwitchPenalizeCheckbox.checked,
        presetCycleLength: cycleTimeInput.value,
        blendTime: blendTimeInput.value
    })
}
updateVars.forEach(control => {
    control.addEventListener("change", updateFunc)
    control.addEventListener("change", () => {
        localStorage.setItem(control.id, control.type === "checkbox" ? control.checked : control.value.toString())
    })
    if(control.type === "checkbox") {
        control.checked = localStorage.getItem(control.id) !== null ? localStorage.getItem(control.id) === "true" : false
    } else {
        control.value = parseInt(localStorage.getItem(control.id)) || control.value
    }
})
window.ctrl.on("get-settings", updateFunc)

function sendOverlay(){
    window.ctrl.sendToWin("set-overlay", {
        text: overlayInput.value,
        duration: overlayDurationInput.value
    })
}
overlayButton.addEventListener("click", sendOverlay)
overlayInput.addEventListener("keydown", e => {
    if(e.key !== "Enter") return
    e.preventDefault()
    sendOverlay()
})
overlayDurationInput.addEventListener("input", () => {
    overlayDurationInput.nextElementSibling.textContent = overlayDurationInput.value + "ms"
})

function addOverlaySamplers(){
    let template = overlaySampleHolder.querySelector("template")
    for(let i = 0; i < SAMPLER_COUNT; i++){
        let newElem = document.createElement("div")
        newElem.innerHTML = template.innerHTML
        let button = newElem.querySelector("button")
        let input = newElem.querySelector("input")
        button.textContent = "Overlay " + (i + 1)

        input.addEventListener("change", () => {
            let file = input.files[0]
            if(!file)  {
                button.textContent = "Overlay " + (i + 1)
                button.style.backgroundColor = ""
                return
            }
            button.textContent = file.name
            button.style.backgroundColor = "green"
        })

        overlaySampleHolder.append(newElem)
    }
    template.remove()
}
addOverlaySamplers()