// Manage the page

// Initialize active state variable
let containerStateActive = false;

// Update the extension icon to reflect the extension's state
sendChangeExtensionIcon(containerStateActive);

const currentOriginAndPath = window.location.origin + window.location.pathname;

let currentSheet = {};

// Add listener for messages from backend
chrome.extension.onMessage.addListener(message => {
    try {
        handleMessage(message);
        return true;
    } catch (err) {
        console.log('message error: ' + err.message);
    }
});

async function handleMessage(message) {
    switch (message.type) {
    case 'changeContainerState':
        changeContainerState();
        break;
    case 'createAnnotation':
        createDraftAnnotation(message.content);
        break;
    case 'sortAnnotations':
        cachedSortOrder = message.newSortOrder;
        sortAnnotations(message.newSortOrder);
        break;
    case 'returnCachedSortOrder':
        cachedSortOrder = message.sortOrder;
        break;
    case 'sheetLoaded':
        currentSheet = message.currentSheet;
        loadAnnotationsFromSheet();
        break;
    case 'syncIconState':
        sendChangeExtensionIcon(containerStateActive);
    }
}

// Open the comment window and contain content on page load
chrome.storage.sync.get('activeOnPageLoad', data => {
    const savedStateActive = data.activeOnPageLoad;

    if (savedStateActive) {
        loadExtension();
    }
    // If the container isn't active in settings don't wrap content

    // Update the current state to the saved state
    containerStateActive = savedStateActive;
});

function changeContainerState() {
    if (!containerStateActive) {
        loadExtension();
    } else {
        unloadExtension();
    }

    // Invert container state
    containerStateActive = !containerStateActive;
}

function loadExtension() {
    getCachedSortOrder();
    auditElements();
    createCommentContainer();
    loadSheetForPage();
    addScriptsToPage();

    // Change icon to show active icon
    sendChangeExtensionIcon(true);
}

function unloadExtension() {
    // (For now, not un-auditing elements, they shouldn't cause any unexpected effects)
    removeCardContainerShadow();
    removeAnnotatedElemStyling();
    clearElementAnnotationEventMap();

    // Change icon to show disabled icon
    sendChangeExtensionIcon(false);
}

async function sendChangeExtensionIcon(state) {
    const message = {
        type: 'changeExtensionIcon',
        state: state
    };

    await chrome.runtime.sendMessage(message, undefined, response => {
        return true;
    });
}

async function sendCheckCacheAndFirestoreSheet() {
    const message = {
        type: 'checkCacheAndFireStoresheet',
        currentOriginAndPath: currentOriginAndPath
    };

    await chrome.runtime.sendMessage(message, undefined, response => {
        return true;
    });
}

async function loadSheetForPage() {
    // trigger backend to get the latest sheet for current url
    sendCheckCacheAndFirestoreSheet();
}

function removeCardContainerShadow() {
    // Remove Shadow container
    var shadowContainer = document.querySelector('#shadowContainer');
    shadowContainer.parentNode.removeChild(shadowContainer);
}

// Label all elements on the page we can authenticate an element is the same as it was when created by comparing auditID and element type
function auditElements() {
    let elementCounter = 1;
    const elementsToAudit = document.querySelector('body');
    elementsToAudit.querySelectorAll('*').forEach(element => {
        element.setAttribute('element_audit_id', elementCounter);
        elementCounter++;
    });
}

// Manage the content container
function addScriptsToPage() {
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const shadowHead = shadow.querySelector('shadowHead');
    // Add google font for now
    shadowHead.insertAdjacentHTML('afterbegin', "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>");

    getCardsContainerStyleSheet();
}

function getCardsContainerStyleSheet() {
    const shadow = document.querySelector('div#shadowContainer').shadowRoot;
    const shadowHead = shadow.querySelector('shadowHead');

    const cardsContainerCssURL = chrome.runtime.getURL('/contentScripts/commentContainer/commentContainer.css');
    fetch(cardsContainerCssURL).then(response => response.text()).then(data => {
        shadowHead.insertAdjacentHTML('afterbegin', `<style> ${data} </style>`);
    });
}

function createCommentContainer() {
    document.body.insertAdjacentHTML('afterbegin',
        '<div id="shadowContainer"></div>'
    );

    const shadowContainer = document.querySelector('div#shadowContainer');
    const shadow = shadowContainer.attachShadow({ mode: 'open' });

    const shadowHead = '<shadowHead></shadowHead>';
    const cardsContainer = '<cardsContainer></cardsContainer>';

    // By default a comment box is in edit mode
    const template = '<template>' +
        '<div class="commentBox edit">' +
            '<textarea class="commentTextArea"> ' +
            'If you\'re reading this, then the template was used incorrectly' +
            '</textarea> ' +
            '<div class="controls">' +
                '<button id="annotate">Annotate</button>' +
                '<button id="update" class="hidden">Update Annotation</button>' +
                '<button id="edit"   class="hidden">Edit Annotation</button>' +
                '<button id="delete" class="hidden">Delete Annotation</button>' +
                '<button id="thread" class="hidden">Toggle Thread</button>' +
                '<button id="cancel">Cancel</button>' +
            '</div>' +
        '</div>' +
    '</template>';

    shadow.innerHTML = shadowHead + cardsContainer + template;
}

// Work out what element was right clicked
document.addEventListener('mousedown', event => {
    // Right click
    if (event.button === 2) {
        contextElement = event.target;

        const message = {
            type: 'setNewContextElement',
            // contextElement: contextElement, look into this...
            elementType: contextElement.nodeName,
            elementAuditID: contextElement.getAttribute('element_audit_id')
        };

        chrome.runtime.sendMessage(message);
    }
}, true);

document.addEventListener('keydown', keyPress);

function keyPress(event) {
    // && pressedKeys.o) {
    if (event.key === 'o') {
        toggleCards();
    }
}
let allCardsOutToggle = false;
function toggleCards() {
    if (allCardsOutToggle) {
        SlideBackCards(undefined, true);
        allCardsOutToggle = false;
    } else {
        SlideOutCards(undefined, true);
        allCardsOutToggle = true;
    }
}

// An array of id's to slide out
function SlideOutCards(annotationsToSlide, allCards = false) {
    if (!containerStateActive) {
        return;
    }

    if (allCards) {
        // Slide all annotations
        annotationsToSlide = currentSheet.sheetData.annotations.map(annotation => {
            return annotation.ID;
        });
    }

    // Delay for animation in ms
    let delay = 0;
    const animationTotalTime = 62;
    const delayIncrementSize = animationTotalTime / annotationsToSlide.length;

    annotationsToSlide.forEach(annotationId => {
        const shadow = document.querySelector('div#shadowContainer').shadowRoot;
        const annotationToSlide = shadow.querySelector('[annotationid="' + annotationId + '"]');
        setTimeout(() => {
            annotationToSlide.classList.add('slideOut');
        }, delay);
        delay += delayIncrementSize;
    });
}

function SlideBackCards(annotationsToSlide, allCards = false) {
    if (!containerStateActive) {
        return;
    }

    if (allCards) {
        // Slide all annotations
        annotationsToSlide = currentSheet.sheetData.annotations.map(annotation => {
            return annotation.ID;
        });
    }

    // Delay for animation in ms
    let delay = 0;
    const animationTotalTime = 62;
    const delayIncrementSize = animationTotalTime / annotationsToSlide.length;

    annotationsToSlide.forEach(annotationId => {
        const shadow = document.querySelector('div#shadowContainer').shadowRoot;
        const annotationToSlide = shadow.querySelector('[annotationid="' + annotationId + '"]');
        setTimeout(() => {
            annotationToSlide.classList.remove('slideOut');
        }, delay);
        delay += delayIncrementSize;
        ;
    });

    delay = 0;
}

// Map of element to array of element IDs
// Eslint is disabled for this line, var is assigned in another file
// eslint-disable-next-line prefer-const
let elementAnnotationsMap = {};

function clearElementAnnotationEventMap() {
    elementAnnotationsMap = {};
}

function onElementMouseOver(annotatedElem) {
    if (allCardsOutToggle) {
        return;
    }

    const annotatedElemID = annotatedElem.getAttribute('element_audit_id');
    const annotationCardsToSlide = elementAnnotationsMap[annotatedElemID];
    SlideOutCards(annotationCardsToSlide);
}

function onElementMouseLeave(annotatedElem) {
    if (allCardsOutToggle) {
        return;
    }

    const annotatedElemID = annotatedElem.getAttribute('element_audit_id');
    const annotationCardsToSlide = elementAnnotationsMap[annotatedElemID];
    SlideBackCards(annotationCardsToSlide);
}

// selectionText is unused for now
// Style and attach a hover event
function attachAnnotatedElementTrigger(annotationId, elementAuditID, selectionText) {
    const annotatedElem = document.querySelector('[element_audit_id="' + elementAuditID + '"]');

    // Style and hover trigger
    annotatedElem.classList.add('annotated');

    const annotatedElemID = annotatedElem.getAttribute('element_audit_id');

    if (!elementAnnotationsMap[annotatedElemID]) {
        elementAnnotationsMap[annotatedElemID] = [annotationId];

        annotatedElem.addEventListener('mouseover', () => {
            onElementMouseOver(annotatedElem);
        });

        annotatedElem.addEventListener('mouseleave', () => {
            onElementMouseLeave(annotatedElem);
        });
    } else {
        elementAnnotationsMap[annotatedElemID].push(annotationId);
    }
}

console.log('ready for lift off');
