
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

interface PanoramaResult {
  imageUrl: string | null;
  text: string | null;
}

export const generatePanorama = async (
  base64ImageData: string,
  mimeType: string,
  userPrompt: string,
  apiKey: string
): Promise<PanoramaResult> => {
  if (!apiKey) {
    throw new Error("API ключ не предоставлен.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

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
