"""自动滚动数据源"""
from enum import Enum, auto
from typing import Callable, Optional


class ScrollState(Enum):
    """自动滚动状态"""
    ENABLED = auto()
    DISABLED = auto()


class AutoScrollSource:
    """
    自动滚动数据源。
    当状态为 ENABLED 时，每次有新数据到达会自动触发滚动。
    """

    def __init__(self, state: ScrollState = ScrollState.ENABLED):
        self._state = state
        self._observers: list[Callable[[], None]] = []

    @property
    def state(self) -> ScrollState:
        return self._state

    @state.setter
    def state(self, value: ScrollState) -> None:
        self._state = value

    @property
    def enabled(self) -> bool:
        return self._state == ScrollState.ENABLED

    def enable(self) -> None:
        """启用自动滚动"""
        self._state = ScrollState.ENABLED

    def disable(self) -> None:
        """禁用自动滚动"""
        self._state = ScrollState.DISABLED

    def toggle(self) -> ScrollState:
        """切换自动滚动状态"""
        if self._state == ScrollState.ENABLED:
            self._state = ScrollState.DISABLED
        else:
            self._state = ScrollState.ENABLED
        return self._state

    def add_observer(self, callback: Callable[[], None]) -> None:
        """添加滚动通知观察者"""
        if callback not in self._observers:
            self._observers.append(callback)

    def remove_observer(self, callback: Callable[[], None]) -> None:
        """移除滚动通知观察者"""
        if callback in self._observers:
            self._observers.remove(callback)

    def notify(self) -> None:
        """通知所有观察者需要滚动"""
        for cb in self._observers:
            try:
                cb()
            except Exception:
                pass

    def __repr__(self) -> str:
        return f"AutoScrollSource(state={self._state.name})"
