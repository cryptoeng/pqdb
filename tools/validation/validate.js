const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml')
const Ajv = require('ajv');
const ajv = new Ajv();

if (!exists('schema')) {
    console.error('Schema folder could not be found. Did you run the script from the root directory?');
    process.exit(1);
}

const schemaForScheme = JSON.parse(fs.readFileSync('schema/scheme.json', 'utf-8'));
const schemaForFlavor = JSON.parse(fs.readFileSync('schema/flavor.json', 'utf-8'));
const schemaForParam = JSON.parse(fs.readFileSync('schema/paramset.json', 'utf-8'));
const schemaForImpl = JSON.parse(fs.readFileSync('schema/implementation.json', 'utf-8'));;
const schemaForBench = JSON.parse(fs.readFileSync('schema/benchmark.json', 'utf-8'));;
const _validIdentifier = RegExp('^[-A-Za-z0-9]+$');


function exists(file) {
    try {
        fs.accessSync(file, 'fs.constants.F_OK');
    } catch {
        return false;
    }
    return true;
}

function isValidSchemeDir(rootDirectory, directory) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var schemeFile = path.join(fullPath, directory + '.yaml');
    if (!exists(schemeFile)) {
        console.error('Scheme file ' + schemeFile + ' is not present.');
        return false;
    }

    console.log(schemeFile);
    var scheme = yaml.load(fs.readFileSync(schemeFile));
    scheme.type = (rootDirectory.endsWith('encryption')) ? 'enc' : 'sig';

    var isValidScheme = ajv.compile(schemaForScheme);
    if (!isValidScheme(scheme)) {
        console.error(isValidScheme.errors);
        return false;
    }

    return fs.readdirSync(fullPath).every(
        flavorDir => !fs.statSync(path.join(fullPath, flavorDir)).isDirectory()
            || isValidFlavorDir(fullPath, flavorDir)
    );
}

function isValidFlavorDir(rootDirectory, directory) {
    var fullPath = path.join(rootDirectory, directory);
    console.log(fullPath);

    var flavorFile = path.join(fullPath, directory + '.yaml');
    if (!exists(flavorFile)) {
        console.error('Flavor file ' + flavorFile + ' is not present.');
        return false;
    }
    if (!isValidFile(flavorFile, schemaForFlavor)) return false;

    var schemaForDir = {
        "param": schemaForParam,
        "impl": schemaForImpl
    };

    var valid = Object.keys(schemaForDir).every(
        directory => !exists(path.join(fullPath, directory))
            || fs.readdirSync(path.join(fullPath, directory)).every(
                file => !fs.statSync(path.join(fullPath, directory, file)).isFile()
                    || !file.endsWith(".yaml")
                    || isValidFile(path.join(fullPath, directory, file), schemaForDir[directory])
            )
    );
    if (!valid) return false;


    return !exists(path.join(fullPath, "bench")) || fs.readdirSync(path.join(fullPath, "bench")).every(
        file => !fs.statSync(path.join(fullPath, "bench", file)).isFile()
            || !file.endsWith(".yaml")
            || isValidBenchmarkFile(fullPath, file)
    );
}

function isValidBenchmarkFile(fullPath, file) {
    var filePath = path.join(fullPath, "bench", file);
    console.log(filePath);
    var parts = path.basename(file, '.yaml').split('_');
    var data = yaml.load(fs.readFileSync(filePath));
    if ('impl' in data || 'param' in data) {
        console.log("'impl' and 'param' should not be explicity set in benchmark files but are inferred from the filename.");
        return false;
    }
    if (parts.length != 3 || !parts.every(p => _validIdentifier.test(p))) {
        console.log("Filename must be impl_param_arch.yaml and each segment must match A-Za-z0-9-.");
        return false;
    }
    data.impl = parts[0];
    if (!exists(path.join(fullPath, 'impl', data.impl + '.yaml'))) {
        console.log("Referenced implementation '" + data.impl + "' does not exist.");
        return false;
    }
    data.param = parts[1];
    if (!exists(path.join(fullPath, 'param', data.param + '.yaml'))) {
        console.log("Referenced parameter set '" + data.param + "' does not exist.");
        return false;
    }
    return isValidData(data, schemaForBench);
}

function isValidFile(file, schema) {
    console.log(file);
    if (!_validIdentifier.test(path.basename(file, '.yaml'))) {
        console.log("Filename must match A-Za-z0-9-!");
        return false;
    }
    return isValidData(yaml.load(fs.readFileSync(file)), schema);
}

function isValidData(data, schema) {
    var isValid = ajv.compile(schema);
    if (!isValid(data)) {
        console.error(isValid.errors);
        return false;
    }
    return true;
}

function validate() {
    return ['encryption', 'signatures'].every(
        rootDir => fs.readdirSync(rootDir).every(
            schemeDir => !fs.statSync(path.join(rootDir, schemeDir)).isDirectory()
                || isValidSchemeDir(rootDir, schemeDir)
        )
    );
}

if (!validate()) process.exit(1);
console.log("Validation successfully completed. All files are valid.")
