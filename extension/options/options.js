let activeOnPageLoadCheckBox = document.getElementById('activeOnPageLoad');

chrome.storage.sync.get('activeOnPageLoad', function (data) {
    activeOnPageLoadCheckBox.checked = data.activeOnPageLoad;
});

activeOnPageLoad.addEventListener( 'change', function() {
    chrome.storage.sync.set({ activeOnPageLoad: activeOnPageLoadCheckBox.checked }, function () {
        console.log('acetate is active on page load:' + activeOnPageLoadCheckBox.checked);
    });
});