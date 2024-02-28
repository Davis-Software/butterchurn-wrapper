const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path");


function openControlWin(){
    let controlWin = new BrowserWindow({
        resizable: false,
        autoHideMenuBar: true,
        darkTheme: true,
        webPreferences: {
            preload: path.join(__dirname, "..", "preload.js"),
            nodeIntegration: true
        },
        width: 350,
        height: 700
    })
    controlWin.loadFile(path.join(__dirname, "..", "templates", "controlWin.html")).then()

    return controlWin
}
function controlWinWrapper(win, ctrlWin){
    ipcMain.on("ctrl", (_, data) => {
        ctrlWin.webContents.send(data.channel, data.message)
    })
}

exports.openControlWin = openControlWin
exports.controlWinWrapper = controlWinWrapper