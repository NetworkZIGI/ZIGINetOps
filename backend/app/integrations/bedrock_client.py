import json
import logging
from typing import Protocol

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import Settings
from app.core.errors import ExternalServiceError

logger = logging.getLogger(__name__)


class LLMClientProtocol(Protocol):
    def analyze(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError


class BedrockClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            config=Config(
                read_timeout=settings.bedrock_timeout_seconds,
                connect_timeout=10,
                retries={"max_attempts": 3, "mode": "standard"},
            ),
        )

    def analyze(self, system_prompt: str, user_prompt: str) -> str:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.settings.bedrock_max_tokens,
            "temperature": self.settings.bedrock_temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        try:
            response = self.client.invoke_model(
                modelId=self.settings.bedrock_model_id,
                body=json.dumps(body),
                accept="application/json",
                contentType="application/json",
            )
            payload = json.loads(response["body"].read())
        except (BotoCoreError, ClientError, KeyError, json.JSONDecodeError) as exc:
            logger.exception("Bedrock invocation failed")
            raise ExternalServiceError("LLM analysis failed. Check Bedrock configuration.") from exc
        return self._parse_response(payload)

    def _parse_response(self, payload: dict) -> str:
        content = payload.get("content", [])
        text_parts = [item.get("text", "") for item in content if item.get("type") == "text"]
        if not text_parts:
            raise ExternalServiceError("LLM response did not contain text.")
        return "\n".join(text_parts).strip()


class LocalEchoLLMClient:
    def analyze(self, system_prompt: str, user_prompt: str) -> str:
        return (
            "Local analysis placeholder. Configure AWS credentials to use Bedrock.\n\n"
            f"System prompt:\n{system_prompt}\n\nAnalysis context preview:\n{user_prompt[:2000]}"
        )
