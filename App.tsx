
import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader.tsx';
import PromptInput from './components/PromptInput.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import Loader from './components/Loader.tsx';
import { SparklesIcon } from './components/icons/SparklesIcon.tsx';
import { generatePanorama } from './services/geminiService.ts';
import { createImageTemplate } from './utils/fileUtils.ts';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('красивый солнечный день с пушистыми облаками');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setGeneratedImage(null);
      setGeneratedText(null);
      
      // Показываем пользователю оригинальное изображение
      setImagePreview(URL.createObjectURL(file));

      // Создаем шаблон 16:9 для отправки в модель
      const { base64, mimeType } = await createImageTemplate(file);
      setBase64Image(base64);
      setMimeType(mimeType);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Не удалось обработать изображение.';
      setError(errorMessage);
      console.error(err);
    }
  }, []);
  
  const handleGenerate = async () => {
    if (!base64Image || !mimeType || !prompt || !apiKey) {
      setError('Пожалуйста, загрузите изображение, введите описание и укажите ваш API-ключ.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);
    setStatusMessage('Инициализация модели Nano Banana...');

    try {
      setTimeout(() => setStatusMessage('Анализ изображения и подсказки...'), 1500);
      setTimeout(() => setStatusMessage('Расширение сцены до 16:9...'), 4000);
      
      const result = await generatePanorama(base64Image, mimeType, prompt, apiKey);
      
      setGeneratedImage(result.imageUrl);
      setGeneratedText(result.text);
      setStatusMessage('Панорама успешно создана!');
    } catch (err) {
      let errorMessage = 'Произошла неизвестная ошибка.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const isGenerateDisabled = !base64Image || !prompt || !apiKey || isLoading;

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 pb-2">
            Генератор Панорам Nano Banana
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Загрузите изображение, и ИИ дорисует его до формата 16:9, создавая потрясающую панораму.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-700 pb-3">1. Настройка</h2>
            <ImageUploader onImageUpload={handleImageUpload} previewUrl={imagePreview} />
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
            
            <div>
              <label htmlFor="api-key" className="block mb-2 text-sm font-medium text-slate-300">
                Ваш Gemini API Ключ
              </label>
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isLoading}
                className="block p-2.5 w-full text-sm text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-400 transition-colors"
                placeholder="Вставьте ваш API ключ сюда"
              />
              <p className="text-xs text-slate-500 mt-1">
                Ключ не сохраняется. Его можно получить в <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className={`
                w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold rounded-lg shadow-md
                transition-all duration-300 ease-in-out
                ${isGenerateDisabled
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 transform hover:scale-105 focus:ring-4 focus:ring-cyan-300/50'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader />
                  Генерация...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Создать Панораму
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-700 pb-3 mb-6">2. Результат</h2>
            <div className="flex-grow flex items-center justify-center">
              <ResultDisplay
                imageUrl={generatedImage}
                text={generatedText}
                isLoading={isLoading}
                statusMessage={statusMessage}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;