
import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, previewUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragEvents = (event: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(dragging);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label
        htmlFor="image-upload"
        onDrop={handleDrop}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        className={`
          relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer 
          transition-colors duration-300 ease-in-out
          ${isDragging ? 'border-cyan-400 bg-slate-700/50' : 'border-slate-600 bg-slate-800 hover:bg-slate-700/80'}
        `}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Предпросмотр" className="object-contain w-full h-full rounded-lg p-1" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <svg className="w-10 h-10 mb-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Нажмите для загрузки</span> или перетащите</p>
            <p className="text-xs text-slate-500">PNG, JPG, WEBP (рекомендуется)</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </label>
      {previewUrl && (
         <button onClick={triggerFileSelect} className="w-full mt-2 text-sm text-center text-cyan-400 hover:text-cyan-300">
           Выбрать другое изображение
         </button>
      )}
    </div>
  );
};

export default ImageUploader;
