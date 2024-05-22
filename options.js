var regStrip = /^[\r\t\f\v ]+|[\r\t\f\v ]+$/gm;

var tcDefaults = {
  showUpVidgetShortcut: 1.0, // default:
};

var keyBindings = [];

var keyCodeAliases = {
  0: "null",
  null: "null",
  undefined: "null",
  32: "Space",
  37: "Left",
  38: "Up",
  39: "Right",
  40: "Down",
  96: "Num 0",
  97: "Num 1",
  98: "Num 2",
  99: "Num 3",
  100: "Num 4",
  101: "Num 5",
  102: "Num 6",
  103: "Num 7",
  104: "Num 8",
  105: "Num 9",
  106: "Num *",
  107: "Num +",
  109: "Num -",
  110: "Num .",
  111: "Num /",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  186: ";",
  188: "<",
  189: "-",
  187: "+",
  190: ">",
  191: "/",
  192: "~",
  219: "[",
  220: "\\",
  221: "]",
  222: "'"
};

function recordKeyPress(e) {
  if (
    (e.keyCode >= 48 && e.keyCode <= 57) || // Numbers 0-9
    (e.keyCode >= 65 && e.keyCode <= 90) || // Letters A-Z
    keyCodeAliases[e.keyCode] // Other character keys
  ) {
    e.target.value =
      keyCodeAliases[e.keyCode] || String.fromCharCode(e.keyCode);
    e.target.keyCode = e.keyCode;

    e.preventDefault();
    e.stopPropagation();
  } else if (e.keyCode === 8) {
    // Clear input when backspace pressed
    e.target.value = "";
  } else if (e.keyCode === 27) {
    // When esc clicked, clear input
    e.target.value = "null";
    e.target.keyCode = null;
  }
}



function inputFocus(e) {
  e.target.value = "";
}

function inputBlur(e) {
  e.target.value =
    keyCodeAliases[e.target.keyCode] || String.fromCharCode(e.target.keyCode);
}

function updateShortcutInputText(inputId, keyCode) {
  document.getElementById(inputId).value =
    keyCodeAliases[keyCode] || String.fromCharCode(keyCode);
  document.getElementById(inputId).keyCode = keyCode;
}

function updateCustomShortcutInputText(inputItem, keyCode) {
  inputItem.value = keyCodeAliases[keyCode] || String.fromCharCode(keyCode);
  inputItem.keyCode = keyCode;
}

// List of custom actions for which customValue should be disabled
var customActionsNoValues = ["pause", "muted", "mark", "jump", "display"];



function createKeyBindings(item) {
  const action = item.querySelector(".customDo").value;
  const value = Number(item.querySelector(".customValue").value);

  keyBindings.push({
    action: action,
    value: value,
  });
}



// Saves options to chrome.storage
function save_options() {

  keyBindings = [];
  Array.from(document.querySelectorAll(".customs")).forEach((item) =>
    createKeyBindings(item)
  ); // Remove added shortcuts

  var showUpVidgetShortcut = document.getElementById("showUpVidgetShortcut").value;

  chrome.storage.sync.remove([
    "showUpVidgetShortcut"
  ]);
  chrome.storage.sync.set(
    {
      showUpVidgetShortcut: showUpVidgetShortcut,
    },
    
    function () {
      // Update status to let user know options were saved.
      var status = document.getElementById("status");
      status.textContent = "Options saved";
      setTimeout(function () {
        status.textContent = "";
      }, 1000);
    }
  );
}

// Restores options from chrome.storage
function restore_options() {
  //TODO STAYED HERE
  chrome.storage.sync.get(tcDefaults, function (storage) {
    document.getElementById("rememberSpeed").checked = storage.rememberSpeed;
    document.getElementById("forceLastSavedSpeed").checked = storage.forceLastSavedSpeed;
    document.getElementById("audioBoolean").checked = storage.audioBoolean;
    document.getElementById("enabled").checked = storage.enabled;
    document.getElementById("startHidden").checked = storage.startHidden;
    document.getElementById("controllerOpacity").value =
      storage.controllerOpacity;
    document.getElementById("blacklist").value = storage.blacklist;

    for (let i in storage.keyBindings) {
      var item = storage.keyBindings[i];
      if (item.predefined) {
        //do predefined ones because their value needed for overlay
        // document.querySelector("#" + item["action"] + " .customDo").value = item["action"];
        if (item["action"] == "display" && typeof item["key"] === "undefined") {
          item["key"] = storage.displayKeyCode || tcDefaults.displayKeyCode; // V
        }

        if (customActionsNoValues.includes(item["action"]))
          document.querySelector(
            "#" + item["action"] + " .customValue"
          ).disabled = true;

        updateCustomShortcutInputText(
          document.querySelector("#" + item["action"] + " .customKey"),
          item["key"]
        );
        document.querySelector("#" + item["action"] + " .customValue").value =
          item["value"];
        document.querySelector("#" + item["action"] + " .customForce").value =
          item["force"];
      } else {
        // new ones
        const dom = document.querySelector(".customs:last-of-type");
        dom.querySelector(".customDo").value = item["action"];

        if (customActionsNoValues.includes(item["action"]))
          dom.querySelector(".customValue").disabled = true;

        updateCustomShortcutInputText(
          dom.querySelector(".customKey"),
          item["key"]
        );
        dom.querySelector(".customValue").value = item["value"];
        dom.querySelector(".customForce").value = item["force"];
      }
    }
  });
}



document.addEventListener("DOMContentLoaded", function () {
  restore_options();

  document.getElementById("save").addEventListener("click", save_options);

  function eventCaller(event, className, funcName) {
    if (!event.target.classList.contains(className)) {
      return;
    }
    funcName(event);
  }

  document.addEventListener("keypress", (event) => {
    eventCaller(event, "customValue", inputFilterNumbersOnly);
  });
  document.addEventListener("focus", (event) => {
    eventCaller(event, "customKey", inputFocus);
  });
  document.addEventListener("blur", (event) => {
    eventCaller(event, "customKey", inputBlur);
  });
  document.addEventListener("keydown", (event) => {
    eventCaller(event, "customKey", recordKeyPress);
  });

});