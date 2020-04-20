import React from 'react';
import { Generate } from '@jsonforms/core';
import { JsonFormsContainer, SelectOrCreate, SelectList } from './BaseComponents';
import { Grid, Button, Paper, Box } from '@material-ui/core';
import { listDirs, ROOT_DIR, disableUIElements, showAlert } from './Tools';
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')
const typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }


class EditScheme extends JsonFormsContainer {
    constructor(props) {
        super(props)
        this.type = props.type;
        this.name = props.name;
        this.schemeFile = path.join(typeDirs[this.type], this.name, this.name + '.yaml');
        this.dataStore = yaml.load(fs.readFileSync(this.schemeFile, 'utf-8'));
        this.dataStore.type = this.type;
        if (!('stateful' in this.dataStore))
            this.dataStore.stateful = false;
        this.state.schema = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'schema', 'scheme.json'), 'utf-8'));
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
        disableUIElements(this.state.uiSchema, ['#/properties/type']);
    }

    render() {
        return (
            <Grid container direction="column" spacing={1}>
                <Grid item>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.saveScheme()}>
                        Save
                    </Button>
                </Grid>
            </Grid>
        );
    }

    saveScheme() {
        try {
            var data = Object.assign({}, this.state.data);
            delete data.type;
            data = yaml.dump(data);
            fs.writeFileSync(this.schemeFile, data);
            showAlert("Saved to " + this.schemeFile, "success");
        } catch {
            showAlert("Error while saving file.", "error");
        }
    }
}

class SchemeOverview extends React.Component {
    constructor(props) {
        super(props)
        this.name = props.match.params.name;
        this.type = props.match.params.type;
        this.baseDir = path.join(typeDirs[this.type], this.name);
        this.state = { flavors: listDirs(this.baseDir) };
        this.history = props.history;
    }

    submitForm(name, create) {
        if (create === fs.existsSync(path.join(this.baseDir, name, name + ".yaml"))) {
            showAlert("Error. Unexpected existance or non-existance of flavor file.", "error");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.baseDir, name);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                ['', 'bench', 'impl', 'param'].map(x => path.join(dir, x))
                    .filter(x => !fs.existsSync(x)).forEach(x => fs.mkdirSync(x));
                var data = { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                showAlert('Flavor "' + name + '" was successfully created.', 'success');
            } catch {
                showAlert('Flavor "' + name + '" could not be created.', 'error');
            }

            this.setState({ flavors: listDirs(this.baseDir) });
            return;
        }
        var link = this.history.location.pathname + name + "/";
        this.history.push(link);
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper >
                        <Box px={2} pt={1} pb={2}>
                            <h2>Scheme Properties</h2>
                            <EditScheme type={this.type} name={this.name} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Flavours</h2>
                            <SelectList entries={this.state.flavors}
                                action={(identifier) => this.submitForm(identifier, false)} />
                            <SelectOrCreate schemes={this.state.flavors} addNew={true}
                                action={(data) => this.submitForm(data.identifier, true)} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export default SchemeOverview;
