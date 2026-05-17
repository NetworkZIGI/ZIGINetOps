from pydantic import BaseModel


class PcapAnalysisRequest(BaseModel):
    file_ids: list[str]
    source_ip: str | None = None
    destination_ip: str | None = None
    extra_message: str | None = None


class DumpAnalysisRequest(BaseModel):
    dump_text: str
    source_ip: str | None = None
    destination_ip: str | None = None
    extra_message: str | None = None
