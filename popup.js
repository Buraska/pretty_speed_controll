
document.addEventListener("DOMContentLoaded", async () => {
    const curTab = await getActiveTab()
    let container = document.getElementsByClassName("container")[0]

    //to not create error if reciever was not found due page loading
    try {
        chrome.tabs.sendMessage(curTab.id, { type: 'VIDEO_CHECK_REQUEST' }, function (response) {
            if (response && response.type === "VIDEO_CHECK_RESULT") {
                if (response.value) {
                    container.innerHTML = '<div class="title">Press "Ctr + \\(220 keycode)" for quick startup.</div>'
                } else {
                    container.innerHTML = '<div class="title">No video was founded.</div>'
                }
            } else {
                container.innerHTML = '<div class="title">Page has not been loaded yet or no video was founded.</div>'
            }
        })
    } catch (error) { }
});


async function getActiveTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
