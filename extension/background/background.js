// Add listener for messaged
chrome.runtime.onMessage.addListener(async message => {
    try {
        await handleMessage(message).then(() => {
            return true;
        });
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
    case 'changeAnnotationSort':
        sendChangeAnnotationSort(message.newSortOrder);
        break;
    case 'getCachedSortOrder_Popup':
        returnCachedSortOrderToPopup();
        break;
    case 'getCachedSortOrder_Content':
        returnCachedSortOrderToContent();
        break;
    case 'checkCacheAndFireStoresheet':
        await checkCacheAndFirestoreSheet(message.currentOriginAndPath);
        break;
    case 'updateFirestoreSheet':
        updateFirestoreSheet(message.sheet);
        break;
    case 'changeExtensionIconAndContextMenu':
        changeExtensionIcon(message.state);
        changeContextmenuControls(message.state);
        break;
    }
    return true;
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

const icons = {
    enabled: {
        16: '/images/acetate16.png',
        32: 'images/acetate32.png',
        48: '/images/acetate48.png',
        128: '/images/acetate128.png'
    },
    disabled: {
        16: '/images/acetate16_Disabled.png',
        32: 'images/Acetate32_Disabled.png',
        48: '/images/Acetate48_Disabled.png',
        128: '/images/Acetate128_Disabled.png'
    }
};

// change the extension icon based on Acetate state
function changeExtensionIcon(active = false) {
    const icon = active ? icons.enabled : icons.disabled;

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        // tabId: tabs[0].id,
        chrome.browserAction.setIcon({ path: icon });
    });
}

chrome.tabs.onActivated.addListener(async() => {
    const message = {
        type: 'syncIconState'
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, message, null, () => { return true; });
    });
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
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function changeContextmenuControls(activeState) {
    if (activeState) {
        addAcetateControlsToContextmenu();
    } else {
        removeAcetateControlsToContextmenu();
    }
}

// Context menu ID
const annotateElementCMenuID = 'Annotate Element';

function addAcetateControlsToContextmenu() {
    // Create the Annotate right-click menu option (remove all and re-add to ensure it isnt duplicated)
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: annotateElementCMenuID,
            title: 'Annotate %s',
            contexts: ['page', 'selection', 'image', 'link']
        });
    });
}

function removeAcetateControlsToContextmenu() {
    // Create the Annotate right-click menu option (remove all and re-add to ensure it isnt duplicated)
    chrome.contextMenus.removeAll();
}

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
    contextElementData = undefined;
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

let currentSheet = {};

async function checkCacheAndFirestoreSheet(currentOriginAndPath) {
    let cachedSheet = {
        sheetId: undefined,
        sheetData: {
            URL: undefined,
            lastModified: undefined,
            annotations: []
        }
    };

    const newSheet = {
        sheetId: undefined,
        sheetData: {
            URL: currentOriginAndPath,
            lastModified: Date.now(),
            annotations: []
        }
    };

    chrome.storage.sync.get('cachedSheet', result => {
        if (result.cachedSheet !== undefined) {
            cachedSheet = result.cachedSheet;
        }
    });

    await loadSheetFromFirestore(currentOriginAndPath)
        .then(async fireStoreSheet => {
        // Determine what sheet to use if any (no need to check if firestore doesnt exist and cached does as that is only possible if cached isnt uplaoded)
            if (fireStoreSheet.sheetData.URL === undefined && cachedSheet.sheetData.URL !== currentOriginAndPath) {
            // if the firestore sheet isnt defined and cached sheet are not for this page, create a new sheet
                currentSheet = newSheet;

                // Upload new sheet to firebase
                await addSheetToFirestore(currentSheet);

                // Set cached new sheet to new sheet
                cacheSheet(currentSheet, true);
            } else if (cachedSheet.sheetData.URL !== currentOriginAndPath) {
            // if firestore sheet is defined for this page but cached sheet is not, set cached sheet to firestore sheet
                currentSheet = fireStoreSheet;

                // Set cached to fireStore sheet
                cacheSheet(currentSheet, false);
            } else if (fireStoreSheet.sheetData.URL === undefined) {
            // cached sheet is populated but not on the firestore, upload
                currentSheet = cachedSheet;
                await addSheetToFirestore(currentSheet);

                // Set cached new sheet to new sheet
                cacheSheet(currentSheet, true);
            } else {
            // if the cached sheet and firestore sheet are both for the current url, compare last modified date
                if (fireStoreSheet.sheetData.lastModified > cachedSheet.sheetData.lastModified) {
                // firestore is more recent, set the cache to use firestore sheet
                    currentSheet = fireStoreSheet;

                    // Set cached sheet to fireStore sheet
                    cacheSheet(currentSheet, false);
                } else if (fireStoreSheet.sheetData.lastModified < cachedSheet.sheetData.lastModified) {
                // cached sheet is more recent update firestore sheet with cached sheet
                    currentSheet = cachedSheet;

                    // update cachedSheet to firebase
                    await updateFirestoreSheet(currentSheet);
                } else {
                // Cached sheet and firestore sheet are the same, just use cached
                    currentSheet = cachedSheet;
                }
            }

            const message = {
                type: 'sheetLoaded',
                currentSheet: currentSheet
            };

            // Send message
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, message);
            });
        });
}

async function loadSheetFromFirestore(currentOriginAndPath) {
    // Fetch sheet via url
    let firestoreSheet = {
        sheetId: undefined,
        sheetData: {
            URL: undefined,
            lastModified: undefined,
            annotations: []
        }
    };

    // fetch and update firestoreSheet attrs
    const response = await getData('https://acetate-34616.web.app/loadSheetByURL?sheetUrl=' + currentOriginAndPath, true);

    if (response.msg === undefined) {
        //  Didn't get the page not found msg, so a sheet was returned
        firestoreSheet = response;
    }

    return firestoreSheet;
}

async function addSheetToFirestore(newSheet) {
    // fetch and update firestoreSheet attrs
    await postData('https://acetate-34616.web.app/addSheet', newSheet.sheetData, true)
        .then(response => {
            currentSheet.sheetId = response.newSheetId;
        });
}

async function updateFirestoreSheet(sheet) {
    // fetch and update firestoreSheet attrs
    await postData('https://acetate-34616.web.app/updateSheet?sheetID=' + sheet.sheetId, sheet.sheetData, false);
}

async function postData(url = '', data = {}, expectResponse = false) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST',
        // *GET, POST, PUT, DELETE, etc.
        mode: 'cors',
        // no-cors, *cors, same-origin
        cache: 'no-cache',
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin',
        // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        // manual, *follow, error
        referrerPolicy: 'no-referrer',
        // no-referrer, *client
        body: JSON.stringify(data)
        // body data type must match "Content-Type" header
    });
    if (expectResponse) {
        return response.json();
    }
}

async function getData(url = '', expectResponse = false) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'GET',
        // *GET, POST, PUT, DELETE, etc.
        mode: 'cors',
        // no-cors, *cors, same-origin
        cache: 'no-cache',
        // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin',
        // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        // manual, *follow, error
        referrerPolicy: 'no-referrer'
        // no-referrer, *client
    });
    if (expectResponse) {
        return response.json();
    }
}
