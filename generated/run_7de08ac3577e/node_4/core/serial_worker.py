"""串口工作者 - 打开/关闭/读写串口"""
import sys
import threading
from typing import Optional, Callable, List

from .serial_config import SerialConfig

# 尝试导入 pyserial
try:
    import serial
    import serial.tools.list_ports
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False


class SerialWorker:
    """
    串口工作者，负责串口的打开、关闭、读写操作。
    以线程方式运行，通过回调传递接收数据。
    """

    def __init__(self):
        self._serial: Optional["serial.Serial"] = None
        self._config: Optional[SerialConfig] = None
        self._running = False
        self._read_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # 回调
        self.on_data_received: Optional[Callable[[bytes], None]] = None
        self.on_error: Optional[Callable[[str], None]] = None
        self.on_connection_changed: Optional[Callable[[bool], None]] = None

    @property
    def is_open(self) -> bool:
        return self._serial is not None and self._serial.is_open

    @property
    def config(self) -> Optional[SerialConfig]:
        return self._config

    @staticmethod
    def list_ports() -> List[str]:
        """列出可用串口"""
        if not HAS_SERIAL:
            return []
        try:
            ports = serial.tools.list_ports.comports()
            return [p.device for p in sorted(ports)]
        except Exception:
            return []

    def open(self, config: SerialConfig) -> str:
        """
        打开串口
        :param config: 串口配置
        :return: 错误信息，空字符串表示成功
        """
        if not HAS_SERIAL:
            return "未安装 pyserial 库，无法操作串口"

        if self.is_open:
            return "串口已打开"

        if not config.is_valid:
            return "无效的串口配置（端口为空）"

        try:
            ser = serial.Serial(
                port=config.port,
                baudrate=config.baudrate,
                bytesize=config.bytesize,
                parity=config.parity,
                stopbits=config.stopbits,
                timeout=0.1,  # 读取超时
            )
            self._serial = ser
            self._config = config
            self._running = True
            self._read_thread = threading.Thread(target=self._read_loop, daemon=True)
            self._read_thread.start()
            if self.on_connection_changed:
                self.on_connection_changed(True)
            return ""
        except (serial.SerialException, OSError) as e:
            return f"打开串口失败: {e}"

    def close(self) -> str:
        """
        关闭串口
        :return: 错误信息，空字符串表示成功
        """
        if not self.is_open:
            return "串口未打开"

        self._running = False
        if self._read_thread and self._read_thread.is_alive():
            self._read_thread.join(timeout=1.0)

        with self._lock:
            try:
                self._serial.close()
            except Exception as e:
                pass
            self._serial = None
            self._config = None

        if self.on_connection_changed:
            self.on_connection_changed(False)
        return ""

    def send(self, data: bytes) -> str:
        """
        发送数据
        :param data: 待发送的字节数据
        :return: 错误信息，空字符串表示成功
        """
        if not self.is_open:
            return "串口未打开，无法发送"

        if not data:
            return "无数据可发送"

        try:
            with self._lock:
                written = self._serial.write(data)
            return ""
        except (serial.SerialException, OSError) as e:
            return f"发送数据失败: {e}"

    def _read_loop(self) -> None:
        """读取循环（在独立线程中运行）"""
        while self._running:
            try:
                if self._serial and self._serial.is_open:
                    # 读取可用数据
                    waiting = self._serial.in_waiting
                    if waiting > 0:
                        data = self._serial.read(waiting)
                        if data and self.on_data_received:
                            self.on_data_received(data)
                    else:
                        # 没有数据时短暂休眠
                        import time
                        time.sleep(0.01)
                else:
                    break
            except Exception as e:
                if self.on_error:
                    self.on_error(f"读取数据错误: {e}")
                break

    def __del__(self):
        self.close()

    def __repr__(self) -> str:
        return f"SerialWorker(open={self.is_open}, config={self._config})"
