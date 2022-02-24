const APP = {
	DB: null, 
	sw: null,
	keyword: null,
	id: null,
	isONLINE: "onLine" in navigator && navigator.onLine,
	tmdbBASEURL: "https://api.themoviedb.org/3/",
	tmdbAPIKEY: "8d4732ba7ba71c8428eb25ce548539f2",
	tmdbIMAGEBASEURL: "https://image.tmdb.org/t/p/w500/",
	results: [],
	init: () => {
		//open the database
		IDB.openDatabase(APP.registerSW); 
	},
	registerSW: () => {
		//register the service worker
		
		APP.pageSpecific();
		APP.addListeners();
	},
	addListeners: () => {
		//add listeners

	},
	pageSpecific: () => {
		if (document.body.id === "home") {
			//on the home page
		}
		if (document.body.id === "results") {
			//on the results page
		}
		if (document.body.id === "suggest") {
			//on the suggest page
		}
		if (document.body.id === "fourohfour") {
			//on the 404 page
			console.log("404 PAGE");
		}
	},
	changeOnlineStatus: (ev) => {
		//when the browser goes online or offline
	},
	navigate: (url) => {
		//change the current page
	},
};

const SEARCH = {
	searchFormSubmitted(ev) {
		ev.preventDefault();
	},
	btnSearchClicked: () => {
	}
}

const IDB = {
	openDatabase: (nextStep) => {
		//open the database

	},
	createTransaction: (storeName) => {
		//create a transaction to use for some interaction with the database
		let tx;
		tx = DB.transaction(storeName, "readwrite");
		return tx;
	},
	getDBResults: (storeName, keyValue, callback) => {
		//return the results from storeName where it matches keyValue

	},
	addResultsToDB: (obj, storeName, callback) => {
		//save the obj passed in to the appropriate store
	},
};

const RESULT = {
	getData: (endpoint, callback) => {
        //do a fetch call to the endpoint
		let url = new URL(endpoint, APP.tmdbBASEURL);
		fetch(url)
			.then((resp) => {
				if (resp.status >= 400) {
					throw new NetworkError(
						`Failed fetch to ${url}`,
						resp.status,
						resp.statusText
					);
				}
				return resp.json();
			})
			.then((contents) => {
				let results = contents.results;
			})
			.catch((err) => {
				//handle the NetworkError
				console.warn(err.message);
			});
	},
	getSearchResults: () => {
	},
	getSuggestedResults: () => {
	},
	addSearchResults: () => {
	},
	addSuggestedResults: () => {
	},
};

const CARDS = {
	cardListClicked: (ev) => {
		// user clicked on a movie card
	},
	displayCards: () => {
		//display all the movie cards based on the results array
	}
};

const MESSAGE = {
	messageReceived: (ev) => {
    console.log(ev.data);
	},
	sendMessage: (msg) => {
		//send a message to the service worker
	},
};

document.addEventListener("DOMContentLoaded", APP.init);

class NetworkError extends Error {
	constructor(msg, status, statusText) {
		super(msg);
		this.status = status;
		this.statusText = statusText;
	}
}
