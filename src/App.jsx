import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import InstallPWA from './components/InstallPWA';
import { AuthProvider } from './contexts/AuthContext';
import { UnitsProvider } from './contexts/UnitsContext';

function App() {
  return (
    <AuthProvider>
      <UnitsProvider>
        <RouterProvider router={router} />
        <InstallPWA />
      </UnitsProvider>
    </AuthProvider>
  );
}

export default App;
