let activateButton = document.getElementById('Activate');

activateButton.onclick = function () {
    let message = {
        type: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};
