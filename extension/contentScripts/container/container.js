// intialze active state variable
let containerStateActive = false;

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

function addScriptsToPage() {
    document.head.innerHTML = document.head.innerHTML + 
    '<script>' +
        'function fireAddAnno() {' +
            'var evt = document.createEvent("Event");' +
            'evt.initEvent("myCustomEvent", true, false);' +
            
            'function test() {' +
                'alert("test!");' +
            '}' +

            // fire the event
            'document.dispatchEvent(evt); ' +
        '}' +
    '</script>' +

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

    '<template id="commentBox ">' +
        '<div class="commentBoxContainer">' +
            '<textarea rows="4" cols="50"> '+
                'add comment here' +
            '</textarea> '+
            '<button onclick="test()">Add annotation</button'
        '</div>' +
    '</template>';
}

function AddAnnotation() {
    let commentsContainerElem = document.querySelector('commentsContainer');
    let commentBoxTemplate =  document.querySelector('template');

    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    commentsContainerElem.appendChild(clone);
}

chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    if (request.body === 'changeContainerState') {
        changeContainerState();
    }
}

console.log('ready for lift off');

document.addEventListener('myCustomEvent', function() {
    let commentsContainerElem = document.querySelector('commentsContainer');
    let commentBoxTemplate =  document.querySelector('template');

    //Create new comment instance
    let clone = document.importNode(commentBoxTemplate.content, true);
    commentsContainerElem.appendChild(clone);
  });

debugger;