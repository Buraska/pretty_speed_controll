document.addEventListener("DOMContentLoaded", async () => {
    const curTab = await getActiveTab()
    let container = document.getElementsByClassName("container")[0]

    chrome.tabs.sendMessage(curTab.id, {type: 'VIDEO_CHECK_REQUEST'}, function(response){
        if (response && response.type === "VIDEO_CHECK_RESULT") {
            if(response.value){
                 let speedValue = parseFloat(response.playbackRate).toFixed(1)

                container.innerHTML = `
                <div class="top-bar">
                  <span class="min-value">0.1</span>
                  <input type="range" min="1" max="40" value="${Math.round(speedValue*10)}" class="slider" id="speedSlider">
                  <span class="max-value">4.0</span>
                </div>
                <div class="bottom-bar">
                    <span></span>
                    <span id="sliderValue">${speedValue}</span>
                    <button id="restoreButton" class="button restoreButton" onClick="onRestoreButtonClick()">R</button>
                </div>
              `;                
              
              const restoreButton = document.getElementById("restoreButton");
              const slider = document.getElementById("speedSlider");
              const sliderValue = document.getElementById("sliderValue");
              
              restoreButton.addEventListener("click", function() {
                slider.value = 10
                speedValue = 1.0.toFixed(1)
                chrome.tabs.sendMessage(curTab.id, {type: 'VIDEO_SPEED_CHANGE', value: speedValue})
                sliderValue.textContent = speedValue;
                
            })

            slider.addEventListener("input", function(event) {
                speedValue = (event.currentTarget.value * 0.1).toFixed(1)
                chrome.tabs.sendMessage(curTab.id, {type: 'VIDEO_SPEED_CHANGE', value: speedValue})
                sliderValue.textContent = speedValue;
                });

            }else{
                container.innerHTML = '<div class="title">No video were founded.</div>'
            }
        }else{
            container.innerHTML = '<div class="title">No response from contentScript</div>'
        }
    });
});


async function getActiveTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }
  