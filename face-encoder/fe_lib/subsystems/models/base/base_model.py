from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

import numpy as np
import onnxruntime

from fe_lib.subsystems.models.base.base_model_config import BaseModelConfig

T = TypeVar("T", bound="BaseModelConfig")


class BaseModel(Generic[T], ABC):
    def __init__(self, config: T) -> None:
        self.config = config

        provider_names: list[str] = []
        provider_options: list[dict] = []
        for provider_option in self.config.providers:
            name, opts = provider_option.provider.to_tuple()
            provider_names.append(name)
            provider_options.append(dict(opts))

        so = onnxruntime.SessionOptions()
        so.log_severity_level = config.log_level

        self.model = onnxruntime.InferenceSession(
            self.config.path,
            providers=provider_names,
            provider_options=provider_options,
            sess_options=so,
        )
        self.input_shape = self.config.input_shape
        self.dtype = self.config.input_dtype

    def init_session(self):
        input_ = np.random.rand(*self.input_shape).astype(self.dtype)
        self.run(input_)

    @abstractmethod
    def run(self, input_: np.ndarray) -> Any:
        raise NotImplementedError
