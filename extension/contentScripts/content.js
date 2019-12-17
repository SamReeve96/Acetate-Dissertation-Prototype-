// Manage the page

// initialize active state variable
let containerStateActive = false;

// add listener for messages from backend
chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    switch (request.type) {
        case 'changeContainerState':
            ChangeContainerState();
            break;
        case 'createAnnotation':
            CreateAnnotation(request.content);
            break;
    }
}

// Check if the comments panel should be in dark mode by default
let darkModeByDefault;

chrome.storage.sync.get('darkModeByDefault', function (data) {
    darkModeByDefault = data.darkModeByDefault;
});

// open the comment window and contain content on page load
chrome.storage.sync.get('activeOnPageLoad', function (data) {
    let savedStateActive = data.activeOnPageLoad;

    if (savedStateActive) {
        // need to remove this on close
        addScriptsToPage();
        containPageContent();
        createCommentContainer();
        auditElements();
    }
    //If the container isn't active in settings don't wrap content

    //Update the current state to the saved state
    containerStateActive = savedStateActive;
});

function ChangeContainerState() {
    if (containerStateActive) {
        // container is active so release the content
        let originalPageContentsElem = document.getElementById('containedBody');
        let originalPageContents = originalPageContentsElem.innerHTML;
        document.body.innerHTML = originalPageContents;
        document.body.removeAttribute("id");
    } else {
        // content will be wrapped

        addScriptsToPage();
        containPageContent();
        auditElements();
        createCommentContainer();
    }

    containerStateActive = !containerStateActive;
}

// Label all elements on the page we can authenticate an element is the same as it was when created by comparing auditID and element type
function auditElements() {
    elementCounter = 1;
    elementsToAudit = document.getElementById('containedBody');
    elementsToAudit.querySelectorAll('*').forEach(function(element) {
        element.setAttribute('element_audit_id', elementCounter);
        elementCounter++;
    });
}

// Manage the content container
function addScriptsToPage() {
    //Add google font for now
    document.head.innerHTML = document.head.innerHTML + 
    "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>";
}

function containPageContent() {
    document.body.innerHTML = '<div id="containedBody">' + document.body.innerHTML + '</div>';
}

function createCommentContainer() {
    document.body.innerHTML = document.body.innerHTML +
    '<commentsContainer>' +
        '<h1 id=containerHeader >' +
            'Annotations' +
            '<button id="darkMode">darkMode</button>' +
        '</h1>' +
        '<div id=comments ></div>' +
    '</commentsContainer>' +

    '<template>' +
        '<div class="commentBox">' +
            '<textarea class="commentTextArea"> ' +
            'If you\'re reading this, then the template was used incorrectly' +
            '</textarea> '+
            '<div class="controls">' +
                '<button>Save Annotation</button>' +
            '</div>' +
        '</div>' +
    '</template>';

    let darkModeButton = document.querySelector('#darkMode');
    darkModeButton.addEventListener('click', function() {
        changeTheme();
    });

    // if the user has set the theme to be dark mode by default, change to dark mode
    if (darkModeByDefault) 
    {
        changeTheme();
    }

    document.body.id = 'alteredBody';
}

//-----------------

// Work out what element was right clicked
document.addEventListener("mousedown", function(event){
    //right click
    if(event.button == 2) { 
        contextElement = event.target;

        let message = {
            type: 'setNewContextElement',
            //contextElement: contextElement, look into this...
            elementType: contextElement.nodeName,
            elementAuditID: contextElement.getAttribute('element_audit_id')
        };
    
        chrome.runtime.sendMessage(message);
    }
}, true);

console.log('ready for lift off');
