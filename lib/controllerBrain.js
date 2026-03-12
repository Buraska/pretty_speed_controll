class ControllerBrain {

    #baseRate = 1.
    #toggleRate = 2.
    #isToggled = false
    #currentVideo = null

    toggleSpeed() {
        if (!this.#currentVideo) return
        this.#isToggled = !this.#isToggled
        if (this.#isToggled) this.#currentVideo.playbackRate = Number(this.#toggleRate);
        else this.#currentVideo.playbackRate = this.#baseRate
    }

    toggleOn(){
        this.#isToggled = true
        this.#currentVideo.playbackRate = Number(this.#toggleRate)
    }

    toggleOff(){
        this.#isToggled = false
        this.#currentVideo.playbackRate = Number(this.#baseRate)
    }

    setCurrentVideo(value){
        this.#currentVideo = value
    }

    getCurrentSpeed(returnString = true) {
        if (!this.#currentVideo) return returnString ? "1.0" : 1
        if (returnString) return Number(this.#currentVideo.playbackRate).toFixed(1)
        return Number(this.#currentVideo.playbackRate)
    }

    setCurrentSpeed(value) {
        if (!this.#currentVideo) return
        const num = Number(value)
        this.#currentVideo.playbackRate = num

        if(this.#isToggled) this.#toggleRate = num
        else this.#baseRate = num
    }

    getToggleSpeed() {
        return Number(this.#toggleRate).toFixed(1)
    }

    getBaseSpeed() {
        return Number(this.#baseRate).toFixed(1)
    }

    getIsToggled() {
        return this.#isToggled
    }
}