let activateButton = document.getElementById('Activate');

activateButton.onclick = function () {
    let message = {
        body: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};
