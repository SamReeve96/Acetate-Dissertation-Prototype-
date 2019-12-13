chrome.storage.sync.set({ activeOnPageLoad: true }, function () {
    console.log("by default, the extension is active, because it's in development and it saves time");
});

// listen for browser Action to be clicked (change trigger type?)
chrome.browserAction.onClicked.addListener(function (tab) {
    // for the current tab, inject the file & execute it
    chrome.tabs.executeScript(tab.ib, {
        file: './contentContainer/contentContainer.js'
    });
});

// add listener to change extension state (triggered by popup.js)
chrome.runtime.onMessage.addListener(receiver);
function receiver(request, sender, sendResponse) {
    console.log(request);
    if (request.type === 'changeActiveState') {
        sendChangeContainerState();
    }
    if (request.type === 'setNewContextElement') {
        setContextElement(request.content);
    }
}

function sendChangeContainerState() {
    //Inform content script to change container state
    let message = {
        type: 'changeContainerState'
    };

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function () {
            console.log('message sent');
        });
    });
}

//------------------------

chrome.contextMenus.create( {
    id: "Annotate Element",
    title: "Annotate %s", 
    contexts: ["page", "selection", "image", "link"]
});

let contextElement;

//set the element of the last right clicked element from the buffer in the
function setContextElement(newElement) {
    contextElement = newElement;
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "Annotate Element") {
        // get element right clicked
        sendAddAnnotation(info, tab);
    }
});

function sendAddAnnotation(info, tab) {
    //Inform content script to add an annotation
    info.contextElement = contextElement;

    let message = {
        type: 'addAnnotation',
        content: info
    };

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tab.id, message, function () {
            console.log('message sent');
        });
    });
}