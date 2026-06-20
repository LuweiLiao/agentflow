"""串口配置数据类"""
from typing import Optional, List

# 常用波特率
BAUD_RATES: List[int] = [
    300, 600, 1200, 2400, 4800, 9600, 14400,
    19200, 38400, 57600, 115200, 230400,
    460800, 921600
]
DEFAULT_BAUD = 115200


class SerialConfig:
    """串口配置，包含端口、波特率、数据位、停止位、校验位"""

    def __init__(
        self,
        port: str = "",
        baudrate: int = DEFAULT_BAUD,
        bytesize: int = 8,
        parity: str = "N",
        stopbits: float = 1.0,
    ):
        self.port = port
        self.baudrate = baudrate
        self.bytesize = bytesize
        self.parity = parity
        self.stopbits = stopbits

    @property
    def is_valid(self) -> bool:
        """配置是否有效（至少端口不为空）"""
        return bool(self.port.strip())

    def to_dict(self) -> dict:
        return {
            "port": self.port,
            "baudrate": self.baudrate,
            "bytesize": self.bytesize,
            "parity": self.parity,
            "stopbits": self.stopbits,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "SerialConfig":
        return cls(
            port=d.get("port", ""),
            baudrate=d.get("baudrate", DEFAULT_BAUD),
            bytesize=d.get("bytesize", 8),
            parity=d.get("parity", "N"),
            stopbits=d.get("stopbits", 1.0),
        )

    def __repr__(self) -> str:
        return (f"SerialConfig(port={self.port!r}, baudrate={self.baudrate}, "
                f"bytesize={self.bytesize}, parity={self.parity!r}, stopbits={self.stopbits})")
