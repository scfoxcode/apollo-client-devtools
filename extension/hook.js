const getManifest = chrome.runtime.getManifest;
const version = (getManifest && getManifest().version) || 'electron-version';
let isConnected = false;
let passedApolloConnected = false;

const js = `
/*
let backgroundPageConnection = chrome.runtime.connect({
  name: chrome.devtools.inspectedWindow.tabId.toString()
});

backgroundPageConnection.onMessage.addListener((request, sender) => {
  console.log('recieved message from background.onConnect ', request);
});
*/

function hookLogger(stateObj) {
  if (!!window.__APOLLO_CLIENT__) {
    window.postMessage({ apolloClientStore: stateObj }, '*');
  }
}

window.__APOLLO_DEVTOOLS_GLOBAL_HOOK__ = { version: "${version}" };

let __APOLLO_POLL_COUNT__ = 0;
const __APOLLO_POLL__ = setInterval(() => {
  if (!!window.__APOLLO_CLIENT__) {
    window.postMessage({ APOLLO_CONNECTED: true}, '*');
    console.log(window.__APOLLO_CLIENT__);
    isConnected = true;
    window.__APOLLO_CLIENT__.__actionHookForDevTools(hookLogger);
    clearInterval(__APOLLO_POLL__);
  } else {
    __APOLLO_POLL_COUNT__ += 1;
  }

  if (__APOLLO_POLL_COUNT__ > 20) clearInterval(__APOLLO_POLL__);
}, 500);
`;

var script = document.createElement('script');
script.textContent = js;
document.documentElement.appendChild(script);
script.parentNode.removeChild(script);

// event.data has the data being passed in the message
window.addEventListener('message', event => {
  console.log(event.source);
  if (event.source != window) 
    return;

  if (event.data.APOLLO_CONNECTED) {
    console.log('in event.data.APOLLO_CONNECTED');
    if (!passedApolloConnected) {
      chrome.runtime.sendMessage({ APOLLO_CONNECTED: true}, function() {
        passedApolloConnected = true;
        console.log('send connected message');
      });
    }
  }

  if (!!event.data.apolloClientStore) {
    chrome.runtime.sendMessage({ apolloClientStore: event.data.apolloClientStore}, function() {
      console.log('send apolloClienStore message');
    });
  }
  // else equivalent to if (!event.data.APOLLO_CONNECTED)
  else {
    return;
  }
});
