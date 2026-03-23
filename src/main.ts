// Motor Sweep — moves M1 from 0 to 360 and back continuously.
// LED on J2 lights up when motor is in the middle 20 degrees (170-190).

let hwName = control.deviceName()
let commonName

if (hwName == "vutev") commonName = "Frank"
else if (hwName == "zuvat") commonName = "Bingo"
else if (hwName == "gitev") commonName = "Sally"
else commonName = hwName

announce.init("MOTOR", commonName)
announce.listenForHello()

// Go to start position and zero the relative counter
nezhaV2.moveToAbsAngle(nezhaV2.MotorPostion.M1, nezhaV2.ServoMotionMode.ShortPath, 0)
basic.pause(1000)
nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)

basic.forever(function () {
    // Sweep CW 360 degrees
    nezhaV2.start(nezhaV2.MotorPostion.M1, 20)
    while (true) {
        let rel = nezhaV2.readRelAngle(nezhaV2.MotorPostion.M1)
        let abs = nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1)
        if (abs >= 170 && abs <= 190) {
            PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, true)
        } else {
            PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, false)
        }
        if (rel >= 360) break
        basic.pause(20)
    }
    nezhaV2.stop(nezhaV2.MotorPostion.M1)
    PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, false)
    nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)
    basic.pause(300)

    // Sweep CCW 360 degrees
    nezhaV2.start(nezhaV2.MotorPostion.M1, -20)
    while (true) {
        let rel = nezhaV2.readRelAngle(nezhaV2.MotorPostion.M1)
        let abs = nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1)
        if (abs >= 170 && abs <= 190) {
            PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, true)
        } else {
            PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, false)
        }
        if (rel <= -360) break
        basic.pause(20)
    }
    nezhaV2.stop(nezhaV2.MotorPostion.M1)
    PlanetX_Display.ledBrightness(PlanetX_Display.DigitalRJPin.J2, false)
    nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)
    basic.pause(300)
})
