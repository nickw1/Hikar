import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './components/App';

// Fake location used for initial testing
const START_POS = { lat: "51.051384", lon: "-0.728487" };
const params = new URLSearchParams(window.location.search);

const root = ReactDOM.createRoot(
	document.getElementById('root')!
);

const testMode = params.get('t') ||  null;

if(params.get('e')) {
	import('eruda').then(eruda => eruda.default.init());
}

root.render(<App fakeLat={testMode ? START_POS.lat : params.get('lat')} fakeLon={testMode ? START_POS.lon : params.get('lon')} />);
