// Add listener to change extension state (triggered by popup.js)
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

chrome.storage.sync.set({ activeOnPageLoad: true }, () => {
    console.log("by default, the extension is active, because it's in development and it saves time");
});

// Listen for browser Action to be clicked (change trigger type?)
chrome.browserAction.onClicked.addListener(tab => {
    // For the current tab, inject the file & execute it
    chrome.tabs.executeScript(tab.ib, {
        file: './contentContainer/contentContainer.js'
    });
});

function sendChangeContainerState() {
    // Inform content script to change container state
    const message = {
        type: 'changeContainerState'
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, message, () => {
            console.log('message sent');
        });
    });
}

// Context menu ID
const annotateElementCMenuID = 'Annotate Element';

// Create the Annotate right-click menu option
chrome.contextMenus.create({
    id: annotateElementCMenuID,
    title: 'Annotate %s',
    contexts: ['page', 'selection', 'image', 'link']
});

// Holds the element triggered when right-clicking
let contextElementData;

// Set the element of the last right clicked element from the buffer in the
function setContextElementData(newElementData) {
    contextElementData = newElementData;
}

// If the user selected the annotate '' right-click menu option, call the corresponding function
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === annotateElementCMenuID) {
        // Get element right clicked
        sendCreateAnnotation(info, tab);
    }
});

// Send a message to the commentContainer script to create an annotation
function sendCreateAnnotation(info, tab) {
    // Add the current context element
    info.elementType = contextElementData.elementType;
    info.elementAuditID = contextElementData.elementAuditID;

    // Inform content script to add an annotation
    const message = {
        type: 'createAnnotation',
        content: info
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tab.id, message, () => {
            console.log('message sent');
        });
    });

    // Reset the context element
    contextElement = undefined;
}

chrome.storage.sync.set({ darkModeByDefault: true }, () => {
    console.log("by default, the extension is in dark mode, because it's dark mode");
});

// Store the annotation instance in chrome sync storage
function cacheInstance(currentInstance) {
    // Get all the instances
    chrome.storage.sync.get(['annotationInstances'], storage => {
        let annotationInstances = storage.annotationInstances;

        if (annotationInstances) {
            // See if there is a saved instance for the current URL
            const savedInstance = storage.annotationInstances.find(instance => (instance.url === currentInstance.url));

            if (savedInstance !== undefined) {
                // Chrome sync storage has an instance
                // Remove old instance, as a new version will be added to the list of instances
                annotationInstances = annotationInstances.filter(instance => (instance.url !== currentInstance.url));
            }
        } else {
            // Storage has no instances, create a new empty array of instances
            annotationInstances = [];
        }
        // Add new url instance
        annotationInstances.push(currentInstance);
        // Save new array of instances
        chrome.storage.sync.set({
            annotationInstances: annotationInstances
        });
    });
}

// Added for debugging storage changes
// Or throw this at the console - chrome.storage.sync.get(null, function (data) { console.info(data) });
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
        var storageChange = changes[key];
        console.log(`Storage key "${key}" in namespace "${namespace}" changed. ` +
                  `Old value was "${storageChange.oldValue}", new value is "${storageChange.newValue}".`);
    }
});
