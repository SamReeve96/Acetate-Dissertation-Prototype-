const activateButton = document.getElementById('Activate');

activateButton.onclick = function() {
    const message = {
        type: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};

const darkModeButton = document.getElementById('DarkMode');
darkModeButton.addEventListener('click', () => {
    const message = {
        type: 'changeTheme'
    };

    // Send message
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message, () => {
            console.log('message sent');
        });
    });
});
