// src/utils/imageHost.ts
import { BASE_URL, IMAGE_URL_PREFIX } from "../../constant";
/**
 *   http://localhost:8000/chat_images/xxx.jpg -> http://localhost:8090/chat_images/xxx.jpg
 */
export const mapToImageHost = (
  url?: string | null,
): string | undefined => {
  if (!url) return undefined;

  if (url.startsWith(BASE_URL)) {
    return url.replace(BASE_URL + "/", IMAGE_URL_PREFIX);
  }
  return url;
};