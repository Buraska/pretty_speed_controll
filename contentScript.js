(() => {
    console.log("1")
    let currentVideo = document.querySelector("video")

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const {type, value} = obj;

        console.log("2")
    
        if(type === "VIDEO_CHECK_REQUEST"){
            if (currentVideo !== undefined){
            response({type: "VIDEO_CHECK_RESULT", value: true, playbackRate: currentVideo.playbackRate})
        }   else{
            response({type: "VIDEO_CHECK_RESULT", value: false})
        }
        }else if(type === "VIDEO_SPEED_CHANGE"){
            currentVideo.playbackRate = value
        }

})
})();