import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const getBackgroundGradient = (code) => {
    if ([0, 1].includes(code)) return 'linear-gradient(to right, #fceabb, #f8b500)'; // sunny
    if ([2, 3].includes(code)) return 'linear-gradient(to right, #bdc3c7, #2c3e50)'; // cloudy
    if ([61, 63, 65, 80, 81, 82].includes(code)) return 'linear-gradient(to right, #4facfe, #00f2fe)'; // rain
    if ([71, 73, 75].includes(code)) return 'linear-gradient(to right, #83a4d4, #b6fbff)'; // snow
    return 'linear-gradient(to right, #89f7fe, #66a6ff)'; // default
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('We cannot tell where you are located, no weather information.');
      setLoading(false);
    } else {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&hourly=relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto`
            );
            const weatherJson = await weatherRes.json();

            const apiKey = process.env.REACT_APP_GEOCODE_API_KEY;
            const geoRes = await fetch(
              `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=${apiKey}`
            );
            const geoJson = await geoRes.json();

            const city = geoJson.address.city || geoJson.address.town || geoJson.address.village || 'Unknown City';
            const country = geoJson.address.country || 'Unknown Country';

            setLocationName({ city, country });
            document.title = `Weather in ${city}`;

            const now = new Date();
            const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
              now.getDate()
            ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
              2,
              '0'
            )} ${now.toLocaleDateString('en-CA', { weekday: 'long' })}`;

            setWeatherData({
              temperatureC: weatherJson.current_weather.temperature,
              temperatureF: (weatherJson.current_weather.temperature * 9) / 5 + 32,
              weatherCode: weatherJson.current_weather.weathercode,
              windSpeed: weatherJson.current_weather.windspeed,
              windDirection: weatherJson.current_weather.winddirection,
              maxTemp: weatherJson.daily.temperature_2m_max[0],
              minTemp: weatherJson.daily.temperature_2m_min[0],
              precipitation: weatherJson.daily.precipitation_sum[0],
              humidity: weatherJson.hourly.relative_humidity_2m[0],
              time: formattedTime,
              timezone: weatherJson.timezone,
            });

            const days = weatherJson.daily.time.map((dateStr, i) => {
              const dateObj = new Date(dateStr);
              const day = dateObj.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
              return {
                date: day,
                maxC: weatherJson.daily.temperature_2m_max[i],
                maxF: (weatherJson.daily.temperature_2m_max[i] * 9) / 5 + 32,
                minC: weatherJson.daily.temperature_2m_min[i],
                minF: (weatherJson.daily.temperature_2m_min[i] * 9) / 5 + 32,
                code: weatherJson.daily.weathercode[i],
              };
            });
            setForecast(days);
          } catch (e) {
            console.error(e);
            setError('We cannot tell where you are located, no weather information.');
          } finally {
            setLoading(false);
          }
        },
        () => {
          setError('We cannot tell where you are located, no weather information.');
          setLoading(false);
        }
      );
    }
  }, []);

  const getWeatherDescription = (code) => {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      80: 'Rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
    };
    return descriptions[code] || 'Unknown';
  };

  const getWeatherIcon = (code) => {
    const icons = {
      0: '☀️',
      1: '🌤️',
      2: '⛅',
      3: '☁️',
      45: '🌫️',
      48: '🌫️',
      51: '🌦️',
      53: '🌧️',
      55: '🌧️',
      61: '🌧️',
      63: '🌧️',
      65: '🌧️',
      71: '❄️',
      73: '❄️',
      75: '❄️',
      80: '🌧️',
      81: '🌧️',
      82: '⛈️',
    };
    return icons[code] || '❔';
  };

  const getCompassDirection = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return dirs[index];
  };

  const getWindArrow = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return '⬆️';
    if (deg >= 22.5 && deg < 67.5) return '↗️';
    if (deg >= 67.5 && deg < 112.5) return '➡️';
    if (deg >= 112.5 && deg < 157.5) return '↘️';
    if (deg >= 157.5 && deg < 202.5) return '⬇️';
    if (deg >= 202.5 && deg < 247.5) return '↙️';
    if (deg >= 247.5 && deg < 292.5) return '⬅️';
    if (deg >= 292.5 && deg < 337.5) return '↖️';
  };

  return (
    <div
      className={`app-container ${darkMode ? 'dark' : ''}`}
      style={{
        backgroundImage: weatherData ? getBackgroundGradient(weatherData.weatherCode) : undefined,
      }}
    >
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div className="card">
        <h1 className="title">Weather App</h1>
        {loading ? (
          <p className="status loading">Loading...</p>
        ) : error ? (
          <p className="status error">{error}</p>
        ) : (
          <>
            <p className="status location">
              Location: {locationName.city}, {locationName.country}
            </p>
            <p className="status time">
              Time: {weatherData.time} ({weatherData.timezone})
            </p>
            <p className="status temp">
              Current Temperature: {weatherData.temperatureC}°C / {weatherData.temperatureF.toFixed(1)}°F
            </p>
            <p className="status weather">
              <span className="icon">{getWeatherIcon(weatherData.weatherCode)}</span>
              Weather: {getWeatherDescription(weatherData.weatherCode)}
            </p>
            <p className="status details">
              High: {weatherData.maxTemp}°C / {(weatherData.maxTemp * 9 / 5 + 32).toFixed(1)}°F<br />
              Low: {weatherData.minTemp}°C / {(weatherData.minTemp * 9 / 5 + 32).toFixed(1)}°F
            </p>
            <p className="status details">
              Precipitation: {weatherData.precipitation} mm<br />
              Humidity: {weatherData.humidity}%<br />
              Wind: {weatherData.windSpeed} km/h, {getCompassDirection(weatherData.windDirection)}{' '}
              {getWindArrow(weatherData.windDirection)}
            </p>

            <div className="forecast">
              {forecast.map((day, idx) => (
                <div key={idx} className="forecast-day">
                  <strong>{day.date}</strong><br />
                  <span className="icon">{getWeatherIcon(day.code)}</span> {getWeatherDescription(day.code)}<br />
                  High: {day.maxC}°C / {day.maxF.toFixed(1)}°F<br />
                  Low: {day.minC}°C / {day.minF.toFixed(1)}°F
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
