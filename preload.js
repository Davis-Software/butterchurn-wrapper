const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld("ipc", {
    onSetSource: listener => ipcRenderer.on("SET_SOURCE", (_, s) => listener(s)),
    askForSourceID: () => ipcRenderer.send("getSources")
})
contextBridge.exposeInMainWorld("onReady", listener => {
    ipcRenderer.on("ready", () => listener())
})


contextBridge.exposeInMainWorld("ctrl", {
    on: (e, listener) => ipcRenderer.on(e, (_, data) => listener(data)),
    send: (e, data) => ipcRenderer.send("ctrl", {channel: e, message: data})
})