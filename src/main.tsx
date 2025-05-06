import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register'
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', registration)
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
