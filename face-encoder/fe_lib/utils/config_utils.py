from __future__ import annotations

from pathlib import Path
from typing import Any

from omegaconf import DictConfig, OmegaConf
from pydantic import BaseModel, ConfigDict


class BaseConfig(BaseModel):
    model_config: ConfigDict = ConfigDict(use_enum_values=True, arbitrary_types_allowed=True)

    @classmethod
    def from_yaml(cls, file_path: str | Path) -> BaseConfig:
        path = Path(file_path) if isinstance(file_path, str) else file_path
        return cls(**cls._load_dict_from_file(path))

    @staticmethod
    def _load_dict_from_file(base_path: Path) -> DictConfig:
        if not base_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {base_path}")

        conf = OmegaConf.load(base_path)

        override_path = Path(str(base_path) + ".override")
        if override_path.exists():
            override_conf = OmegaConf.load(override_path)
            conf = OmegaConf.merge(conf, override_conf)

        return conf


class BaseAppConfig(BaseConfig):
    @classmethod
    def from_config_dir(cls, config_dir: str | Path) -> BaseAppConfig:
        config_path = Path(config_dir) if isinstance(config_dir, str) else config_dir

        merged_components: dict[str, Any] = {}
        for field_name in cls.model_fields.keys():
            yaml_file = config_path / f"{field_name}.yaml"
            merged_components[field_name] = cls._load_dict_from_file(yaml_file)

        config = OmegaConf.create(merged_components)
        config_dict = OmegaConf.to_container(config, resolve=True)
        return cls(**config_dict)
