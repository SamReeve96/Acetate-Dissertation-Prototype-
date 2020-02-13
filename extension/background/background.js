// Add listener for messaged
chrome.runtime.onMessage.addListener(message => {
    try {
        handleMessage(message);
        return true;
    } catch (err) {
        console.log('message error: ' + err.message);
    }
});

async function handleMessage(message) {
    switch (message.type) {
    case 'changeActiveState':
        sendChangeContainerState();
        break;
    case 'setNewContextElement':
        setContextElementData(message);
        break;
    case 'cacheSheet':
        cacheSheet(message.Sheet, message.modification);
        break;
    case 'loadFromCache':
        sendLoadFromCache(message.key);
        break;
    case 'changeAnnotationSort':
        sendChangeAnnotationSort(message.newSortOrder);
        break;
    case 'getCachedSortOrder_Popup':
        returnCachedSortOrderToPopup();
        break;
    case 'getCachedSortOrder_Content':
        returnCachedSortOrderToContent();
        break;
    }
}

chrome.storage.sync.get('tutorialShown', ({ tutorialShown }) => {
    if (tutorialShown === undefined) {
        chrome.storage.sync.set({ tutorialShown: true }, () => {
            console.log('The tutorial tab will now be shown');

            const tutPageURL = 'https://acetate-34616.web.app/Tutorial/';

            chrome.tabs.create({ url: tutPageURL });
        });
    }
});

// Store the annotation Sheet in chrome sync storage
function cacheSheet(sheetToCache, modification) {
    if (modification) {
        sheetToCache.sheetData.lastModified = Date.now();
    }
    // Save new array of Sheets
    chrome.storage.sync.set({
        cachedSheet: sheetToCache
    });
}

// Listen for browser Action to be clicked (change trigger type?)
chrome.browserAction.onClicked.addListener(tab => {
    // For the current tab, inject the file & execute it
    chrome.tabs.executeScript(tab.ib, {
        file: './contentContainer/contentContainer.js'
    });
});

// Ways the annotation cards can be ordered
const annotationSortMode = {
    ELEMENT: 'Element',
    CREATED: 'Created'
};

let cachedSortOrder = annotationSortMode.ELEMENT;

function returnCachedSortOrderToPopup() {
    // Send message to backend to change active state
    const message = {
        type: 'returnCachedSortOrder',
        sortOrder: cachedSortOrder
    };

    chrome.runtime.sendMessage(message);
}

function returnCachedSortOrderToContent() {
    // Send message to backend to change active state
    const message = {
        type: 'returnCachedSortOrder',
        sortOrder: cachedSortOrder
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function sendChangeContainerState() {
    // Inform content script to change container state
    const message = {
        type: 'changeContainerState'
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function sendChangeAnnotationSort(newSortOrder) {
    // As the sort is changing, change the cache
    cachedSortOrder = newSortOrder;

    // Inform content script to change card sort order
    const message = {
        type: 'sortAnnotations',
        newSortOrder: cachedSortOrder
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id);
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
// Added for debugging storage changes
// Or throw this at the console - chrome.storage.sync.get(null, function (data) { console.info(data) });
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (var key in changes) {
        var storageChange = changes[key];
        console.log(`Storage key "${key}" in namespace "${namespace}" changed. ` +
                  `Old value was "${storageChange.oldValue}", new value is "${storageChange.newValue}".`);
    }
});
