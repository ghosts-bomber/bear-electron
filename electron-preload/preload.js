"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os_1 = require("os");
var electron_1 = require("electron");
console.log("platform", os_1.default.platform());
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    readFile: function (filePath) { return electron_1.ipcRenderer.invoke("read-file", filePath); },
    selectFile: function () { return electron_1.ipcRenderer.invoke("select-file"); },
});
