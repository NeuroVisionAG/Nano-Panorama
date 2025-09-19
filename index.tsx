
import React, { useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

// --- UTILS ---

interface FileConversionResult {
  base64: string;
  mimeType: string;
}

/**
 * Creates a 16:9 canvas, places the uploaded image in the center (scaled to fit),
 * and returns the result as a base64 PNG string.
 */
const createImageTemplate = (file: File): Promise<FileConversionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Не удалось получить контекст холста'));
      }
      const TARGET_WIDTH = 1280;
      const TARGET_HEIGHT = 720;
      const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const originalWidth = img.width;
      const originalHeight = img.height;
      const originalAspectRatio = originalWidth / originalHeight;
      let drawWidth = originalWidth;
      let drawHeight = originalHeight;
      if (originalAspectRatio > TARGET_ASPECT_RATIO) {
        drawWidth = TARGET_WIDTH;
        drawHeight = TARGET_WIDTH / originalAspectRatio;
      } else {
        drawHeight = TARGET_HEIGHT;
        drawWidth = TARGET_HEIGHT * originalAspectRatio;
      }
      const offsetX = (TARGET_WIDTH - drawWidth) / 2;
      const offsetY = (TARGET_HEIGHT - drawHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      const dataUrl = canvas.toDataURL('image/png');
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        return reject(new Error('Неверный формат Data URL при создании шаблона'));
      }
      resolve({ base64: parts[1], mimeType: 'image/png' });
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
  });
};

// --- SERVICES ---

interface PanoramaResult {
  imageUrl: string | null;
  text: string | null;
}

const generatePanorama = async (
  base64ImageData: string,
  mimeType: string,
  userPrompt: string
): Promise<PanoramaResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API ключ не настроен в переменных окружения.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const fullPrompt = `Ваша задача — заполнить прозрачные области на этом холсте, чтобы создать полную, бесшовную и целостную сцену. Центральное изображение — это отправная точка. Естественно расширьте сцену, сохраняя стиль, освещение, перспективу и детали оригинального изображения. Финальный результат должен быть полноценным изображением с соотношением сторон 16:9. Дополнительно учтите пожелание пользователя: ${userPrompt}`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    let imageUrl: string | null = null;
    let text: string | null = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Bytes = part.inlineData.data;
          const imageMimeType = part.inlineData.mimeType;
          imageUrl = `data:${imageMimeType};base64,${base64Bytes}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }
    if (!imageUrl) {
        throw new Error("Не удалось сгенерировать изображение. Модель не вернула изображение в ответе.");
    }
    return { imageUrl, text };
  } catch (error) {
    console.error("Ошибка при вызове Gemini API:", error);
    if (error instanceof Error && (error.message.includes('API_KEY') || error.message.includes('permission denied'))) {
        throw new Error("Произошла ошибка конфигурации. Проверьте ваш API ключ.");
    }
    throw new Error("Не удалось сгенерировать панораму. Пожалуйста, попробуйте еще раз позже.");
  }
};


// --- ICONS ---

const SparklesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 2 2-4 5.293-5.293a1 1 0 011.414 0z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
    <svg className="w-5 h-5 mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 19">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15h.01M4 12H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-3m-5.5 0v-5.5m0 0h3m-3 0h-3"/>
    </svg>
);

// --- COMPONENTS ---

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
}
const Loader: React.FC<LoaderProps> = ({ size = 'md' }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg className={`animate-spin text-white ${sizeClasses[size]}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  previewUrl: string | null;
}
const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageUpload(file);
  };
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onImageUpload(file);
  };
  const handleDragEvents = (event: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(dragging);
  };
  const triggerFileSelect = () => fileInputRef.current?.click();
  return (
    <div>
      <label htmlFor="image-upload" onDrop={handleDrop} onDragOver={(e) => handleDragEvents(e, true)} onDragEnter={(e) => handleDragEvents(e, true)} onDragLeave={(e) => handleDragEvents(e, false)} className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 bg-slate-800 hover:bg-slate-700/80'}`}>
        {previewUrl ? (<img src={previewUrl} alt="Предпросмотр" className="object-contain w-full h-full rounded-lg p-1" />) : (<div className="flex flex-col items-center justify-center pt-5 pb-6 text-center"><svg className="w-10 h-10 mb-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg><p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Нажмите для загрузки</span> или перетащите</p><p className="text-xs text-slate-500">PNG, JPG, WEBP (рекомендуется)</p></div>)}
        <input ref={fileInputRef} id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
      </label>
      {previewUrl && (<button onClick={triggerFileSelect} className="w-full mt-2 text-sm text-center text-cyan-400 hover:text-cyan-300">Выбрать другое изображение</button>)}
    </div>
  );
};

interface PromptInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}
const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
      <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-slate-300">Опишите, как расширить изображение</label>
      <textarea id="prompt" rows={4} value={value} onChange={onChange} disabled={disabled} className="block p-2.5 w-full text-sm text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-400 transition-colors" placeholder="Например: 'преврати это в эпический фэнтезийный пейзаж с драконами в небе'"></textarea>
    </div>
  );
};

interface ResultDisplayProps {
  imageUrl: string | null;
  text: string | null;
  isLoading: boolean;
  statusMessage: string;
}
const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageUrl, text, isLoading, statusMessage }) => {
  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'panorama.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      // Fallback method
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'panorama.png';
      link.click();
    }
  };

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
        <button onClick={handleDownload} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300/50 transition-colors">
          <DownloadIcon />
          Скачать изображение
        </button>
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


// --- MAIN APP ---

const App: React.FC = () => {
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
      setImagePreview(URL.createObjectURL(file));
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
    if (!base64Image || !mimeType || !prompt) {
      setError('Пожалуйста, загрузите изображение и введите описание.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);
    setStatusMessage('Инициализация модели...');
    try {
      setTimeout(() => setStatusMessage('Анализ изображения и подсказки...'), 1500);
      setTimeout(() => setStatusMessage('Расширение сцены до 16:9...'), 4000);
      const result = await generatePanorama(base64Image, mimeType, prompt);
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

  const isGenerateDisabled = !base64Image || !prompt || isLoading;

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 pb-2">Генератор Панорам Nano Banana</h1>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">Загрузите изображение, и ИИ дорисует его до формата 16:9, создавая потрясающую панораму.</p>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-700 pb-3">1. Настройка</h2>
            <ImageUploader onImageUpload={handleImageUpload} previewUrl={imagePreview} />
            <PromptInput value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
            <button onClick={handleGenerate} disabled={isGenerateDisabled} className={`w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out ${isGenerateDisabled ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 transform hover:scale-105 focus:ring-4 focus:ring-cyan-300/50'}`}>
              {isLoading ? (<><Loader />Генерация...</>) : (<><SparklesIcon />Создать Панораму</>)}
            </button>
            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
          </div>
          <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col">
            <h2 className="text-2xl font-bold text-slate-100 border-b border-slate-700 pb-3 mb-6">2. Результат</h2>
            <div className="flex-grow flex items-center justify-center">
              <ResultDisplay imageUrl={generatedImage} text={generatedText} isLoading={isLoading} statusMessage={statusMessage} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- RENDER APP ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Не удалось найти корневой элемент для монтирования");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
