import { useState, useEffect } from 'react';
import './scss/DateTimeWeather';

// 天气代码映射为图标
const weatherIcons = {
    '113': '☀️',
    '116': '⛅',
    '119': '☁️',
    '122': '☁️',
    '143': '🌫️',
    '176': '🌦️',
    '179': '🌨️',
    '182': '🌨️',
    '185': '🌨️',
    '200': '⛈️',
    '227': '🌨️',
    '230': '❄️',
    '248': '🌫️',
    '260': '🌫️',
    '263': '🌦️',
    '266': '🌧️',
    '281': '🌨️',
    '284': '🌨️',
    '293': '🌦️',
    '296': '🌧️',
    '299': '🌧️',
    '302': '🌧️',
    '305': '🌧️',
    '308': '🌧️',
    '311': '🌨️',
    '314': '🌨️',
    '317': '🌨️',
    '320': '🌨️',
    '323': '🌨️',
    '326': '🌨️',
    '329': '❄️',
    '332': '❄️',
    '335': '❄️',
    '338': '❄️',
    '350': '🌨️',
    '353': '🌦️',
    '356': '🌧️',
    '359': '🌧️',
    '362': '🌨️',
    '365': '🌨️',
    '368': '🌨️',
    '371': '❄️',
    '374': '🌨️',
    '377': '🌨️',
    '386': '⛈️',
    '389': '⛈️',
    '392': '⛈️',
    '395': '❄️',
};

const DateTimeWeather = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    // 更新时间
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // 获取天气
    useEffect(() => {
        const getWeather = async () => {
            try {
                const res = await fetch('https://wttr.in/?format=j1&lang=zh');
                const data = await res.json();
                setWeather({
                    temp: data.current_condition[0].temp_C,
                    desc: data.current_condition[0].lang_zh[0].value,
                    code: data.current_condition[0].weatherCode,
                    humidity: data.current_condition[0].humidity,
                    windSpeed: data.current_condition[0].windspeedKmph,
                });
            } catch (error) {
                console.error('天气获取失败', error);
                setWeather({
                    temp: '--',
                    desc: '获取失败',
                    code: '113',
                    humidity: '--',
                    windSpeed: '--',
                });
            } finally {
                setLoading(false);
            }
        };

        getWeather();
    }, []);

    // 格式化日期
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekDay = weekDays[date.getDay()];
        return `${year}年${month}月${day}日 ${weekDay}`;
    };

    // 格式化时间
    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="datetime-weather">
            {/* 日期时间 */}
            <div className="datetime-section">
                <div className="datetime-date">{formatDate(currentTime)}</div>
                <div className="datetime-time">{formatTime(currentTime)}</div>
            </div>

            {/* 分割线 */}
            <div className="datetime-divider"></div>

            {/* 天气 */}
            <div className="weather-section">
                {loading ? (
                    <div className="weather-loading">加载中...</div>
                ) : (
                    <>
                        <div className="weather-main">
                            <span className="weather-icon">{weatherIcons[weather.code] || '🌤️'}</span>
                            <span className="weather-temp">{weather.temp}°C</span>
                        </div>
                        <div className="weather-desc">{weather.desc}</div>
                        <div className="weather-details">
                            <span>💧 {weather.humidity}%</span>
                            <span>💨 {weather.windSpeed}km/h</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DateTimeWeather;
