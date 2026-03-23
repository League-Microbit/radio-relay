// Color wheel — mapping sweep then fast color positioning.

announce.init("COLORWHEEL", "colors1")
colorsensor.init()

// K-means classifier for transition detection
function classifyColor(): string {
    let R = colorsensor.red()
    let G = colorsensor.green()
    let B = colorsensor.blue()
    let I = colorsensor.clear()
    let sum = R + G + B
    if (sum == 0) return "?"
    let r = R * 1000 / sum
    let g = G * 1000 / sum
    let b = B * 1000 / sum
    let i = (I - 3635) * 1000 / 5244

    let d0 = (r - 97) * (r - 97) + (g - 303) * (g - 303) + (b - 600) * (b - 600) + (i - 930) * (i - 930)
    let d1 = (r - 395) * (r - 395) + (g - 346) * (g - 346) + (b - 259) * (b - 259) + (i - 105) * (i - 105)
    let d2 = (r - 143) * (r - 143) + (g - 574) * (g - 574) + (b - 283) * (b - 283) + (i - 756) * (i - 756)
    let d3 = (r - 377) * (r - 377) + (g - 449) * (g - 449) + (b - 175) * (b - 175) + (i - 666) * (i - 666)

    let minD = d0
    let label = "A"
    if (d1 < minD) { minD = d1; label = "B" }
    if (d2 < minD) { minD = d2; label = "C" }
    if (d3 < minD) { minD = d3; label = "D" }
    return label
}

// Color centers
let mapBlue = -1
let mapGreen = -1
let mapRed = -1
let mapOrange = -1
let mapped = false

// Collect zone midpoints from a sweep. Store up to 16 midpoints.
let midPoints: number[] = []
let midLabels: string[] = []
let midCount = 0

function sweepAndCollect(speed: number, tag: string) {
    let lastColor = ""
    let enteredAt = -1
    let enteredColor = ""

    nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)
    nezhaV2.start(nezhaV2.MotorPostion.M1, speed)

    while (true) {
        let rel = nezhaV2.readRelAngle(nezhaV2.MotorPostion.M1)
        let pos = Math.round(nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1))
        let color = classifyColor()

        if (color != lastColor && lastColor != "") {
            if (enteredAt >= 0 && midCount < 16) {
                let mid = 0
                if (pos >= enteredAt) {
                    mid = (enteredAt + pos) / 2
                } else {
                    mid = ((enteredAt + pos + 360) / 2) % 360
                }
                midPoints.push(Math.round(mid))
                midLabels.push(enteredColor)
                midCount++
                serial.writeLine("MAP:" + tag + " " + enteredColor + " " + enteredAt + "-" + pos + " mid=" + Math.round(mid))
            }
            enteredAt = pos
            enteredColor = color
        }
        if (lastColor == "") {
            enteredAt = pos
            enteredColor = color
        }
        lastColor = color

        if (rel >= 720 || rel <= -720) break
        basic.pause(50)
    }
    nezhaV2.stop(nezhaV2.MotorPostion.M1)
    basic.pause(300)
}

function circMeanArr(angles: number[]): number {
    let sinS = 0
    let cosS = 0
    for (let j = 0; j < angles.length; j++) {
        let rad = angles[j] * 3.14159 / 180
        sinS += Math.sin(rad)
        cosS += Math.cos(rad)
    }
    let deg = Math.round(Math.atan2(sinS / angles.length, cosS / angles.length) * 180 / 3.14159)
    if (deg < 0) deg += 360
    return deg
}

function mapColors() {
    serial.writeLine("MAP:start")
    midPoints = []
    midLabels = []
    midCount = 0

    sweepAndCollect(15, "CW")
    sweepAndCollect(-15, "CCW")

    // Group midpoints by classifier label, compute circular mean for each
    let uniqueLabels = ["A", "B", "C", "D"]
    let centers: number[] = []
    let labelForCenter: string[] = []

    for (let li = 0; li < 4; li++) {
        let lbl = uniqueLabels[li]
        let angles: number[] = []
        for (let j = 0; j < midCount; j++) {
            if (midLabels[j] == lbl) {
                angles.push(midPoints[j])
            }
        }
        if (angles.length > 0) {
            let c = circMeanArr(angles)
            centers.push(c)
            labelForCenter.push(lbl)
            serial.writeLine("MAP:zone " + lbl + "=" + c + " (" + angles.length + " samples)")
        }
    }

    // Sort centers by angle
    for (let i = 0; i < centers.length - 1; i++) {
        for (let j = i + 1; j < centers.length; j++) {
            if (centers[j] < centers[i]) {
                let tmp = centers[i]; centers[i] = centers[j]; centers[j] = tmp
                let tmpl = labelForCenter[i]; labelForCenter[i] = labelForCenter[j]; labelForCenter[j] = tmpl
            }
        }
    }

    // Assign known wheel order: starting from lowest angle
    // Wheel order CW: Green, Red, Orange, Blue (from calibration)
    let wheelOrder = ["Green", "Red", "Orange", "Blue"]
    if (centers.length >= 4) {
        mapGreen = centers[0]
        mapRed = centers[1]
        mapOrange = centers[2]
        mapBlue = centers[3]
        mapped = true
        for (let i = 0; i < 4; i++) {
            serial.writeLine("MAP:" + wheelOrder[i] + "=" + centers[i])
        }
    } else {
        serial.writeLine("MAP:ERR only found " + centers.length + " zones")
    }

    serial.writeLine("MAP:done")
}

function goToColor(name: string) {
    let target = -1
    if (name == "Blue") target = mapBlue
    else if (name == "Green") target = mapGreen
    else if (name == "Red") target = mapRed
    else if (name == "Orange") target = mapOrange

    if (target < 0) {
        serial.writeLine("ERR:" + name + " not mapped")
        return
    }

    nezhaV2.moveToAbsAngle(nezhaV2.MotorPostion.M1, nezhaV2.ServoMotionMode.ShortPath, target)
    basic.pause(500)
    serial.writeLine(name + " P:" + target + " sensed:" + classifyColor())
}

function runSequence() {
    serial.writeLine("SEQ:start")
    goToColor("Blue")
    basic.pause(300)
    goToColor("Red")
    basic.pause(300)
    goToColor("Blue")
    basic.pause(300)
    goToColor("Orange")
    basic.pause(300)
    goToColor("Green")
    serial.writeLine("SEQ:done")
}

input.onButtonPressed(Button.A, function () {
    basic.clearScreen()
    mapColors()
    runSequence()
    basic.showIcon(IconNames.Yes)
})

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    if (!line || line.length == 0) return

    if (line == "MAP") { mapColors() }
    else if (line == "SEQ") { if (!mapped) mapColors(); runSequence() }
    else if (line.indexOf("COLOR:") == 0) { if (!mapped) mapColors(); goToColor(line.substr(6)) }
    else if (line == "READ") { serial.writeLine("POS:" + Math.round(nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1)) + " " + classifyColor()) }
    else if (line == "CAL") {
        serial.writeLine("CAL:start")
        nezhaV2.resetRelAngleValue(nezhaV2.MotorPostion.M1)
        nezhaV2.start(nezhaV2.MotorPostion.M1, 15)
        while (true) {
            let rel = nezhaV2.readRelAngle(nezhaV2.MotorPostion.M1)
            let pos = Math.round(nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1))
            let hue = Math.round(PlanetX_Basic.readColor())
            serial.writeLine("C:" + pos + "," + hue)
            if (rel >= 370) break
            basic.pause(100)
        }
        nezhaV2.stop(nezhaV2.MotorPostion.M1)
        serial.writeLine("CAL:done")
    }
    else if (line.indexOf("GOTO:") == 0) {
        let angle = parseInt(line.substr(5))
        nezhaV2.moveToAbsAngle(nezhaV2.MotorPostion.M1, nezhaV2.ServoMotionMode.ShortPath, angle)
        basic.pause(500)
        serial.writeLine("AT:" + Math.round(nezhaV2.readAbsAngle(nezhaV2.MotorPostion.M1)))
    }
    else if (line == "STOP") { nezhaV2.stop(nezhaV2.MotorPostion.M1); serial.writeLine("STOPPED") }
    else if (line == "SPIN") { nezhaV2.start(nezhaV2.MotorPostion.M1, 15); serial.writeLine("SPINNING") }
    else if (announce.handleHello(line)) { }
    else { serial.writeLine("ERR:" + line) }
})

basic.showIcon(IconNames.Giraffe)
serial.writeLine("READY")
