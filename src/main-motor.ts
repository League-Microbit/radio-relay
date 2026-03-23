// Color Calibration — slow spin, logs position and hue via radio.
// Reads color sensor directly over I2C to avoid PlanetX serial spam.

let hwName = control.deviceName()
announce.init("CAL", hwName)

radio.setGroup(42)
radio.setTransmitPower(7)

// I2C color sensor (APDS9960) — read raw RGB without the library
function i2cWriteReg(addr: number, reg: number, val: number) {
    let buf = pins.createBuffer(2)
    buf[0] = reg
    buf[1] = val
    pins.i2cWriteBuffer(addr, buf)
}

function i2cReadReg(addr: number, reg: number): number {
    pins.i2cWriteBuffer(addr, pins.createBufferFromArray([reg]))
    return pins.i2cReadBuffer(addr, 1)[0]
}

function initColorSensor() {
    i2cWriteReg(0x39, 0x81, 252)  // ATIME
    i2cWriteReg(0x39, 0x8F, 0x03) // CONTROL
    i2cWriteReg(0x39, 0x80, 0x00) // ENABLE off
    i2cWriteReg(0x39, 0xAB, 0x00) // GCONF4
    i2cWriteReg(0x39, 0xE7, 0x00) // AICLEAR
    i2cWriteReg(0x39, 0x80, 0x01) // ENABLE on
    basic.pause(10)
    // Enable ALS
    let en = i2cReadReg(0x39, 0x80) | 0x02
    i2cWriteReg(0x39, 0x80, en)
    basic.pause(50)
}

function readHue(): number {
    // Wait for data ready
    let status = i2cReadReg(0x39, 0x93) & 0x01
    if (!status) return -1

    let r = i2cReadReg(0x39, 0x96) + i2cReadReg(0x39, 0x97) * 256
    let g = i2cReadReg(0x39, 0x98) + i2cReadReg(0x39, 0x99) * 256
    let b = i2cReadReg(0x39, 0x9A) + i2cReadReg(0x39, 0x9B) * 256
    let c = i2cReadReg(0x39, 0x94) + i2cReadReg(0x39, 0x95) * 256

    if (c == 0) return -1

    // Normalize to 0-255
    let avg = c / 3
    let rn = r * 255 / avg
    let gn = g * 255 / avg
    let bn = b * 255 / avg

    // RGB to hue
    rn = Math.min(rn, 255)
    gn = Math.min(gn, 255)
    bn = Math.min(bn, 255)
    let mx = Math.max(rn, Math.max(gn, bn))
    let mn = Math.min(rn, Math.min(gn, bn))
    let delta = mx - mn
    if (delta <= 0) return 0

    let hue = 0
    if (mx == rn) {
        hue = 60 * ((gn - bn) / delta)
        if (gn < bn) hue += 360
    } else if (mx == gn) {
        hue = 60 * ((bn - rn) / delta) + 120
    } else {
        hue = 60 * ((rn - gn) / delta) + 240
    }
    return Math.round(hue)
}

// Init
initColorSensor()

// Go to start
nezhaV2.moveToAbsAngle(nezhaV2.MotorPostion.M1, nezhaV2.ServoMotionMode.ShortPath, 0)
basic.pause(1000)
nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)

radio.sendString("CAL:START")

// Slow CW sweep
nezhaV2.start(nezhaV2.MotorPostion.M1, 5)

basic.forever(function () {
    let rel = nezhaV2.readRelAngle(nezhaV2.MotorPostion.M1)
    let abs = nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1)
    let hue = readHue()
    if (hue >= 0) {
        radio.sendString(Math.round(abs) + "," + hue)
    }
    if (rel >= 360) {
        nezhaV2.stop(nezhaV2.MotorPostion.M1)
        radio.sendString("CAL:DONE")
        basic.showIcon(IconNames.Yes)
        basic.pause(999999)
    }
    basic.pause(200)
})
