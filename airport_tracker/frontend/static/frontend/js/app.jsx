import React from 'react';
import ReactDOM from 'react-dom'
import Particles from './components/Particles.jsx';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import AirportMapPage from './components/AirportMapPage.jsx';

import { useHistory } from 'react-router-dom';

const HomePageWrapper = () => {
    const history = useHistory(); // Работает потому что внутри Router
    const handle_onMapClick = () => {
        console.log('🔄 Переход на /map');
        history.push('/map');
    };
    return (
        <Particles onMapClick={handle_onMapClick} />
    );
};


const App = () => (
    <Router>
        <Switch>
            <Route exact path="/" component={HomePageWrapper} />
            <Route path="/map" component={AirportMapPage} />
        </Switch>
    </Router>
);
// Старый способ для React 17
ReactDOM.render(<App />, document.getElementById('root'));