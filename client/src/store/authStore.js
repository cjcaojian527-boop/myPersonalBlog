import { create } from 'zustand';

// 页面加载时：从 localStorage 临时读取 token，读完立即删除
// 这样 F12 打开时 localStorage 里看不到 token
const _savedUser = localStorage.getItem('_auth_user');
const _savedToken = localStorage.getItem('_auth_token');
if (_savedToken) {
  localStorage.removeItem('_auth_user');
  localStorage.removeItem('_auth_token');
}

const useAuthStore = create((set, get) => ({
  user: _savedUser ? JSON.parse(_savedUser) : null,
  token: _savedToken || '',

  login: (user, token) => {
    set({ user, token });
  },

  logout: () => {
    set({ user: null, token: '' });
  },

  isAdmin: () => get().user?.role === 'admin',
}));

// 页面刷新或关闭前：临时保存到 localStorage，供下次加载时恢复
window.addEventListener('beforeunload', () => {
  const { user, token } = useAuthStore.getState();
  if (token) {
    localStorage.setItem('_auth_user', JSON.stringify(user));
    localStorage.setItem('_auth_token', token);
  }
});

export default useAuthStore;