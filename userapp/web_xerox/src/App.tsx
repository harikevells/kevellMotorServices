import React, { useState } from 'react';
import PhoneFrame from './components/PhoneFrame';
import HomePage from './pages/HomePage';
import NearbyShopsPage from './pages/NearbyShopsPage';
import UploadDocumentPage from './pages/UploadDocumentPage';
import SelectPageScreen from './pages/SelectPageScreen';
import AddressPage from './pages/AddressPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'nearby':
        return <NearbyShopsPage onNavigate={handleNavigate} />;
      case 'upload':
        return <UploadDocumentPage onNavigate={handleNavigate} />;
      case 'selectpage':
        return <SelectPageScreen onNavigate={handleNavigate} />;
      case 'address':
        return <AddressPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {/* Import Nunito font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <PhoneFrame>
        {renderPage()}
      </PhoneFrame>
    </>
  );
};

export default App;
