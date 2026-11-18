const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = document.querySelector("#search-button");
const feedback = document.querySelector("#search-feedback");
const weatherCard = document.querySelector("#weather-card");
const weatherContent = document.querySelector("#weather-content");
const weatherTime = document.querySelector("#weather-time");
const cardFooterText = document.querySelector("#card-footer-text");

let activeController = null;

const weatherConditions = {
  0: { label: "Clear", kind: "clear" },
  1: { label: "Mainly clear", kind: "clear" },
  2: { label: "Partly cloudy", kind: "cloud" },
  3: { label: "Overcast", kind: "cloud" },
  45: { label: "Fog", kind: "fog" },
  48: { label: "Depositing rime fog", kind: "fog" },
  51: { label: "Light drizzle", kind: "rain" },
  53: { label: "Moderate drizzle", kind: "rain" },
  55: { label: "Dense drizzle", kind: "rain" },
  56: { label: "Light freezing drizzle", kind: "rain" },
  57: { label: "Dense freezing drizzle", kind: "rain" },
  61: { label: "Slight rain", kind: "rain" },
  63: { label: "Moderate rain", kind: "rain" },
  65: { label: "Heavy rain", kind: "rain" },
  66: { label: "Light freezing rain", kind: "rain" },
  67: { label: "Heavy freezing rain", kind: "rain" },
  71: { label: "Slight snowfall", kind: "snow" },
  73: { label: "Moderate snowfall", kind: "snow" },
  75: { label: "Heavy snowfall", kind: "snow" },
  77: { label: "Snow grains", kind: "snow" },
  80: { label: "Slight rain showers", kind: "rain" },
  81: { label: "Moderate rain showers", kind: "rain" },
  82: { label: "Violent rain showers", kind: "rain" },
  85: { label: "Slight snow showers", kind: "snow" },
  86: { label: "Heavy snow showers", kind: "snow" },
  95: { label: "Thunderstorm", kind: "storm" },
  96: { label: "Thunderstorm with slight hail", kind: "storm" },
  97: { label: "Heavy thunderstorm", kind: "storm" },
  99: { label: "Thunderstorm with heavy hail", kind: "storm" },
};

function weatherIcon(kind) {
  const icons = {
    clear: '<circle cx="50" cy="50" r="21" fill="currentColor"/><path d="M50 8v10m0 64v10M8 50h10m64 0h10M20.3 20.3l7.1 7.1m45.2 45.2 7.1 7.1m0-59.4-7.1 7.1m-45.2 45.2-7.1 7.1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    cloud: '<path d="M27 68h43a16 16 0 0 0 1-32 24 24 0 0 0-46 7A14 14 0 0 0 27 68Z" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
    fog: '<path d="M31 59h36a13 13 0 0 0 1-26 20 20 0 0 0-38 6A11 11 0 0 0 31 59Z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.5"/><path d="M23 70h48M30 79h42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    rain: '<path d="M27 56h43a15 15 0 0 0 1-30 22 22 0 0 0-43 6A13 13 0 0 0 27 56Z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.7"/><path d="m38 65-4 10m22-10-4 10m22-10-4 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    snow: '<path d="M27 54h43a15 15 0 0 0 1-30 22 22 0 0 0-43 6A13 13 0 0 0 27 54Z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.7"/><path d="M37 66v11m-4-7 8 4m0-8-8 4m26-4v11m-4-7 8 4m0-8-8 4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
    storm: '<path d="M27 57h43a15 15 0 0 0 1-30 22 22 0 0 0-43 6A13 13 0 0 0 27 57Z" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.7"/><path d="m51 59-9 14h9l-3 13 14-19h-10l5-8" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  };

  return `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">${icons[kind] || icons.cloud}</svg>`;
}

function setLoading(isLoading) {
  weatherCard.setAttribute("aria-busy", String(isLoading));
  weatherCard.classList.toggle("is-loading", isLoading);
  searchButton.setAttribute("aria-label", isLoading ? "Search for another city" : "Search weather");
}

function showLoading(city) {
  feedback.textContent = "";
  weatherTime.textContent = "";
  cardFooterText.textContent = "Contacting weather services…";
  weatherContent.innerHTML = `
    <div class="loading-state" role="status">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-title">Finding ${escapeHtml(city)}</p>
      <p class="loading-copy">Looking up the city and checking its latest conditions.</p>
    </div>`;
  setLoading(true);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function showError(title, message) {
  weatherContent.innerHTML = `
    <div class="error-state">
      <span class="error-mark" aria-hidden="true">!</span>
      <p class="error-title">${escapeHtml(title)}</p>
      <p class="error-copy">${escapeHtml(message)}</p>
    </div>`;
  cardFooterText.textContent = "Try another city whenever you’re ready";
  weatherTime.textContent = "";
  setLoading(false);
}

function formatCurrentTime(timeZone, timestamp, utcOffsetSeconds) {
  try {
    const parsedAsUtc = Date.parse(`${timestamp}Z`);
    const currentTime = Number.isFinite(parsedAsUtc) && Number.isFinite(utcOffsetSeconds)
      ? new Date(parsedAsUtc - utcOffsetSeconds * 1000)
      : new Date();
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(currentTime);
  } catch {
    return "";
  }
}

function renderWeather(place, forecast) {
  const { current, current_units: units = {} } = forecast;
  const condition = weatherConditions[current.weather_code] || { label: "Current conditions", kind: "cloud" };
  const area = [place.admin1, place.country].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ");
  const temperature = Math.round(current.temperature_2m);
  const humidity = Math.round(current.relative_humidity_2m);
  const wind = Math.round(current.wind_speed_10m);
  const temperatureUnit = units.temperature_2m || "°C";
  const humidityUnit = units.relative_humidity_2m || "%";
  const windUnit = units.wind_speed_10m || "km/h";

  weatherContent.innerHTML = `
    <div class="weather-result">
      <h2 class="location-heading">
        <span class="location-pin" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="M16.2 8.3c0 4.3-6.2 9-6.2 9s-6.2-4.7-6.2-9a6.2 6.2 0 1 1 12.4 0Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8.2" r="2.1" stroke="currentColor" stroke-width="1.5"/></svg></span>
        <span>${escapeHtml(place.name)}</span>
      </h2>
      ${area ? `<p class="location-region">${escapeHtml(area)}</p>` : ""}
      <div class="weather-main">
        <div>
          <div class="temperature" aria-label="${temperature} ${escapeHtml(temperatureUnit)}">${temperature}<span>${escapeHtml(temperatureUnit)}</span></div>
          <p class="condition-label">${escapeHtml(condition.label)}</p>
        </div>
        <div class="condition-visual" aria-hidden="true">${weatherIcon(condition.kind)}</div>
      </div>
      <div class="weather-details" aria-label="Weather details">
        <div class="detail"><span class="detail-label">Humidity</span><span class="detail-value">${humidity}<small> ${escapeHtml(humidityUnit)}</small></span></div>
        <div class="detail"><span class="detail-label">Wind</span><span class="detail-value">${wind}<small> ${escapeHtml(windUnit)}</small></span></div>
        <div class="detail"><span class="detail-label">Temperature</span><span class="detail-value">${temperature}<small> ${escapeHtml(temperatureUnit)}</small></span></div>
      </div>
    </div>`;

  const timezone = forecast.timezone || "UTC";
  weatherTime.textContent = formatCurrentTime(timezone, current.time, forecast.utc_offset_seconds);
  cardFooterText.textContent = `Updated from ${escapeHtml(forecast.timezone || "local forecast time")}`;
  setLoading(false);
}

function validCurrentWeather(current) {
  return current
    && Number.isFinite(current.temperature_2m)
    && Number.isFinite(current.relative_humidity_2m)
    && Number.isFinite(current.wind_speed_10m)
    && Number.isFinite(current.weather_code);
}

async function searchWeather(city) {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  const { signal } = controller;
  showLoading(city);

  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.search = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
    const geocodingResponse = await fetch(geocodingUrl, { signal });
    if (!geocodingResponse.ok) throw new Error("The city lookup service is unavailable.");
    const geocoding = await geocodingResponse.json();
    if (signal.aborted || activeController !== controller) return;
    const place = geocoding.results?.[0];

    if (!place) {
      showError("We couldn’t find that city", "Check the spelling or try a nearby city name.");
      feedback.textContent = "No matching city found. Try a different spelling or a nearby city.";
      return;
    }

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      timezone: "auto",
    });
    const forecastResponse = await fetch(forecastUrl, { signal });
    if (!forecastResponse.ok) throw new Error("The weather service is unavailable.");
    const forecast = await forecastResponse.json();
    if (signal.aborted || activeController !== controller) return;

    if (!validCurrentWeather(forecast.current)) {
      throw new Error("The weather service returned incomplete conditions. Please try again.");
    }
    renderWeather(place, forecast);
    feedback.textContent = "";
  } catch (error) {
    if (error.name === "AbortError" || signal.aborted || activeController !== controller) return;
    const isNetworkError = error instanceof TypeError;
    const isUnexpectedResponse = error instanceof SyntaxError;
    const message = isNetworkError
      ? "Check your internet connection and try searching again."
      : isUnexpectedResponse
        ? "The weather service returned an unexpected response. Please try again in a moment."
        : `${error.message || "Something went wrong."} Please try again in a moment.`;
    showError("Weather is unavailable right now", message);
    feedback.textContent = message;
  } finally {
    if (activeController === controller) {
      activeController = null;
      setLoading(false);
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    activeController?.abort();
    activeController = null;
    showError("Enter a city name", "Type a city name before searching for weather.");
    feedback.textContent = "Enter a city name to search for its weather.";
    cityInput.setAttribute("aria-invalid", "true");
    cityInput.focus();
    return;
  }

  cityInput.removeAttribute("aria-invalid");
  void searchWeather(city);
});

cityInput.addEventListener("input", () => {
  if (cityInput.value.trim()) {
    cityInput.removeAttribute("aria-invalid");
    feedback.textContent = "";
  }
});
