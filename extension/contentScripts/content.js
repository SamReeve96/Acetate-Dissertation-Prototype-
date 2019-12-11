// Manage the page

// intialze active state variable
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
        containPageContent()
        createCommentContainer();

        // done for the demo, as normally it'd load preexsiting annos or user can add to empty
        AddAnnotation();
    }
    //If the container isnt active in settings dont wrap content

    //Update the current state to the saved state
    containerStateActive = savedStateActive;
});

function changeContainerState() {
    if (containerStateActive) {
        // container is active so release the content
        let originalPageContentsElem = document.getElementById('containedBody');
        let originalPageContents = originalPageContentsElem.innerHTML;
        document.body.innerHTML = originalPageContents;
        document.body.removeAttribute("id")
    } else {
        // content will be wrapped

        addScriptsToPage();
        containPageContent()
        createCommentContainer();

        // done for the demo, as normally it'd load preexsiting annos or user can add to empty
        AddAnnotation();
    }

    containerStateActive = !containerStateActive;
}

// Manage the content conatiner
function addScriptsToPage() {
    //Add google font for now
    document.head.innerHTML = document.head.innerHTML + 
    "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet'>"
}

function containPageContent() {
    document.body.innerHTML = '<div id="containedBody">' + document.body.innerHTML + '</div>'
}

function createCommentContainer() {
    document.body.innerHTML = document.body.innerHTML +
    '<commentsContainer>' +
        '<h1 id=containerHeader >Annotations</h1>' +
    '</commentsContainer>' +

    '<template>' +
        '<div class="commentBox">' +
            '<textarea class="commentTextArea" rows="4" cols="20"> ' +
            'If youre reading this, then the tempate was used incorrectly' +
            '</textarea> '+
        
            '<button class="addAnnotation">Add annotation</button>' +
        '</div>' +
    '</template>';

    document.body.id = 'alteredBody';
}

console.log('ready for lift off');
