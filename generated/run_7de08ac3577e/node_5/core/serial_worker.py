"""
串口工作者 - 串口打开/关闭/读写（支持模拟模式用于测试）
"""
import time
import threading
from enum import Enum
from typing import Optional, Callable, List
from .serial_config import SerialConfig


class SerialState(Enum):
    """串口状态"""
    CLOSED = "closed"
    OPENING = "opening"
    OPENED = "opened"
    ERROR = "error"


class SerialWorker:
    """串口工作者 - 封装串口操作，支持模拟模式"""

    def __init__(self, config: Optional[SerialConfig] = None):
        self.config = config or SerialConfig()
        self._state = SerialState.CLOSED
        self._serial = None
        self._read_thread: Optional[threading.Thread] = None
        self._running = False
        self._on_data_received: Optional[Callable[[bytes], None]] = None
        self._on_error: Optional[Callable[[str], None]] = None
        self._on_state_changed: Optional[Callable[[SerialState], None]] = None

        # 模拟模式支持
        self._simulate_mode = False
        self._simulate_send_buffer: List[bytes] = []
        self._simulate_recv_buffer: List[bytes] = []

    # --- 事件回调注册 ---

    def set_on_data_received(self, callback: Callable[[bytes], None]):
        self._on_data_received = callback

    def set_on_error(self, callback: Callable[[str], None]):
        self._on_error = callback

    def set_on_state_changed(self, callback: Callable[[SerialState], None]):
        self._on_state_changed = callback

    # --- 状态 ---

    @property
    def state(self) -> SerialState:
        return self._state

    def _set_state(self, new_state: SerialState):
        old_state = self._state
        self._state = new_state
        if self._on_state_changed and old_state != new_state:
            self._on_state_changed(new_state)

    # --- 模拟模式 ---

    def enable_simulate_mode(self, enabled: bool = True):
        """启用模拟模式（无真实串口时测试用）"""
        self._simulate_mode = enabled

    @property
    def is_simulate_mode(self) -> bool:
        return self._simulate_mode

    def inject_received_data(self, data: bytes):
        """模拟模式下注入接收数据"""
        if self._simulate_mode and self._state == SerialState.OPENED:
            self._simulate_recv_buffer.append(data)
            if self._on_data_received:
                self._on_data_received(data)

    # --- 核心操作 ---

    def open(self) -> bool:
        """打开串口"""
        if self._state == SerialState.OPENED:
            return True

        self._set_state(SerialState.OPENING)

        try:
            if self._simulate_mode:
                # 模拟模式：直接标记为已打开
                self._simulate_send_buffer.clear()
                self._simulate_recv_buffer.clear()
                self._set_state(SerialState.OPENED)
                self._start_read_thread()
                return True
            else:
                # 真实模式：尝试导入 serial 并打开
                try:
                    import serial
                    self._serial = serial.Serial(
                        port=self.config.port,
                        baudrate=self.config.baudrate,
                        bytesize=self.config.bytesize,
                        stopbits=self.config.stopbits,
                        parity=self.config.parity,
                        timeout=self.config.timeout,
                        write_timeout=self.config.write_timeout,
                    )
                    self._set_state(SerialState.OPENED)
                    self._start_read_thread()
                    return True
                except ImportError:
                    self._on_error_callback("pyserial 库未安装")
                    self._set_state(SerialState.ERROR)
                    return False
                except Exception as e:
                    self._on_error_callback(f"打开串口失败: {e}")
                    self._set_state(SerialState.ERROR)
                    return False
        except Exception as e:
            self._on_error_callback(f"打开串口异常: {e}")
            self._set_state(SerialState.ERROR)
            return False

    def close(self):
        """关闭串口"""
        self._running = False
        if self._read_thread and self._read_thread.is_alive():
            self._read_thread.join(timeout=1.0)
        self._read_thread = None

        if self._serial:
            try:
                self._serial.close()
            except Exception:
                pass
            self._serial = None

        self._set_state(SerialState.CLOSED)

    def send(self, data: bytes) -> bool:
        """发送数据"""
        if self._state != SerialState.OPENED:
            return False

        try:
            if self._simulate_mode:
                self._simulate_send_buffer.append(data)
                return True
            else:
                if self._serial and self._serial.is_open:
                    self._serial.write(data)
                    return True
                return False
        except Exception as e:
            self._on_error_callback(f"发送数据失败: {e}")
            return False

    def get_available_ports(self) -> List[str]:
        """获取可用串口列表"""
        if self._simulate_mode:
            return ["COM1(SIM)", "COM2(SIM)", "COM3(SIM)"]
        try:
            import serial.tools.list_ports
            return [p.device for p in serial.tools.list_ports.comports()]
        except ImportError:
            return []
        except Exception:
            return []

    def _start_read_thread(self):
        """启动读取线程"""
        self._running = True
        self._read_thread = threading.Thread(target=self._read_loop, daemon=True)
        self._read_thread.start()

    def _read_loop(self):
        """读取循环"""
        while self._running and self._state == SerialState.OPENED:
            try:
                if self._simulate_mode:
                    # 模拟模式：检查模拟接收缓冲区
                    if self._simulate_recv_buffer:
                        data = self._simulate_recv_buffer.pop(0)
                        if self._on_data_received:
                            self._on_data_received(data)
                    time.sleep(0.01)
                else:
                    if self._serial and self._serial.is_open:
                        if self._serial.in_waiting > 0:
                            data = self._serial.read(self._serial.in_waiting)
                            if data and self._on_data_received:
                                self._on_data_received(data)
                        time.sleep(0.01)
                    else:
                        break
            except Exception as e:
                if self._on_error:
                    self._on_error(f"读取数据异常: {e}")
                break

    def _on_error_callback(self, msg: str):
        if self._on_error:
            self._on_error(msg)
