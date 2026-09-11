# Weather Dashboard

A responsive weather dashboard built using **HTML, CSS, and JavaScript**. The application uses the **Fetch API** to retrieve real-time weather information from the **Open-Meteo REST API** and displays current weather conditions for searched cities.

## Features

* Search weather by city name
* Displays current temperature
* Shows weather conditions
* Displays wind speed and other weather metrics
* Uses real-time data from a REST API
* Responsive user interface
* Asynchronous JavaScript using `async/await`
* Error handling for invalid searches or unavailable data

## Technologies Used

* **HTML5** – Webpage structure
* **CSS3** – Styling and responsive layout
* **JavaScript** – Application logic and API integration
* **Fetch API** – Fetching weather data
* **Open-Meteo API** – Weather data source

## API Used

This project uses the **Open-Meteo API** to retrieve weather information.

### API Workflow

```text
User enters city
       ↓
JavaScript sends request
       ↓
Geocoding API finds city coordinates
       ↓
Weather API returns weather data
       ↓
JavaScript processes the response
       ↓
Weather information displayed on dashboard
```

## How It Works

1. The user enters the name of a city.
2. JavaScript uses the Open-Meteo geocoding service to find the city's latitude and longitude.
3. The application sends those coordinates to the Open-Meteo weather endpoint.
4. The API returns current weather information.
5. JavaScript extracts the required values and updates the dashboard dynamically.

## Project Structure

```text
weather-dashboard/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## Running the Project

Clone the repository:

```bash
git clone https://github.com/fevin2005/weather-dashboard.git
```

Open the project folder:

```bash
cd weather-dashboard
```

Then open `index.html` in a web browser.

For the best experience, you can also run it using the **VS Code Live Server** extension.

## Example

Search for a city such as:

```text
Coimbatore
```

The dashboard retrieves the latest available weather data and displays it on the webpage.

## Learning Outcomes

Through this project, I practiced:

* JavaScript asynchronous programming
* `async/await`
* Fetch API
* REST API integration
* JSON data handling
* DOM manipulation
* Error handling
* Responsive web design

## Future Improvements

* 5-day weather forecast
* Weather icons
* Automatic location detection
* Temperature unit conversion
* Weather charts
* Dark/light mode
* Recent search history

## Author

**Fevin K**

B.Tech AI & Cybersecurity Student

GitHub: [@fevin2005](https://github.com/fevin2005)
