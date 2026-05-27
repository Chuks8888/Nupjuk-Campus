import { apiRequest } from './http';

// Post CRUD
export async function createPost(courseId, postData) {
  // Routes to coursePosts.ts -> POST /
  return await apiRequest(`/courses/${courseId}/posts`, {
    method: 'POST',
    body: postData,
  });
}

export async function getPostDetail(courseId, postId) {
  // Routes to coursePosts.ts -> GET /:postId
  return await apiRequest(`/courses/${courseId}/posts/${postId}`);
}

export async function updatePost(postId, postData) {
  // Routes to boards.ts -> PATCH /posts/:postId
  return await apiRequest(`/boards/posts/${postId}`, {
    method: 'PATCH',
    body: postData,
  });
}

export async function deletePost(postId) {
  // Routes to boards.ts -> DELETE /posts/:postId
  return await apiRequest(`/boards/posts/${postId}`, {
    method: 'DELETE',
  });
}

// Comment CRUD
export async function createComment(courseId, postId, body) {
  // Routes to coursePosts.ts -> POST /:postId/comments
  return await apiRequest(`/courses/${courseId}/posts/${postId}/comments`, {
    method: 'POST',
    body: { body },
  });
}

export async function updateComment(commentId, body) {
  // Routes to comments.ts -> PATCH /:commentId
  return await apiRequest(`/comments/${commentId}`, {
    method: 'PATCH',
    body: { body },
  });
}

export async function deleteComment(commentId) {
  // Routes to comments.ts -> DELETE /:commentId
  return await apiRequest(`/comments/${commentId}`, {
    method: 'DELETE',
  });
}
