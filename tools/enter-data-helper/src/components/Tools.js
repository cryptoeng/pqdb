const fs = window.require('fs');
const path = require('path');

var argv = window.require('electron').remote.process.argv;

var ROOT_DIR = path.join('..', '..');
if (argv.length === 2 || argv.length === 3) {
    ROOT_DIR = argv[argv.length - 1];
}
Object.freeze(ROOT_DIR);

var application = null;
function registerApp(app) {
    application = app;
}

function showAlert(msg, severity) {
    application.openAlert(msg, severity);
}

function checkRootDir() {
    return fs.existsSync(ROOT_DIR) && fs.existsSync(path.join(ROOT_DIR, "encryption")) &&
        fs.existsSync(path.join(ROOT_DIR, "signatures")) && fs.existsSync(path.join(ROOT_DIR, "schema"));
}

function listDirs(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isDirectory());
}

function listFiles(dir) {
    return fs.readdirSync(dir).filter(x => fs.statSync(path.join(dir, x)).isFile());
}

function disableUIElements(uiSchema, scopes) {
    for (var prop of uiSchema.elements) {
        if (scopes.includes(prop.scope))
            prop.rule = {
                effect: "DISABLE",
                condition: {
                    scope: prop.scope,
                    schema: {}
                }
            }
    }
}

export {
    checkRootDir,
    disableUIElements,
    listDirs,
    listFiles,
    registerApp,
    showAlert,
    ROOT_DIR
}
