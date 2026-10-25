
import { Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import './index.scss';

const NotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // console.log(location)
    const TouristsToken = useAuthStore(state => state.TouristsToken);
    const handleGoHome = () => {
        if (TouristsToken) {
            window.location.href = window.location.origin + '/admin' + '?_back' + Date.now();
        } else {
            window.location.href = window.location.origin + '/blog' + '?_back' + Date.now();
        }

    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="not-found">
            <div className="not-found-content">
                {/* 404 大数字 */}
                <div className="not-found-number">404</div>

                <h2 className="not-found-title">迷路了？</h2>
                <p className="not-found-desc">【{location.pathname}】页面不存在，或者已经被删掉了。</p>
                <div className="not-found-btns">
                    <Button type="primary" onClick={handleGoHome}>回首页</Button>
                    <Button onClick={handleBack}>返回</Button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
