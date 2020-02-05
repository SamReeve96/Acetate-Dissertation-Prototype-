// Manage the page

// Initialize active state variable
let containerStateActive = false;

// Check if the comments panel should be in dark mode by default
let darkModeByDefault;

chrome.storage.sync.get('darkModeByDefault', data => {
    darkModeByDefault = data.darkModeByDefault;
});

// Add listener for messages from backend
chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    switch (request.type) {
    case 'changeContainerState':
        changeContainerState();
        break;
    case 'createAnnotation':
        createDraftAnnotation(request.content);
        break;
    case 'changeTheme':
        changeTheme();
        break;
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
    }

    containerStateActive = !containerStateActive;
}

function loadExtension() {
    auditElements();
    createCommentContainer();
    addScriptsToPage();
    loadAnnotationsFromCache();
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
    const shadow = document.querySelector('div#cardsContainer').shadowRoot;

    const cardsContainerURL = chrome.runtime.getURL('/contentScripts/commentContainer/commentContainer.css');

    // Add google font for now
    shadow.innerHTML = shadow.innerHTML +
    "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>" +
    // "<link type=text/css href='" + cardsContainerURL + "'>";
    '<style>' +
    `div#cardsContainer {
        background-color: none;
        font-family: 'roboto', arial;
        height: 100%;
        margin: auto;
        min-height: 100vh;
        position: absolute;
        right: -370px;
        top: 0px;
        width: 400px;
        z-index: 9001;
    }
    
    .commentBox {
        background-color: rgb(53, 53, 53);
        display: flex;
        margin-bottom: 5px;
        max-width: 100%;
        padding: 5px 25px 5px 30px;
        transition: all 0.25s ease-in-out;
            -webkit-transition: all 0.25s ease-in-out; /** Chrome & Safari **/
            -moz-transition: all 0.25s ease-in-out; /** Firefox **/
            -o-transition: all 0.25s ease-in-out; /** Opera **/
    }
    
    .commentBox.slideOut, .commentBox:hover, .commentBox.edit {
        transform: translate(-360px,0);
        -webkit-transform: translate(-360px,0); /** Chrome & Safari **/
        -o-transform: translate(-360px,0); /** Opera **/
        -moz-transform: translate(-360px,0); /** Firefox **/
    }
    
    .commentBox.default, .annotatedElem {
        background-color: #f3936ecf;
    }
    
    .commentTextArea {
        flex: 4;
        min-height: 10em;
        resize: none;
    }
    
    .controls {
        flex: 1;
        height: 100%;
    }
    
    .hidden {
        display: none;
    }
    
    #containerOptions {
        margin: auto;
        width: 80%;
    }
    
    #containerOptions > select, #containerOptions > button {
        display: block;
        margin: auto;
    }` +
    '</style>';
}

function createCommentContainer() {
    document.body.innerHTML = document.body.innerHTML +
    '<div id="cardsContainer">' +
    // Hidden controls for now, will in the future move to popup js
    // '<div id="containerOptions">' +
    //     '<button id="share">Share</button>' +
    //     '<select id="annotationSort">' +
    //         '<option value="Element">Sort by Element</option>' +
    //         '<option value="Created">Sort by Created</option>' +
    //     '</select>' +
    // '</div>' +
    '</div>';

    const cardsContainer = document.querySelector('div#cardsContainer');
    const shadow = cardsContainer.attachShadow({ mode: 'open' });

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

    shadow.innerHTML = template;

    // // If the user has set the theme to be dark mode by default, change to dark mode
    // if (darkModeByDefault) {
    //     changeTheme();
    // }

    // let sortDropdown = document.querySelector('select#annotationSort');
    // sortDropdown.addEventListener('change', function () {
    //     changeSort();
    // });
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
    if (allCards) {
        // Slide all annotations
        annotationsToSlide = currentAnnotationInstance.annotations.map(annotation => {
            return annotation.ID;
        });
    }

    // Delay for animation in ms
    let delay = 0;
    const animationTotalTime = 62;
    const delayIncrementSize = animationTotalTime / annotationsToSlide.length;

    annotationsToSlide.forEach(annotationId => {
        const shadow = document.querySelector('div#cardsContainer').shadowRoot;
        const annotationToSlide = shadow.querySelector('[annotationid="' + annotationId + '"]');
        setTimeout(() => {
            annotationToSlide.classList.add('slideOut');
        }, delay);
        delay += delayIncrementSize;
    });
}

function SlideBackCards(annotationsToSlide, allCards = false) {
    if (allCards) {
        // Slide all annotations
        annotationsToSlide = currentAnnotationInstance.annotations.map(annotation => {
            return annotation.ID;
        });
    }

    // Delay for animation in ms
    let delay = 0;
    const animationTotalTime = 62;
    const delayIncrementSize = animationTotalTime / annotationsToSlide.length;

    annotationsToSlide.forEach(annotationId => {
        const shadow = document.querySelector('div#cardsContainer').shadowRoot;
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
