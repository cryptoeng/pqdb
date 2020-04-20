import React from 'react';
import { JsonForms, JsonFormsDispatch } from '@jsonforms/react';
import { Generate, schemaMatches, rankWith, resolveSchema } from '@jsonforms/core';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import {
    Tooltip, Grid, Button, AppBar, Toolbar, IconButton, Link, Breadcrumbs, Typography, ButtonGroup, Box,
    List, ListItem, ListItemIcon, ListItemText, Paper
} from '@material-ui/core';
import {
    Info as InfoIcon, ArrowBack as BackIcon, Home as HomeIcon, ArrowForward as ForwardIcon
} from '@material-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

class TooltipWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.subSchema = resolveSchema(props.schema, props.id);
    }

    render() {
        return (
            <Grid container direction="row" alignItems="center" spacing={1}>
                <Grid item xs>
                    <JsonFormsDispatch
                        uischema={this.props.uischema}
                        schema={this.props.schema}
                        path={this.props.path}
                        renderers={materialRenderers} /*need to use renderers in which this wrapper is not included*/
                    />
                </Grid>
                <Grid item>
                    <Tooltip arrow placement="left" title={this.subSchema["$comment"]}>
                        <InfoIcon />
                    </Tooltip>
                </Grid>
            </Grid>
        );
    }
};

const LinkRouter = props => <Link color="inherit" {...props} component={RouterLink} />;

class NavBar extends React.Component {
    constructor(props) {
        super(props);
        this.history = props.history;
        this.location = this.history.location.pathname;
    }

    selectTheme(theme) {
        this.props.setTheme(theme);
    }

    componentDidMount() {
        this.unlisten = this.history.listen((location, action) => {
            this.location = location.pathname;
            this.forceUpdate();
        });
    }
    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        var path = this.location.substring(1, this.location.length - 1).split('/');
        var pathLinks = [['/', "Home"]];
        if (path.length >= 2 && path[0] !== '') {
            var text1 = path.slice(0, 2).join("/");
            var link1 = '/' + text1 + '/';
            pathLinks.push([link1, text1]);
        }
        if (path.length >= 3) {
            var text2 = path[2];
            var link2 = '/' + path.slice(0, 3).join("/") + '/';
            pathLinks.push([link2, text2]);
        }
        if (path.length === 5) {
            var text3 = path.slice(3, 5).join("/");
            var link3 = '/' + path.join('/') + '/';
            pathLinks.push([link3, text3]);
        }

        var last = pathLinks.length - 1;

        return (
            <AppBar position="sticky">
                <Toolbar>
                    {
                        (pathLinks.length > 1) ?
                            <IconButton edge="start" color="inherit" onClick={(evt) => this.history.goBack()}>
                                <BackIcon />
                            </IconButton>
                            :
                            <IconButton edge="start" color="inherit">
                                <HomeIcon />
                            </IconButton>
                    }

                    <Breadcrumbs>
                        {pathLinks.slice(0, last).map(x => <LinkRouter key={x[0]} to={x[0]}>{x[1]}</LinkRouter>)}
                        {<Typography color="textPrimary">{pathLinks[last][1]}</Typography>}
                    </Breadcrumbs>
                    <Box flex={1} />
                    <ButtonGroup>
                        <Button
                            variant={this.props.theme === 'light' ? "contained" : "outlined"}
                            onClick={() => this.selectTheme('light')}>Light</Button>
                        <Button
                            variant={this.props.theme === 'dark' ? "contained" : "outlined"}
                            onClick={() => this.selectTheme('dark')}>Dark</Button>
                    </ButtonGroup>
                </Toolbar>
            </AppBar>
        );
    }
}

class JsonFormsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { validState: false, data: {}, schema: {}, uiSchema: {} };
        this.dataStore = {};
    }

    buildJSONForm() {
        return (
            <JsonForms
                schema={this.state.schema}
                uischema={this.state.uiSchema}
                renderers={[
                    ...materialRenderers,
                    {
                        tester: rankWith(3, schemaMatches((schema) => "$comment" in schema)),
                        renderer: TooltipWrapper
                    }
                ]}
                cells={materialCells}
                data={this.dataStore}
                onChange={this.onChange.bind(this)}
            />
        );
    }

    onChange({ errors, data }) {
        this.setState({ validState: errors && errors.length === 0, data: data });
    }
}

class SelectList extends React.Component {
    constructor(props) {
        super(props);
        this.entries = props.entries;
    }

    render() {
        return (
            <Paper>
                <List component="ul">
                    {
                        this.entries.map(entry => (
                            <ListItem button key={"item-" + entry} onClick={() => this.props.action(entry)}>
                                <ListItemText primary={entry} />
                                <ListItemIcon>
                                    <ForwardIcon />
                                </ListItemIcon>
                            </ListItem>
                        ))
                    }
                </List>
            </Paper>
        );
    }
}

class SelectOrCreate extends JsonFormsContainer {
    constructor(props) {
        super(props);
        if (props.regex != null)
            this.regex = props.regex;
        else
            this.regex = "^[A-Za-z0-9-]+$";

        this.addNew = props.addNew;
        this.action = props.action;
        this.buttonText = (this.addNew) ? "Create" : "Select";

        this.state.schema = this.generateSchema();
        this.state.uiSchema = Generate.uiSchema(this.state.schema);
        this.state.schemes = props.schemes;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.schemes !== this.props.schemes) {
            var schema = this.generateSchema();
            this.setState({ schema: schema, uiSchema: Generate.uiSchema(schema), schemes: this.props.schemes });
        }
    }

    generateSchema() {
        var schema = {
            type: "object", properties: {
                identifier: {
                    type: "string",
                    pattern: this.regex
                }
            }, required: ["identifier"]
        };
        if (this.addNew && this.props.schemes.length > 0)
            schema.properties.identifier.not = { type: "string", enum: this.props.schemes };
        else if (!this.addNew)
            schema.properties.identifier.enum = this.props.schemes;

        return schema;
    }

    render() {
        if (this.state.schemes.length === 0 && !this.addNew)
            return null;

        return (
            <Grid container direction="row" alignItems="center" spacing={1}>
                <Grid item xs>
                    {this.buildJSONForm()}
                </Grid>
                <Grid item>
                    <Button size="medium" color="primary" variant="contained" disabled={!this.state.validState}
                        onClick={(evt) => this.action(this.state.data)}>
                        {this.buttonText}
                    </Button>
                </Grid>
            </Grid>
        );
    }
}

export default JsonFormsContainer;
export { JsonFormsContainer, SelectOrCreate, SelectList, NavBar };
