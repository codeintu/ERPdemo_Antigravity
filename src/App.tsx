import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContactList from './pages/contacts/ContactList';
import ContactDetail from './pages/contacts/ContactDetail';
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import SalesList from './pages/sales/SalesList';
import SalesDetail from './pages/sales/SalesDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<ContactList />} />
          <Route path="contacts/:id" element={<ContactDetail />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/:id" element={<SalesDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
