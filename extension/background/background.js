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
chrome.runtime.onMessage.addListener(reciver);
function reciver(request, sender, sendResponse) {
    console.log(request);
    if (request.type === 'changeActiveState') {
        sendChangeContainerState();
    }
}

function sendChangeContainerState() {
    //Inform content script to change container state
    let message = {
        type: 'changeContainerState'
    }

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function () {
            console.log('message sent');
        });
    });
}

chrome.contextMenus.create( {
    id: "Annotate Element",
    title: "Annotate %s", 
    contexts: ["page", "selection", "image", "link"],
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "Annotate Element") {
        sendAddAnnotation(info, tab)
    }
});

function sendAddAnnotation(info, tab) {
    //Inform content script to add an annotation
    let message = {
        type: 'addAnnotation',
        content: info
    }

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tab.id, message, function () {
            console.log('message sent');
        });
    });
}