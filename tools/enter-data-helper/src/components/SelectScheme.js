import React from 'react';
import { SelectOrCreate, SelectList } from './BaseComponents';
import { listDirs, ROOT_DIR, showAlert } from './Tools';
import { Box, Grid, Paper } from '@material-ui/core';
const fs = window.require('fs');
const path = require('path');
const yaml = require('js-yaml')


class SelectScheme extends React.Component {
    constructor(props) {
        super(props);
        this.history = props.history;
        this.typeDirs = { "enc": path.join(ROOT_DIR, "encryption"), "sig": path.join(ROOT_DIR, "signatures") }
        this.state = {
            enc: listDirs(this.typeDirs['enc']),
            sig: listDirs(this.typeDirs['sig'])
        };
    }

    submitForm(type, name, create) {
        if (create === fs.existsSync(path.join(this.typeDirs[type], name, name + ".yaml"))) {
            showAlert("Error. Unexpected existance or non-existance of scheme file.", "error");
            return;
        }

        if (create) {
            try {
                var dir = path.join(this.typeDirs[type], name);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir);
                var data = { name: name };
                fs.writeFileSync(path.join(dir, name + ".yaml"), yaml.dump(data));
                showAlert('Scheme "' + name + '" was successfully created.', 'success');
            } catch {
                showAlert('Scheme "' + name + '" could not be created.', 'error');
            }

            var newState = {};
            newState[type] = listDirs(this.typeDirs[type]);
            this.setState(newState);

            return;
        }

        this.history.push('/' + type + '/' + name + '/');
        window.scrollTo(0, 0);
    }

    render() {
        return (
            <Grid container direction="column" spacing={3}>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Encryption Schemes</h2>
                            <SelectList entries={this.state.enc}
                                action={(identifier) => this.submitForm("enc", identifier, false)} />
                            <SelectOrCreate schemes={this.state.enc} addNew={true}
                                action={(data) => this.submitForm("enc", data.identifier, true)} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item>
                    <Paper>
                        <Box px={2} pt={1} pb={2}>
                            <h2>Signature Schemes</h2>
                            <SelectList entries={this.state.sig}
                                action={(identifier) => this.submitForm("sig", identifier, false)} />
                            <SelectOrCreate schemes={this.state.sig} addNew={true}
                                action={(data) => this.submitForm("sig", data.identifier, true)} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid >
        );
    }

}

export default SelectScheme;


