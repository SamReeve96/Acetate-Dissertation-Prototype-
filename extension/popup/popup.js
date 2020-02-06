const activateButton = document.getElementById('Activate');
activateButton.onclick = function() {
    // Send message to backend to change active state
    const message = {
        type: 'changeActiveState'
    };

    chrome.runtime.sendMessage(message);
};

const sortDropdown = document.querySelector('#annotationCardSort');
sortDropdown.addEventListener('change', () => {
    // Send a message to backend to change sort order
    const message = {
        type: 'changeAnnotationSort'
    };

    chrome.runtime.sendMessage(message);
});
