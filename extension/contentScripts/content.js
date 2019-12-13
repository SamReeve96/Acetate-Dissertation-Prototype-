// Manage the page

// initialize active state variable
let containerStateActive = false;

// add listener for messages from backend
chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    if (request.type === 'changeContainerState') {
        changeContainerState();
    }
    if (request.type === 'addAnnotation') {
        AddAnnotation(request.content);
    }
}

// open the comment window and contain content on page load
chrome.storage.sync.get('activeOnPageLoad', function (data) {
    let savedStateActive = data.activeOnPageLoad;

    if (savedStateActive) {
        // need to remove this on close
        addScriptsToPage();
        containPageContent();
        createCommentContainer();
        auditElements();

        // done for the demo, as normally it'd load pre-existing annotations or user can add to empty
        AddAnnotation();
    }
    //If the container isn't active in settings don't wrap content

    //Update the current state to the saved state
    containerStateActive = savedStateActive;
});

function changeContainerState() {
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

        // done for the demo, as normally it'd load pre-existing annotations or user can add to empty
        AddAnnotation();
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
        '<h1 id=containerHeader >Annotations</h1>' +
    '</commentsContainer>' +

    '<template>' +
        '<div class="commentBox">' +
            '<textarea class="commentTextArea" rows="4" cols="20"> ' +
            'If you\'re reading this, then the template was used incorrectly' +
            '</textarea> '+
        
            '<button class="addAnnotation">Add annotation</button>' +
        '</div>' +
    '</template>';

    document.body.id = 'alteredBody';
}

//-----------------

document.addEventListener("mousedown", function(event){
    //right click
    if(event.button == 2) { 
        contextElement = event.target;

        let message = {
            type: 'setNewContextElement',
            content: contextElement.nodeName,
        };
    
        chrome.runtime.sendMessage(message);
    }
}, true);

console.log('ready for lift off');
