// Radio Bridge — receives radio messages and prints them to serial.
// The bridge console picks these up for remote monitoring.

let hwName = control.deviceName()

announce.init("RADIOBRIDGE", hwName)
announce.listenForHello()

radio.setGroup(42)
radio.setTransmitPower(7)

radio.onReceivedString(function (msg: string) {
    serial.writeLine(msg)
})
