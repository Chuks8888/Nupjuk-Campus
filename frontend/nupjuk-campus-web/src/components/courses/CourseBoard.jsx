import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Paperclip, Search, Plus } from 'lucide-react';
import DetailCard from '../common/DetailCard';
import '../../styles/Board.css';
import '../../styles/Courses.css'; /* Inherit the search-container styles */

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
      <div className="board-controls">
        {/* MATCHES COURSES.JSX SEARCH BAR EXACTLY */}
        <div className="search-container" style={{ flex: 1, margin: 0 }}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="board-input"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button onClick={() => navigate(`/courses/${courseId}/posts/new`)} className="btn-primary">
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
              className="clickable-card"
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
