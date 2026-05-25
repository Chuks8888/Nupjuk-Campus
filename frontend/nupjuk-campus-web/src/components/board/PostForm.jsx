import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { createPost, updatePost, getPostDetail } from '../../api/board';
import '../../styles/Board.css';

const ALLOWED_CATEGORIES = ['GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT'];

export default function PostForm() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(postId);

  const [formData, setFormData] = useState({ title: '', category: 'GENERAL', body: '' });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchExistingPost = async () => {
        try {
          const data = await getPostDetail(courseId, postId);
          setFormData({ title: data.title, category: data.category, body: data.body });
        } catch (err) {
          setError('Failed to load the post for editing.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchExistingPost();
    }
  }, [courseId, postId, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await updatePost(postId, formData);
        navigate(`/courses/${courseId}/posts/${postId}`);
      } else {
        const newPost = await createPost(courseId, formData);
        const createdId = newPost.post?.id || newPost.id;
        navigate(`/courses/${courseId}/posts/${createdId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save the post. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="post-container">Loading post data...</div>;

  return (
    <div className="post-container">
      <button
        onClick={() =>
          isEditing
            ? navigate(`/courses/${courseId}/posts/${postId}`)
            : navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } })
        }
        className="back-button board-back-btn"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="post-content-card">
        <h2 className="board-page-title">{isEditing ? 'Edit Post' : 'Create New Post'}</h2>

        {error && <div className="board-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="board-form-layout">
          <div className="board-form-row">
            <div className="board-form-group title-group">
              <label htmlFor="title" className="board-form-label">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Keep it clear and concise"
                className="board-input"
              />
            </div>

            <div className="board-form-group category-group">
              <label htmlFor="category" className="board-form-label">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="board-input"
              >
                {ALLOWED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="board-form-group">
            <label htmlFor="body" className="board-form-label">
              Details
            </label>
            <textarea
              id="body"
              name="body"
              required
              value={formData.body}
              onChange={handleChange}
              placeholder="Write the details of your post here..."
              className="board-input board-textarea-large"
            />
          </div>

          <div className="board-form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              <X size={18} /> Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              <Save size={18} /> {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
