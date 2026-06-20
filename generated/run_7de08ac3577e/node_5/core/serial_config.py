"""
串口配置数据类
"""
from dataclasses import dataclass, field
from typing import Optional


class BaudRate:
    """标准波特率常量"""
    B1200 = 1200
    B2400 = 2400
    B4800 = 4800
    B9600 = 9600
    B14400 = 14400
    B19200 = 19200
    B38400 = 38400
    B57600 = 57600
    B115200 = 115200
    B230400 = 230400
    B460800 = 460800
    B921600 = 921600

    @classmethod
    def values(cls):
        return [1200, 2400, 4800, 9600, 14400, 19200, 38400,
                57600, 115200, 230400, 460800, 921600]


class DataBits:
    """数据位"""
    FIVE = 5
    SIX = 6
    SEVEN = 7
    EIGHT = 8

    @classmethod
    def values(cls):
        return [5, 6, 7, 8]


class StopBits:
    """停止位"""
    ONE = 1
    ONE_POINT_FIVE = 1.5
    TWO = 2

    @classmethod
    def values(cls):
        return [1, 1.5, 2]


class Parity:
    """校验位"""
    NONE = "N"
    EVEN = "E"
    ODD = "O"
    MARK = "M"
    SPACE = "S"

    @classmethod
    def values(cls):
        return ["N", "E", "O", "M", "S"]


@dataclass
class SerialConfig:
    """串口配置数据类"""
    port: str = ""
    baudrate: int = BaudRate.B115200
    bytesize: int = DataBits.EIGHT
    stopbits: float = StopBits.ONE
    parity: str = Parity.NONE
    timeout: float = 0.1
    write_timeout: float = 1.0

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
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
