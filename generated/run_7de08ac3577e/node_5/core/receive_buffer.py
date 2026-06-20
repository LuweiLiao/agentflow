"""
接收缓冲区 - 环形缓存管理接收数据
"""
from typing import Optional, List
from collections import deque
import threading


class ReceiveBuffer:
    """接收环形缓冲区，线程安全"""

    def __init__(self, max_size: int = 1024 * 1024):
        """
        Args:
            max_size: 最大字节数，默认1MB
        """
        self._max_size = max_size
        self._buffer = bytearray()
        self._lock = threading.Lock()

    def append(self, data: bytes):
        """追加接收数据"""
        if not data:
            return

        with self._lock:
            self._buffer.extend(data)
            # 如果超过最大大小，丢弃旧数据
            if len(self._buffer) > self._max_size:
                excess = len(self._buffer) - self._max_size
                self._buffer = self._buffer[excess:]

    def clear(self):
        """清空缓冲区"""
        with self._lock:
            self._buffer.clear()

    def get_all(self) -> bytes:
        """获取所有数据"""
        with self._lock:
            return bytes(self._buffer)

    def get_last(self, size: int) -> bytes:
        """获取最近N字节"""
        with self._lock:
            if not self._buffer:
                return b""
            return bytes(self._buffer[-size:])

    def get_and_clear(self) -> bytes:
        """获取并清空"""
        with self._lock:
            data = bytes(self._buffer)
            self._buffer.clear()
            return data

    @property
    def size(self) -> int:
        """当前缓冲区大小"""
        with self._lock:
            return len(self._buffer)

    @property
    def max_size(self) -> int:
        return self._max_size

    def __len__(self) -> int:
        return self.size
