import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { School } from '../types';
import { localeSchoolName, primarySchoolName } from '../hooks/useSchoolTranslations';
import { escapeHtml } from '../lib/escapeHtml';
import { externalHref } from '../lib/website';

interface MapViewProps {
  schools: School[];
  apiKey: string;
  height?: string;
  onSchoolSelect?: (school: School) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ schools, apiKey, height = 'calc(100vh - 4rem)', onSchoolSelect }) => {
  const { t, i18n } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const schoolLink = target.closest('.school-link') as HTMLElement;
      
      if (schoolLink) {
        const schoolId = schoolLink.getAttribute('data-id');
        if (schoolId) {
          const school = schools.find(s => String(s.id) === schoolId);
          if (school && onSchoolSelect) {
            onSchoolSelect(school);
          }
        }
      }
    };

    container.addEventListener('click', handleContainerClick);
    return () => container.removeEventListener('click', handleContainerClick);
  }, [schools, onSchoolSelect]);

  useEffect(() => {
    if (!apiKey) {
      setError(t('map.missingKey'));
      return;
    }

    const scriptId = 'yandex-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=en_US`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setError(t('map.scriptError'));
      document.body.appendChild(script);
    } else if (window.ymaps) {
      setIsLoaded(true);
    }
  }, [apiKey]);

  useEffect(() => {
    if (isLoaded && window.ymaps && mapRef.current) {
      window.ymaps.ready(() => {
        // Clear existing objects if any
        if (mapRef.current && (mapRef.current as any)._mapInstance) {
          (mapRef.current as any)._mapInstance.geoObjects.removeAll();
        }

        const map = (mapRef.current as any)._mapInstance || new window.ymaps.Map(mapRef.current, {
          center: [41.7151, 44.8271], // Tbilisi center
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl'],
        });
        
        (mapRef.current as any)._mapInstance = map;

        // If only one school, center the map on it
        if (schools.length === 1) {
          const school = schools[0];
          const coords = school.coordinates.split(',').map(c => parseFloat(c.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            map.setCenter(coords, 15);
          }
        }

        schools.forEach((school) => {
          const coords = school.coordinates.split(',').map(c => parseFloat(c.trim()));
          if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

          const primaryName = primarySchoolName(school);
          const localName = localeSchoolName(school, i18n.language);
          const balloonHeader = `
            <div class="font-bold text-indigo-700 cursor-pointer hover:underline school-link" data-id="${school.id}">
              ${escapeHtml(primaryName)}
            </div>
            ${localName ? `<div class="text-xs text-gray-500 font-medium">${escapeHtml(localName)}</div>` : ''}
          `;

          const placemark = new window.ymaps.Placemark(coords, {
            balloonContentHeader: balloonHeader,
            balloonContentBody: `
              <div class="text-sm">
                <p><strong>${escapeHtml(t('map.address'))}:</strong> ${escapeHtml(school.address)}</p>
                <p><strong>${escapeHtml(t('map.languages'))}:</strong> ${escapeHtml(school.languages)}</p>
                ${school.website && externalHref(school.website) ? `<p><strong>${escapeHtml(t('catalog.website'))}:</strong> <a href="${escapeHtml(externalHref(school.website) ?? "")}" target="_blank" rel="noopener noreferrer">${escapeHtml(school.website)}</a></p>` : ''}
              </div>
            `,
            hintContent: primaryName,
          }, {
            preset: 'islands#indigoEducationIcon',
          });

          map.geoObjects.add(placemark);
        });
      });
    }
  }, [isLoaded, schools, t, i18n]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 p-4`} style={{ height }}>
        <div className="bg-white p-6 rounded-xl shadow-md max-w-md text-center">
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <p className="text-gray-600 text-sm">{t('map.keyHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">{t('map.loading')}</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
