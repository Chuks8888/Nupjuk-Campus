// src/components/courses/CourseBoard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Paperclip, Search, Plus } from 'lucide-react';
import DetailCard from '../common/DetailCard';

const CATEGORIES = ['GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT'];

export default function CourseBoard({ posts, courseId }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts =
    posts?.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }) || [];

  return (
    <div className="course-board-container">
      <div
        className="board-controls"
        style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}
      >
        <div
          className="search-bar"
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '0.5rem',
          }}
        >
          <Search size={18} style={{ marginRight: '0.5rem' }} />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%' }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={() => navigate(`/courses/${courseId}/posts/new`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} /> New Post
        </button>
      </div>

      {filteredPosts.length === 0 ? (
        <p className="empty-state">No posts found matching your criteria.</p>
      ) : (
        <div className="detail-list-container">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate(`/courses/${courseId}/posts/${post.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <DetailCard
                category={post.category}
                author={post.author_name}
                title={post.title}
                description={post.body.substring(0, 100) + (post.body.length > 100 ? '...' : '')}
                metaLeft={
                  <>
                    <MessageSquare size={14} /> {post.comment_count}
                  </>
                }
                metaRight={
                  <>
                    <Paperclip size={14} /> {post.attachment_count}
                  </>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
