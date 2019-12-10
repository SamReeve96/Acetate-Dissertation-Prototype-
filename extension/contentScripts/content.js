// Manage the page

// intialze active state variable
let containerStateActive = false;

// add listener for changes in container state
chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    if (request.body === 'changeContainerState') {
        changeContainerState();
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


        let commentsContainerElem = document.querySelector('commentsContainer');
        let commentBoxTemplate =  document.querySelector('template');

        //Create new comment instance
        let clone = document.importNode(commentBoxTemplate.content, true);
        commentsContainerElem.appendChild(clone);
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
    } else {
        // content will be wrapped

        addScriptsToPage();
        containPageContent()
        createCommentContainer();

        let commentsContainerElem = document.querySelector('commentsContainer');
        let commentBoxTemplate =  document.querySelector('template');

        //Create new comment instance
        let clone = document.importNode(commentBoxTemplate.content, true);
        commentsContainerElem.appendChild(clone);
    }

    containerStateActive = !containerStateActive;
}

// Manage the content conatiner
function addScriptsToPage() {
    document.head.innerHTML = document.head.innerHTML + 


    //Add google font for now
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
            '<textarea class="commentTextArea" rows="4" cols="20"> '+
                'add comment here' +
            '</textarea> '+
            '<button onclick="test()">Add annotation</button'
        '</div>' +
    '</template>';
}

console.log('ready for lift off');