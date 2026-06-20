"""自动滚动数据源：为 UI 提供增量数据，决定是否需要自动滚动到底部"""

from typing import Callable, List, Optional
from dataclasses import dataclass, field


@dataclass
class ScrollState:
    """滚动状态快照"""
    at_bottom: bool = True       # 当前是否在底部
    content_height: int = 0      # 内容总高度
    viewport_height: int = 0     # 可视区域高度
    scroll_position: int = 0     # 当前滚动位置


class AutoScrollSource:
    """自动滚动数据源

    职责：
    - 维护"是否自动滚动"的开关
    - 在新数据到达时，判断是否应该触发自动滚动
    - 提供增量数据（仅新行），减少 UI 刷新开销

    使用场景：
    UI 层每次收到新数据时，调用 add_lines()，然后根据
    should_auto_scroll() 决定是否将滚动条移到底部。
    """

    def __init__(self, auto_scroll: bool = True):
        """
        Args:
            auto_scroll: 初始是否启用自动滚动
        """
        self._auto_scroll = auto_scroll
        self._pending_lines: List[str] = []
        self._total_lines = 0

        # 滚动状态（由 UI 层更新）
        self._scroll_state = ScrollState()

        # 新数据回调
        self._on_lines_added: Optional[Callable[[List[str]], None]] = None

    # ---------- 属性 ----------

    @property
    def auto_scroll_enabled(self) -> bool:
        return self._auto_scroll

    @property
    def total_lines(self) -> int:
        return self._total_lines

    @property
    def pending_lines(self) -> List[str]:
        """获取待处理的新行并清空 pending 队列"""
        lines = self._pending_lines.copy()
        self._pending_lines.clear()
        return lines

    # ---------- 开关控制 ----------

    def enable_auto_scroll(self) -> None:
        """启用自动滚动"""
        self._auto_scroll = True

    def disable_auto_scroll(self) -> None:
        """禁用自动滚动"""
        self._auto_scroll = False

    def toggle_auto_scroll(self) -> bool:
        """切换自动滚动状态，返回新状态"""
        self._auto_scroll = not self._auto_scroll
        return self._auto_scroll

    # ---------- 数据输入 ----------

    def add_lines(self, lines: List[str]) -> None:
        """添加新行（由 ReceiveBuffer 或外部调用）

        Args:
            lines: 新增的行
        """
        if not lines:
            return

        self._pending_lines.extend(lines)
        self._total_lines += len(lines)

        # 触发回调
        if self._on_lines_added:
            self._on_lines_added(lines)

    # ---------- 滚动决策 ----------

    def should_auto_scroll(self) -> bool:
        """判断是否应该自动滚动到底部

        同时满足以下条件时才自动滚动：
        1. auto_scroll 开关为 True
        2. 用户当前在底部（at_bottom=True）
        """
        return self._auto_scroll and self._scroll_state.at_bottom

    def update_scroll_state(self, state: ScrollState) -> None:
        """更新滚动状态（由 UI 层滚动事件驱动）"""
        self._scroll_state = state

    def set_at_bottom(self, at_bottom: bool) -> None:
        """便捷方法：直接设置是否在底部"""
        self._scroll_state.at_bottom = at_bottom

    # ---------- 回调 ----------

    def set_on_lines_added(self, callback: Callable[[List[str]], None]) -> None:
        """设置行添加回调"""
        self._on_lines_added = callback

    # ---------- 重置 ----------

    def reset(self) -> None:
        """重置所有状态"""
        self._pending_lines.clear()
        self._total_lines = 0
        self._scroll_state = ScrollState(at_bottom=True)

    def __repr__(self) -> str:
        return (f"AutoScrollSource(auto_scroll={self._auto_scroll}, "
                f"total_lines={self._total_lines}, "
                f"pending={len(self._pending_lines)}, "
                f"at_bottom={self._scroll_state.at_bottom})")
