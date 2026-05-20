import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import '../../styles/Cards.css';

export default function CourseCard({ course }) {
  const navigate = useNavigate();

  const prefix = course.course_code.replace(/[0-9]/g, '');

  const getPrefixColor = (str) => {
    const colors = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5856D6'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      className="card" 
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Background color stays inline because it's dynamically generated */}
      <div 
        className="card-icon course-icon" 
        style={{ backgroundColor: getPrefixColor(prefix) }}
      >
        {prefix}
      </div>

      <div className="card-content">
        <h3>{course.course_code}</h3>
        <p>{course.course_name}</p>
      </div>

      <ChevronRight color="#c7c7cc" />
    </div>
  );
}