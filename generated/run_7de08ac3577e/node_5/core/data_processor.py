"""
数据处理器 - HEX/文本编解码
"""
import re
from typing import Union


class DataProcessor:
    """数据处理器，处理文本与HEX格式之间的转换"""

    @staticmethod
    def text_to_bytes(text: str, encoding: str = "utf-8") -> bytes:
        """将文本字符串编码为字节"""
        if not text:
            return b""
        return text.encode(encoding)

    @staticmethod
    def bytes_to_text(data: bytes, encoding: str = "utf-8", errors: str = "replace") -> str:
        """将字节解码为文本字符串"""
        if not data:
            return ""
        return data.decode(encoding, errors=errors)

    @staticmethod
    def hex_to_bytes(hex_str: str) -> bytes:
        """将HEX字符串转换为字节
        支持格式: "A1B2", "A1 B2", "0xA1 0xB2", "A1-B2"
        """
        if not hex_str or not hex_str.strip():
            return b""

        # 去除 0x 前缀和空白字符
        cleaned = re.sub(r'0x', '', hex_str, flags=re.IGNORECASE)
        # 去除分隔符（空格、连字符、冒号等）
        cleaned = re.sub(r'[\s\-:]+', '', cleaned)

        if not cleaned:
            return b""

        # 确保长度为偶数
        if len(cleaned) % 2 != 0:
            cleaned = "0" + cleaned

        try:
            return bytes.fromhex(cleaned)
        except ValueError as e:
            raise ValueError(f"HEX格式无效: '{hex_str}' -> '{cleaned}', 错误: {e}")

    @staticmethod
    def bytes_to_hex(data: bytes, sep: str = " ", upper: bool = True) -> str:
        """将字节转换为HEX字符串
        Args:
            data: 输入字节
            sep: 分隔符，默认空格
            upper: 是否大写
        Returns:
            HEX字符串，如 "A1 B2 C3"
        """
        if not data:
            return ""

        hex_str = data.hex().upper() if upper else data.hex()

        if sep:
            # 每两个字符插入分隔符
            parts = [hex_str[i:i+2] for i in range(0, len(hex_str), 2)]
            return sep.join(parts)
        return hex_str

    @staticmethod
    def is_valid_hex(hex_str: str) -> bool:
        """检查字符串是否为有效的HEX格式"""
        if not hex_str or not hex_str.strip():
            return False

        cleaned = re.sub(r'0x', '', hex_str, flags=re.IGNORECASE)
        cleaned = re.sub(r'[\s\-:]+', '', cleaned)

        if not cleaned:
            return False

        try:
            bytes.fromhex(cleaned)
            return True
        except ValueError:
            return False

    @staticmethod
    def detect_encoding(data: bytes) -> str:
        """尝试检测字节数据的编码"""
        if not data:
            return "utf-8"

        # 尝试常见编码
        for enc in ["utf-8", "gbk", "gb2312", "ascii", "latin-1"]:
            try:
                data.decode(enc)
                return enc
            except (UnicodeDecodeError, LookupError):
                continue
        return "utf-8"
