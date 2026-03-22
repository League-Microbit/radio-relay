// Startup animation
basic.showIcon(IconNames.Heart)
basic.pause(1000)
basic.clearScreen()

// Button A: play a tone (V2 speaker)
input.onButtonPressed(Button.A, function () {
    music.playTone(262, music.beat(BeatFraction.Whole))
    basic.showIcon(IconNames.Happy)
})

// Button B: show light level as bar graph
input.onButtonPressed(Button.B, function () {
    let light = input.lightLevel()
    led.plotBarGraph(light, 255)
})

// Touch logo (V2): show temperature
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    let temp = input.temperature()
    basic.showNumber(temp)
})

// Shake: show compass heading as arrow
input.onGesture(Gesture.Shake, function () {
    basic.showArrow(ArrowNames.North)
    basic.pause(500)
    basic.clearScreen()
})
