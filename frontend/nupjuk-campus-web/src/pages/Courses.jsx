import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import CourseCard from '../components/common/CourseCard';
import { getCourses } from '../api/courses';
import '../styles/Courses.css';

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError('');
        setCourses(await getCourses());
      } catch (err) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="courses-container">
      <header className="courses-header">
        <h1>My Courses</h1>
        <p className="semester-text">2026 Spring Semester</p>
        
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <div className="cards-container">
        {isLoading && <p className="empty-state">Loading courses...</p>}
        {error && <p className="empty-state">{error}</p>}
        {!isLoading && !error && filteredCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <p className="empty-state">No courses found.</p>
        )}
      </div>
    </div>
  );
}
