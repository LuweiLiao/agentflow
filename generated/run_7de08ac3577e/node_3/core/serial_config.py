"""串口参数配置数据类，纯数据模型，无副作用"""

from dataclasses import dataclass, field
from typing import Optional


# 常用波特率列表
STANDARD_BAUDRATES = [
    300, 600, 1200, 2400, 4800, 9600, 14400,
    19200, 28800, 38400, 57600, 115200, 230400,
    460800, 921600,
]

# 数据位选项
STANDARD_DATA_BITS = [5, 6, 7, 8]

# 停止位选项（pyserial 使用浮点值）
STANDARD_STOP_BITS = [1, 1.5, 2]

# 校验位选项（pyserial 字符串值）
STANDARD_PARITY = {
    "None": "N",
    "Even": "E",
    "Odd": "O",
    "Mark": "M",
    "Space": "S",
}


@dataclass
class SerialConfig:
    """串口配置参数

    所有字段都有合理默认值，可在无串口环境下构造使用。
    """
    port: str = ""
    baudrate: int = 115200
    bytesize: int = 8
    stopbits: float = 1.0
    parity: str = "N"          # 'N','E','O','M','S'
    timeout: float = 0.1       # 读取超时（秒）
    write_timeout: float = 1.0  # 写入超时（秒）
    rtscts: bool = False       # 硬件流控
    dsrdtr: bool = False       # 硬件流控

    def to_dict(self) -> dict:
        """转为可序列化字典"""
        return {
            "port": self.port,
            "baudrate": self.baudrate,
            "bytesize": self.bytesize,
            "stopbits": self.stopbits,
            "parity": self.parity,
            "timeout": self.timeout,
            "write_timeout": self.write_timeout,
            "rtscts": self.rtscts,
            "dsrdtr": self.dsrdtr,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "SerialConfig":
        """从字典恢复配置"""
        return cls(
            port=data.get("port", ""),
            baudrate=data.get("baudrate", 115200),
            bytesize=data.get("bytesize", 8),
            stopbits=data.get("stopbits", 1.0),
            parity=data.get("parity", "N"),
            timeout=data.get("timeout", 0.1),
            write_timeout=data.get("write_timeout", 1.0),
            rtscts=data.get("rtscts", False),
            dsrdtr=data.get("dsrdtr", False),
        )

    def is_valid(self) -> bool:
        """检查配置是否基本有效"""
        if not self.port:
            return False
        if self.baudrate <= 0:
            return False
        if self.bytesize not in (5, 6, 7, 8):
            return False
        if self.parity not in ("N", "E", "O", "M", "S"):
            return False
        if self.stopbits not in (1, 1.5, 2):
            return False
        return True

    def __repr__(self) -> str:
        return (f"SerialConfig(port={self.port!r}, baudrate={self.baudrate}, "
                f"bytesize={self.bytesize}, stopbits={self.stopbits}, "
                f"parity={self.parity})")
