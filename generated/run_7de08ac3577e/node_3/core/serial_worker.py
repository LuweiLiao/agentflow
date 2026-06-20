"""串口读写工作者，封装 pyserial 的打开/关闭/读写操作

无 GUI 依赖，可在无串口设备环境下通过回环测试验证。
"""

import threading
import time
from typing import Optional, Callable, List, Union
from enum import Enum, auto

from .serial_config import SerialConfig

# 尝试导入 pyserial，若不存在则提供模拟实现用于测试
try:
    import serial
    import serial.tools.list_ports
    HAS_PYSERIAL = True
except ImportError:
    HAS_PYSERIAL = False
    # 提供一个 mock 用于开发和测试
    serial = None
    serial_tools_list_ports = None


class SerialState(Enum):
    """串口状态枚举"""
    CLOSED = auto()
    OPENING = auto()
    OPEN = auto()
    ERROR = auto()


class SerialWorker:
    """串口读写工作者

    职责：
    - 打开/关闭串口
    - 发送数据（文本或 HEX）
    - 接收数据（通过回调通知）
    - 管理串口状态
    - 提供可用端口列表

    使用方式：
        worker = SerialWorker()
        worker.on_data_received = lambda data: print(data)
        worker.open(config)
        worker.send(b"hello")
        worker.close()
    """

    def __init__(self):
        self._serial: Optional["serial.Serial"] = None
        self._config: Optional[SerialConfig] = None
        self._state = SerialState.CLOSED
        self._lock = threading.Lock()

        # 接收线程
        self._read_thread: Optional[threading.Thread] = None
        self._running = False

        # ---------- 回调 ----------
        self.on_data_received: Optional[Callable[[bytes], None]] = None
        self.on_state_changed: Optional[Callable[[SerialState], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None

    # ---------- 属性 ----------

    @property
    def state(self) -> SerialState:
        return self._state

    @property
    def config(self) -> Optional[SerialConfig]:
        return self._config

    @property
    def is_open(self) -> bool:
        if self._serial and HAS_PYSERIAL:
            try:
                return self._serial.is_open
            except Exception:
                return False
        return False

    @property
    def port(self) -> str:
        if self._config:
            return self._config.port
        return ""

    # ---------- 端口扫描 ----------

    @staticmethod
    def list_ports() -> List[dict]:
        """获取可用串口列表

        Returns:
            [{"port": "COM3", "description": "USB Serial Port", "hwid": "..."}, ...]
        """
        ports = []
        if HAS_PYSERIAL:
            try:
                for p in serial.tools.list_ports.comports():
                    ports.append({
                        "port": p.device,
                        "description": p.description,
                        "hwid": p.hwid,
                    })
            except Exception:
                pass
        return ports

    # ---------- 打开/关闭 ----------

    def open(self, config: SerialConfig) -> bool:
        """打开串口

        Args:
            config: 串口配置参数

        Returns:
            True 打开成功，False 打开失败
        """
        if not HAS_PYSERIAL:
            self._set_state(SerialState.ERROR)
            self._trigger_error("pyserial 未安装，无法打开真实串口")
            return False

        if not config.is_valid():
            self._set_state(SerialState.ERROR)
            self._trigger_error(f"无效的串口配置: {config}")
            return False

        with self._lock:
            if self._serial and self._serial.is_open:
                self._close_serial()

            self._set_state(SerialState.OPENING)

            try:
                self._serial = serial.Serial(
                    port=config.port,
                    baudrate=config.baudrate,
                    bytesize=self._get_bytesize(config.bytesize),
                    stopbits=self._get_stopbits(config.stopbits),
                    parity=self._get_parity(config.parity),
                    timeout=config.timeout,
                    write_timeout=config.write_timeout,
                    rtscts=config.rtscts,
                    dsrdtr=config.dsrdtr,
                )
                self._config = config
                self._set_state(SerialState.OPEN)

                # 启动接收线程
                self._running = True
                self._read_thread = threading.Thread(
                    target=self._read_loop,
                    daemon=True,
                    name=f"SerialReader-{config.port}",
                )
                self._read_thread.start()

                return True

            except Exception as e:
                self._set_state(SerialState.ERROR)
                self._trigger_error(f"打开串口失败: {e}")
                self._serial = None
                return False

    def close(self) -> bool:
        """关闭串口

        Returns:
            True 关闭成功
        """
        self._running = False

        # 等待接收线程结束
        if self._read_thread and self._read_thread.is_alive():
            self._read_thread.join(timeout=2.0)
            self._read_thread = None

        with self._lock:
            self._close_serial()
            self._set_state(SerialState.CLOSED)
            return True

    def _close_serial(self):
        """内部：关闭串口（不加锁，由调用方保证）"""
        if self._serial:
            try:
                if self._serial.is_open:
                    # 清除缓冲区
                    try:
                        self._serial.cancel_read()
                    except Exception:
                        pass
                    try:
                        self._serial.cancel_write()
                    except Exception:
                        pass
                    self._serial.close()
            except Exception as e:
                self._trigger_error(f"关闭串口时发生异常: {e}")
            finally:
                self._serial = None
                self._config = None

    # ---------- 数据发送 ----------

    def send(self, data: bytes) -> int:
        """发送数据

        Args:
            data: 要发送的字节数据

        Returns:
            实际发送的字节数；失败返回 -1
        """
        if not self.is_open or not self._serial:
            self._trigger_error("串口未打开，无法发送")
            return -1

        try:
            written = self._serial.write(data)
            self._serial.flush()
            return written
        except Exception as e:
            self._trigger_error(f"发送数据失败: {e}")
            return -1

    def send_text(self, text: str, encoding: str = "utf-8") -> int:
        """发送文本（自动编码为 bytes）

        Returns:
            实际发送的字节数
        """
        return self.send(text.encode(encoding, errors="replace"))

    def send_hex_from_string(self, hex_str: str) -> int:
        """从 HEX 字符串发送（如 'A1 B2'）

        Returns:
            实际发送的字节数；格式错误返回 -1
        """
        from .data_processor import DataProcessor
        data = DataProcessor.hex_to_bytes(hex_str)
        if data is None:
            self._trigger_error(f"HEX 格式错误: {hex_str}")
            return -1
        return self.send(data)

    # ---------- 接收循环 ----------

    def _read_loop(self):
        """后台接收线程：持续读取串口数据并通过回调通知"""
        while self._running:
            if not self._serial or not self._serial.is_open:
                break

            try:
                # 读取可用数据（非阻塞，由 timeout 控制等待时间）
                if self._serial.in_waiting > 0:
                    data = self._serial.read(self._serial.in_waiting)
                    if data and self.on_data_received:
                        self.on_data_received(data)
                else:
                    # 没有数据时短暂休眠，降低 CPU 占用
                    time.sleep(0.005)
            except serial.SerialException as e:
                if self._running:  # 非主动关闭导致的异常
                    self._trigger_error(f"串口读取异常: {e}")
                    self._set_state(SerialState.ERROR)
                break
            except Exception as e:
                if self._running:
                    self._trigger_error(f"读取数据异常: {e}")
                break

    # ---------- 工具方法 ----------

    def _set_state(self, state: SerialState):
        self._state = state
        if self.on_state_changed:
            try:
                self.on_state_changed(state)
            except Exception:
                pass

    def _trigger_error(self, msg: str):
        if self.on_error:
            try:
                self.on_error(msg)
            except Exception:
                pass

    @staticmethod
    def _get_bytesize(value: int):
        if not HAS_PYSERIAL:
            return None
        mapping = {5: serial.FIVEBITS, 6: serial.SIXBITS,
                    7: serial.SEVENBITS, 8: serial.EIGHTBITS}
        return mapping.get(value, serial.EIGHTBITS)

    @staticmethod
    def _get_stopbits(value: float):
        if not HAS_PYSERIAL:
            return None
        mapping = {1: serial.STOPBITS_ONE, 1.5: serial.STOPBITS_ONE_POINT_FIVE,
                    2: serial.STOPBITS_TWO}
        return mapping.get(value, serial.STOPBITS_ONE)

    @staticmethod
    def _get_parity(value: str):
        if not HAS_PYSERIAL:
            return None
        mapping = {"N": serial.PARITY_NONE, "E": serial.PARITY_EVEN,
                    "O": serial.PARITY_ODD, "M": serial.PARITY_MARK,
                    "S": serial.PARITY_SPACE}
        return mapping.get(value.upper(), serial.PARITY_NONE)

    # ---------- 资源清理 ----------

    def __del__(self):
        self.close()

    def __repr__(self) -> str:
        return (f"SerialWorker(port={self.port}, "
                f"state={self._state.name}, "
                f"is_open={self.is_open})")
