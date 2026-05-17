# ZIGINetOps Architecture

ZIGINetOps is split into a Python FastAPI backend and a React TypeScript frontend.

## Backend Layers

Requests flow through `api/routes`, into service classes, and then into repositories or external clients.

- `app/api/routes`: HTTP contracts and dependency wiring.
- `app/services`: packet upload, pcap summary, tcpdump context building, IP obfuscation, and chat orchestration.
- `app/repositories`: repository interfaces plus CSV implementations. Services depend on interfaces so PostgreSQL or MySQL implementations can replace CSV later.
- `app/integrations`: AWS Bedrock integration through `boto3`.
- `app/domain`: internal business objects.
- `app/schemas`: API request and response models.

## Frontend Feature Pattern

Frontend code is organized by feature under `src/features`.

Each future menu should provide:

- `menu.ts`: menu metadata.
- `api.ts`: API calls for the feature.
- `types.ts`: feature DTOs.
- `components`: UI implementation.

The initial release has one feature: `packet-analysis`.

## IP Obfuscation

`IpObfuscationService` uses Python `ipaddress` for normalization and deterministic SHA-256 based mapping.

- IPv4 addresses are mapped into the configured IPv4 network, default `10.0.0.0/8`.
- IPv4 addresses sharing the same first three octets map to the same obfuscated `/24` bucket.
- IPv6 addresses are mapped into the configured ULA network, default `fd00::/8`.
- IPv6 addresses sharing the same `/64` prefix map to the same obfuscated prefix bucket.
- Mappings are persisted in CSV for audit and modal display.

## LLM Analysis

The backend summarizes pcap data before sending it to the LLM. This avoids sending raw packet files to Bedrock and reduces token usage.

In local mode, the app uses `LocalEchoLLMClient` so developers can test the UI without AWS credentials. Set `APP_ENV` to a non-local value and configure AWS credentials to use the real Bedrock client.
