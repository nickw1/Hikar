import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './components/App';

const params = new URLSearchParams(window.location.search);

const root = ReactDOM.createRoot(
	document.getElementById('root')!
);

root.render(<App fakeLat={params.get('lat')} fakeLon={params.get('lon')}/>);
