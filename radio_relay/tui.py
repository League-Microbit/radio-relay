"""Textual TUI for interacting with a RADIORELAY device."""

from __future__ import annotations

from typing import Callable

from textual import events
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.message import Message
from textual.screen import ModalScreen
from textual.widgets import Footer, Header, Input, Label, ListItem, ListView, RichLog, Static

from .discovery import RelayInfo
from .relay import RadioRelay


BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


class _HistoryInput(Input):
    """Input that scrolls through prior submissions on up/down."""

    BINDINGS = [
        Binding("up", "history_prev", show=False),
        Binding("down", "history_next", show=False),
    ]

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._history: list[str] = []
        self._history_idx: int | None = None  # None = at the live draft
        self._draft: str = ""

    def remember(self, text: str) -> None:
        if text and (not self._history or self._history[-1] != text):
            self._history.append(text)
        self._history_idx = None
        self._draft = ""

    def action_history_prev(self) -> None:
        if not self._history:
            return
        if self._history_idx is None:
            self._draft = self.value
            self._history_idx = len(self._history) - 1
        elif self._history_idx > 0:
            self._history_idx -= 1
        else:
            return  # already at oldest
        self._set_value(self._history[self._history_idx])

    def action_history_next(self) -> None:
        if self._history_idx is None:
            return
        if self._history_idx < len(self._history) - 1:
            self._history_idx += 1
            self._set_value(self._history[self._history_idx])
        else:
            self._history_idx = None
            self._set_value(self._draft)

    def _set_value(self, text: str) -> None:
        self.value = text
        # Move cursor to end so it feels like shell history.
        self.cursor_position = len(text)


def channel_char(ch: int) -> str:
    if 0 <= ch < 36:
        return BASE36[ch]
    return "?"


# -------------------------------------------------------------------- modals


class _PromptModal(ModalScreen[int | None]):
    """Single-input modal that returns an int or None on cancel."""

    BINDINGS = [Binding("escape", "cancel", "Cancel")]

    def __init__(self, title: str, prompt: str, value: str = "") -> None:
        super().__init__()
        self._title = title
        self._prompt = prompt
        self._initial = value

    def compose(self) -> ComposeResult:
        with Vertical(id="modal"):
            yield Label(self._title, id="modal-title")
            yield Label(self._prompt, id="modal-prompt")
            yield Input(value=self._initial, id="modal-input")
            yield Label("Enter to accept, Esc to cancel", id="modal-hint")

    def on_mount(self) -> None:
        self.query_one("#modal-input", Input).focus()

    def on_input_submitted(self, event: Input.Submitted) -> None:
        text = event.value.strip()
        try:
            self.dismiss(int(text))
        except ValueError:
            self.query_one("#modal-hint", Label).update(
                "Not a number. Enter to accept, Esc to cancel"
            )

    def action_cancel(self) -> None:
        self.dismiss(None)


class _CommandScreen(ModalScreen[str | None]):
    """Captures one keystroke after Ctrl-A and returns it.

    Returns the key name ('c', 'g', 'h', 's', 'q', 'left', 'right', a digit,
    etc.) or None if the user cancelled (Esc or another Ctrl-A).
    Uses bindings (not on_key) because a ModalScreen with no focusable
    children doesn't always receive on_key reliably across terminals.
    """

    BINDINGS = [
        Binding("c", "ret('c')", show=False, priority=True),
        Binding("g", "ret('g')", show=False, priority=True),
        Binding("h", "ret('h')", show=False, priority=True),
        Binding("s", "ret('s')", show=False, priority=True),
        Binding("q", "ret('q')", show=False, priority=True),
        Binding("left", "ret('left')", show=False, priority=True),
        Binding("right", "ret('right')", show=False, priority=True),
        Binding("0", "ret('0')", show=False, priority=True),
        Binding("1", "ret('1')", show=False, priority=True),
        Binding("2", "ret('2')", show=False, priority=True),
        Binding("3", "ret('3')", show=False, priority=True),
        Binding("4", "ret('4')", show=False, priority=True),
        Binding("5", "ret('5')", show=False, priority=True),
        Binding("6", "ret('6')", show=False, priority=True),
        Binding("7", "ret('7')", show=False, priority=True),
        Binding("8", "ret('8')", show=False, priority=True),
        Binding("9", "ret('9')", show=False, priority=True),
        Binding("escape", "cancel", show=False, priority=True),
        Binding("ctrl+a", "cancel", show=False, priority=True),
    ]

    def compose(self) -> ComposeResult:
        with Vertical(id="cmd"):
            yield Label("[Ctrl-A] command mode", id="cmd-title")
            yield Label(
                "c=channel  g=group  h=help  s=status  q=quit  "
                "←/→=ch±1  0-9=ch direct\n"
                "Esc or Ctrl-A to cancel",
                id="cmd-keys",
            )

    def action_ret(self, key: str) -> None:
        self.dismiss(key)

    def action_cancel(self) -> None:
        self.dismiss(None)


# -------------------------------------------------------------------- messages


class _LineReceived(Message):
    def __init__(self, line: str) -> None:
        super().__init__()
        self.line = line


# -------------------------------------------------------------------- app


class RadioRelayApp(App[None]):
    CSS = """
    Screen { layout: vertical; }

    #main { layout: horizontal; height: 1fr; }

    /* Left column: 19-byte radio payloads are short, but firmware help/status
       comments can run longer, so leave room for ~45 chars of body. */
    #left { layout: vertical; width: 50; min-width: 40; }
    #log { height: 1fr; border: round $accent; padding: 0 1; }
    #input { height: 3; border: round $accent; }

    /* Right column takes the rest. Min-width fits "> relay [hwid] @ /dev/tty.usbmodem21431202". */
    #right { layout: vertical; width: 1fr; min-width: 56; border: round $accent; padding: 0 1; }
    #right .heading { color: $accent; text-style: bold; padding-top: 1; }
    #relays { height: auto; max-height: 8; border: tall $panel; }
    #status { padding: 1 0 0 0; }
    #commands { padding-top: 1; color: $text-muted; }

    /* modal */
    _PromptModal, _CommandScreen { align: center middle; }
    #modal {
        width: 50; height: auto; padding: 1 2;
        border: thick $accent; background: $panel;
    }
    #modal-title { text-style: bold; }
    #modal-hint { color: $text-muted; padding-top: 1; }

    #cmd {
        width: 70; height: auto; padding: 1 2;
        border: thick $warning; background: $panel;
    }
    #cmd-title { text-style: bold; color: $warning; }
    #cmd-keys { padding-top: 1; }
    """

    BINDINGS = [
        Binding("ctrl+a", "prefix", "Cmd", show=True, priority=True),
    ]

    def __init__(
        self,
        relays: list[RelayInfo],
        initial_index: int = 0,
        connect: Callable[[str], RadioRelay] | None = None,
    ) -> None:
        super().__init__()
        self.relays = relays
        self.current_index = initial_index
        self.relay: RadioRelay | None = None
        self.channel = 0
        self.group = 10
        self._connect = connect or (lambda port: _open(port))

    # ------------------------------ layout

    def compose(self) -> ComposeResult:
        yield Header(show_clock=False)
        with Horizontal(id="main"):
            with Vertical(id="left"):
                yield RichLog(id="log", highlight=False, markup=True, wrap=True)
                yield _HistoryInput(
                    placeholder="message  (Enter to send, ↑/↓ for history)",
                    id="input",
                )
            with Vertical(id="right"):
                yield Static("Relays", classes="heading")
                yield ListView(id="relays")
                yield Static("", id="status")
                yield Static(self._commands_text(), id="commands")
        yield Footer()

    def on_mount(self) -> None:
        lv = self.query_one("#relays", ListView)
        for i, info in enumerate(self.relays):
            lv.append(self._relay_item(info, current=(i == self.current_index)))
        lv.index = self.current_index
        self._connect_current()
        self.query_one(Input).focus()

    # ------------------------------ helpers

    def _relay_item(self, info: RelayInfo, *, current: bool) -> ListItem:
        marker = "[b]>[/b]" if current else " "
        text = f"{marker} {info.label}"
        return ListItem(Label(text))

    def _commands_text(self) -> str:
        return (
            "[b]Commands[/b]  (prefix [b]Ctrl-A[/b])\n"
            "Ctrl-A C    set channel\n"
            "Ctrl-A G    set group\n"
            "Ctrl-A H    send !HELP\n"
            "Ctrl-A S    send ?\n"
            "Ctrl-A ←/→  channel ±1\n"
            "Ctrl-A 0-9  channel direct\n"
            "Ctrl-A Q    quit\n"
            "Tab         switch focus\n"
            "\n"
            "Type a message and press\n"
            "Enter to send (no '>' needed)."
        )

    def _log(self, text: str) -> None:
        self.query_one("#log", RichLog).write(text)

    def _update_status(self) -> None:
        cur = self.relays[self.current_index] if self.relays else None
        port = cur.port if cur else "(none)"
        ch_label = channel_char(self.channel)
        text = (
            f"[b]Port[/b]  {port}\n"
            f"[b]Ch[/b]    {self.channel}  [{ch_label}]\n"
            f"[b]Group[/b] {self.group}"
        )
        self.query_one("#status", Static).update(text)

    def _refresh_relay_marks(self) -> None:
        lv = self.query_one("#relays", ListView)
        lv.clear()
        for i, info in enumerate(self.relays):
            lv.append(self._relay_item(info, current=(i == self.current_index)))
        lv.index = self.current_index

    # ------------------------------ connection

    def _connect_current(self) -> None:
        if self.relay is not None:
            try:
                self.relay.close()
            except Exception:
                pass
            self.relay = None
        if not self.relays:
            self._log("[red]No relays available.[/red]")
            self._update_status()
            return
        info = self.relays[self.current_index]
        try:
            self.relay = self._connect(info.port)
        except Exception as e:
            self._log(f"[red]Open failed:[/red] {info.port}: {e}")
            self._update_status()
            return
        self.relay.start_reader(self._on_line_thread)
        self._log(f"[blue]Connected[/blue] {info.label}")
        # ask the firmware for current channel/group
        try:
            self.relay.request_status()
        except Exception:
            pass
        self._update_status()

    def _on_line_thread(self, line: str) -> None:
        # Called from the reader thread. Bridge into the app loop.
        self.post_message(_LineReceived(line))

    def on_line_received(self, event: _LineReceived) -> None:
        line = event.line
        if not line:
            return
        if line.startswith("<"):
            self._log(f"[green]RX[/green] {line[1:]}")
        elif line.startswith("#"):
            self._log(f"[white]{line}[/white]")
            self._maybe_update_from_comment(line)
        elif line.startswith("DEVICE:"):
            self._log(f"[blue]{line}[/blue]")
        else:
            self._log(line)

    def _maybe_update_from_comment(self, line: str) -> None:
        # Parse "# OK ch=5 [5] grp=10" and "# channel: 5 group: 10"
        ch = self._extract(line, "ch=")
        if ch is None:
            ch = self._extract(line, "channel:")
        grp = self._extract(line, "grp=")
        if grp is None:
            grp = self._extract(line, "group:")
        if ch is not None:
            self.channel = ch
        if grp is not None:
            self.group = grp
        if ch is not None or grp is not None:
            self._update_status()

    @staticmethod
    def _extract(line: str, key: str) -> int | None:
        idx = line.find(key)
        if idx < 0:
            return None
        rest = line[idx + len(key):].lstrip()
        num = ""
        for c in rest:
            if c.isdigit() or (not num and c == "-"):
                num += c
            else:
                break
        if not num:
            return None
        try:
            return int(num)
        except ValueError:
            return None

    # ------------------------------ input

    def on_input_submitted(self, event: Input.Submitted) -> None:
        msg = event.value
        event.input.value = ""
        if not msg:
            return
        if self.relay is None:
            self._log("[red]Not connected[/red]")
            return
        try:
            sent = self.relay.send_message(msg)
        except Exception as e:
            self._log(f"[red]Send failed:[/red] {e}")
            return
        if len(msg) > self.relay.MAX_PAYLOAD:
            self._log(f"[yellow]TX (truncated)[/yellow] {sent}")
        else:
            self._log(f"[cyan]TX[/cyan] {sent}")
        if isinstance(event.input, _HistoryInput):
            event.input.remember(msg)

    # ------------------------------ command-prefix dispatcher

    def action_prefix(self) -> None:
        """Ctrl-A pressed — open the command-mode capture screen."""
        self.push_screen(_CommandScreen(), self._on_command)

    def _on_command(self, key: str | None) -> None:
        if not key:
            return
        self._log(f"[magenta]Ctrl-A {key}[/magenta]")
        if key == "c":
            self._open_set_channel()
        elif key == "g":
            self._open_set_group()
        elif key == "h":
            self._send_help()
        elif key == "s":
            self._send_status()
        elif key == "q":
            self.exit()
        elif key == "left":
            self._channel_delta(-1)
        elif key == "right":
            self._channel_delta(+1)
        elif key.isdigit() and len(key) == 1:
            self._set_channel(int(key))
        else:
            self._log(f"[yellow]Unknown command key:[/yellow] Ctrl-A {key}")

    # ------------------------------ command operations

    def _channel_delta(self, delta: int) -> None:
        self._set_channel((self.channel + delta) % 36)

    def _set_channel(self, ch: int) -> None:
        if self.relay is None:
            return
        try:
            self.relay.set_channel(ch)
        except Exception as e:
            self._log(f"[red]set_channel failed:[/red] {e}")

    def _open_set_channel(self) -> None:
        modal = _PromptModal(
            "Set channel",
            "Channel (0-35), group will be set to 10:",
            value=str(self.channel),
        )
        self.push_screen(modal, self._channel_chosen)

    def _channel_chosen(self, value: int | None) -> None:
        if value is None or self.relay is None:
            return
        if not 0 <= value <= 35:
            self._log("[red]Channel out of range (0-35)[/red]")
            return
        try:
            self.relay.set_channel(value)
        except Exception as e:
            self._log(f"[red]{e}[/red]")

    def _open_set_group(self) -> None:
        modal = _PromptModal(
            "Set group",
            "Group (0-255), keeps current channel:",
            value=str(self.group),
        )
        self.push_screen(modal, self._group_chosen)

    def _group_chosen(self, value: int | None) -> None:
        if value is None or self.relay is None:
            return
        if not 0 <= value <= 255:
            self._log("[red]Group out of range (0-255)[/red]")
            return
        try:
            self.relay.set_channel_group(self.channel, value)
        except Exception as e:
            self._log(f"[red]{e}[/red]")

    def _send_help(self) -> None:
        if self.relay is not None:
            self.relay.request_help()

    def _send_status(self) -> None:
        if self.relay is not None:
            self.relay.request_status()

    # ------------------------------ relay list interaction

    def on_list_view_selected(self, event: ListView.Selected) -> None:
        new_idx = self.query_one("#relays", ListView).index or 0
        if new_idx == self.current_index:
            return
        self.current_index = new_idx
        self._refresh_relay_marks()
        self._connect_current()

    def on_unmount(self) -> None:
        if self.relay is not None:
            try:
                self.relay.close()
            except Exception:
                pass


def _open(port: str) -> RadioRelay:
    relay = RadioRelay(port)
    relay.open()
    return relay


def run_tui(relays: list[RelayInfo], initial_index: int = 0) -> None:
    app = RadioRelayApp(relays, initial_index=initial_index)
    app.run()
