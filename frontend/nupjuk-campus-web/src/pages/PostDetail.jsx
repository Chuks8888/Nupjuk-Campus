import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import {
  getPostDetail,
  createComment,
  deletePost,
  updateComment,
  deleteComment,
} from '../api/board';
import CommentCard from '../components/board/CommentCard';

export default function PostDetail() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this post? This action cannot be undone.'
    );

    if (isConfirmed) {
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

      const newCommentData = addedComment.comment || addedComment;

      setPost((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newCommentData],
      }));
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
    const isConfirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!isConfirmed) return;

    try {
      await deleteComment(commentId);

      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== commentId),
      }));
    } catch (error) {
      console.error('Failed to delete comment', error);
      alert('Failed to delete comment.');
    }
  };

  if (isLoading) return <div>Loading post...</div>;
  if (!post) return <div>Post not found.</div>;

  const isAuthor = post.author?.id === currentUserId;
  return (
    <div
      className="post-detail-container"
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}
    >
      <button
        onClick={() => navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={20} /> Back to Course
      </button>

      <article
        className="post-content"
        style={{ borderBottom: '1px solid #eee', paddingBottom: '2rem', marginBottom: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span
              style={{
                background: '#f0f0f0',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.875rem',
              }}
            >
              {post.category}
            </span>
            <span style={{ color: '#666' }}>
              By {post.author?.displayName || post.author?.kaistEmail || 'Unknown'}
            </span>
          </div>

          {/* Action Buttons for Edit and Delete */}
          {isAuthor && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate(`/courses/${courseId}/posts/${postId}/edit`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem',
                  background: 'none',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#333',
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={handleDeletePost}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem',
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#d32f2f',
                }}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
        <h1 style={{ marginTop: '1rem' }}>{post.title}</h1>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginTop: '1.5rem' }}>
          {post.body}
        </p>

        {/* Upvote button removed from here */}
      </article>

      <section className="comments-section">
        <h3>
          <MessageSquare
            size={20}
            style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}
          />
          {post.comments?.length || 0} Comments
        </h3>

        <form onSubmit={handleCommentSubmit} style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginBottom: '0.5rem',
              resize: 'vertical',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
              background: '#0056b3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Post Comment
          </button>
        </form>

        <div
          className="comments-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
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
