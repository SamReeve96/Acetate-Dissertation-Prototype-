// --- Active by default settings

const activeOnPageLoadCheckBox = document.getElementById('activeOnPageLoad');

chrome.storage.sync.get('activeOnPageLoad', ({ activeOnPageLoad }) => { activeOnPageLoadCheckBox.checked = activeOnPageLoad; });

activeOnPageLoadCheckBox.addEventListener('change', () => {
    chrome.storage.sync.set({ activeOnPageLoad: activeOnPageLoadCheckBox.checked }, () => {
        console.log('acetate is active on page load:' + activeOnPageLoadCheckBox.checked);
    });
});
