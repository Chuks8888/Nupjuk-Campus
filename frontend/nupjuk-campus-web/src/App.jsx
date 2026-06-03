import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import PostDetail from './pages/PostDetail';
import PostForm from './components/board/PostForm';
import Calendar from './pages/Calendar';
import Alerts from './pages/Alerts';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/posts/:postId" element={<PostDetail />} />
            <Route path="/courses/:courseId/posts/new" element={<PostForm />} />
            <Route path="/courses/:courseId/posts/:postId/edit" element={<PostForm />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/alerts" element={<Alerts />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
