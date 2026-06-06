import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, File, MessageSquare, Paperclip, Trash2, Edit2 } from 'lucide-react';
import {
  getPostDetail,
  createComment,
  deletePost,
  updateComment,
  deleteComment,
} from '../api/board';
import { deleteAttachment, getPostAttachments } from '../api/attachments';
import CommentCard from '../components/board/CommentCard';
import '../styles/Board.css';

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!size) return '';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unitIndex;

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function PostDetail() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [attachmentError, setAttachmentError] = useState('');

  const userString = localStorage.getItem('currentUser');
  const user = userString ? JSON.parse(userString) : null;
  const currentUserId = user?.id;

  useEffect(() => {
    loadPost();
  }, [courseId, postId]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const [data, postAttachments] = await Promise.all([
        getPostDetail(courseId, postId),
        getPostAttachments(postId),
      ]);
      setPost(data);
      setAttachments(postAttachments);
      setAttachmentError('');
    } catch (error) {
      console.error('Failed to load post', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Remove this attachment from the post?')) return;

    try {
      await deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId));
    } catch (error) {
      console.error('Failed to delete attachment', error);
      setAttachmentError(error.message || 'Failed to delete attachment.');
    }
  };

  const handleDeletePost = async () => {
    if (
      window.confirm('Are you sure you want to delete this post? This action cannot be undone.')
    ) {
      try {
        await deletePost(postId);
        navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } });
      } catch (error) {
        console.error('Failed to delete post', error);
        alert(error.message || 'Failed to delete the post.');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addedComment = await createComment(courseId, postId, newComment);
      let newCommentData = addedComment.comment || addedComment;

      if (!newCommentData.author && user) {
        newCommentData.author = {
          id: user.id,
          displayName: user.displayName || user.name,
          kaistEmail: user.kaistEmail,
        };
      }

      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), newCommentData] }));
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleUpdateComment = async (commentId, updatedBody) => {
    try {
      await updateComment(commentId, updatedBody);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => (c.id === commentId ? { ...c, body: updatedBody } : c)),
      }));
    } catch (error) {
      console.error('Failed to update comment', error);
      alert('Failed to update comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setPost((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }));
    } catch (error) {
      console.error('Failed to delete comment', error);
      alert('Failed to delete comment.');
    }
  };

  if (isLoading) return <div className="post-container">Loading post...</div>;
  if (!post) return <div className="post-container">Post not found.</div>;

  const isAuthor = post.author?.id === currentUserId;

  return (
    <div className="post-container">
      <button
        onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } })}
        className="back-button"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={20} /> Back to Course
      </button>

      <article className="post-content-card">
        <div className="post-meta-header">
          <div>
            <span className="post-category-badge">{post.category}</span>
            <span className="post-author">
              By {post.author?.displayName || post.author?.kaistEmail || 'Unknown'}
            </span>
          </div>

          {isAuthor && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => navigate(`/courses/${courseId}/posts/${postId}/edit`)}
                className="btn-secondary"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button onClick={handleDeletePost} className="btn-danger">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>

        <h1>{post.title}</h1>
        <p className="post-body">{post.body}</p>

        <section className="attachments-panel" aria-labelledby="post-attachments-heading">
          <div className="attachments-header">
            <h3 id="post-attachments-heading">
              <Paperclip size={18} /> Attachments
            </h3>
            <span>{attachments.length}</span>
          </div>

          {attachmentError && <div className="board-error-banner">{attachmentError}</div>}

          {attachments.length > 0 ? (
            <div className="attachment-list">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-item">
                  <div className="attachment-file-meta">
                    <File size={18} />
                    <div>
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="attachment-name"
                      >
                        {attachment.file_name || 'Attachment'}
                      </a>
                      <span className="attachment-detail">
                        {[attachment.file_extension, formatFileSize(attachment.file_size)]
                          .filter(Boolean)
                          .join(' | ')}
                      </span>
                    </div>
                  </div>
                  <div className="attachment-actions">
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="icon-link-button"
                      aria-label={`Download ${attachment.file_name || 'attachment'}`}
                    >
                      <Download size={16} />
                    </a>
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="icon-link-button danger"
                        aria-label={`Delete ${attachment.file_name || 'attachment'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="attachments-empty">No attachments added.</p>
          )}
        </section>
      </article>

      <section className="comments-section">
        <h3>
          <MessageSquare size={20} /> {post.comments?.length || 0} Comments
        </h3>

        {/* Form wrapped in the new card class */}
        <form onSubmit={handleCommentSubmit} className="comment-form-card">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="board-input comment-textarea"
          />
          <div className="comment-form-actions">
            <button type="submit" className="btn-primary" disabled={!newComment.trim()}>
              Post Comment
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {post.comments?.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
