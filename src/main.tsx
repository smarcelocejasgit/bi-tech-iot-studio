import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GlobalNav } from './components/GlobalNav';
import { SmartGardenLab } from './lab/SmartGardenLab';
import { useAppRoute } from './routing/appRoute';
import './index.css';

const PAGE_TITLES = {
  studio: 'Bi-Tech IoT Studio',
  lab: 'Smart Garden Lab Bi-Tech',
} as const;

const Root: React.FC = () => {
  const { route, navigate } = useAppRoute();

  useEffect(() => {
    document.title = PAGE_TITLES[route];
  }, [route]);

  return (
    <>
      <GlobalNav route={route} onNavigate={navigate} />
      {route === 'lab' ? (
        <SmartGardenLab />
      ) : (
        <App onOpenLab={() => navigate('lab')} />
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
