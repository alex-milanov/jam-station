![screenshot](https://alex-milanov.github.io/jam-station/assets/screenshot-01.png)

# ![logo](https://alex-milanov.github.io/jam-station/dist/assets/logo.png) Jam Station
- Music Live Rig App with Web Audio and MIDI Api's

## Installation
- Setup your node environment via https://github.com/creationix/nvm
- Clone the repo:
```sh
git clone https://github.com/alex-milanov/jam-station.git
cd jam-station
```
- Install the dependencies
```sh
npm i
```

## Running the app
**Important:** Web MIDI is currently supported only in Chrome
- To start up the app just run:
```sh
npm start
```
- Open Chrome at http://localhost:8080
- To use the synth simply connect a MIDI keyboard or install a virtual MIDI keyboard app

## Development Notes
**Note:** The app is currently in active development, and the architecture could undergo several refactorings.

### App Architecture
The app architecture is influenced by recent trends like functional and functional reactive programming

It's building blocks consist of **redux** inspired state machine, virtual dom with **hyperscript**, whereby **rxjs** observables are used to connect the different elements.

The application flow is one directional, flux like.
- **Actions** -> **State** -> **UI** (-> **Actions**)

A central goal of this approach is to structure the app in a manner of how one might reason about it. For eg.:
- The `State` of the app is being changed by the user `Actions`
```js
const state$ = actions.stream
	.scan((state, change) => change(state), actions.initial);
```
- The `UI` of the app reflects it's `State`
```js
const ui$ = state$.map(state => ui({state, actions}));
```
