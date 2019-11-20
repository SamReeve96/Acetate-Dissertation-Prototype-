// intialze active state variable
let containerStateActive = false;

chrome.storage.sync.get('activeOnPageLoad', function (data) {
    let savedStateActive = data.activeOnPageLoad;

    if (savedStateActive) {
        document.body.innerHTML = '<div id="containedBody">' + document.body.innerHTML + '</div>';
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
        document.body.innerHTML = '<div id="containedBody">' + document.body.innerHTML + '</div>';
        //Dont do inner html, kills event listeners etc.
    }

    containerStateActive = !containerStateActive;
}

chrome.extension.onMessage.addListener(handleMessage);
function handleMessage(request) {
    if (request.body === 'changeContainerState') {
        changeContainerState();
    }
}

console.log('ready for lift off');

debugger;