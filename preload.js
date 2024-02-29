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
    sendToCtrl: (e, data) => ipcRenderer.send("ctrl", {channel: e, message: data}),
    sendToWin: (e, data) => ipcRenderer.send("ctrl-to-win", {channel: e, message: data})
})