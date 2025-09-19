
import React from 'react';

interface PromptInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div>
      <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-slate-300">
        Опишите, как расширить изображение
      </label>
      <textarea
        id="prompt"
        rows={4}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="block p-2.5 w-full text-sm text-slate-200 bg-slate-700/50 rounded-lg border border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 placeholder-slate-400 transition-colors"
        placeholder="Например: 'преврати это в эпический фэнтезийный пейзаж с драконами в небе'"
      ></textarea>
    </div>
  );
};

export default PromptInput;
