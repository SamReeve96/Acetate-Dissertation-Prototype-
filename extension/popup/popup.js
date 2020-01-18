let activateButton = document.getElementById('Activate');

activateButton.onclick = function () {
    let message = {
        type: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};

let darkModeButton = document.getElementById('DarkMode');
darkModeButton.addEventListener('click', function() {
        let message = {
        type: 'changeTheme'
    };

    //Send message
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function () {
            console.log('message sent');
        });
    });
});