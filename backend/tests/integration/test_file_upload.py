from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


def test_upload_and_list_pcap_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    Path("app/storage/pcap_file").mkdir(parents=True)
    Path("app/storage/csv").mkdir(parents=True)
    client = TestClient(app)

    response = client.post(
        "/api/packet/files",
        files=[("files", ("sample.pcap", b"pcap bytes", "application/octet-stream"))],
    )

    assert response.status_code == 200
    uploaded = response.json()
    assert uploaded[0]["filename"] == "sample.pcap"

    list_response = client.get("/api/packet/files")
    assert list_response.status_code == 200
    assert any(item["filename"] == "sample.pcap" for item in list_response.json())
