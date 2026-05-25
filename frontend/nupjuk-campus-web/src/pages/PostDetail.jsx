import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import {
  getPostDetail,
  createComment,
  deletePost,
  updateComment,
  deleteComment,
} from '../api/board';
import CommentCard from '../components/board/CommentCard';
import '../styles/Board.css';

export default function PostDetail() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userString = localStorage.getItem('currentUser');
  const user = userString ? JSON.parse(userString) : null;
  const currentUserId = user?.id;

  useEffect(() => {
    loadPost();
  }, [courseId, postId]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      const data = await getPostDetail(courseId, postId);
      setPost(data);
    } catch (error) {
      console.error('Failed to load post', error);
    } finally {
      setIsLoading(false);
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
