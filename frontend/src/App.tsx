import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AppRouter } from './routes/AppRouter';
import './index.css';

function App() {
  useEffect(() => {
    console.log('OGSL Data Portal - Application démarrée');
    console.log('Environment:', import.meta.env.MODE);
  }, []);

  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}

export default App;


