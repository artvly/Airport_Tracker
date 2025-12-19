import React from 'react';
import ReactDOM from 'react-dom'
import Particles from './components/Particles.jsx';

const App = () => {
    return (
        <div>
            <Particles />
        </div>
    );
};
// Старый способ для React 17
ReactDOM.render(<App />, document.getElementById('root'));