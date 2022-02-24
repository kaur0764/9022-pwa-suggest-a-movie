const version = 1;
const staticName = `PWA-Static-Movie-APP-${version}`;
const dynamicName = `PWA-Dynamic-Movie-APP-${version}`;
const cacheLimit = 100;
const cacheList = [
    "/",
	"/index.html",
	"/404.html",
	"/results.html",
	"/suggest.html",
	"/css/main.css",
	"/js/app.js",
	"/manifest.json",
    "/img/android-chrome-192x192.png",
    "/img/android-chrome-512x512.png",
    "/img/apple-touch-icon.png",
    "/img/favicon-16x16.png",
    "/img/favicon-32x32.png",
    "/img/mstile-150x150.png",
	"/img/placeholder.png",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
];

self.addEventListener('install', (ev)=>{
    ev.waitUntil();
});
self.addEventListener('activate', (ev)=>{
    ev.waitUntil();
});
self.addEventListener('fetch', (ev)=>{
    ev.respondWith();
});
self.addEventListener('message', (ev)=>{
    //check ev.data to get the message
});

function sendMessage(msg){
    //send a message to the browser from the service worker
};

function limitCache(){
    //remove some files from the dynamic cache
}

function checkForConnection(){
    //try to talk to a server and do a fetch() with HEAD method.
    //to see if we are really online or offline
    //send a message back to the browser
}