const endpoints = {
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast"
};

const state = {
  locations: [],
  activeLocationId: null
};

const els = {
  app: document.querySelector(".weather-app"),
  form: document.querySelector("#search-form"),
  input: document.querySelector("#city-input"),
  searchButton: document.querySelector(".icon-button"),
  status: document.querySelector("#status-message"),
  options: document.querySelector("#location-options"),
  conditionLabel: document.querySelector("#condition-label"),
  locationName: document.querySelector("#location-name"),
  locationMeta: document.querySelector("#location-meta"),
  conditionBadge: document.querySelector("#condition-badge"),
  temperatureValue: document.querySelector("#temperature-value"),
  temperatureUnit: document.querySelector("#temperature-unit"),
  currentDetails: document.querySelector("#current-details"),
  metricGrid: document.querySelector("#metric-grid"),
  timezoneLabel: document.querySelector("#timezone-label"),
  forecastList: document.querySelector("#forecast-list")
};

const weatherCodeMap = new Map([
  [0, ["Clear", "SUN"]],
  [1, ["Mostly clear", "SUN"]],
  [2, ["Partly cloudy", "CLD"]],
  [3, ["Cloudy", "CLD"]],
  [45, ["Fog", "FOG"]],
  [48, ["Rime fog", "FOG"]],
  [51, ["Light drizzle", "DRZ"]],
  [53, ["Drizzle", "DRZ"]],
  [55, ["Dense drizzle", "DRZ"]],
  [56, ["Freezing drizzle", "ICE"]],
  [57, ["Freezing drizzle", "ICE"]],
  [61, ["Light rain", "RN"]],
  [63, ["Rain", "RN"]],
  [65, ["Heavy rain", "RN"]],
  [66, ["Freezing rain", "ICE"]],
  [67, ["Freezing rain", "ICE"]],
  [71, ["Light snow", "SN"]],
  [73, ["Snow", "SN"]],
  [75, ["Heavy snow", "SN"]],
  [77, ["Snow grains", "SN"]],
  [80, ["Rain showers", "SHW"]],
  [81, ["Rain showers", "SHW"]],
  [82, ["Violent showers", "SHW"]],
  [85, ["Snow showers", "SN"]],
  [86, ["Snow showers", "SN"]],
  [95, ["Thunderstorm", "STM"]],
  [96, ["Storm with hail", "STM"]],
  [99, ["Storm with hail", "STM"]]
]);

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric"
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = els.input.value.trim();

  if (city.length < 2) {
    showStatus("Enter at least two characters to search.", "error");
    els.input.focus();
    return;
  }

  loadWeatherByCity(city);
});

els.options.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-location-id]");
  if (!button) return;

  const location = state.locations.find((item) => String(item.id) === button.dataset.locationId);
  if (location) {
    loadWeatherForLocation(location);
  }
});

loadWeatherByCity("New York");

async function loadWeatherByCity(city) {
  setLoading(true);
  showStatus(`Searching for ${city}...`);

  try {
    const locations = await findLocations(city);
    state.locations = locations;
    renderLocationOptions(locations, locations[0].id);
    await loadWeatherForLocation(locations[0], { keepOptions: true });
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}

async function loadWeatherForLocation(location, options = {}) {
  setLoading(true);
  state.activeLocationId = location.id;

  if (!options.keepOptions) {
    renderLocationOptions(state.locations, location.id);
  }

  showStatus(`Fetching weather for ${formatLocation(location)}...`);

  try {
    assertLocation(location);
    const weather = await fetchForecast(location);
    assertWeather(weather);
    renderWeather(location, weather);
    showStatus(`Showing live weather for ${formatLocation(location)}.`);
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}

async function findLocations(city) {
  const url = new URL(endpoints.geocoding);
  url.search = new URLSearchParams({
    name: city,
    count: "5",
    language: "en",
    format: "json"
  }).toString();

  const data = await requestJson(url, "Location search");

  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw new Error(`No matching city found for "${city}".`);
  }

  const locations = data.results.filter((item) => item && typeof item.name === "string");

  if (locations.length === 0) {
    throw new Error(`No usable location data was found for "${city}".`);
  }

  return locations;
}

async function fetchForecast(location) {
  const url = new URL(endpoints.forecast);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "rain",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max"
    ].join(","),
    timezone: "auto",
    forecast_days: "5"
  }).toString();

  return requestJson(url, "Weather forecast");
}

async function requestJson(url, label) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`${label} could not be reached. Check your internet connection and try again.`);
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`${label} returned data in an unexpected format.`);
  }

  if (!response.ok || data.error) {
    const reason = data.reason || `${label} failed with HTTP ${response.status}.`;
    throw new Error(reason);
  }

  return data;
}

function assertLocation(location) {
  const hasCoordinates = Number.isFinite(location.latitude) && Number.isFinite(location.longitude);

  if (!hasCoordinates) {
    throw new Error("The selected location is missing usable coordinates.");
  }
}

function assertWeather(weather) {
  const hasCurrent = weather && typeof weather.current === "object";
  const hasUnits = weather && typeof weather.current_units === "object";
  const hasDaily = weather && weather.daily && Array.isArray(weather.daily.time);

  if (!hasCurrent || !hasUnits || !hasDaily) {
    throw new Error("The weather service returned incomplete weather data.");
  }
}

function renderWeather(location, weather) {
  const current = weather.current;
  const units = weather.current_units;
  const daily = weather.daily;
  const condition = weatherCodeMap.get(current.weather_code) || ["Unknown", "--"];

  els.conditionLabel.textContent = condition[0];
  els.conditionBadge.textContent = condition[1];
  els.locationName.textContent = location.name;
  els.locationMeta.textContent = buildLocationMeta(location);
  els.temperatureValue.textContent = valueOnly(current.temperature_2m);
  els.temperatureUnit.textContent = units.temperature_2m || "";
  els.currentDetails.replaceChildren(
    textPill(`Feels like ${formatMetric(current.apparent_temperature, units.apparent_temperature)}`),
    textPill(`Updated ${formatApiTime(current.time)}`)
  );
  els.timezoneLabel.textContent = weather.timezone ? `Timezone ${weather.timezone}` : "Timezone unavailable";

  const metrics = [
    {
      label: "Humidity",
      value: formatMetric(current.relative_humidity_2m, units.relative_humidity_2m),
      note: "Relative humidity at 2 m",
      icon: "HUM"
    },
    {
      label: "Wind speed",
      value: formatMetric(current.wind_speed_10m, units.wind_speed_10m),
      note: `${formatCompass(current.wind_direction_10m)} wind, gusts ${formatMetric(current.wind_gusts_10m, units.wind_gusts_10m)}`,
      icon: "WND"
    },
    {
      label: "Precipitation",
      value: formatMetric(current.precipitation, units.precipitation),
      note: `Rain ${formatMetric(current.rain, units.rain)}`,
      icon: "PRC"
    },
    {
      label: "Cloud cover",
      value: formatMetric(current.cloud_cover, units.cloud_cover),
      note: current.is_day ? "Daytime conditions" : "Nighttime conditions",
      icon: "CLD"
    }
  ];

  els.metricGrid.replaceChildren(...metrics.map(createMetricCard));
  els.forecastList.replaceChildren(...createForecastItems(daily, weather.daily_units || {}));
}

function createMetricCard(metric) {
  const card = document.createElement("article");
  card.className = "metric-card";

  const top = document.createElement("div");
  top.className = "metric-top";

  const label = document.createElement("span");
  label.className = "metric-label";
  label.textContent = metric.label;

  const icon = document.createElement("span");
  icon.className = "metric-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = metric.icon;

  const value = document.createElement("div");
  value.className = "metric-value";
  value.textContent = metric.value;

  const note = document.createElement("p");
  note.className = "metric-note";
  note.textContent = metric.note;

  top.append(label, icon);
  card.append(top, value, note);
  return card;
}

function createForecastItems(daily, units) {
  return daily.time.map((day, index) => {
    const item = document.createElement("article");
    const condition = weatherCodeMap.get(daily.weather_code?.[index]) || ["Forecast", "--"];
    const high = formatMetric(daily.temperature_2m_max?.[index], units.temperature_2m_max);
    const low = formatMetric(daily.temperature_2m_min?.[index], units.temperature_2m_min);
    const sunrise = formatClock(daily.sunrise?.[index]);
    const sunset = formatClock(daily.sunset?.[index]);
    const dayLabel = document.createElement("strong");
    const conditionLabel = document.createElement("span");
    const temp = document.createElement("div");
    const sun = document.createElement("span");

    item.className = "forecast-day";
    dayLabel.textContent = formatDate(day);
    conditionLabel.textContent = condition[0];
    temp.className = "forecast-temp";
    temp.textContent = `${high} / ${low}`;
    sun.textContent = `Sun ${sunrise} to ${sunset}`;

    item.append(dayLabel, conditionLabel, temp, sun);
    return item;
  });
}

function renderLocationOptions(locations, activeId) {
  els.options.replaceChildren(
    ...locations.map((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `location-chip${location.id === activeId ? " active" : ""}`;
      button.dataset.locationId = String(location.id);
      button.textContent = formatLocation(location);
      return button;
    })
  );
}

function handleError(error) {
  showStatus(error.message || "Something went wrong while loading the weather.", "error");
}

function setLoading(isLoading) {
  els.app.classList.toggle("is-loading", isLoading);
  els.searchButton.disabled = isLoading;
  els.input.disabled = isLoading;
}

function showStatus(message, type = "info") {
  els.status.textContent = message;
  els.status.classList.toggle("error", type === "error");
}

function textPill(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function formatLocation(location) {
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

function buildLocationMeta(location) {
  const parts = [
    location.admin1,
    location.country,
    Number.isFinite(location.elevation) ? `${numberFormat.format(location.elevation)} m elevation` : null
  ].filter(Boolean);

  return parts.join(" | ");
}

function valueOnly(value) {
  return Number.isFinite(value) ? numberFormat.format(value) : "--";
}

function formatMetric(value, unit = "") {
  return Number.isFinite(value) ? `${numberFormat.format(value)}${unit ? ` ${unit}` : ""}` : "--";
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Forecast" : dateFormat.format(date);
}

function formatClock(dateTime) {
  if (!dateTime || !dateTime.includes("T")) return "--";
  return dateTime.split("T")[1];
}

function formatApiTime(dateTime) {
  if (!dateTime || !dateTime.includes("T")) return "--";
  return dateTime.replace("T", " ");
}

function formatCompass(degrees) {
  if (!Number.isFinite(degrees)) return "Variable";

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % directions.length;
  return directions[index];
}
