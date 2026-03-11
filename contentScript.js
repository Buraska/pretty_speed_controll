(() => {
  initializeWhenReady(document)
})();

let boostSpeed = 2.00;
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
  e.stopPropagation()
    
    videoPressed = true
    setTimeout(() => {
      if (videoPressed) {
        video.addEventListener("click", swallowClick, { capture: true, once: true })

        currentVideo = video
        if (!isWidgetActive) {
          xPos = `${e.clientX + window.scrollX - vscOffsetX}px`
          yPos = `${e.clientY + window.scrollY - vscOffsetY}px`
        }
        showClickMarker(e.clientX, e.clientY)
        toggleSpeed();
      }
    }, 499)
  },
    true)

  video.addEventListener("mouseup", () => {
    videoPressed = false
  })

}

function showClickMarker(clientX, clientY) {
  if (activeClickMarker) {
    activeClickMarker.remove();
    activeClickMarker = null;
  }

  const marker = document.createElement("div");
  marker.className = "vsc-marker";
  marker.style.left = `${clientX + window.scrollX}px`;
  marker.style.top = `${clientY + window.scrollY - 36}px`;

  const markerCircle = document.createElement("div");
  markerCircle.className = "vsc-marker-circle";
  const lockIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lockIcon.setAttribute("viewBox", "0 0 24 24");
  lockIcon.setAttribute("width", "16");
  lockIcon.setAttribute("height", "16");
  lockIcon.setAttribute("aria-hidden", "true");
  lockIcon.innerHTML = '<path fill="#ffffff" d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-6 8.73V17a1 1 0 1 0 2 0v-.27a2 2 0 1 0-2 0zM10 8V6a2 2 0 1 1 4 0v2h-4z"/>';
  markerCircle.appendChild(lockIcon);

  const speedLabel = document.createElement("div");
  speedLabel.className = "vsc-marker-label";
  speedLabel.textContent = `${Number(currentVideo?.playbackRate ?? 1).toFixed(1) == Number(boostSpeed).toFixed(1) ? '1.0' : Number(boostSpeed).toFixed(1)}`;

  marker.appendChild(speedLabel);
  marker.appendChild(markerCircle);

  document.body.appendChild(marker);
  activeClickMarker = marker;

  const cleanupMarker = () => {
    document.removeEventListener("mouseup", documentMouseUpHandler, true);
    marker.remove();
    if (activeClickMarker === marker) {
      activeClickMarker = null;
    }
  };

  const markerMouseUpHandler = () => {
    marker.addEventListener("click", () => {
      marker.classList.add("vsc-marker-clicked");
      setTimeout(() => {
        attachSpeedController();
        cleanupMarker();
        currentVideo.removeEventListener("click", swallowClick, true);
      }, 120);
    }, { once: true });
  };

  const documentMouseUpHandler = (event) => {
    if (!marker.contains(event.target)) {
      cleanupMarker();
      toggleSpeed();
    }
  };

  marker.addEventListener("mouseup", markerMouseUpHandler, { once: true });
  document.addEventListener("mouseup", documentMouseUpHandler, true);
}

const shortCutHandler = function (event) {

  // Ignore if following modifier is active inclusive control.
  if (
    event.getModifierState("Alt") ||
    event.getModifierState("Fn") ||
    event.getModifierState("Meta") ||
    event.getModifierState("Hyper") ||
    event.getModifierState("OS")
  ) {
    return false;
  }
  // Ignore keydown event if typing in an input box
  if (
    event.target.nodeName === "INPUT" ||
    event.target.nodeName === "TEXTAREA" ||
    event.target.isContentEditable
  ) {
    return false;
  }

  //ignore if there is no video

  if (event.ctrlKey && event.keyCode === 220) {
    if (!findVideo()) { return false }
    attachSpeedController()
  }
}


function findVideo() {
  currentVideo = document.querySelector("video")
  if (!currentVideo) { return false }
  return true
}


function initializeNow(document) {
  if (isInitialized) { return }
  isInitialized = true

  document.addEventListener('keydown', shortCutHandler);

  setupPressingListeners()

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value } = obj;
    if (type === "VIDEO_CHECK_REQUEST") {

      if (findVideo()) {
        response({ type: "VIDEO_CHECK_RESULT", value: true, playbackRate: currentVideo.playbackRate })
        attachSpeedController()
      } else {
        response({ type: "VIDEO_CHECK_RESULT", value: false })
      }
    }
  })
}


function toggleSpeed() {
  if (!currentVideo) return
  if (currentVideo.playbackRate == 1.00) { currentVideo.playbackRate = boostSpeed }
  else {
    currentVideo.playbackRate = 1
  }
}

function attachSpeedController() {
  //TODO No need to reload it fully.
  //Delete and reload the vidget if it already exists
  if (isWidgetActive) {
    document.querySelector("#pretty-vsc").shadowRoot.querySelector("#closeButton").click();
  }
  isWidgetActive = true

  let speedValue = currentVideo.playbackRate
  const wrapper = document.createElement("div");
  wrapper.classList.add("vsc-controller");
  wrapper.id = "pretty-vsc";

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
          <span style="user-select: none; padding: 2px" id="sliderValue">${speedValue.toFixed(1)}</span>
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
  const sliderValue = shadow.querySelector("#sliderValue");
  const closeButton = shadow.querySelector("#closeButton");

  const draggableHandler = (e) => {
    handleDrag(e, wrapper.shadowRoot)
    e.stopPropagation();
  }

  const restoreButtonHandler = function () {
    toggleSpeed()
  }

  const sliderHandler = function (event) {
    speedValue = (event.currentTarget.value * 0.1).toFixed(1)
    currentVideo.playbackRate = speedValue
    boostSpeed = speedValue
    sliderValue.textContent = speedValue;
  }
  const closeButtonHandler = function () {
    closeButton.removeEventListener("click", closeButtonHandler);
    restoreButton.removeEventListener("click", restoreButtonHandler);
    slider.removeEventListener("input", sliderHandler);
    shadow.querySelector(".draggable").removeEventListener("mousedown", draggableHandler);
    wrapper.remove();
    isWidgetActive = false
  }

  const ratechangeHandler = () => {
    const rate = Number(currentVideo.playbackRate);
    slider.value = String(Math.round(rate * 10));
    sliderValue.textContent = rate.toFixed(1);
    speedValue = rate;
  }

  currentVideo.addEventListener("ratechange", ratechangeHandler)
  restoreButton.addEventListener("click", restoreButtonHandler)
  slider.addEventListener("input", sliderHandler);
  shadow.querySelector(".draggable").addEventListener("mousedown", draggableHandler)
  closeButton.addEventListener("click", closeButtonHandler);
  currentVideo.addEventListener("ratechange", handleDrag)
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


window.navigation.addEventListener("navigate", () => {
  //For ability to navigate on pages with the same vidget
  if (isWidgetActive) {
    if (findVideo()) {
      attachSpeedController()
    }
  }
})