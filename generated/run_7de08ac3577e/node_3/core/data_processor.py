"""数据处理器：文本与 HEX 之间的编解码，以及发送数据的准备"""

import binascii
import re
from typing import Union


class DataProcessor:
    """文本/HEX 数据编解码，纯函数工具类"""

    # ---------- 编码：发送方向 ----------

    @staticmethod
    def encode_send(text: str, hex_mode: bool) -> Union[bytes, None]:
        """将用户输入的字符串编码为发送用的字节流

        Args:
            text: 用户输入的字符串
            hex_mode: 若为 True，则将输入视为 HEX 字符串（空格可选）进行解码

        Returns:
            字节数据；若 HEX 格式错误则返回 None
        """
        if hex_mode:
            return DataProcessor.hex_to_bytes(text)
        else:
            return text.encode("utf-8", errors="replace")

    # ---------- 解码：接收方向 ----------

    @staticmethod
    def decode_receive(data: bytes, hex_mode: bool) -> str:
        """将接收到的字节流解码为可显示的字符串

        Args:
            data: 原始字节数据
            hex_mode: 若为 True，输出大写 HEX 字符串（空格分隔）

        Returns:
            可显示的字符串
        """
        if hex_mode:
            return DataProcessor.bytes_to_hex(data)
        else:
            return DataProcessor.bytes_to_text(data)

    # ---------- 底层转换 ----------

    @staticmethod
    def hex_to_bytes(hex_str: str) -> Union[bytes, None]:
        """将 HEX 字符串（如 'A1 B2' 或 '0xA1 0xB2' 或 'A1B2'）转换为字节

        支持：
        - 纯 HEX: "A1B2" / "a1 b2"
        - 带 0x 前缀: "0xA1 0xB2"
        - 逗号分隔: "A1,B2"
        - 混合分隔: "A1 B2, C3"

        Returns:
            成功返回 bytes，失败返回 None
        """
        hex_str = hex_str.strip()
        if not hex_str:
            return b""

        # 1) 移除所有 "0x" 和 "0X" 前缀（整体移除，不拆分数字）
        cleaned = re.sub(r'0[xX]', '', hex_str)

        # 2) 只保留十六进制字符
        hex_chars = []
        for ch in cleaned:
            if ch in "0123456789abcdefABCDEF":
                hex_chars.append(ch)
            elif ch in " \t\r\n,;":
                continue
            else:
                # 遇到非法字符
                return None

        if not hex_chars:
            return b""

        hex_string = "".join(hex_chars)

        # 3) 奇数长度补 0
        if len(hex_string) % 2 != 0:
            hex_string = "0" + hex_string

        try:
            return binascii.unhexlify(hex_string)
        except binascii.Error:
            return None

    @staticmethod
    def bytes_to_hex(data: bytes, uppercase: bool = True, sep: str = " ") -> str:
        """将字节转换为 HEX 显示字符串

        Args:
            data: 字节数据
            uppercase: 是否大写
            sep: 字节之间的分隔符

        Returns:
            如 "A1 B2 C3"
        """
        if not data:
            return ""
        hex_str = binascii.hexlify(data).decode("ascii")
        parts = [hex_str[i:i+2] for i in range(0, len(hex_str), 2)]
        result = sep.join(parts)
        return result.upper() if uppercase else result.lower()

    @staticmethod
    def bytes_to_text(data: bytes, encoding: str = "utf-8", errors: str = "replace") -> str:
        """将字节按文本解码

        Args:
            data: 字节数据
            encoding: 编码方式，默认 utf-8
            errors: 解码错误处理方式，默认 replace

        Returns:
            解码后的字符串
        """
        return data.decode(encoding, errors=errors)

    @staticmethod
    def is_valid_hex(hex_str: str) -> bool:
        """检查字符串是否为合法的 HEX 输入"""
        return DataProcessor.hex_to_bytes(hex_str) is not None
