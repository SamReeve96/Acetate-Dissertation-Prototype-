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
chrome.runtime.onMessage.addListener(handleMessage);
function handleMessage(request) {
    switch (request.type) {
        case 'changeActiveState':
            sendChangeContainerState();
            break;
        case 'setNewContextElement':
            setContextElementData(request);
            break;
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

let contextElementData;

//set the element of the last right clicked element from the buffer in the
function setContextElementData(newElementData) {
    contextElementData = newElementData;
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId == "Annotate Element") {
        // get element right clicked
        sendCreateAnnotation(info, tab);
    }
});

function sendCreateAnnotation(info, tab) {
    // Add the current context element
    info.elementType = contextElementData.elementType;
    info.elementAuditID = contextElementData.elementAuditID;
    
    // Inform content script to add an annotation
    let message = {
        type: 'createAnnotation',
        content: info
    };

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tab.id, message, function () {
            console.log('message sent');
        });
    });

    contextElement = undefined;
}

chrome.storage.sync.set({ darkModeByDefault: true }, function () {
    console.log("by default, the extension is in dark mode, because it's dark mode");
});