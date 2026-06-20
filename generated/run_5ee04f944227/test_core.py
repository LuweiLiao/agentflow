#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_core.py - serial_core.py 的全面单元测试

测试范围：
1. SerialConfig 配置类
2. LogFormatter 日志格式化
3. HexCodec HEX编解码
4. FakeSerialCore 伪造串口核心
5. SerialException 异常处理
6. 工厂函数 create_serial_core
7. 常量 BAUDRATES / DataBits / StopBits / Parity

运行方式：python3 -m unittest test_core.py -v
"""

import unittest
import time
from typing import List

# 导入待测试模块
from serial_core import (
    SerialConfig,
    LogFormatter,
    HexCodec,
    FakeSerialCore,
    RealSerialCore,
    SerialCore,
    SerialException,
    PortScanner,
    DataBits,
    StopBits,
    Parity,
    BAUDRATES,
    create_serial_core,
)


# ============================================================
# 1. SerialConfig 测试
# ============================================================

class TestSerialConfig(unittest.TestCase):
    """测试 SerialConfig 配置数据类"""

    def test_default_config(self):
        """测试默认配置参数"""
        config = SerialConfig()
        self.assertEqual(config.port, "")
        self.assertEqual(config.baudrate, 9600)
        self.assertEqual(config.bytesize, DataBits.EIGHT)
        self.assertEqual(config.stopbits, StopBits.ONE)
        self.assertEqual(config.parity, Parity.NONE)
        self.assertAlmostEqual(config.timeout, 0.1)
        self.assertAlmostEqual(config.write_timeout, 1.0)

    def test_custom_config(self):
        """测试自定义配置参数"""
        config = SerialConfig(
            port="COM3",
            baudrate=115200,
            bytesize=DataBits.EIGHT,
            stopbits=StopBits.TWO,
            parity=Parity.EVEN,
            timeout=1.0,
            write_timeout=2.0,
        )
        self.assertEqual(config.port, "COM3")
        self.assertEqual(config.baudrate, 115200)
        self.assertEqual(config.bytesize, 8)
        self.assertEqual(config.stopbits, 2)
        self.assertEqual(config.parity, "E")
        self.assertAlmostEqual(config.timeout, 1.0)

    def test_to_dict(self):
        """测试 to_dict 方法"""
        config = SerialConfig(port="COM1", baudrate=9600)
        d = config.to_dict()
        self.assertEqual(d["port"], "COM1")
        self.assertEqual(d["baudrate"], 9600)
        self.assertEqual(d["bytesize"], 8)
        self.assertEqual(d["stopbits"], 1)
        self.assertEqual(d["parity"], "N")

    def test_from_dict(self):
        """测试 from_dict 类方法"""
        data = {
            "port": "COM2",
            "baudrate": 57600,
            "bytesize": 7,
            "stopbits": 1.5,
            "parity": "O",
            "timeout": 0.5,
            "write_timeout": 3.0,
        }
        config = SerialConfig.from_dict(data)
        self.assertEqual(config.port, "COM2")
        self.assertEqual(config.baudrate, 57600)
        self.assertEqual(config.bytesize, 7)
        self.assertEqual(config.stopbits, 1.5)
        self.assertEqual(config.parity, "O")

    def test_from_dict_extra_keys(self):
        """测试 from_dict 忽略额外键"""
        data = {"port": "COM1", "baudrate": 9600, "extra_key": "ignored"}
        config = SerialConfig.from_dict(data)
        self.assertEqual(config.port, "COM1")
        self.assertFalse(hasattr(config, "extra_key"))

    def test_from_dict_empty(self):
        """测试 from_dict 空字典"""
        config = SerialConfig.from_dict({})
        self.assertEqual(config.port, "")
        self.assertEqual(config.baudrate, 9600)

    def test_to_from_dict_roundtrip(self):
        """测试 to_dict -> from_dict 往返一致性"""
        original = SerialConfig(port="/dev/ttyUSB0", baudrate=115200, parity=Parity.EVEN)
        restored = SerialConfig.from_dict(original.to_dict())
        self.assertEqual(original.port, restored.port)
        self.assertEqual(original.baudrate, restored.baudrate)
        self.assertEqual(original.bytesize, restored.bytesize)
        self.assertEqual(original.stopbits, restored.stopbits)
        self.assertEqual(original.parity, restored.parity)
        self.assertEqual(original.timeout, restored.timeout)
        self.assertEqual(original.write_timeout, restored.write_timeout)

    def test_repr(self):
        """测试 __repr__ 输出"""
        config = SerialConfig(port="COM1", baudrate=9600)
        repr_str = repr(config)
        self.assertIn("COM1", repr_str)
        self.assertIn("9600", repr_str)
        self.assertIn("SerialConfig", repr_str)

    def test_config_immutability(self):
        """测试配置数据独立性"""
        config = SerialConfig(port="COM1")
        d = config.to_dict()
        d["port"] = "COM2"
        self.assertEqual(config.port, "COM1")  # 原始对象不应改变


# ============================================================
# 2. LogFormatter 测试
# ============================================================

class TestLogFormatter(unittest.TestCase):
    """测试 LogFormatter 日志格式化工具"""

    def setUp(self):
        """使用 0.125（1/8）作为小数部分，这是二进制精确值"""
        self.fixed_ts = 1234567890.125
        self.expected_time_str = "07:31:30.125"

    def test_format_received_ascii(self):
        """测试 format_received ASCII 模式"""
        result = LogFormatter.format_received(b"Hello", self.fixed_ts, hex_mode=False)
        self.assertIn("[RX]", result)
        self.assertIn(self.expected_time_str, result)
        self.assertIn("Hello", result)

    def test_format_received_hex(self):
        """测试 format_received HEX 模式"""
        result = LogFormatter.format_received(b"\x01\x02\x03", self.fixed_ts, hex_mode=True)
        self.assertIn("[RX]", result)
        self.assertIn(self.expected_time_str, result)
        self.assertIn("01 02 03", result)

    def test_format_received_control_chars(self):
        """测试 format_received 控制字符转义"""
        # 0x01 (SOH) 应被转义（<32 且不在 \n\r\t 中）
        # \n 保留（在保留列表中）
        data = b"\x01Hello\nWorld\x02"
        result = LogFormatter.format_received(data, self.fixed_ts, hex_mode=False)
        self.assertIn("\\x01", result)
        self.assertIn("Hello", result)
        self.assertIn("\n", result)
        self.assertIn("World", result)
        self.assertIn("\\x02", result)

    def test_format_received_non_utf8(self):
        """测试 format_received 处理非 UTF-8 数据时自动切换 HEX"""
        data = b"\xff\xfe"
        result = LogFormatter.format_received(data, self.fixed_ts, hex_mode=False)
        # 由于解码失败，应自动使用 HEX 格式
        self.assertIn("FF FE", result.upper())

    def test_format_sent_ascii(self):
        """测试 format_sent ASCII 模式"""
        result = LogFormatter.format_sent(b"AT+CMD", self.fixed_ts, hex_mode=False)
        self.assertIn("[TX]", result)
        self.assertIn(self.expected_time_str, result)
        self.assertIn("AT+CMD", result)

    def test_format_sent_hex(self):
        """测试 format_sent HEX 模式"""
        result = LogFormatter.format_sent(b"\xAA\xBB", self.fixed_ts, hex_mode=True)
        self.assertIn("[TX]", result)
        self.assertIn("AA BB", result)

    def test_format_sent_control_chars(self):
        """测试 format_sent 控制字符转义"""
        data = b"AT\r\n"
        result = LogFormatter.format_sent(data, self.fixed_ts, hex_mode=False)
        # \r (0x0d) 和 \n (0x0a) 都在保留列表 "\n\r\t" 中，所以不会被转义
        self.assertNotIn("\\x0d", result)
        self.assertIn("AT", result)
        self.assertIn("\r", result)
        self.assertIn("\n", result)

    def test_format_info(self):
        """测试 format_info"""
        result = LogFormatter.format_info("串口已打开", self.fixed_ts)
        self.assertIn("[INFO]", result)
        self.assertIn(self.expected_time_str, result)
        self.assertIn("串口已打开", result)

    def test_format_error(self):
        """测试 format_error"""
        result = LogFormatter.format_error("打开失败", self.fixed_ts)
        self.assertIn("[ERROR]", result)
        self.assertIn(self.expected_time_str, result)
        self.assertIn("打开失败", result)

    def test_format_without_timestamp(self):
        """测试不提供时间戳时自动使用当前时间"""
        result = LogFormatter.format_info("test")
        self.assertIn("[INFO]", result)
        self.assertIn("test", result)
        # 时间戳应该存在（格式为 HH:MM:SS.mmm）
        import re
        self.assertIsNotNone(re.search(r'\d{2}:\d{2}:\d{2}\.\d{3}', result))

    def test_format_empty_data(self):
        """测试空数据格式化"""
        result = LogFormatter.format_received(b"", self.fixed_ts, hex_mode=True)
        self.assertIn("[RX]", result)
        self.assertIn(self.expected_time_str, result)

    def test_format_sent_empty_hex(self):
        """测试空数据发送 HEX 格式化"""
        result = LogFormatter.format_sent(b"", self.fixed_ts, hex_mode=True)
        self.assertIn("[TX]", result)
        self.assertIn(self.expected_time_str, result)


# ============================================================
# 3. HexCodec 测试
# ============================================================

class TestHexCodec(unittest.TestCase):
    """测试 HexCodec HEX 编解码工具"""

    def test_encode_basic(self):
        """测试基本编码"""
        self.assertEqual(HexCodec.encode(b"\x01\x02\xFF"), "01 02 FF")

    def test_encode_empty(self):
        """测试空字节编码"""
        self.assertEqual(HexCodec.encode(b""), "")

    def test_decode_basic(self):
        """测试基本解码"""
        self.assertEqual(HexCodec.decode("01 02 FF"), b"\x01\x02\xFF")

    def test_decode_no_spaces(self):
        """测试无空格解码"""
        self.assertEqual(HexCodec.decode("0102FF"), b"\x01\x02\xFF")

    def test_decode_mixed_spaces(self):
        """测试混合空格解码"""
        self.assertEqual(HexCodec.decode(" AA  BB  "), b"\xAA\xBB")

    def test_decode_lowercase(self):
        """测试小写字母解码"""
        self.assertEqual(HexCodec.decode("aa bb cc"), b"\xAA\xBB\xCC")

    def test_decode_empty(self):
        """测试空字符串解码"""
        self.assertEqual(HexCodec.decode(""), b"")
        self.assertEqual(HexCodec.decode("   "), b"")

    def test_decode_odd_length(self):
        """测试奇数长度自动补0（前补零）"""
        # "A" -> cleaned="A" (len=1,奇数) -> "0A" -> b'\x0a'
        self.assertEqual(HexCodec.decode("A"), b"\x0A")
        # "ABC" -> cleaned="ABC" (len=3,奇数) -> "0ABC" -> b'\x0a\xbc'
        self.assertEqual(HexCodec.decode("ABC"), b"\x0A\xBC")

    def test_decode_newlines_and_tabs(self):
        """测试解码含换行符和制表符的字符串"""
        self.assertEqual(HexCodec.decode("AA\nBB\tCC"), b"\xAA\xBB\xCC")

    def test_is_valid_hex_valid(self):
        """测试有效 HEX 字符串"""
        self.assertTrue(HexCodec.is_valid_hex("01 02 FF"))
        self.assertTrue(HexCodec.is_valid_hex("AABB"))
        self.assertTrue(HexCodec.is_valid_hex("aa bb"))

    def test_is_valid_hex_invalid(self):
        """测试无效 HEX 字符串"""
        self.assertFalse(HexCodec.is_valid_hex(""))
        self.assertFalse(HexCodec.is_valid_hex("   "))
        self.assertFalse(HexCodec.is_valid_hex("XYZ"))
        self.assertFalse(HexCodec.is_valid_hex("A"))  # 奇数长度

    def test_is_valid_hex_odd_length(self):
        """测试奇数长度检测"""
        self.assertFalse(HexCodec.is_valid_hex("A"))
        self.assertFalse(HexCodec.is_valid_hex("123"))

    def test_encode_decode_roundtrip(self):
        """测试编解码往返一致性"""
        original = b"\xDE\xAD\xBE\xEF"
        encoded = HexCodec.encode(original)
        decoded = HexCodec.decode(encoded)
        self.assertEqual(original, decoded)


# ============================================================
# 4. FakeSerialCore 测试
# ============================================================

class TestFakeSerialCoreLifecycle(unittest.TestCase):
    """测试 FakeSerialCore 生命周期"""

    def setUp(self):
        self.fake = FakeSerialCore()

    def test_initial_state_closed(self):
        """测试初始状态为关闭"""
        self.assertFalse(self.fake.is_open)

    def test_open_success(self):
        """测试成功打开"""
        config = SerialConfig(port="FAKE", baudrate=115200)
        result = self.fake.open(config)
        self.assertTrue(result)
        self.assertTrue(self.fake.is_open)
        self.assertEqual(self.fake.get_port(), "FAKE")
        self.assertEqual(self.fake.baudrate, 115200)

    def test_open_fail(self):
        """测试打开失败场景"""
        fake = FakeSerialCore(fail_on_open=True)
        config = SerialConfig(port="FAKE")
        result = fake.open(config)
        self.assertFalse(result)
        self.assertFalse(fake.is_open)

    def test_close_success(self):
        """测试成功关闭"""
        self.fake.open(SerialConfig())
        result = self.fake.close()
        self.assertTrue(result)
        self.assertFalse(self.fake.is_open)

    def test_close_when_not_open(self):
        """测试在未打开时关闭"""
        result = self.fake.close()
        self.assertFalse(result)

    def test_double_close(self):
        """测试重复关闭"""
        self.fake.open(SerialConfig())
        self.fake.close()
        result = self.fake.close()
        self.assertFalse(result)

    def test_open_count(self):
        """测试打开计数"""
        self.assertEqual(self.fake._open_count, 0)
        self.fake.open(SerialConfig())
        self.assertEqual(self.fake._open_count, 1)
        self.fake.open(SerialConfig())
        self.assertEqual(self.fake._open_count, 2)

    def test_close_count(self):
        """测试关闭计数"""
        self.fake.open(SerialConfig())
        self.fake.close()
        self.assertEqual(self.fake._close_count, 1)


class TestFakeSerialCoreConfig(unittest.TestCase):
    """测试 FakeSerialCore 配置管理"""

    def setUp(self):
        self.fake = FakeSerialCore()
        self.fake.open(SerialConfig(port="FAKE", baudrate=9600))

    def test_get_config(self):
        """测试获取配置"""
        config = self.fake.get_config()
        self.assertIsInstance(config, SerialConfig)
        self.assertEqual(config.baudrate, 9600)

    def test_update_config(self):
        """测试更新配置"""
        new_config = SerialConfig(port="FAKE2", baudrate=115200, parity=Parity.EVEN)
        result = self.fake.update_config(new_config)
        self.assertTrue(result)
        self.assertEqual(self.fake.baudrate, 115200)
        self.assertEqual(self.fake.parity, "E")
        self.assertEqual(self.fake.get_port(), "FAKE2")

    def test_update_config_no_port_change(self):
        """测试配置更新不影响打开状态"""
        self.fake.update_config(SerialConfig(port="FAKE", baudrate=57600))
        self.assertTrue(self.fake.is_open)


class TestFakeSerialCoreSend(unittest.TestCase):
    """测试 FakeSerialCore 发送功能"""

    def setUp(self):
        self.fake = FakeSerialCore()
        self.fake.open(SerialConfig())

    def test_send_basic(self):
        """测试基本发送"""
        result = self.fake.send(b"Hello")
        self.assertEqual(result, 5)
        self.assertEqual(self.fake.get_sent_count(), 1)
        self.assertEqual(self.fake.get_sent_data(), [b"Hello"])

    def test_send_empty(self):
        """测试发送空数据"""
        result = self.fake.send(b"")
        self.assertEqual(result, 0)
        self.assertEqual(self.fake.get_sent_count(), 1)

    def test_send_multiple(self):
        """测试多次发送"""
        self.fake.send(b"AT")
        self.fake.send(b"OK")
        self.assertEqual(self.fake.get_sent_data(), [b"AT", b"OK"])
        self.assertEqual(self.fake.get_total_sent_bytes(), 4)

    def test_send_when_closed(self):
        """测试在未打开时发送应抛出异常"""
        fake = FakeSerialCore()
        with self.assertRaises(SerialException) as ctx:
            fake.send(b"data")
        self.assertIn("未打开", str(ctx.exception))

    def test_send_fail(self):
        """测试发送失败场景"""
        fake = FakeSerialCore(fail_on_send=True)
        fake.open(SerialConfig())
        with self.assertRaises(SerialException) as ctx:
            fake.send(b"data")
        self.assertIn("模拟发送失败", str(ctx.exception))

    def test_send_ascii(self):
        """测试 send_ascii"""
        result = self.fake.send_ascii("你好")
        self.assertEqual(result, 6)  # UTF-8 编码 "你好" 为 6 字节
        self.assertEqual(self.fake.get_sent_data(), ["你好".encode("utf-8")])

    def test_send_hex(self):
        """测试 send_hex"""
        result = self.fake.send_hex("AA BB")
        self.assertEqual(result, 2)
        self.assertEqual(self.fake.get_sent_data(), [b"\xaa\xbb"])

    def test_clear_sent_data(self):
        """测试清空发送记录"""
        self.fake.send(b"data1")
        self.fake.send(b"data2")
        self.assertEqual(self.fake.get_sent_count(), 2)
        self.fake.clear_sent_data()
        self.assertEqual(self.fake.get_sent_count(), 0)
        self.assertEqual(self.fake.get_sent_data(), [])

    def test_get_sent_data_as_hex(self):
        """测试获取发送数据的 HEX 表示"""
        self.fake.send(b"\x01\x02\xFF")
        hex_data = self.fake.get_sent_data_as_hex()
        self.assertEqual(hex_data, ["01 02 FF"])


class TestFakeSerialCoreReceive(unittest.TestCase):
    """测试 FakeSerialCore 接收功能"""

    def setUp(self):
        self.fake = FakeSerialCore()
        self.fake.open(SerialConfig())

    def test_read_basic(self):
        """测试基本读取"""
        self.fake.inject_received_data(b"Hello")
        data = self.fake.read(5)
        self.assertEqual(data, b"Hello")

    def test_read_partial(self):
        """测试部分读取"""
        self.fake.inject_received_data(b"HelloWorld")
        data = self.fake.read(5)
        self.assertEqual(data, b"Hello")
        data = self.fake.read(5)
        self.assertEqual(data, b"World")

    def test_read_more_than_available(self):
        """测试读取超过可用数据量"""
        self.fake.inject_received_data(b"AB")
        data = self.fake.read(10)
        self.assertEqual(data, b"AB")

    def test_read_empty_buffer(self):
        """测试缓冲区为空时读取"""
        data = self.fake.read(1)
        self.assertEqual(data, b"")

    def test_read_when_closed(self):
        """测试在未打开时读取应抛出异常"""
        fake = FakeSerialCore()
        with self.assertRaises(SerialException):
            fake.read(1)

    def test_read_all(self):
        """测试 read_all"""
        self.fake.inject_received_data(b"AllData")
        data = self.fake.read_all()
        self.assertEqual(data, b"AllData")
        # 第二次读取应返回空
        self.assertEqual(self.fake.read_all(), b"")

    def test_read_all_when_closed(self):
        """测试在未打开时 read_all 应抛出异常"""
        fake = FakeSerialCore()
        with self.assertRaises(SerialException):
            fake.read_all()

    def test_read_until_found(self):
        """测试 read_until 找到分隔符"""
        self.fake.inject_received_data(b"Hello\nWorld")
        data = self.fake.read_until(b"\n")
        self.assertEqual(data, b"Hello\n")

    def test_read_until_not_found(self):
        """测试 read_until 未找到分隔符"""
        self.fake.inject_received_data(b"HelloWorld")
        data = self.fake.read_until(b"\n")
        self.assertEqual(data, b"HelloWorld")

    def test_read_until_with_size_limit(self):
        """测试 read_until 带大小限制"""
        self.fake.inject_received_data(b"Hello\nWorld")
        data = self.fake.read_until(b"\n", size=3)
        self.assertEqual(data, b"Hel")  # 受 size 限制

    def test_read_until_empty_delimiter(self):
        """测试 read_until 空分隔符"""
        self.fake.inject_received_data(b"data")
        data = self.fake.read_until(b"")
        self.assertEqual(data, b"")

    def test_read_until_when_closed(self):
        """测试在未打开时 read_until 应抛出异常"""
        fake = FakeSerialCore()
        with self.assertRaises(SerialException):
            fake.read_until(b"\n")

    def test_inject_received_ascii(self):
        """测试注入 ASCII 接收数据"""
        self.fake.inject_received_ascii("Test")
        data = self.fake.read_all()
        self.assertEqual(data, b"Test")

    def test_inject_received_hex(self):
        """测试注入 HEX 接收数据"""
        self.fake.inject_received_hex("DE AD BE EF")
        data = self.fake.read_all()
        self.assertEqual(data, b"\xDE\xAD\xBE\xEF")


class TestFakeSerialCoreBufferAndReset(unittest.TestCase):
    """测试 FakeSerialCore 缓冲区管理和重置功能"""

    def setUp(self):
        self.fake = FakeSerialCore()
        self.fake.open(SerialConfig())

    def test_clear_buffers(self):
        """测试清空缓冲区"""
        self.fake.inject_received_data(b"data")
        self.fake.send(b"sent")
        self.fake.clear_buffers()
        # 接收缓冲区应空
        self.assertEqual(self.fake.read_all(), b"")
        # 发送记录应空
        self.assertEqual(self.fake.get_sent_data(), [])

    def test_clear_receive_buffer(self):
        """测试清空接收缓冲区"""
        self.fake.inject_received_data(b"data")
        self.fake.clear_receive_buffer()
        self.assertEqual(self.fake.read_all(), b"")

    def test_reset(self):
        """测试完全重置状态"""
        self.fake.inject_received_data(b"data")
        self.fake.send(b"sent")
        self.fake.reset()
        # 重置后串口关闭，不能直接读/写，检查内部状态
        self.assertFalse(self.fake.is_open)
        self.assertEqual(self.fake._receive_buffer, bytearray())
        self.assertEqual(self.fake._sent_data, [])
        self.assertEqual(self.fake._open_count, 0)
        self.assertEqual(self.fake._close_count, 0)

    def test_reset_and_reopen(self):
        """测试重置后重新打开"""
        self.fake.inject_received_data(b"data")
        self.fake.send(b"sent")
        self.fake.reset()
        # 重新打开并验证功能
        self.fake.open(SerialConfig(port="NEW_FAKE"))
        self.assertTrue(self.fake.is_open)
        self.assertEqual(self.fake.get_port(), "NEW_FAKE")
        self.fake.send(b"new_data")
        self.assertEqual(self.fake.get_sent_data(), [b"new_data"])

    def test_context_manager(self):
        """测试上下文管理器支持"""
        with FakeSerialCore() as fake:
            fake.open(SerialConfig())
            self.assertTrue(fake.is_open)
        # 退出上下文后 close() 被调用（但初始状态已关闭，返回 False）
        # 此处验证上下文管理器语法正确，不抛出异常


# ============================================================
# 5. SerialException 测试
# ============================================================

class TestSerialException(unittest.TestCase):
    """测试 SerialException 异常类"""

    def test_exception_is_exception(self):
        """测试异常继承自 Exception"""
        self.assertTrue(issubclass(SerialException, Exception))

    def test_exception_with_message(self):
        """测试带消息的异常"""
        e = SerialException("测试错误")
        self.assertEqual(str(e), "测试错误")

    def test_exception_raise_and_catch(self):
        """测试异常的抛出和捕获"""
        with self.assertRaises(SerialException):
            raise SerialException("错误")


# ============================================================
# 6. 工厂函数测试
# ============================================================

class TestCreateSerialCore(unittest.TestCase):
    """测试 create_serial_core 工厂函数"""

    def test_create_fake(self):
        """测试创建伪造串口"""
        core = create_serial_core(fake=True)
        self.assertIsInstance(core, FakeSerialCore)

    def test_create_real(self):
        """测试创建真实串口"""
        core = create_serial_core(fake=False)
        self.assertIsInstance(core, RealSerialCore)

    def test_create_fake_with_options(self):
        """测试创建带选项的伪造串口"""
        core = create_serial_core(fake=True, fail_on_open=True)
        self.assertIsInstance(core, FakeSerialCore)
        self.assertTrue(core._fail_on_open)

        core2 = create_serial_core(fake=True, fail_on_send=True)
        self.assertTrue(core2._fail_on_send)

    def test_default_is_real(self):
        """测试默认创建真实串口"""
        core = create_serial_core()
        self.assertIsInstance(core, RealSerialCore)


# ============================================================
# 7. 常量测试
# ============================================================

class TestConstants(unittest.TestCase):
    """测试模块常量"""

    def test_data_bits(self):
        """测试数据位常量"""
        self.assertEqual(DataBits.FIVE, 5)
        self.assertEqual(DataBits.SIX, 6)
        self.assertEqual(DataBits.SEVEN, 7)
        self.assertEqual(DataBits.EIGHT, 8)

    def test_stop_bits(self):
        """测试停止位常量"""
        self.assertEqual(StopBits.ONE, 1)
        self.assertEqual(StopBits.ONE_POINT_FIVE, 1.5)
        self.assertEqual(StopBits.TWO, 2)

    def test_parity(self):
        """测试校验位常量"""
        self.assertEqual(Parity.NONE, 'N')
        self.assertEqual(Parity.EVEN, 'E')
        self.assertEqual(Parity.ODD, 'O')
        self.assertEqual(Parity.MARK, 'M')
        self.assertEqual(Parity.SPACE, 'S')

    def test_baudrates(self):
        """测试波特率列表"""
        self.assertIsInstance(BAUDRATES, list)
        self.assertIn(9600, BAUDRATES)
        self.assertIn(115200, BAUDRATES)
        self.assertIn(921600, BAUDRATES)
        # 验证波特率递增排序
        for i in range(1, len(BAUDRATES)):
            self.assertGreater(BAUDRATES[i], BAUDRATES[i - 1])
        # 最小波特率
        self.assertEqual(BAUDRATES[0], 300)
        # 最大波特率
        self.assertEqual(BAUDRATES[-1], 921600)


# ============================================================
# 8. 抽象基类测试
# ============================================================

class TestSerialCoreAbstract(unittest.TestCase):
    """测试 SerialCore 抽象基类"""

    def test_cannot_instantiate(self):
        """测试抽象基类不能直接实例化"""
        with self.assertRaises(TypeError):
            SerialCore()  # type: ignore

    def test_fake_implements_all_abstract_methods(self):
        """测试 FakeSerialCore 实现了所有抽象方法"""
        fake = FakeSerialCore()
        fake.open(SerialConfig())  # 先打开
        # 这些调用不应抛出 NotImplementedError
        fake.close()
        fake.open(SerialConfig())
        _ = fake.is_open
        _ = fake.get_config()
        fake.update_config(SerialConfig())
        fake.send(b"")
        fake.send_ascii("")
        fake.send_hex("")
        fake.read(1)
        fake.read_all()
        fake.read_until(b"")
        _ = fake.get_port()
        fake.clear_buffers()

    def test_fake_is_serialcore(self):
        """测试 FakeSerialCore 是 SerialCore 的子类"""
        self.assertTrue(issubclass(FakeSerialCore, SerialCore))

    def test_real_is_serialcore(self):
        """测试 RealSerialCore 是 SerialCore 的子类"""
        self.assertTrue(issubclass(RealSerialCore, SerialCore))


# ============================================================
# 9. 边界与综合测试
# ============================================================

class TestEdgeCases(unittest.TestCase):
    """测试边界情况"""

    def test_large_data_transfer(self):
        """测试大数据量传输"""
        fake = FakeSerialCore()
        fake.open(SerialConfig())

        # 发送大数据
        large_data = bytes(range(256)) * 100  # 25600 字节
        sent = fake.send(large_data)
        self.assertEqual(sent, len(large_data))
        self.assertEqual(fake.get_total_sent_bytes(), len(large_data))

        # 接收
        fake.inject_received_data(large_data)
        received = fake.read_all()
        self.assertEqual(received, large_data)

    def test_multiple_inject_and_read(self):
        """测试多次注入和读取"""
        fake = FakeSerialCore()
        fake.open(SerialConfig())

        fake.inject_received_data(b"Part1")
        fake.inject_received_data(b"Part2")
        fake.inject_received_data(b"Part3")

        self.assertEqual(fake.read(5), b"Part1")
        self.assertEqual(fake.read(5), b"Part2")
        self.assertEqual(fake.read(5), b"Part3")

    def test_send_after_reopen(self):
        """测试重新打开后发送"""
        fake = FakeSerialCore()
        fake.open(SerialConfig())
        fake.send(b"first")
        fake.close()
        fake.open(SerialConfig())
        fake.send(b"second")
        self.assertEqual(fake.get_sent_data(), [b"first", b"second"])

    def test_fake_serial_core_default_config(self):
        """测试 FakeSerialCore 默认端口名为 FAKE"""
        fake = FakeSerialCore()
        self.assertEqual(fake.get_port(), "FAKE")


# ============================================================
# 10. 真实串口 RealSerialCore 轻量测试
# ============================================================

class TestRealSerialCore(unittest.TestCase):
    """测试 RealSerialCore（无硬件环境下的行为验证）"""

    def test_initial_state(self):
        """测试初始状态"""
        real = RealSerialCore()
        self.assertFalse(real.is_open)
        self.assertEqual(real.get_port(), "")

    def test_close_when_not_open(self):
        """测试未打开时关闭返回 False"""
        real = RealSerialCore()
        result = real.close()
        self.assertFalse(result)

    def test_send_when_not_open(self):
        """测试未打开时发送抛出异常"""
        real = RealSerialCore()
        with self.assertRaises(SerialException):
            real.send(b"data")

    def test_read_when_not_open(self):
        """测试未打开时读取抛出异常"""
        real = RealSerialCore()
        with self.assertRaises(SerialException):
            real.read(1)

    def test_read_all_when_not_open(self):
        """测试未打开时 read_all 抛出异常"""
        real = RealSerialCore()
        with self.assertRaises(SerialException):
            real.read_all()

    def test_read_until_when_not_open(self):
        """测试未打开时 read_until 抛出异常"""
        real = RealSerialCore()
        with self.assertRaises(SerialException):
            real.read_until(b"\n")


# ============================================================
# 11. PortScanner 测试（轻量，无硬件环境）
# ============================================================

class TestPortScanner(unittest.TestCase):
    """测试 PortScanner（无硬件环境）"""

    def test_list_ports_no_error(self):
        """测试端口扫描不抛出异常"""
        try:
            ports = PortScanner.list_ports()
            self.assertIsInstance(ports, list)
        except Exception as e:
            self.fail(f"PortScanner.list_ports() 不应抛出异常: {e}")

    def test_list_ports_simple_no_error(self):
        """测试简单端口扫描不抛出异常"""
        try:
            ports = PortScanner.list_ports_simple()
            self.assertIsInstance(ports, list)
        except Exception as e:
            self.fail(f"PortScanner.list_ports_simple() 不应抛出异常: {e}")

    def test_scan_with_serial_number_no_error(self):
        """测试带序列号的端口扫描不抛出异常"""
        try:
            ports = PortScanner.scan_with_serial_number()
            self.assertIsInstance(ports, list)
        except Exception as e:
            self.fail(f"PortScanner.scan_with_serial_number() 不应抛出异常: {e}")


# ============================================================
# 入口
# ============================================================

if __name__ == "__main__":
    unittest.main(verbosity=2)
