chrome.storage.sync.set({ activeOnPageLoad: true }, function () {
    console.log("by default, the extension is active, because it's in development and it saves time");
});

chrome.runtime.onMessage.addListener(reciver);
function reciver(request, sender, sendResponse) {
    console.log(request);
    if (request.body === 'changeActiveState') {
        changeContainerState();
    }
}

function changeContainerState() {
    //Inform content script to change container state
    let message = {
        body: 'changeContainerState'
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function () {
            console.log('message sent');
        });
    });
}