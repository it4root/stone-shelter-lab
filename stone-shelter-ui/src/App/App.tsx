import { CatalogPage } from '../features/catalog/components/CatalogPage/CatalogPage';
import { Header } from '../components/Common/Header/Header';
import { Footer } from '../components/Common/Footer/Footer';
import '../styles/global.css';

export function App() {
  return (
    <>
      <Header />
      <CatalogPage />
      <Footer />
    </>
  );
}
