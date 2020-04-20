import React from 'react';
import { HashRouter as Router, Switch, Route, withRouter } from 'react-router-dom';
import { Container, Snackbar, CssBaseline } from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import SelectScheme from './components/SelectScheme';
import SchemeOverview from './components/SchemeOverview';
import { FlavorOverview, SubtypeOverview } from './components/FlavorOverview';
import { NavBar } from './components/BaseComponents';
import { checkRootDir, registerApp } from './components/Tools'
import './App.css';

const NavBarRouter = withRouter(props => <NavBar {...props} />);

function getTheme(type) {
  return createMuiTheme({
    palette: {
      type: type
    },
  });
}

const themes = {
  'light': getTheme('light'),
  'dark': getTheme('dark')
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.foundRootDir = checkRootDir();
    registerApp(this);
    this.state = {
      alertOpen: false,
      alertMsg: "",
      alertSeverity: "info",
      themeId: "light"
    };
  }

  setTheme(id) {
    this.setState({ themeId: id });
  }

  openAlert(msg, severity) {
    this.setState({ alertOpen: true, alertMsg: msg, alertSeverity: severity });
  }

  closeAlert(event, reason) {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ alertOpen: false, alertMsg: "" });
  }

  render() {
    if (!this.foundRootDir) {
      return <h1>Required directories not found. Please specify the correct path to the repository as a command line argument.</h1>;
    }
    return (
      <ThemeProvider key={this.state.themeId} theme={themes[this.state.themeId]}>
        <CssBaseline />
        <Container disableGutters maxWidth={false}>
          <Router forceRefresh={false}>
            <NavBarRouter setTheme={this.setTheme.bind(this)} theme={this.state.themeId} />
            <Container>
              <Switch>
                <Route path='/:type/:schemeName/:name/:subType/:subName' component={SubtypeOverview} />
                <Route path='/:type/:schemeName/:name/' component={FlavorOverview} />
                <Route path='/:type/:name/' component={SchemeOverview} />
                <Route exact path='/' component={SelectScheme} />
              </Switch>
              <Snackbar key={this.state.alertMsg} autoHideDuration={6000}
                open={this.state.alertOpen} onClose={this.closeAlert.bind(this)}>
                <Alert onClose={this.closeAlert.bind(this)} severity={this.state.alertSeverity}>
                  {this.state.alertMsg}
                </Alert>
              </Snackbar>
            </Container>
          </Router>
        </Container>
      </ThemeProvider>
    )
  }
}

export default App;
