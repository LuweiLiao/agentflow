"""HEX/文本编解码工具"""
import re
from typing import Tuple


class DataProcessor:
    """数据处理器：负责 HEX 字符串与字节序列之间的转换"""

    @staticmethod
    def bytes_to_hex(data: bytes, sep: str = " ") -> str:
        """字节转HEX字符串，如 b'\\x01\\x02' -> '01 02'"""
        return sep.join(f"{b:02X}" for b in data)

    @staticmethod
    def hex_to_bytes(hex_str: str) -> Tuple[bytes, str]:
        """
        HEX字符串转字节序列。
        支持 '01 02', '01-02', '0x01 0x02', '0102' 等格式。
        返回 (bytes, 错误信息)，错误信息为空表示成功。
        """
        if not hex_str or not hex_str.strip():
            return b"", "输入为空"

        # 统一分隔符：去掉 0x/0X 前缀，将非HEX字符转为空格
        s = hex_str.strip()
        # 移除 0x 或 0X 前缀
        s = re.sub(r'0[xX]', ' ', s)
        # 将非十六进制字符（空格、横线、冒号等）替换为空格
        s = re.sub(r'[^0-9a-fA-F]', ' ', s)
        # 分割
        parts = [p for p in s.split() if p]

        if not parts:
            return b"", "无法识别的HEX格式"

        # 如果所有部分长度都是2（标准HEX字节），直接转换
        # 否则尝试连接成完整十六进制串
        if all(len(p) == 2 for p in parts):
            try:
                return bytes(int(p, 16) for p in parts), ""
            except ValueError as e:
                return b"", f"HEX转换错误: {e}"

        # 尝试整体作为连续十六进制串
        joined = "".join(parts)
        if len(joined) % 2 != 0:
            return b"", f"HEX字符串长度({len(joined)})不是偶数"

        try:
            return bytes(int(joined[i:i+2], 16) for i in range(0, len(joined), 2)), ""
        except ValueError as e:
            return b"", f"HEX转换错误: {e}"

    @staticmethod
    def format_received(data: bytes, hex_mode: bool) -> str:
        """格式化接收到的数据用于显示"""
        if hex_mode:
            return DataProcessor.bytes_to_hex(data)
        else:
            # 尝试UTF-8解码，失败则用repr
            try:
                return data.decode("utf-8")
            except UnicodeDecodeError:
                return repr(data)[1:-1]  # 去掉引号

    @staticmethod
    def prepare_send(text: str, hex_mode: bool) -> Tuple[bytes, str]:
        """
        准备待发送的数据。
        返回 (bytes, 错误信息)
        """
        if hex_mode:
            return DataProcessor.hex_to_bytes(text)
        else:
            # 文本模式：直接编码
            return text.encode("utf-8", errors="replace"), ""
