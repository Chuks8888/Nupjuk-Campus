import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { createPost, updatePost, getPostDetail } from '../../api/board';

const ALLOWED_CATEGORIES = ['GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT'];

export default function PostForm() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(postId);

  const [formData, setFormData] = useState({
    title: '',
    category: 'GENERAL',
    body: '',
  });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchExistingPost = async () => {
        try {
          const data = await getPostDetail(courseId, postId);
          setFormData({
            title: data.title,
            category: data.category,
            body: data.body,
          });
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

  if (isLoading) return <div>Loading post data...</div>;

  return (
    <div
      className="post-form-container"
      style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}
    >
      <button
        onClick={() =>
          isEditing
            ? navigate(`/courses/${courseId}/posts/${postId}`)
            : navigate(`/courses/${courseId}`, { state: { activeTab: 'board' } })
        }
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
        <ArrowLeft size={20} /> Back
      </button>

      <h2>{isEditing ? 'Edit Post' : 'Create New Post'}</h2>

      {error && (
        <div
          style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee' }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 2 }}>
            <label
              htmlFor="title"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
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
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              htmlFor="category"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            >
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="body"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Details
          </label>
          <textarea
            id="body"
            name="body"
            required
            value={formData.body}
            onChange={handleChange}
            placeholder="Write the details of your post here..."
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <X size={18} /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#0056b3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Save size={18} /> {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
