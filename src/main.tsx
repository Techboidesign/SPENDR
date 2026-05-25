
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';
import { APPEARANCE_STORAGE_KEY } from './app/theme/appColors';
import { getItem } from './app/utils/storage';

if (getItem<string>(APPEARANCE_STORAGE_KEY) === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(<App />);
  