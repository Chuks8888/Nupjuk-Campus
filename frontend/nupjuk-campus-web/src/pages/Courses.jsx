import { useState } from 'react';
import { Search } from 'lucide-react';
import CourseCard from '../components/common/CourseCard';
import { mockCourses } from '../data/mockData';
import '../styles/Courses.css';

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = mockCourses.filter(course => 
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

      <div className="course-list">
        {filteredCourses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
        {filteredCourses.length === 0 && (
          <p className="empty-state">No courses found.</p>
        )}
      </div>
    </div>
  );
}