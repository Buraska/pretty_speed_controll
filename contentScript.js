(() => {
  initializeWhenReady(document)
})();

const controllerBrain = new ControllerBrain()

let currentVideo;
let isInitialized = false
let xPos = (window.innerWidth - window.innerWidth / 5) + "px";
let yPos = (0) + "px"
let isWidgetActive = false
let observedVideos = new WeakSet()
let videoPressed = false
let activeClickMarker = null

let vscOffsetX = 140
let vscOffsetY = 59

function setupPressingListeners() {
  document.querySelectorAll("video").forEach(attachPressingListenerToVideo)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation?.addedNodes?.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return

        if (node.tagName === "VIDEO") {
          attachPressingListenerToVideo(node)
        }
        node.querySelectorAll?.("video")?.forEach(attachPressingListenerToVideo)
      })
    }
  })
  observer.observe(document, { childList: true, subtree: true })
}



const swallowClick = (e) => {
  e.stopPropagation()
}

function attachPressingListenerToVideo(video) {
  if (!video || observedVideos.has(video)) return
  observedVideos.add(video)

  video.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    videoPressed = true;
    setTimeout(() => {
      if (videoPressed) {
        video.addEventListener("click", swallowClick, { capture: true, once: true })

        currentVideo = video
        controllerBrain.setCurrentVideo(video)
        if (!isWidgetActive) {
          xPos = `${e.clientX + window.scrollX - vscOffsetX}px`
          yPos = `${e.clientY + window.scrollY - vscOffsetY}px`
        }
        showClickMarker(e.clientX, e.clientY)
        controllerBrain.toggleOn()
      }
    }, 499);
  }, true);

  video.addEventListener("mouseup", () => {
    videoPressed = false
  })

}

function showClickMarker(clientX, clientY) {
  if (activeClickMarker) {
    activeClickMarker.remove();
    activeClickMarker = null;
  }

  const left = `${clientX + window.scrollX}px`;
  const top = `${clientY + window.scrollY - 36}px`;
  const speedLabelText = controllerBrain.getToggleSpeed()

  const markerTemplate = `
    <div class="vsc-marker-label">${speedLabelText}</div>
    <div class="vsc-marker-circle">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path fill="#ffffff" d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-6 8.73V17a1 1 0 1 0 2 0v-.27a2 2 0 1 0-2 0zM10 8V6a2 2 0 1 1 4 0v2h-4z"/>
      </svg>
    </div>
  `;

  const marker = document.createElement("div");
  marker.className = "vsc-marker";
  marker.style.left = left;
  marker.style.top = top;
  marker.innerHTML = markerTemplate;

  document.body.appendChild(marker);
  activeClickMarker = marker;

  const lockIcon = marker.querySelector(".vsc-marker-circle svg");

  const cleanupMarker = () => {
    marker.remove();
    if (activeClickMarker === marker) {
      activeClickMarker = null;
    }
  };

  const markerMouseUpHandler = () => {
    marker.classList.add("vsc-marker-clicked");
    lockIcon.classList.add("vsc-lock-animate");
    document.removeEventListener("mouseup", documentMouseUpHandler, true);
    currentVideo.addEventListener("mouseup", documentMouseUpHandler, {capture: true, once: true});

    marker.addEventListener("click", () => {
      setTimeout(() => {
        attachSpeedController();
        document.removeEventListener("mouseup", documentMouseUpHandler, true);
        currentVideo.removeEventListener("mouseup", documentMouseUpHandler, true);

        cleanupMarker();
        currentVideo?.removeEventListener("click", swallowClick, true);
      }, 120);
    }, { once: true });
  };

  const documentMouseUpHandler = (event) => {
    if (!marker.contains(event.target)) {
      cleanupMarker();
      // currentVideo?.removeEventListener("click", swallowClick, true);
      controllerBrain.toggleOff();
    }
  };

  marker.addEventListener("mouseup", markerMouseUpHandler, { once: true });
  document.addEventListener("mouseup", documentMouseUpHandler, {capture: true, once: true});
}



// function toggleSpeed() {
//   if (!currentVideo) return
//   if (currentVideo.playbackRate == 1.00) { currentVideo.playbackRate = toggleRate }
//   else {
//     currentVideo.playbackRate = 1
//   }
// }

function attachSpeedController() {
  //TODO No need to reload it fully.
  //Delete and reload the vidget if it already exists
  if (isWidgetActive) {
    document.querySelector("#pretty-vsc").shadowRoot.querySelector("#closeButton").click();
  }
  isWidgetActive = true

  controllerBrain.setCurrentVideo(currentVideo)
  let speedValue = controllerBrain.getCurrentSpeed(false)
  if (speedValue == null || Number.isNaN(speedValue)) speedValue = 1
  const wrapper = document.createElement("div");
  wrapper.classList.add("vsc-controller");
  wrapper.id = "pretty-vsc";
  let toggleRate = controllerBrain.getToggleSpeed()
  let baseRate = controllerBrain.getBaseSpeed()
  const isToggled = controllerBrain.getIsToggled()

  const activeRateStyle = "font-size: 1.6em; font-weight: 800;"
  const shadow = wrapper.attachShadow({ mode: "open" });
  const shadowTemplate = `
        <style>
          @import "${chrome.runtime.getURL("shadow.css")}";
        </style>
        
        <div style="top:${yPos}; left:${xPos};" class="container draggable">
        
      <div class="top-bar">
      <span style="user-select: none;" class="min-value">0.1</span>
      <input type="range" min="1" max="40" value="${Math.round(speedValue * 10)}" class="slider" id="speedSlider">
      <span style="user-select: none;" class="max-value">4.0</span>
    </div>

      <div class="bottom-bar">
          <div class="speed-display">
            <span id="baseRate" class="toggle-rate-value" style="${isToggled ? "" : activeRateStyle}">${baseRate}</span>
            <span class="speed-label">base rate</span>
          </div>
          <div class="speed-display">
            <span style="user-select: none; ${isToggled ? activeRateStyle : ""}" id="toggleRate">${toggleRate}</span>
            <span class="speed-label">toggle rate</span>
          </div>
          <button id="restoreButton" class="button restoreButton">⇆</button>
          <span><button id="closeButton" class="button closeButton">X</button></span>
      </div>

        </div>
      `;

  shadow.innerHTML = shadowTemplate;
  document.getElementsByTagName("body")[0].parentNode.appendChild(wrapper)

  // Putting container up to the mouse click

  const restoreButton = shadow.querySelector("#restoreButton");
  const slider = shadow.querySelector("#speedSlider");
  const baseRateElement = shadow.querySelector("#baseRate");
  const toggleRateElement = shadow.querySelector("#toggleRate");
  const closeButton = shadow.querySelector("#closeButton");

  const draggableHandler = (e) => {
    handleDrag(e, wrapper.shadowRoot)
    e.stopPropagation();
  }


  const toggleButtonHandler = function () {
    controllerBrain.toggleSpeed()
    const big = activeRateStyle
    const small = ""
    if (controllerBrain.getIsToggled()) {
      baseRateElement.style.cssText = ""
      toggleRateElement.style.cssText = `user-select: none; ${big}`
    } else {
      baseRateElement.style.cssText = big
      toggleRateElement.style.cssText = "user-select: none;"
    }  
  }

  const sliderHandler = function (event) {
    controllerBrain.setCurrentSpeed(Number(event.currentTarget.value) * 0.1)
    baseRateElement.textContent = controllerBrain.getBaseSpeed()
    toggleRateElement.textContent = controllerBrain.getToggleSpeed()
  }

  const ratechangeHandler = () => {
    const rate = controllerBrain.getCurrentSpeed(false);
    if (rate == null || Number.isNaN(rate)) return;
    slider.value = String(Math.round(rate * 10));
  }

  const closeButtonHandler = function () {
    currentVideo.removeEventListener("ratechange", ratechangeHandler);
    closeButton.removeEventListener("click", closeButtonHandler);
    restoreButton.removeEventListener("click", toggleButtonHandler);
    slider.removeEventListener("input", sliderHandler);
    shadow.querySelector(".draggable").removeEventListener("mousedown", draggableHandler);
    wrapper.remove();
    isWidgetActive = false;
    controllerBrain.toggleOff();
  };

  currentVideo.addEventListener("ratechange", ratechangeHandler);
  restoreButton.addEventListener("click", toggleButtonHandler);
  slider.addEventListener("input", sliderHandler);
  shadow.querySelector(".draggable").addEventListener("mousedown", draggableHandler);
  closeButton.addEventListener("click", closeButtonHandler);
}

function handleDrag(e, controller) {
  if ((e.target.tagName !== "DIV" && e.target.tagName !== "SPAN")) {
    return;
  }

  const shadowContainer = controller.querySelector(".draggable");

  shadowContainer.classList.add("dragging");

  const initialMouseXY = [e.clientX, e.clientY];
  const initialControllerXY = [
    parseInt(shadowContainer.style.left),
    parseInt(shadowContainer.style.top)
  ];


  const startDragging = (e) => {
    let style = shadowContainer.style;
    let dx = e.clientX - initialMouseXY[0];
    let dy = e.clientY - initialMouseXY[1];
    style.left = initialControllerXY[0] + dx + "px";
    style.top = initialControllerXY[1] + dy + "px";
  };

  const stopDragging = () => {
    window.removeEventListener("mousemove", startDragging);
    window.removeEventListener("mouseup", stopDragging);
    window.removeEventListener("mouseleave", stopDragging);
    shadowContainer.classList.remove("dragging");

    let style = shadowContainer.style;
    xPos = style.left
    yPos = style.top
  };

  window.addEventListener("mouseup", stopDragging);
  window.addEventListener("mouseleave", stopDragging);
  window.addEventListener("mousemove", startDragging);
}


function initializeNow(document) {
  if (isInitialized) { return }
  isInitialized = true
  setupPressingListeners()
}

function initializeWhenReady(document) {
  window.onload = () => {
    initializeNow(document);
  };
  if (document) {
    if (document.readyState === "complete") {
      initializeNow(document);
    } else {
      document.onreadystatechange = () => {
        if (document.readyState === "complete") {
          initializeNow(document);
        }
      };
    }
  }
}


