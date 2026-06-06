import { API_BASE_URL, ApiError, apiRequest, getAuthToken } from './http';

function normalizeAttachment(attachment) {
  return {
    id: String(attachment.id),
    raw_id: attachment.id,
    post_id: attachment.postId ?? attachment.post_id,
    file_name: attachment.fileName ?? attachment.file_name,
    file_url: attachment.fileUrl ?? attachment.file_url,
    file_size: attachment.fileSize ?? attachment.file_size,
    file_extension: attachment.fileExtension ?? attachment.file_extension,
    storage_backend: attachment.storageBackend ?? attachment.storage_backend,
    uploaded_at: attachment.uploadedAt ?? attachment.uploaded_at,
    expires_at: attachment.expiresAt ?? attachment.expires_at,
  };
}

async function uploadRequest(path, formData, token = getAuthToken()) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Session expired or unauthorized. Logging out...');

      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }

    const message =
      typeof payload === 'object' && payload?.error ? payload.error : response.statusText;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export async function uploadPostAttachment(postId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const attachment = await uploadRequest(`/attachments/posts/${postId}`, formData);
  return normalizeAttachment(attachment);
}

export async function getPostAttachments(postId) {
  const attachments = await apiRequest(`/attachments/posts/${postId}`);
  return attachments.map(normalizeAttachment);
}

export async function deleteAttachment(attachmentId) {
  return await apiRequest(`/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}
