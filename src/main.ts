// Radio relay -- bridges serial <-> radio.
//
// Protocol:
//   !  -- command from serial host
//   >  -- serial host sends a message over radio
//   <  -- radio message forwarded to serial host
//   #  -- comment/info from relay to serial host
//
// Commands:
//   !C <ch>        -- set channel (0-35), group=10, display base-36 char
//   !CG <ch> <grp> -- set channel and group, display "?"
//   !RC <ch> <grp>  -- raw set channel/group, display "?"
//   !HELP          -- show help
//
// Buttons (only when group == 10):
//   A -- channel down
//   B -- channel up

let radioChannel = 0
let radioGroup = 10
let BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

announce.init("RADIOBRIDGE", "relay")
radio.setFrequencyBand(radioChannel)
radio.setGroup(radioGroup)

function comment(msg: string): void {
    serial.writeLine("# " + msg)
}

function channelChar(ch: number): string {
    if (ch >= 0 && ch < 36) {
        return BASE36.charAt(ch)
    }
    return "?"
}

function updateDisplay(): void {
    if (radioGroup == 10 && radioChannel >= 0 && radioChannel < 36) {
        basic.showString(channelChar(radioChannel))
    } else {
        basic.showString("?")
    }
}

function setChannel(ch: number): void {
    if (ch < 0 || ch > 83) {
        comment("ERR: channel must be 0-83")
        return
    }
    radioChannel = ch
    radioGroup = 10
    radio.setFrequencyBand(radioChannel)
    radio.setGroup(radioGroup)
    comment("OK ch=" + radioChannel + " [" + channelChar(radioChannel) + "] grp=" + radioGroup)
    updateDisplay()
}

function setChannelGroup(ch: number, grp: number): void {
    if (ch < 0 || ch > 83) {
        comment("ERR: channel must be 0-83")
        return
    }
    if (grp < 0 || grp > 255) {
        comment("ERR: group must be 0-255")
        return
    }
    radioChannel = ch
    radioGroup = grp
    radio.setFrequencyBand(radioChannel)
    radio.setGroup(radioGroup)
    comment("OK ch=" + radioChannel + " grp=" + radioGroup)
    updateDisplay()
}

function showHelp(): void {
    comment("Radio Relay -- serial <-> radio bridge")
    comment("Commands:")
    comment("  !C <ch>       - set channel (0-35), group=10")
    comment("  !CG <ch> <g>  - set channel and group")
    comment("  !RC <ch> <g>  - same as !CG")
    comment("  !HELP         - this help")
    comment("Send/receive:")
    comment("  >message      - send over radio (max 18 chars)")
    comment("  <message      - received from radio")
    comment("Buttons A/B change channel (when group=10)")
    comment("Channels 0-35 shown as 0-9, A-Z")
    comment("Current: ch=" + radioChannel + " [" + channelChar(radioChannel) + "] grp=" + radioGroup)
}

input.onButtonPressed(Button.A, function () {
    if (radioGroup != 10) return
    let ch = radioChannel - 1
    if (ch < 0) ch = 35
    setChannel(ch)
})

input.onButtonPressed(Button.B, function () {
    if (radioGroup != 10) return
    let ch = radioChannel + 1
    if (ch > 35) ch = 0
    setChannel(ch)
})

serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    if (!line || line.length == 0) return

    if (announce.handleHello(line)) return

    let prefix = line.charAt(0)

    if (prefix == "?") {
        comment("channel: " + radioChannel + " group: " + radioGroup)
    } else if (prefix == "!") {
        let cmd = line.substr(1)
        let spaceIdx = cmd.indexOf(" ")
        let verb = ""
        let arg = ""
        if (spaceIdx < 0) {
            verb = cmd
        } else {
            verb = cmd.substr(0, spaceIdx)
            arg = cmd.substr(spaceIdx + 1)
        }

        if (verb == "C") {
            let ch = parseInt(arg)
            if (ch < 0 || ch > 35) {
                comment("ERR: !C channel must be 0-35")
            } else {
                setChannel(ch)
            }
        } else if (verb == "CG" || verb == "RC") {
            let parts = arg.indexOf(" ")
            if (parts < 0) {
                comment("ERR: !" + verb + " needs <channel> <group>")
            } else {
                let ch = parseInt(arg.substr(0, parts))
                let grp = parseInt(arg.substr(parts + 1))
                setChannelGroup(ch, grp)
            }
        } else if (verb == "HELP") {
            showHelp()
        } else {
            comment("ERR: unknown command: " + verb)
        }
    } else if (prefix == ">") {
        let msg = line.substr(1)
        if (msg.length > 18) {
            comment("WARN: truncated to 18 chars")
            msg = msg.substr(0, 18)
        }
        radio.sendString(msg)
        comment("TX:" + msg)
    } else {
        comment("ERR: unknown prefix '" + prefix + "' -- use ! > or type !HELP")
    }
})

radio.onReceivedString(function (receivedString: string) {
    serial.writeLine("<" + receivedString)
})

comment("Radio Relay ready ch=" + radioChannel + " [" + channelChar(radioChannel) + "] grp=" + radioGroup)
comment("Type !HELP for usage")
updateDisplay()
