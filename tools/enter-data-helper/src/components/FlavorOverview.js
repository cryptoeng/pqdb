import React from 'react';
import { Generate } from '@jsonforms/core';
import { JsonFormsContainer, SelectOrCreate, SelectList } from './BaseComponents';
import { Grid, Button, Paper, Box } from '@material-ui/core';
import { listFiles, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") };


class EditFlavor extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.type;
        this.schemeName = props.schemeName;
        this.name = props.name;
        this.flavorFile = path.join(typeDirs[this.type], this.schemeName, this.name, this.name + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.flavorFile, 'utf-8'));
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'flavor.json'), 'utf-8'));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.saveFlavor()}>
                        Save
                    </Button>
                </Grid>
            </Grid>
        );
    }

    saveFlavor() {
        try {
            var data = yaml.dump(this.state.data);
            fs.writeFileSync(this.flavorFile, data);
            showAlert("Saved to " + this.flavorFile, "success");
        } catch {
            showAlert("Error while saving file.", "error");
        }
    }
}

class SubtypeOverview extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.match.params.type;
        this.schemeName = props.match.params.schemeName;
        this.name = props.match.params.name;
        this.subType = props.match.params.subType;
        this.subName = props.match.params.subName;

        this.targetFile = path.join(typeDirs[this.type], this.schemeName, this.name, this.subType, this.subName + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.targetFile, 'utf-8'));
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema',
            { 'bench': 'benchmark', 'param': 'paramset', 'impl': 'implementation' }[this.subType] + '.json')));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
        if (this.subType === 'bench') {
            var parts = this.subName.split('_');
            this.dataStore.impl = parts[0];
            this.dataStore.param = parts[1];
            disableUIElements(this.state.uiSchema, ['#/properties/impl', '#/properties/param']);
        }
    }

    saveFile() {
        var data = Object.assign({}, this.state.data);
        if (this.subType === 'bench') {
            delete data.param;
            delete data.impl;
        }
        try {
            fs.writeFileSync(this.targetFile, yaml.dump(data));
            showAlert("Saved to " + this.targetFile, "success");
        } catch {
            showAlert("Error while saving file.", "error");
        }
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    <h2>{{ 'bench': 'Benchmark', 'param': 'Parameter Set', 'impl': 'Implementation' }[this.subType] + " Properties"}</h2>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.saveFile()}>
                        Save
                    </Button>
                </Grid>
            </Grid>
        );
    }
}

class FlavorOverview extends React.Component {
    constructor(props) {
        super(props)
        this.schemeName = props.match.params.schemeName;
        this.name = props.match.params.name;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.schemeName, this.name);
        this.state = {
            param: this.generateChoices('param'),
            impl: this.generateChoices('impl'),
            bench: this.generateChoices('bench')
        };

        this.benchRegex = '^(:?' + this.state.impl.join('|') + ')_(:?' + this.state.param.join('|') + ')_[A-Za-z0-9-]+$';
        this.history = props.history;
    }

    generateChoices(type) {
        return listFiles(path.join(this.baseDir, type))
            .filter(x => x.endsWith('.yaml')).map(x => x.substring(0, x.length - 5));
    }

    submitForm(name, type, create) {
        if (create === fs.existsSync(path.join(this.baseDir, type, name + ".yaml"))) {
            showAlert('Error. Unexpected existance or non-existance of flavor file.', 'error');
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, type);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = (type === 'bench') ? { platform: name.split('_')[2] } : { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                showAlert('"' + name + '" was successfully created.', 'success');
            } catch {
                showAlert('"' + name + '" could not be created.', 'error');
            }

            var newState = {};
            newState[type] = this.generateChoices(type);
            this.setState(newState);

            return;
        }

        this.history.push(this.history.location.pathname + type + '/' + name + '/');
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Flavor Properties</h2>
                            <EditFlavor type={this.type} schemeName={this.schemeName} name={this.name} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Parameter Sets</h2>
                            <SelectList entries={this.state.param}
                                action={(identifier) => this.submitForm(identifier, "param", false)} />
                            <SelectOrCreate schemes={this.state.param} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "param", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Implementations</h2>
                            <SelectList entries={this.state.impl}
                                action={(identifier) => this.submitForm(identifier, "impl", false)} />
                            <SelectOrCreate schemes={this.state.impl} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "impl", true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Benchmarks</h2>
                            <SelectList entries={this.state.bench}
                                action={(identifier) => this.submitForm(identifier, "bench", false)} />
                            <SelectOrCreate schemes={this.state.bench} regex={this.benchRegex} addNew={true}
                                action={(data) => this.submitForm(data.identifier, "bench", true)} />
                        </Box>
                    </Paper>
                </Grid>

            </Grid >
        );
    }
}

export { FlavorOverview, SubtypeOverview };
export default FlavorOverview;
