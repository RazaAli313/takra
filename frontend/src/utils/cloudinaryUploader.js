/**
 * Upload an image via the backend Cloudinary uploader.
 * Uses POST /api/user/upload-profile-image for profile images.
 */
import { API_BASE_URL } from './api';

/**
 * Upload a profile image. Returns the Cloudinary image URL on success.
 * @param {File} file - Image file (JPG, PNG, WEBP; max 10MB)
 * @returns {Promise<string>} - The secure URL of the uploaded image
 * @throws {Error} - On upload or validation failure
 */
export async function uploadProfileImage(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('A valid image file is required');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/user/upload-profile-image`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Upload failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.url) {
    throw new Error('Server did not return an image URL');
  }
  return data.url;
}
