// Radio Echo Bridge
// All devices share the same radio group. Serial input is broadcast
// over radio; radio messages are printed to serial.

let deviceId = control.deviceSerialNumber().toString().slice(-4)
let deviceName = "echo-" + deviceId

// Configure radio
radio.setGroup(42)
radio.setTransmitPower(7)

// Show our short ID
basic.showString(deviceId)
basic.clearScreen()

// Announce to bridge console every 2 seconds
basic.forever(function () {
    serial.writeLine("DEVICE:ECHO:" + deviceName + ":" + deviceId)
    basic.pause(2000)
})

// Radio → Serial: print received messages with sender info
radio.onReceivedString(function (receivedString: string) {
    serial.writeLine("[rx] " + receivedString)
    // Flash a dot to show activity
    led.plot(2, 2)
    basic.pause(100)
    led.unplot(2, 2)
})

// Serial → Radio: broadcast anything received on serial
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    if (line && line.length > 0) {
        radio.sendString(deviceName + ": " + line)
        serial.writeLine("[tx] " + line)
    }
})

// Button A: send a test message
input.onButtonPressed(Button.A, function () {
    let msg = deviceName + ": ping"
    radio.sendString(msg)
    serial.writeLine("[tx] ping")
    basic.showIcon(IconNames.Yes)
    basic.pause(300)
    basic.clearScreen()
})

// Button B: show device name
input.onButtonPressed(Button.B, function () {
    basic.showString(deviceName)
    basic.clearScreen()
})
