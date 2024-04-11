icon of restore button change

const closeButtonHandler = function () {
  
  const restoreButton = shadow.querySelector("#restoreButton");
  const slider = shadow.querySelector("#speedSlider");
  const closeButton = shadow.querySelector("#closeButton");
  const wrapper = document.querySelector("#pretty-vsc")
  const draggable = wrapper.shadowRoot.querySelector(".draggable")

  closeButton.removeEventListener("click", closeButtonHandler);
  restoreButton.removeEventListener("click", restoreButtonHandler);
  slider.removeEventListener("input", sliderHandler);
  draggable.removeEventListener("mousedown", draggableHandler);
  wrapper.remove();
}