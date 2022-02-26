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
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(function (err) {
				console.warn(err);
			});
			navigator.serviceWorker.ready.then((registration) => {
				APP.sw = registration.active;
			});
		}

		APP.pageSpecific();
		APP.addListeners();
	},
	addListeners: () => {
		//add listeners
		document.querySelector('h1').addEventListener('click',function(ev){ APP.navigate("/index.html")})
    document.addEventListener("submit", SEARCH.searchFormSubmitted);
		document.querySelector("#btnSearchHeader").addEventListener("click", SEARCH.btnSearchClicked);
		navigator.serviceWorker.addEventListener("message", function(ev){	MESSAGE.messageReceived(ev)});
		//when online and offline
		window.addEventListener("online", APP.changeOnlineStatus);
		window.addEventListener("offline", APP.changeOnlineStatus);
	},
	pageSpecific: () => {
		if (document.body.id === "home") {
			//on the home page
			IDB.getAllSearchResults();
		}
		if (document.body.id === "results") {
			//on the results page
			let keyword = decodeURIComponent(location.search.split("=")[1]);
			APP.keyword = keyword;
			let titleArea = document.querySelector(".titleArea h2");
			titleArea.innerHTML = `Search Results for <span>'${keyword}'<span>`;
			IDB.getDBResults("searchStore", keyword, RESULT.getSearchResults);
			//listener for clicking on the movie card container
			document
				.querySelector(".contentArea")
				.addEventListener("click", CARDS.cardListClicked);
		}
		if (document.body.id === "suggest") {
			//on the suggest page
			let movieid = location.search.split("&")[0].split("=")[1];
			APP.id = movieid;
			let title = decodeURIComponent(location.search.split("&")[1].split("=")[1]);
			let titleArea = document.querySelector(".titleArea h2");
			titleArea.innerHTML = `Suggested Results based on <span>'${title}'<span>`;
			//listener for clicking on the movie card container
			document.querySelector(".contentArea").addEventListener("click", CARDS.cardListClicked);
			IDB.getDBResults("suggestStore", movieid, RESULT.getSuggestedResults);
		}
		if (document.body.id === "fourohfour") {
			//on the 404 page
			console.log("404 PAGE");
			if (!APP.isONLINE) {
				let div = document.querySelector(".titleArea div");
        div.innerHTML = `<h3>Oops! You are Offline</h3>
				<img src="/img/offline.png" alt="Image showing Offline"></img>`;
			}
				IDB.getAllSearchResults();
		}
	},
	changeOnlineStatus: (ev) => {
		//when the browser goes online or offline
		APP.isONLINE = ev.type === "online" ? true : false;
    MESSAGE.sendMessage({ ONLINE: APP.isONLINE });
	},
	navigate: (url) => {
		//change the current page
		window.location = url; 
		window.onload = (event) => {
			APP.pageSpecific();
		};
	}
};

const SEARCH = {
	searchFormSubmitted(ev) {
		ev.preventDefault();
		//get the keyword from the input
		let searchInput = document.getElementById("inputSearch").value;
		if (searchInput) {
			searchInput = searchInput.toLowerCase()
			APP.navigate(`/results.html?keyword=${searchInput}`);
		}
	},
	btnSearchClicked: () => {
		let searchArea = document.querySelector(".searchArea");
		searchArea.classList.add("active");
		let searchOverlay = document.querySelector(".overlay");
		searchOverlay.classList.add("active");
		searchOverlay.addEventListener('click', SEARCH.removeActive)
		let input = document.getElementById("inputSearch");
		input.focus()
		let btnClose = document.querySelector("#btnClose");
		btnClose.addEventListener("click", SEARCH.removeActive);
	},
	removeActive: (ev) => {
		let target = ev.target
		if(target.id!='inputSearch'){
		  let searchArea = document.querySelector(".searchArea");
		  searchArea.classList.remove("active");
		  let searchOverlay = document.querySelector(".overlay");
		  searchOverlay.classList.remove("active");
		}
	}
}

const IDB = {
	openDatabase: (nextStep) => {
		//open the database
		let version = 2;
		let dbOpenRequest = indexedDB.open("suggestDB", version);

		dbOpenRequest.onupgradeneeded = function (ev) {
			DB = ev.target.result;
			/* deleting the old stores */
			try {
				DB.deleteObjectStore("searchStore");
				DB.deleteObjectStore("suggestStore");
			} catch (err) {
				console.log("error deleting old DB because it was the first version");
			}

			//create searchStore with keyword as keyPath
			let optionsSearch = {
				keyPath: "keyword",
				autoIncrement: false,
			};
			let searchStore = DB.createObjectStore("searchStore", optionsSearch);

			//create suggestStore with movieid as keyPath
			let optionsSuggest = {
				keyPath: "movieid",
				autoIncrement: false,
			};
			let suggestStore = DB.createObjectStore("suggestStore", optionsSuggest);
		};

		dbOpenRequest.onerror = function (err) {
			console.log(err.message);
		};

		//call nextStep onsuccess
		dbOpenRequest.onsuccess = function (ev) {
			DB = dbOpenRequest.result;
			console.log(DB.name, `ready to be used.`);
			nextStep();
		};
	},
	createTransaction: (storeName) => {
		//create a transaction to use for some interaction with the database
		let tx;
		tx = DB.transaction(storeName, "readwrite");
		return tx;
	},
	getAllSearchResults: () => {
			//return the results from storeName where it matches keyValue
			let tx = IDB.createTransaction("searchStore");
			tx.oncomplete = function () {
				//done the transaction
			};
			let store = tx.objectStore("searchStore");
			let getRequest = store.getAll();
			getRequest.onsuccess = function (ev) {
				results = getRequest.result;
					let ul = document.querySelector('.contentArea ul');
					let html = results.map( (result)=> {
					let li = document.createElement('li');
					li.innerHTML=`${decodeURIComponent(result.keyword)}`;
					return li;
					})
					ul.append(...html);	
					ul.addEventListener('click',function(ev){	
						let li = ev.target.closest('li');	
					  APP.navigate(`/results.html?keyword=${li.innerHTML}`)
					});
					if(html.length == 0){
						document.querySelector('.contentArea h4').innerHTML="";
					}
		}
	},
	getDBResults: (storeName, keyValue, callback) => {
		//return the results from storeName where it matches keyValue
		let tx = IDB.createTransaction(storeName);
		tx.oncomplete = function () {
			//done the transaction
		};
		let store = tx.objectStore(storeName);
		let getRequest = store.get(keyValue);
		getRequest.onsuccess = function (ev) {
			if (getRequest.result) {
				APP.results = getRequest.result.results;
				CARDS.displayCards();
			} else {
				if(typeof callback === 'function') callback();
			}
		};
	},
	addResultsToDB: (obj, storeName, callback) => {
		//save the obj passed in to the appropriate store
		let tx = IDB.createTransaction(storeName);
		tx.oncomplete = function () {
			//done the transaction
			if(callback)callback();
		};
		let movieStore = tx.objectStore(storeName);
		let addRequest = movieStore.add(obj);

		addRequest.onsuccess = (ev) => {
			console.log("Movies added to db");
		};
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
				if(results.length === 0){
					let titleArea = document.querySelector(".titleArea h2");
					console.log(titleArea);
					titleArea.innerHTML = `<h2>No matches for <span>'${APP.keyword}'<span></h2>`
				} else {
				let newResults = results.map(item =>{ 
					let {id, title, poster_path, overview, release_date, popularity}= item;
					return {id, title, poster_path, overview, release_date, popularity};
				})
				APP.results = newResults;
				if(typeof callback === 'function') callback();
				}
			})
			.catch((err) => {
				//handle the NetworkError
				console.warn(err.message);
				MESSAGE.sendMessage({ checkOnline: APP.isONLINE });
			});
	},
	getSearchResults: () => {
		if (APP.isONLINE) {
			//if no match in DB do a fetch;
			let endpoint = `search/movie?api_key=${APP.tmdbAPIKEY}&query=${APP.keyword}`;
			RESULT.getData(endpoint, RESULT.addSearchResults);
		} else {
			APP.navigate("/404.html");
		}
	},
	addSearchResults: () => {
		let obj = {
			keyword: APP.keyword,
			results: APP.results,
		};
		IDB.addResultsToDB(obj, "searchStore",	CARDS.displayCards);
	},
	getSuggestedResults: () => {
		if (APP.isONLINE) {	
			//if no match in DB do a fetch;
			let endpoint = `movie/${APP.id}/similar?api_key=${APP.tmdbAPIKEY}`;
			RESULT.getData(endpoint, RESULT.addSuggestedResults);
		} else {
			APP.navigate("/404.html");
		}
	},
	addSuggestedResults: () => {
		let obj = {
			movieid: APP.id,
			results: APP.results,
		};
		IDB.addResultsToDB(obj, "suggestStore",	CARDS.displayCards);
	},
};

const CARDS = {
	cardListClicked: (ev) => {
		// user clicked on a movie card
		let btnExpand = ev.target.closest(".btnExpand")
		if(btnExpand){
			// button to expand card body clicked
			let span =ev.target.closest("span")
			let cardBody =  ev.target.closest(".card-body");
			cardBody.classList.toggle('expand');
			if(cardBody.classList.contains('expand')){
        span.innerHTML='expand_more';
			} else {
				span.innerHTML='expand_less';
			}
		} else {
			let card = ev.target.closest(".card");
		  let movieid = card.dataset.id;
		  APP.id = movieid;
		  let title = card.querySelector("h3").innerHTML;
		  APP.navigate(`/suggest.html?movie_id=${movieid}&title=${title}`);
		}
	},
	displayCards: () => {
		//display all the movie cards based on the results array
		let cards = document.querySelector(".contentArea");
		cards.innerHTML = "";
		let df= document.createDocumentFragment();
		APP.results.forEach((result) => {
			let card = document.createElement("div");
			let posterPath = result.poster_path;
			let overview = result.overview;
			let releaseDate = result.release_date;
			let popularity = result.popularity;
			let id = result.id;
			let title = result.title;
			let imgSrc = `${APP.tmdbIMAGEBASEURL}${posterPath}`;
			if (posterPath === null) {
				imgSrc = "/img/placeholder.png";
			}
			card.setAttribute("data-id", id);
			card.classList.add("card");
			card.innerHTML = `<img src=${imgSrc} alt="Poster for movie ${title}"></img>`;
			let cardBody = document.createElement("div");
			cardBody.classList.add("card-body");
			cardBody.innerHTML = `<button class="btnExpand" type="button">
			                    <span class="material-icons">expand_less</span>
			                    </button>
	                        <h3>${title}</h3>
                          <p>${releaseDate}</p>
                          <p>Popularity: ${popularity}</p>
                          <p>${overview}</p>`;
			card.append(cardBody);
			df.append(card);
		});
		cards.append(df)
	}
};

const MESSAGE = {
	messageReceived: ({data}) => {
		//received message from service worker
		if ('isOnline' in data) {
			APP.isOnline = data.isOnline;
			if (!APP.isOnline) {
				APP.navigate("/404.html");
			}
		}
	},
	sendMessage: (msg) => {
		//send a message to the service worker
		navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage(msg);
    });
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
