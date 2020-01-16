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
        case 'cacheInstance':
            cacheInstance(request.instance);
            break;
        case 'loadFromCache':
            sendLoadFromCache(request.key);
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

function cacheInstance(currentInstance) {
    // get all the instances
    chrome.storage.sync.get(['annotationInstances'], function (result) {
        let annotationInstances = result.annotationInstances;

        // if there are any instances
        if (annotationInstances)
        {
            let filteredInstances = result.annotationInstances.filter(instance => (instance.url === currentInstance.url));

            if (filteredInstances.length == 1) { // TODO: handle multiple instances of the same page, 
                // update instances (remove old instance of url
                annotationInstances = annotationInstances.filter(instance => (instance.url !== currentInstance.url));
            }
        } else {
            annotationInstances = [];
        }
        // Add new url instance
        annotationInstances.push(currentInstance);
        // save new array of instances
        chrome.storage.sync.set({
            'annotationInstances': annotationInstances
        });
    });
}

// added for debugging storage changes
// Or throw this at the console - chrome.storage.sync.get(null, function (data) { console.info(data) });
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
      var storageChange = changes[key];
      console.log('Storage key "%s" in namespace "%s" changed. ' +
                  'Old value was "%s", new value is "%s".',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
    }
});