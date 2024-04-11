(() => {
  initializeWhenReady(document)
})();

let lastSpeed = 1.00;
let currentVideo;
let isInitialized = false
let xPos = (window.innerWidth - window.innerWidth/5) + "px";
let yPos = (0) + "px"

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


function findVideo(){
  currentVideo = document.querySelector("video")
  if (!currentVideo) { return false }
  return true
}


function initializeNow(document) {
  if (isInitialized) { return }
  isInitialized = true

  document.addEventListener('keydown', shortCutHandler);

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


function attachSpeedController() {

  currentVideo = document.querySelector("video")

  //Delete and reload the vidget if it already exists
  if (document.querySelector("#pretty-vsc")) { 
    document.querySelector("#pretty-vsc").shadowRoot.querySelector("#closeButton").click();
  }

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
       

      <div class="bottom-bar">
          <button id="restoreButton" class="button restoreButton">⇆</button>
          <span style="user-select: none;" id="sliderValue">${speedValue.toFixed(1)}</span>
          <span><button id="closeButton" class="button closeButton">X</button></span>
      </div>

      <div class="top-bar">
      <span style="user-select: none;" class="min-value">0.1</span>
      <input type="range" min="1" max="40" value="${Math.round(speedValue * 10)}" class="slider" id="speedSlider">
      <span style="user-select: none;" class="max-value">4.0</span>
    </div>
        </div>
      `;

  shadow.innerHTML = shadowTemplate;
  document.getElementsByTagName("body")[0].parentNode.appendChild(wrapper)

  const restoreButton = shadow.querySelector("#restoreButton");
  const slider = shadow.querySelector("#speedSlider");
  const sliderValue = shadow.querySelector("#sliderValue");
  const closeButton = shadow.querySelector("#closeButton");
  
  const draggableHandler = (e) => {
    handleDrag(e, wrapper.shadowRoot)
    e.stopPropagation();
  }

  const restoreButtonHandler = function () {
      if (currentVideo.playbackRate == 1.00) { currentVideo.playbackRate = lastSpeed }
      else { currentVideo.playbackRate = 1.00 }

      slider.value = currentVideo.playbackRate * 10
      sliderValue.textContent = currentVideo.playbackRate.toFixed(1)
  }
  const sliderHandler = function (event) {
    speedValue = (event.currentTarget.value * 0.1).toFixed(1)
    currentVideo.playbackRate = speedValue
    lastSpeed = speedValue
    sliderValue.textContent = speedValue;
  }
  const closeButtonHandler = function () {
    closeButton.removeEventListener("click", closeButtonHandler);
    restoreButton.removeEventListener("click", restoreButtonHandler);
    slider.removeEventListener("input", sliderHandler);
    shadow.querySelector(".draggable").removeEventListener("mousedown", draggableHandler);
    wrapper.remove();
  }


  restoreButton.addEventListener("click", restoreButtonHandler)
  slider.addEventListener("input", sliderHandler);
  shadow.querySelector(".draggable").addEventListener("mousedown", draggableHandler)
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