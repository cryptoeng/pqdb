import React from 'react';
import { useEffect } from "react";
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router, withRouter, useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const AppWithRouter = withRouter(props => <App {...props} />);
ReactDOM.render(
  <React.StrictMode>
    <Router basename={"/pqdb"}>
      <ScrollToTop />
      <AppWithRouter />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
