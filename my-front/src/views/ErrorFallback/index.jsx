
import { Button, Result } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import './index.scss';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleRetry = () => {
        // 重试加载
        window.location.reload();
    };

    return (
        <div className="error-fallback">
            <div className="error-fallback-content">
                <Result
                    status="error"
                    title="页面加载失败"
                    subTitle={error?.message || "抱歉，页面:" + location.pathname + "出现了问题，请稍后重试。"}
                    extra={[
                        <Button type="primary" key="home" onClick={handleGoHome}>
                            返回首页
                        </Button>,
                        <Button key="retry" onClick={handleRetry}>
                            重试
                        </Button>,
                    ]}
                >
                    <div className="error-details">
                        <p className="error-tip">如果问题持续出现，请联系管理员</p>
                    </div>
                </Result>
            </div>
        </div>
    );
};

export default ErrorFallback;
