'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
let inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
let inputDuration = document.querySelector('.form__input--duration');
let inputCadence = document.querySelector('.form__input--cadence');
let inputElevation = document.querySelector('.form__input--elevation');
class App {
  #map;
  #mapEvent;
  #workoutArray = [];
  constructor() {

    this._getLocalStorage();

    this._getPosition();

    form.addEventListener('submit', this._newWorkOut.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._setViewToWorkout.bind(this));

  }

  _getPosition() {
    if (window.navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
        alert('Could not get your position');
      });
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    let coords = { latitude, longitude };

    this.#map = L.map('map').setView([coords.latitude, coords.longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workoutArray.forEach(workout => {
      this._putMarkerOnMap(workout);
    });

  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();

    const validNumber = (...inputs) => {
      return inputs.every(number => Number.isFinite(number));
    }
    const positiveNumber = (...inputs) => {
      return inputs.every(number => number > 0);
    }

    let type = document.querySelector('.form__input--type').value;
    let distance = +document.querySelector('.form__input--distance').value;
    let cadence = +document.querySelector('.form__input--cadence').value;
    let duration = +document.querySelector('.form__input--duration').value;
    let elevation = +document.querySelector('.form__input--elevation').value;


    if (type == "running") {
      if (!validNumber(distance, duration, cadence) || !positiveNumber(distance, duration, cadence)) {
        alert("The values must be numeric and grater than 0")
      } else {
        let coords = { lat: this.#mapEvent.latlng.lat, lng: this.#mapEvent.latlng.lng };
        let runningWorkout = new Running(coords, distance, duration, cadence);
        this.#workoutArray.push(runningWorkout);
        this._putMarkerOnMap(runningWorkout);
        this._renderWorkout(runningWorkout);
        this._clearForm();
      }
    }
    if (type == "cycling") {
      if (!validNumber(distance, duration, elevation) || !positiveNumber(distance, duration, elevation)) {
        alert("The values must be numeric and grater than 0")
      } else {
        let coords = { lat: this.#mapEvent.latlng.lat, lng: this.#mapEvent.latlng.lng };
        let cyclingWorkout = new Cycling(coords, distance, duration, elevation);
        this.#workoutArray.push(cyclingWorkout);
        this._putMarkerOnMap(cyclingWorkout);
        this._renderWorkout(cyclingWorkout);
        this._clearForm();
      }
    }
    this._setLocalStorage();

  }

  _clearForm() {
    form.classList.toggle('hidden');
    inputCadence.value = inputDistance.value = inputDuration.value = '';
  }

  _putMarkerOnMap(workout) {
    let popUpClass = workout.type === 'running' ? 'running-popup' : 'cycling-popup'
    var marker = L.marker([
      workout.coords.lat, workout.coords.lng
    ]).addTo(this.#map);
    marker.bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: popUpClass

      })
        .setContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup()
    );
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${workout.id}>
                  <h2 class="workout__title" >${workout.description}</h2 >
                <div class="workout__details">
                  <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span >
                  <span class="workout__value">${workout.distance}</span>
                  <span class="workout__unit">km</span>
                </div >
                <div class="workout__details">
                  <span class="workout__icon">⏱</span>
                  <span class="workout__value">${workout.duration}</span>
                  <span class="workout__unit">min</span>
                </div>`
    if (workout.type == 'running') {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>`;
    }
    if (workout.type == 'cycling') {
      html += `<div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed}</span>
                <span class="workout__unit">km/h</span>
              </div >
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
              </div>`
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _setViewToWorkout(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workoutArray.find(workout => workout.id == workoutEl.dataset.id);

    this.#map.setView(workout.coords, 13, { animate: true, pan: { duration: 1 } })
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workoutArray));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workoutArray = data;
    this.#workoutArray.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

}
class Workout {
  date = new Date();
  id = Math.trunc(Math.random() * 9999);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()} `;

  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}


let app = new App();
