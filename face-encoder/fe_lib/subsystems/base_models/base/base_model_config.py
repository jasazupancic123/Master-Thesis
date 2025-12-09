from typing import Any, Literal

import numpy as np

from pydantic import Field, model_validator

from fe_lib.utils.config_utils import BaseConfig


class BaseONNXProviderConfig(BaseConfig):
    def to_tuple(self) -> tuple[str, dict[str, Any]]:
        return self.provider_name, {}


class CPUONNXProviderConfig(BaseONNXProviderConfig):
    provider_name: Literal["CPUExecutionProvider"] = "CPUExecutionProvider"


class CUDAONNXProviderConfig(BaseONNXProviderConfig):
    provider_name: Literal["CUDAExecutionProvider"] = "CUDAExecutionProvider"


class TensorRTONNXProviderConfig(BaseONNXProviderConfig):
    provider_name: Literal["TensorrtExecutionProvider"] = "TensorrtExecutionProvider"
    fp16_enable: bool = True
    engine_cache_enable: bool = True
    builder_optimization_level: int = 5  # default is 3,
    trt_layer_norm_fp32_fallback: bool = True
    engine_cache_path: str
    engine_cache_prefix: str | None = None
    trt_profile_min_shapes: str | None = None
    trt_profile_opt_shapes: str | None = None
    trt_profile_max_shapes: str | None = None

    def to_tuple(self) -> tuple[str, dict[str, Any]]:
        settings = {
            "trt_fp16_enable": self.fp16_enable,
            "trt_engine_cache_enable": self.engine_cache_enable,
            "trt_engine_cache_path": self.engine_cache_path,
            "trt_builder_optimization_level": self.builder_optimization_level,
            "trt_layer_norm_fp32_fallback": self.trt_layer_norm_fp32_fallback,
        }
        if self.trt_profile_min_shapes:
            settings["trt_profile_min_shapes"] = self.trt_profile_min_shapes
        if self.trt_profile_opt_shapes:
            settings["trt_profile_opt_shapes"] = self.trt_profile_opt_shapes
        if self.trt_profile_max_shapes:
            settings["trt_profile_max_shapes"] = self.trt_profile_max_shapes
        if self.engine_cache_prefix:
            settings["trt_engine_cache_prefix"] = self.engine_cache_prefix

        return self.provider_name, settings


class ONNXProviderConfig(BaseConfig):
    provider: CPUONNXProviderConfig | CUDAONNXProviderConfig | TensorRTONNXProviderConfig = Field(
        discriminator="provider_name"
    )


class BaseModelConfig(BaseConfig):
    path: str
    input_shape: tuple[int, ...]
    input_dtype: str
    providers: list[ONNXProviderConfig]
    log_level: int = 3

    @model_validator(mode="before")
    @classmethod
    def validate_before(cls, values):
        # ensure shape tuple
        if isinstance(values.get("input_shape"), list):
            values["input_shape"] = tuple(values["input_shape"])

        return values

    @property
    def input_dtype_np(self) -> np.dtype:
        """Get the input dtype as a numpy dtype."""
        return np.dtype(self.input_dtype)
