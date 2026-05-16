import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import SearchResult from './pages/SearchResult';
import Archive from './pages/Archive';
import About from './pages/About';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminArticles from './pages/admin/Articles';
import AdminArticleEdit from './pages/admin/ArticleEdit';
import AdminCategories from './pages/admin/Categories';
import AdminTags from './pages/admin/Tags';
import AdminComments from './pages/admin/Comments';
import AdminLinks from './pages/admin/Links';
import AdminSettings from './pages/admin/Settings';
import AdminAbout from './pages/admin/AboutEdit';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/search" element={<SearchResult />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/about" element={<About />} />
        <Route path="/category/:id" element={<Home />} />
        <Route path="/tag/:id" element={<Home />} />
      </Route>
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/articles" element={<AdminArticles />} />
        <Route path="/admin/articles/new" element={<AdminArticleEdit />} />
        <Route path="/admin/articles/:id/edit" element={<AdminArticleEdit />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/tags" element={<AdminTags />} />
        <Route path="/admin/comments" element={<AdminComments />} />
        <Route path="/admin/links" element={<AdminLinks />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/about" element={<AdminAbout />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
