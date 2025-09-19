
import React from 'react';
import Loader from './Loader.tsx';
import { DownloadIcon } from './icons/DownloadIcon.tsx';

interface ResultDisplayProps {
  imageUrl: string | null;
  text: string | null;
  isLoading: boolean;
  statusMessage: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, text, isLoading, statusMessage }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <Loader size="lg" />
        <p className="text-lg text-slate-300 animate-pulse">{statusMessage}</p>
        <p className="text-sm text-slate-400">Процесс может занять до минуты.</p>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50 border border-slate-700">
          <img src={imageUrl} alt="Сгенерированная панорама" className="w-full h-full object-contain" />
        </div>
        {text && <p className="text-sm text-slate-400 italic mt-2 text-center max-w-lg">"{text}"</p>}
        <a
          href={imageUrl}
          download="panorama.png"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300/50 transition-colors"
        >
          <DownloadIcon />
          Скачать изображение
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-500 h-full">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      <p className="text-lg">Ваша сгенерированная панорама появится здесь.</p>
      <p className="text-sm">Настройте параметры слева и нажмите "Создать".</p>
    </div>
  );
};

export default ResultDisplay;