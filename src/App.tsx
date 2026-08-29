/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Header from './components/Header';
import MapView from './components/Map';
import Catalog from './components/Catalog';
import Directory from './components/Directory';
import About from './components/About';
import Footer from './components/Footer';
import { School, Config } from './types';
import './i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'catalog' | 'directory' | 'about'>('map');
  const [schools, setSchools] = useState<School[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setActiveTab('catalog');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolsRes, configRes] = await Promise.all([
          fetch('/api/schools'),
          fetch('/api/config')
        ]);
        
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData);
        }
        
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow">
        {activeTab === 'map' && (
          <div className="flex flex-col items-center bg-gray-50 pb-12">
            <div className="w-[85%] lg:w-[80%] mx-auto shadow-2xl rounded-b-2xl overflow-hidden">
              <MapView 
                schools={schools} 
                apiKey={config?.yandexMapsApiKey || ''} 
                onSchoolSelect={handleSchoolSelect}
              />
            </div>
            <div className="w-full mt-12">
              <Footer />
            </div>
          </div>
        )}
        {activeTab === 'catalog' && (
          <Catalog 
            schools={schools} 
            apiKey={config?.yandexMapsApiKey || ''} 
            selectedSchool={selectedSchool}
            setSelectedSchool={setSelectedSchool}
          />
        )}
        {activeTab === 'directory' && (
          <Directory />
        )}
        {activeTab === 'about' && (
          <About />
        )}
      </main>
    </div>
  );
}


