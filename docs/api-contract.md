# API Contract

Base URL: `/api`

## Health

- `GET /health`
  - Response: `{ "status": "ok" }`

## Packet Files

- `POST /packet/files`
  - Multipart field: `files`
  - Uploads one or more `.pcap` or `.pcapng` files.

- `GET /packet/files`
  - Returns uploaded file metadata.

- `PATCH /packet/files/{file_id}`
  - Body: `{ "description": "..." }`
  - Updates the editable description field.

- `GET /packet/files/{file_id}/download`
  - Downloads one pcap file.

- `POST /packet/files/download`
  - Body: `{ "file_ids": ["..."] }`
  - Downloads a zip containing selected files.

- `DELETE /packet/files`
  - Body: `{ "file_ids": ["..."] }`
  - Deletes selected files and metadata.

- `POST /packet/files/obfuscate`
  - Body: `{ "file_ids": ["..."] }`
  - Creates `modi_{filename}` files and records mapping metadata.

- `GET /packet/files/{file_id}/obfuscation-map`
  - Returns original IP and obfuscated IP mapping rows.

## Analysis

- `POST /packet/analyze/pcap`
  - Body:
    ```json
    {
      "file_ids": ["..."],
      "source_ip": "optional",
      "destination_ip": "optional",
      "extra_message": "optional"
    }
    ```

- `POST /packet/analyze/dump`
  - Body:
    ```json
    {
      "dump_text": "tcpdump text",
      "source_ip": "optional",
      "destination_ip": "optional",
      "extra_message": "optional"
    }
    ```

- `POST /packet/chat/{session_id}/messages`
  - Body: `{ "message": "..." }`
  - Sends a follow-up question.

- `GET /packet/chat/{session_id}/messages`
  - Returns chat history for a session.
