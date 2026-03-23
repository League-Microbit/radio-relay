/**
 * Device announcement protocol for the bridge console.
 * Format: DEVICE:<type>:<name>:<deviceName>:<serial>
 *
 * Call announce.init() at startup to emit the announcement.
 * Call announce.listenForHello() if you don't have your own serial
 * handler — it registers one that responds to HELLO automatically.
 * If you have your own serial handler, call announce.handleHello(line)
 * at the top — it returns true if the line was HELLO (and re-sends
 * the announcement), so you can return early.
 */
//% color="#6080c0" weight=50 icon="\uf2db"
namespace announce {

    let _line: string = null

    /**
     * Initialize and emit the device announcement.
     * @param type device type, e.g. "ROBOT"
     * @param name application-assigned name, e.g. "my-bot"
     */
    //% block="announce as $type named $name"
    //% type.defl="ROBOT" name.defl="my-bot"
    export function init(type: string, name: string): void {
        let hwName = control.deviceName()
        let devSerial = control.deviceSerialNumber()
        _line = "DEVICE:" + type + ":" + name + ":" + hwName + ":" + devSerial
        serial.writeLine(_line)
    }

    /**
     * Re-emit the announcement line.
     */
    //% block="send announcement"
    export function send(): void {
        if (_line) {
            serial.writeLine(_line)
        }
    }

    /**
     * Check a serial line for HELLO and respond if so.
     * Returns true if it was HELLO (announcement sent), false otherwise.
     * Use at the top of your own serial handler to handle HELLO
     * without duplicating logic.
     * @param line the serial input to check
     */
    //% block="handle hello $line"
    export function handleHello(line: string): boolean {
        if (line == "HELLO") {
            send()
            return true
        }
        return false
    }

    /**
     * Register a default serial handler that only responds to HELLO.
     * Call this if your program does not need its own serial handler.
     * Do NOT call this if you register your own serial.onDataReceived.
     */
    //% block="listen for hello"
    export function listenForHello(): void {
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
            handleHello(line)
        })
    }
}
