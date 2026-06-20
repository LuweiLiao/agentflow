"""接收环形缓存"""
from typing import Optional


class ReceiveBuffer:
    """环形接收缓冲区，存储接收到的原始字节数据"""

    def __init__(self, max_size: int = 1024 * 1024):
        """
        :param max_size: 缓冲区最大字节数（默认1MB）
        """
        self._buffer = bytearray()
        self._max_size = max_size

    @property
    def size(self) -> int:
        return len(self._buffer)

    @property
    def empty(self) -> bool:
        return len(self._buffer) == 0

    def append(self, data: bytes) -> None:
        """追加数据，超出容量时丢弃最旧的数据"""
        if not data:
            return
        self._buffer.extend(data)
        # 环形裁剪
        if len(self._buffer) > self._max_size:
            overflow = len(self._buffer) - self._max_size
            self._buffer = self._buffer[overflow:]

    def clear(self) -> None:
        """清空缓冲区"""
        self._buffer.clear()

    def get_all(self) -> bytes:
        """获取全部数据"""
        return bytes(self._buffer)

    def get_all_as_text(self, encoding: str = "utf-8") -> str:
        """以文本形式获取全部数据"""
        try:
            return self._buffer.decode(encoding)
        except UnicodeDecodeError:
            return repr(self._buffer)

    def read(self, size: Optional[int] = None) -> bytes:
        """
        读取并移除数据（队列模式）
        :param size: 读取字节数，None表示全部
        """
        if size is None or size >= len(self._buffer):
            result = bytes(self._buffer)
            self._buffer.clear()
            return result
        result = bytes(self._buffer[:size])
        self._buffer = self._buffer[size:]
        return result

    def peek(self, size: Optional[int] = None) -> bytes:
        """查看但不移除数据"""
        if size is None:
            return bytes(self._buffer)
        return bytes(self._buffer[:size])

    def hex_dump(self, sep: str = " ", max_len: int = 0) -> str:
        """以HEX形式输出缓冲区内容"""
        data = self._buffer
        if max_len > 0 and len(data) > max_len:
            data = data[:max_len]
        return sep.join(f"{b:02X}" for b in data)

    def __len__(self) -> int:
        return len(self._buffer)

    def __repr__(self) -> str:
        return f"ReceiveBuffer(size={len(self._buffer)}, max_size={self._max_size})"
