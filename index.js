const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron")
const { openControlWin, controlWinWrapper } = require("./back/controlWin")
const path = require("path");


app.allowRendererProcessReuse = true

const dataPath = path.join(__dirname, "data")
app.setAppLogsPath(path.join(dataPath, "logs"))
app.setPath("userData", dataPath)
app.setPath("appData", dataPath)
app.setPath("temp", path.join(dataPath, "temp"))
app.setPath("logs", path.join(dataPath, "logs"))


let win


function MainWindow () {
    win = new BrowserWindow({
        resizable: true,
        darkTheme: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true
        }
    })

    win.loadFile(path.join(__dirname, "templates", "index.html")).then(() => {
        controlWinWrapper(win, openControlWin())
    })
}
app.whenReady().then(MainWindow)
app.on('activate', () => {
    MainWindow()
})


function sendReady(){
    win.webContents.send("ready")
}
function testIsReady(){
    if(!win){
        setTimeout(testIsReady, 1000)
        return
    }
    sendReady()
}
function sendSourceData(){
    // weird fix for crash
    desktopCapturer.getSources({types: ["window"]}).then(() => {
        // send desktop id to font-end
        desktopCapturer.getSources({types: ["screen"]}).then(sources => {
            win.webContents.send('SET_SOURCE', sources[0].id)
            sendReady()
        })
    })
}
ipcMain.on("getSources", () => sendSourceData())
ipcMain.on("isReady", () => testIsReady())