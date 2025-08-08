//weatherapi.com was used to fetch the weather data
// exchangerate-api.com was used to fetch the currency conversion rates
// refenced notes taken from class, also used the fetch/delete functions and modified them to suit the needs of this project.

// weather api
const weatherUrl = "https://api.weatherapi.com/v1/current.json?key=b27a3e75b672430cb43173008250508&q=Calgary";
const WEATHER_KEY = "weatherData";
const WEATHER_EXPIRY = 10 * 60 * 1000; // 10 minutes
// This function fetches weather data and caches it in localStorage
// It checks if the cached data is still valid before making a new API call
// If the cached data is valid, it displays the weather without making an API call
function loadWeather() {
  const weatherDiv = document.getElementById("weatherDisplay");
  // this checks if the weather data is already stored in localStorage
  // and if it is still valid (not expired)
  let stored = localStorage.getItem(WEATHER_KEY);
  if (stored) {
    let obj = JSON.parse(stored);
    let now = Date.now();
    // this checks if the stored data is still valid
    // if it is, it displays the weather data without calling the API
    if (now - obj.timestamp < WEATHER_EXPIRY) {
      displayWeather(obj.data);
      return; 
    }
  }
  // if the data is not valid or not stored, it fetches new data from the API
  // and stores it in localStorage
  // also handles errors if the API call fails
  fetch(weatherUrl)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      localStorage.setItem(WEATHER_KEY, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
      displayWeather(data);
    })
    .catch(err => {
      console.error("Weather API error:", err);
      weatherDiv.innerText = "Weather data unavailable.";
    });
}

function displayWeather(data) {
  const weatherDiv = document.getElementById("weatherDisplay");
  const temp = data.current.temp_c;
  const desc = data.current.condition.text;
  const updated = data.location.localtime;
  weatherDiv.innerHTML = `
    <p><strong>Temperature:</strong> ${temp} °C</p>
    <p><strong>Condition:</strong> ${desc}</p>
    <p><small>Updated: ${updated}</small></p>
  `;
}

loadWeather(); // Call on page load to fetch and display weather data

// currency api
// this function fetches currency conversion rates and caches them in localStorage
// checks if the cached data is still valid before making a new API call

const currencyUrl = `https://v6.exchangerate-api.com/v6/82df9500dc8d68a1ce6b3461/latest/USD`;
const CURRENCY_KEY = "currencyData";
const CURRENCY_EXPIRY = 10 * 60 * 1000; // this is set to 10 minutes. 

// This function fetches currency data and caches it in localStorage
// It checks if the cached data is still valid before making a new API call
function loadCurrency() {
  let stored = localStorage.getItem(CURRENCY_KEY);
  if (stored) {
    let obj = JSON.parse(stored);
    let now = Date.now();
    if (now - obj.timestamp < CURRENCY_EXPIRY) {
      setupCurrencyForm(obj.data);
      return;
    }
  }
  fetch(currencyUrl)
    .then(res => res.json())
    .then(data => {
      localStorage.setItem(CURRENCY_KEY, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
      setupCurrencyForm(data);
    })
    .catch(err => console.error("Currency API fetch failed:", err));
}
// this function sets up the currency conversion form
// populates the dropdowns with currency codes and sets up the form submission
// also handles the conversion logic when the form is submitted
function setupCurrencyForm(data) {
  const fromCurrency = document.getElementById("fromCurrency");
  const toCurrency = document.getElementById("toCurrency");
  const currencies = Object.keys(data.conversion_rates);
  fromCurrency.innerHTML = "";
  toCurrency.innerHTML = "";
  currencies.forEach(code => {
    fromCurrency.innerHTML += `<option value="${code}">${code}</option>`;
    toCurrency.innerHTML += `<option value="${code}">${code}</option>`;
  });

  // this sets the default values for the dropdowns
  const form = document.getElementById("currencyForm");
  const resultDiv = document.getElementById("currencyResult");
  form.onsubmit = function (e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("amount").value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    // this checks if the amount is a valid number
    // if not, it displays an error message
    let ratesStored = localStorage.getItem(`rates_${from}`);
    let shouldFetch = true;
    if (ratesStored) {
      let obj = JSON.parse(ratesStored);
      let now = Date.now();
      if (now - obj.timestamp < CURRENCY_EXPIRY) {
        updateConversion(obj.data, amount, from, to, resultDiv);
        shouldFetch = false;
      }
    }
    if (shouldFetch) {
      fetch(`https://v6.exchangerate-api.com/v6/82df9500dc8d68a1ce6b3461/latest/${from}`)
        .then(res => res.json())
        .then(ratesData => {
          // Save rates for the selected 'from' currency
          localStorage.setItem(`rates_${from}`, JSON.stringify({
            data: ratesData,
            timestamp: Date.now()
          }));
          updateConversion(ratesData, amount, from, to, resultDiv);
        })
        .catch(err => {
          console.error("Currency API error:", err);
          resultDiv.innerText = "Conversion failed.";
        });
    }
  };
}
// this function updates the conversion result
// it calculates the converted amount based on the selected currencies and the amount entered
// it also updates the result div with the conversion rates and the converted amount
function updateConversion(ratesData, amount, from, to, resultDiv) {
  const rate = ratesData.conversion_rates[to];
  const converted = (amount * rate).toFixed(2);
  resultDiv.innerHTML = `
    <p><strong>1 ${from} = ${rate} ${to}</strong></p>
    <p><strong>${amount} ${from} = ${converted} ${to}</strong></p>
  `;
}


loadCurrency(); // Call on page load
