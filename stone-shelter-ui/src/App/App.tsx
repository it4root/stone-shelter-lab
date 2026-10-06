import { ApplicationPages } from './ApplicationPages/ApplicationPages';
import { CatalogSessionProvider } from '../features/catalog/state/CatalogSessionProvider/CatalogSessionProvider';
import { Header } from '../components/Common/Header/Header';
import { Footer } from '../components/Common/Footer/Footer';
import '../styles/global.css';

export function App() {
  return (
    <>
      <Header />
      <CatalogSessionProvider><ApplicationPages /></CatalogSessionProvider>
      <Footer />
    </>
  );
}
