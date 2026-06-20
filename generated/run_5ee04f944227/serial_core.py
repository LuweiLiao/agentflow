"""
serial_core.py - 串口核心逻辑层

三层解耦架构中的核心层，负责：
1. 端口扫描
2. 串口参数配置（波特率、数据位、停止位、校验位）
3. ASCII/HEX 数据收发
4. 日志格式化
5. 提供 FakeSerial 便于无硬件环境测试

设计原则：
- 与 GUI 完全解耦，不依赖 PyQt
- 通过抽象基类定义接口
- RealSerialCore 使用 pyserial 实现真实串口通信
- FakeSerialCore 模拟串口行为，用于单元测试
"""

import abc
import time
import struct
import threading
from typing import Optional, Callable, List, Tuple


# ============================================================
# 数据格式常量
# ============================================================

class DataBits:
    """数据位常量"""
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8


class StopBits:
    """停止位常量"""
    ONE = 1
    ONE_POINT_FIVE = 1.5
    TWO = 2


class Parity:
    """校验位常量"""
    NONE = 'N'
    EVEN = 'E'
    ODD = 'O'
    MARK = 'M'
    SPACE = 'S'


# ============================================================
# 串口配置数据类
# ============================================================

class SerialConfig:
    """串口配置参数，不可变数据结构"""

    def __init__(
        self,
        port: str = "",
        baudrate: int = 9600,
        bytesize: int = DataBits.EIGHT,
        stopbits: float = StopBits.ONE,
        parity: str = Parity.NONE,
        timeout: float = 0.1,
        write_timeout: float = 1.0,
    ):
        self.port = port
        self.baudrate = baudrate
        self.bytesize = bytesize
        self.stopbits = stopbits
        self.parity = parity
        self.timeout = timeout
        self.write_timeout = write_timeout

    def to_dict(self) -> dict:
        return {
            "port": self.port,
            "baudrate": self.baudrate,
            "bytesize": self.bytesize,
            "stopbits": self.stopbits,
            "parity": self.parity,
            "timeout": self.timeout,
            "write_timeout": self.write_timeout,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SerialConfig":
        return cls(**{k: v for k, v in data.items() if k in cls.__init__.__code__.co_varnames})

    def __repr__(self) -> str:
        return (
            f"SerialConfig(port={self.port!r}, baudrate={self.baudrate}, "
            f"bytesize={self.bytesize}, stopbits={self.stopbits}, parity={self.parity!r})"
        )


# ============================================================
# 日志格式化工具
# ============================================================

class LogFormatter:
    """日志格式化工具，支持时间戳、收发标识、数据预览"""

    @staticmethod
    def format_received(data: bytes, timestamp: Optional[float] = None, hex_mode: bool = False) -> str:
        """格式化接收数据日志"""
        ts = timestamp if timestamp is not None else time.time()
        time_str = time.strftime("%H:%M:%S.", time.localtime(ts)) + f"{int((ts % 1) * 1000):03d}"
        if hex_mode:
            data_str = data.hex(" ").upper()
        else:
            # 尝试按 UTF-8 解码，不可见字符转义
            try:
                data_str = data.decode("utf-8")
                # 替换控制字符（保留换行等常见字符）
                data_str = "".join(
                    f"\\x{c:02x}" if (0 <= ord(c) < 32 and c not in "\n\r\t") else c
                    for c in data_str
                )
            except UnicodeDecodeError:
                data_str = data.hex(" ").upper()
        return f"[RX] [{time_str}] {data_str}"

    @staticmethod
    def format_sent(data: bytes, timestamp: Optional[float] = None, hex_mode: bool = False) -> str:
        """格式化发送数据日志"""
        ts = timestamp if timestamp is not None else time.time()
        time_str = time.strftime("%H:%M:%S.", time.localtime(ts)) + f"{int((ts % 1) * 1000):03d}"
        if hex_mode:
            data_str = data.hex(" ").upper()
        else:
            try:
                data_str = data.decode("utf-8")
                data_str = "".join(
                    f"\\x{c:02x}" if (0 <= ord(c) < 32 and c not in "\n\r\t") else c
                    for c in data_str
                )
            except UnicodeDecodeError:
                data_str = data.hex(" ").upper()
        return f"[TX] [{time_str}] {data_str}"

    @staticmethod
    def format_info(message: str, timestamp: Optional[float] = None) -> str:
        """格式化信息日志"""
        ts = timestamp if timestamp is not None else time.time()
        time_str = time.strftime("%H:%M:%S.", time.localtime(ts)) + f"{int((ts % 1) * 1000):03d}"
        return f"[INFO] [{time_str}] {message}"

    @staticmethod
    def format_error(message: str, timestamp: Optional[float] = None) -> str:
        """格式化错误日志"""
        ts = timestamp if timestamp is not None else time.time()
        time_str = time.strftime("%H:%M:%S.", time.localtime(ts)) + f"{int((ts % 1) * 1000):03d}"
        return f"[ERROR] [{time_str}] {message}"


# ============================================================
# HEX 编解码工具
# ============================================================

class HexCodec:
    """HEX 格式编解码工具"""

    @staticmethod
    def encode(data: bytes) -> str:
        """将字节数据编码为 HEX 字符串（大写，空格分隔）"""
        return data.hex(" ").upper()

    @staticmethod
    def decode(hex_str: str) -> bytes:
        """将 HEX 字符串解码为字节数据，支持空格分隔"""
        # 移除空格、换行、制表符等空白字符
        cleaned = "".join(hex_str.split())
        if not cleaned:
            return b""
        # 如果长度为奇数，补0
        if len(cleaned) % 2 != 0:
            cleaned = "0" + cleaned
        return bytes.fromhex(cleaned)

    @staticmethod
    def is_valid_hex(hex_str: str) -> bool:
        """检查字符串是否为合法的 HEX 格式"""
        cleaned = "".join(hex_str.split())
        if not cleaned:
            return False
        if len(cleaned) % 2 != 0:
            return False
        try:
            int(cleaned, 16)
            return True
        except ValueError:
            return False


# ============================================================
# 端口扫描器
# ============================================================

class PortScanner:
    """串口端口扫描器"""

    @staticmethod
    def list_ports() -> List[dict]:
        """
        扫描可用串口端口
        返回: [{"port": "COM1", "description": "...", "hwid": "..."}, ...]
        """
        try:
            import serial.tools.list_ports
            ports = []
            for port_info in serial.tools.list_ports.comports():
                ports.append({
                    "port": port_info.device,
                    "description": port_info.description or "",
                    "hwid": port_info.hwid or "",
                })
            return ports
        except ImportError:
            # 没有 pyserial 时返回空列表
            return []
        except Exception:
            return []

    @staticmethod
    def list_ports_simple() -> List[str]:
        """仅返回端口名称列表"""
        return [p["port"] for p in PortScanner.list_ports()]

    @staticmethod
    def scan_with_serial_number() -> List[dict]:
        """扫描包含序列号信息的端口"""
        try:
            import serial.tools.list_ports
            ports = []
            for port_info in serial.tools.list_ports.comports():
                ports.append({
                    "port": port_info.device,
                    "description": port_info.description,
                    "hwid": port_info.hwid,
                    "manufacturer": port_info.manufacturer or "",
                    "product": port_info.product or "",
                    "serial_number": port_info.serial_number or "",
                    "vid": port_info.vid,
                    "pid": port_info.pid,
                })
            return ports
        except ImportError:
            return []
        except Exception:
            return []


# ============================================================
# 抽象基类 SerialCore
# ============================================================

class SerialCore(abc.ABC):
    """
    串口核心抽象基类
    
    定义所有串口操作的标准接口，具体实现由子类完成。
    """

    # ---- 生命周期 ----

    @abc.abstractmethod
    def open(self, config: SerialConfig) -> bool:
        """打开串口，返回是否成功"""
        ...

    @abc.abstractmethod
    def close(self) -> bool:
        """关闭串口，返回是否成功"""
        ...

    @property
    @abc.abstractmethod
    def is_open(self) -> bool:
        """串口是否已打开"""
        ...

    # ---- 配置 ----

    @abc.abstractmethod
    def get_config(self) -> SerialConfig:
        """获取当前配置"""
        ...

    @abc.abstractmethod
    def update_config(self, config: SerialConfig) -> bool:
        """更新配置（串口打开状态下更新参数）"""
        ...

    # ---- 发送 ----

    @abc.abstractmethod
    def send(self, data: bytes) -> int:
        """发送原始字节数据，返回发送字节数"""
        ...

    def send_ascii(self, text: str) -> int:
        """发送 ASCII 字符串"""
        return self.send(text.encode("utf-8"))

    def send_hex(self, hex_str: str) -> int:
        """发送 HEX 字符串（如 'AA BB CC'）"""
        return self.send(HexCodec.decode(hex_str))

    # ---- 接收 ----

    @abc.abstractmethod
    def read(self, size: int = 1) -> bytes:
        """读取指定字节数的数据"""
        ...

    @abc.abstractmethod
    def read_all(self) -> bytes:
        """读取所有可用数据"""
        ...

    @abc.abstractmethod
    def read_until(self, expected: bytes, size: Optional[int] = None) -> bytes:
        """读取直到遇到 expected 或超时"""
        ...

    # ---- 状态 ----

    @abc.abstractmethod
    def get_port(self) -> str:
        """获取当前端口名"""
        ...

    @abc.abstractmethod
    def clear_buffers(self) -> None:
        """清空收发缓冲区"""
        ...

    # ---- 上下文管理器 ----

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False


# ============================================================
# RealSerialCore - 真实串口实现
# ============================================================

class RealSerialCore(SerialCore):
    """
    基于 pyserial 的真实串口实现
    
    使用 serial.Serial 与物理串口通信。
    """

    def __init__(self):
        self._serial = None  # type: Optional[serial.Serial]
        self._config = SerialConfig()
        self._lock = threading.Lock()

    # ---- 生命周期 ----

    def open(self, config: SerialConfig) -> bool:
        """打开串口"""
        try:
            import serial
            if self._serial is not None and self._serial.is_open:
                self._serial.close()
            ser = serial.Serial(
                port=config.port,
                baudrate=config.baudrate,
                bytesize=config.bytesize,
                stopbits=config.stopbits,
                parity=config.parity,
                timeout=config.timeout,
                write_timeout=config.write_timeout,
            )
            self._serial = ser
            self._config = config
            return True
        except Exception as e:
            self._serial = None
            raise SerialException(f"打开串口失败: {e}")

    def close(self) -> bool:
        """关闭串口"""
        with self._lock:
            if self._serial is not None and self._serial.is_open:
                try:
                    self._serial.close()
                except Exception:
                    pass
                self._serial = None
                return True
            return False

    @property
    def is_open(self) -> bool:
        if self._serial is not None:
            try:
                return self._serial.is_open
            except Exception:
                return False
        return False

    # ---- 配置 ----

    def get_config(self) -> SerialConfig:
        return self._config

    def update_config(self, config: SerialConfig) -> bool:
        """更新配置"""
        with self._lock:
            if self._serial is not None and self._serial.is_open:
                try:
                    was_open = True
                    self._serial.close()
                except Exception:
                    was_open = False
            self._config = config
            if hasattr(self, '_serial') and self._serial is not None:
                try:
                    self._serial.apply_settings({
                        "baudrate": config.baudrate,
                        "bytesize": config.bytesize,
                        "stopbits": config.stopbits,
                        "parity": config.parity,
                        "timeout": config.timeout,
                        "write_timeout": config.write_timeout,
                    })
                    return True
                except Exception:
                    # 如果 apply 失败，尝试重新打开
                    pass
            return True

    # ---- 发送 ----

    def send(self, data: bytes) -> int:
        """发送数据"""
        with self._lock:
            if not self.is_open:
                raise SerialException("串口未打开，无法发送数据")
            try:
                written = self._serial.write(data)
                return written
            except Exception as e:
                raise SerialException(f"发送数据失败: {e}")

    # ---- 接收 ----

    def read(self, size: int = 1) -> bytes:
        """读取数据"""
        if not self.is_open:
            raise SerialException("串口未打开，无法读取数据")
        try:
            return self._serial.read(size)
        except Exception as e:
            raise SerialException(f"读取数据失败: {e}")

    def read_all(self) -> bytes:
        """读取所有可用数据"""
        if not self.is_open:
            raise SerialException("串口未打开，无法读取数据")
        try:
            # 等待一小段时间积累数据
            time.sleep(0.05)
            return self._serial.read(self._serial.in_waiting or 1)
        except Exception as e:
            raise SerialException(f"读取数据失败: {e}")

    def read_until(self, expected: bytes, size: Optional[int] = None) -> bytes:
        """读取直到遇到分隔符"""
        if not self.is_open:
            raise SerialException("串口未打开，无法读取数据")
        try:
            return self._serial.read_until(expected, size)
        except Exception as e:
            raise SerialException(f"读取数据失败: {e}")

    # ---- 状态 ----

    def get_port(self) -> str:
        return self._config.port

    def clear_buffers(self) -> None:
        """清空缓冲区"""
        with self._lock:
            if self.is_open:
                try:
                    self._serial.reset_input_buffer()
                    self._serial.reset_output_buffer()
                except Exception:
                    pass

    def __del__(self):
        """析构时自动关闭"""
        self.close()


# ============================================================
# FakeSerialCore - 伪造串口实现（用于测试）
# ============================================================

class FakeSerialCore(SerialCore):
    """
    伪造串口核心，用于单元测试和无硬件环境开发
    
    特性：
    - 内部缓冲区模拟串口收发
    - 可预设接收数据用于测试
    - 记录所有发送数据便于断言验证
    - 支持模拟打开失败等异常场景
    """

    def __init__(self, fail_on_open: bool = False, fail_on_send: bool = False):
        self._config = SerialConfig(port="FAKE")
        self._is_open = False
        self._receive_buffer = bytearray()  # 模拟串口收到的数据
        self._sent_data = []                # 记录所有发送的数据
        self._fail_on_open = fail_on_open
        self._fail_on_send = fail_on_send
        self._open_count = 0
        self._close_count = 0

    # ---- 测试辅助方法 ----

    def inject_received_data(self, data: bytes) -> None:
        """注入模拟的接收数据（仿真硬件发来的数据）"""
        self._receive_buffer.extend(data)

    def inject_received_ascii(self, text: str) -> None:
        """注入 ASCII 格式的模拟接收数据"""
        self.inject_received_data(text.encode("utf-8"))

    def inject_received_hex(self, hex_str: str) -> None:
        """注入 HEX 格式的模拟接收数据"""
        self.inject_received_data(HexCodec.decode(hex_str))

    def get_sent_data(self) -> List[bytes]:
        """获取所有已发送的数据列表"""
        return list(self._sent_data)

    def get_sent_data_as_hex(self) -> List[str]:
        """获取所有已发送数据的 HEX 表示"""
        return [HexCodec.encode(d) for d in self._sent_data]

    def get_sent_count(self) -> int:
        """获取发送次数"""
        return len(self._sent_data)

    def get_total_sent_bytes(self) -> int:
        """获取发送总字节数"""
        return sum(len(d) for d in self._sent_data)

    def clear_sent_data(self) -> None:
        """清空发送记录"""
        self._sent_data.clear()

    def clear_receive_buffer(self) -> None:
        """清空接收缓冲区"""
        self._receive_buffer.clear()

    def reset(self) -> None:
        """重置所有状态"""
        self._is_open = False
        self._receive_buffer.clear()
        self._sent_data.clear()
        self._open_count = 0
        self._close_count = 0

    # ---- 串口配置查询 ----

    @property
    def baudrate(self) -> int:
        return self._config.baudrate

    @property
    def bytesize(self) -> int:
        return self._config.bytesize

    @property
    def stopbits(self) -> float:
        return self._config.stopbits

    @property
    def parity(self) -> str:
        return self._config.parity

    # ---- 生命周期 ----

    def open(self, config: SerialConfig) -> bool:
        """打开伪造串口"""
        if self._fail_on_open:
            self._is_open = False
            return False
        self._config = config
        self._is_open = True
        self._open_count += 1
        return True

    def close(self) -> bool:
        """关闭伪造串口"""
        if not self._is_open:
            return False
        self._is_open = False
        self._close_count += 1
        return True

    @property
    def is_open(self) -> bool:
        return self._is_open

    # ---- 配置 ----

    def get_config(self) -> SerialConfig:
        return self._config

    def update_config(self, config: SerialConfig) -> bool:
        """更新配置"""
        self._config = config
        return True

    # ---- 发送 ----

    def send(self, data: bytes) -> int:
        """发送数据（记录到发送列表）"""
        if not self._is_open:
            raise SerialException("串口未打开，无法发送数据")
        if self._fail_on_send:
            raise SerialException("模拟发送失败")
        self._sent_data.append(bytes(data))
        return len(data)

    # ---- 接收 ----

    def read(self, size: int = 1) -> bytes:
        """从接收缓冲区读取数据"""
        if not self._is_open:
            raise SerialException("串口未打开，无法读取数据")
        if len(self._receive_buffer) == 0:
            return b""
        actual = min(size, len(self._receive_buffer))
        result = bytes(self._receive_buffer[:actual])
        self._receive_buffer = self._receive_buffer[actual:]
        return result

    def read_all(self) -> bytes:
        """读取所有可用数据"""
        if not self._is_open:
            raise SerialException("串口未打开，无法读取数据")
        result = bytes(self._receive_buffer)
        self._receive_buffer.clear()
        return result

    def read_until(self, expected: bytes, size: Optional[int] = None) -> bytes:
        """读取直到遇到 expected"""
        if not self._is_open:
            raise SerialException("串口未打开，无法读取数据")
        if not expected:
            return b""
        idx = self._receive_buffer.find(expected)
        if idx == -1:
            if size is not None:
                actual = min(size, len(self._receive_buffer))
                result = bytes(self._receive_buffer[:actual])
                self._receive_buffer = self._receive_buffer[actual:]
                return result
            result = bytes(self._receive_buffer)
            self._receive_buffer.clear()
            return result
        end = idx + len(expected)
        if size is not None:
            end = min(end, size)
        result = bytes(self._receive_buffer[:end])
        self._receive_buffer = self._receive_buffer[end:]
        return result

    # ---- 状态 ----

    def get_port(self) -> str:
        return self._config.port

    def clear_buffers(self) -> None:
        """清空收发缓冲区"""
        self._receive_buffer.clear()
        self._sent_data.clear()


# ============================================================
# 串口异常类
# ============================================================

class SerialException(Exception):
    """串口操作异常"""
    pass


# ============================================================
# 便捷工厂函数
# ============================================================

def create_serial_core(fake: bool = False, **kwargs) -> SerialCore:
    """
    创建串口核心实例的工厂函数
    
    Args:
        fake: 是否使用伪造串口（用于测试）
        **kwargs: 传递给 FakeSerialCore 或 RealSerialCore 的参数
    
    Returns:
        SerialCore 实例
    """
    if fake:
        return FakeSerialCore(
            fail_on_open=kwargs.get("fail_on_open", False),
            fail_on_send=kwargs.get("fail_on_send", False),
        )
    return RealSerialCore()


# ============================================================
# 预定义的常用波特率
# ============================================================

BAUDRATES = [
    300, 600, 1200, 2400, 4800, 9600, 14400,
    19200, 38400, 57600, 115200, 128000, 256000,
    460800, 921600,
]

# 导出常用符号
__all__ = [
    "SerialCore",
    "RealSerialCore",
    "FakeSerialCore",
    "SerialConfig",
    "SerialException",
    "PortScanner",
    "LogFormatter",
    "HexCodec",
    "DataBits",
    "StopBits",
    "Parity",
    "BAUDRATES",
    "create_serial_core",
]
